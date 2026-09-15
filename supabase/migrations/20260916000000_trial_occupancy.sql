-- Las clases de prueba (sesiones de reconocimiento) viven en enrollments.trial_*,
-- no en class_sessions. Ninguna funcion de disponibilidad las consultaba, asi que
-- no bloqueaban nada: se podia agendar una clase regular (u otra prueba) encima del
-- mismo instructor, y el salon nunca quedaba reservado.
--
-- Se mantienen en enrollments (class_sessions.student_id/course_id son NOT NULL y un
-- interesado no tiene ficha de alumno ni curso) y se unifican solo en lectura via
-- v_occupancy, que es ahora la unica definicion de "ese hueco esta ocupado".

-- ── Salon de la clase de prueba ───────────────────────────────

ALTER TABLE "public"."enrollments"
  ADD COLUMN IF NOT EXISTS "trial_classroom_id" UUID
  REFERENCES "public"."classrooms"("id") ON DELETE SET NULL;

-- Equivalente de idx_cs_classroom_slot para las pruebas: un salon no puede tener
-- dos pruebas a la misma hora. Los trials historicos sin salon quedan fuera del
-- indice (ocupan instructor pero no salon), que es lo correcto para datos viejos.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_enr_trial_classroom_slot"
  ON "public"."enrollments" ("trial_classroom_id", "trial_date", "trial_time")
  WHERE "trial_date" IS NOT NULL
    AND "trial_time" IS NOT NULL
    AND "trial_classroom_id" IS NOT NULL
    AND "status" NOT IN ('perdido', 'cancelled', 'converted');

CREATE INDEX IF NOT EXISTS "idx_enr_trial_instructor_slot"
  ON "public"."enrollments" ("trial_instructor_id", "trial_date", "trial_time")
  WHERE "trial_date" IS NOT NULL;

-- ── Ocupacion unificada ───────────────────────────────────────

-- security_invoker = off (default): la vista se evalua con los permisos del owner,
-- para que las funciones STABLE que no son SECURITY DEFINER (fn_slot_available)
-- puedan leerla sin chocar con las RLS de class_sessions.
CREATE OR REPLACE VIEW "public"."v_occupancy" AS
  SELECT
    'session'::TEXT   AS source,
    cs.id             AS ref_id,
    cs.scheduled_date AS occ_date,
    cs.start_time     AS occ_time,
    cs.instructor_id  AS instructor_id,
    cs.classroom_id   AS classroom_id
  FROM "public"."class_sessions" cs
  WHERE cs.status NOT IN ('cancelled', 'rescheduled')

  UNION ALL

  SELECT
    'trial'::TEXT           AS source,
    e.id                    AS ref_id,
    e.trial_date            AS occ_date,
    e.trial_time            AS occ_time,
    e.trial_instructor_id   AS instructor_id,
    e.trial_classroom_id    AS classroom_id
  FROM "public"."enrollments" e
  WHERE e.trial_date IS NOT NULL
    AND e.trial_time IS NOT NULL
    AND e.status NOT IN ('perdido', 'cancelled', 'converted');

ALTER VIEW "public"."v_occupancy" OWNER TO "postgres";
GRANT SELECT ON "public"."v_occupancy" TO "authenticated", "service_role";

-- ── Disponibilidad del instructor ─────────────────────────────

-- Misma firma que antes (fn_book_session la llama). El paso 2 pasa a mirar
-- v_occupancy en vez de solo class_sessions, asi una prueba tambien bloquea.
CREATE OR REPLACE FUNCTION "public"."fn_instructor_free"("p_instructor_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$  -- NULL = libre, TEXT = mensaje de error
DECLARE
  v_dow SMALLINT := EXTRACT(ISODOW FROM p_date)::SMALLINT;
BEGIN
  -- 1. Tiene ventana de disponibilidad que cubra la clase completa (1h)
  IF NOT EXISTS (
    SELECT 1 FROM instructor_availability
    WHERE instructor_id = p_instructor_id
      AND day_of_week   = v_dow
      AND start_time   <= p_start_time
      AND end_time     >= (p_start_time + INTERVAL '1 hour')
  ) THEN
    RETURN 'El instructor no tiene disponibilidad configurada en ese horario.';
  END IF;

  -- 2. No tiene otra clase al mismo tiempo
  IF EXISTS (
    SELECT 1 FROM v_occupancy o
    WHERE o.instructor_id = p_instructor_id
      AND o.occ_date      = p_date
      AND o.source        = 'session'
      AND (p_exclude_id IS NULL OR o.ref_id != p_exclude_id)
      AND o.occ_time < (p_start_time + INTERVAL '1 hour')
      AND (o.occ_time + INTERVAL '1 hour') > p_start_time
  ) THEN
    RETURN 'El instructor ya tiene otra clase en ese horario.';
  END IF;

  -- 3. No tiene una sesion de reconocimiento al mismo tiempo
  IF EXISTS (
    SELECT 1 FROM v_occupancy o
    WHERE o.instructor_id = p_instructor_id
      AND o.occ_date      = p_date
      AND o.source        = 'trial'
      AND (p_exclude_id IS NULL OR o.ref_id != p_exclude_id)
      AND o.occ_time < (p_start_time + INTERVAL '1 hour')
      AND (o.occ_time + INTERVAL '1 hour') > p_start_time
  ) THEN
    RETURN 'El instructor tiene una sesion de reconocimiento en ese horario.';
  END IF;

  -- 4. No tiene ese horario bloqueado
  IF EXISTS (
    SELECT 1 FROM instructor_availability_blocks
    WHERE instructor_id = p_instructor_id
      AND blocked_date  = p_date
      AND start_time    < (p_start_time + INTERVAL '1 hour')
      AND end_time       > p_start_time
  ) THEN
    RETURN 'El instructor tiene ese horario bloqueado.';
  END IF;

  RETURN NULL;  -- Libre y disponible
END;
$$;

-- ── Disponibilidad del salon ──────────────────────────────────

-- fn_available_slots delega en esta funcion, asi que al mirar v_occupancy el
-- calendario empieza a contar las pruebas como ocupacion sin tocarlo.
CREATE OR REPLACE FUNCTION "public"."fn_slot_available"("p_classroom_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM v_occupancy o
    WHERE o.classroom_id  = p_classroom_id
      AND o.occ_date      = p_date
      AND (p_exclude_id IS NULL OR o.ref_id != p_exclude_id)
      -- Overlap check: dos clases de 60 min se solapan si sus rangos se intersectan
      -- [A.start, A.start+1h) ∩ [B.start, B.start+1h) ≠ ∅
      AND o.occ_time < (p_start_time + INTERVAL '1 hour')
      AND (o.occ_time + INTERVAL '1 hour') > p_start_time
  );
$$;

-- ── Validacion para agendar una sesion de reconocimiento ──────

-- Un solo punto de verdad para el flujo de trial: instructor + salon.
-- p_exclude_enrollment_id permite reagendar sin chocar consigo mismo.
CREATE OR REPLACE FUNCTION "public"."fn_trial_slot_free"(
  "p_instructor_id" "uuid",
  "p_classroom_id" "uuid",
  "p_date" "date",
  "p_start_time" time without time zone,
  "p_exclude_enrollment_id" "uuid" DEFAULT NULL::"uuid"
) RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$  -- NULL = libre, TEXT = mensaje de error
DECLARE
  v_msg TEXT;
BEGIN
  v_msg := fn_instructor_free(p_instructor_id, p_date, p_start_time, p_exclude_enrollment_id);
  IF v_msg IS NOT NULL THEN
    RETURN v_msg;
  END IF;

  IF p_classroom_id IS NOT NULL
     AND NOT fn_slot_available(p_classroom_id, p_date, p_start_time, p_exclude_enrollment_id) THEN
    RETURN 'Ese salon ya esta ocupado en ese horario.';
  END IF;

  RETURN NULL;
END;
$$;

ALTER FUNCTION "public"."fn_trial_slot_free"("uuid", "uuid", "date", time without time zone, "uuid") OWNER TO "postgres";

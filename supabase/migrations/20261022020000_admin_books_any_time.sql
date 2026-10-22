-- El admin agenda sin restricciones de horario: cualquier hora (incluye medias
-- horas como 11:30) y con cualquier instructor aunque no tenga disponibilidad
-- configurada. Siguen bloqueando solo los choques reales: salón ocupado,
-- estudiante o instructor con otra clase, bloqueo del instructor, academia
-- cerrada y domingos. El portal del estudiante conserva todas las reglas.

BEGIN;

-- Las franjas horarias se validan en fn_validate_schedule_rules (solo para
-- no-admin); los CHECK impedían al admin salirse del horario.
ALTER TABLE "public"."class_sessions" DROP CONSTRAINT "cs_valid_saturday";
ALTER TABLE "public"."class_sessions" DROP CONSTRAINT "cs_valid_weekday";

CREATE OR REPLACE FUNCTION "public"."fn_validate_schedule_rules"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_admin" boolean DEFAULT false) RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_dow          SMALLINT := EXTRACT(ISODOW FROM p_date)::SMALLINT;
  -- ISODOW: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb, 7=Dom
  v_student_type student_type_t;
BEGIN
  -- Domingo: cerrado
  IF v_dow = 7 THEN
    RETURN 'La academia no opera los domingos.';
  END IF;

  -- El admin puede agendar a cualquier hora (excepto domingo).
  IF p_admin THEN
    RETURN NULL;
  END IF;

  -- Sábado: 8:00 AM – 7:00 PM (última clase empieza 6:00 PM, termina 7:00 PM)
  IF v_dow = 6 THEN
    IF p_start_time < '08:00'::TIME OR p_start_time > '18:00'::TIME THEN
      RETURN 'Los sábados el horario de clases es 8:00 AM – 7:00 PM (última clase a las 6:00 PM).';
    END IF;
    RETURN NULL;
  END IF;

  -- Lunes–Viernes: 8:00 AM – 10:00 PM (última clase empieza 9:00 PM, termina 10:00 PM)
  IF p_start_time < '08:00'::TIME OR p_start_time > '21:00'::TIME THEN
    RETURN 'El horario de lunes a viernes es 8:00 AM – 10:00 PM (última clase a las 9:00 PM).';
  END IF;

  -- Restricción para estudiantes nuevos: solo desde 5:00 PM (L-V).
  SELECT student_type INTO v_student_type
  FROM students WHERE id = p_student_id;

  IF v_student_type = 'new' AND p_start_time < '17:00'::TIME THEN
    RETURN 'Los estudiantes nuevos solo pueden agendar clases de 5:00 PM a 10:00 PM de lunes a viernes.';
  END IF;

  RETURN NULL;  -- Válido
END;
$$;


DROP FUNCTION "public"."fn_instructor_free"("uuid", "date", time without time zone, "uuid");

CREATE OR REPLACE FUNCTION "public"."fn_instructor_free"("p_instructor_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid" DEFAULT NULL::"uuid", "p_admin" boolean DEFAULT false) RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$  -- NULL = libre, TEXT = mensaje de error
DECLARE
  v_dow SMALLINT := EXTRACT(ISODOW FROM p_date)::SMALLINT;
BEGIN
  -- 1. Tiene ventana de disponibilidad que cubra la clase completa (1h).
  --    El admin puede asignar al instructor aunque no la tenga configurada.
  IF NOT p_admin AND NOT EXISTS (
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


GRANT ALL ON FUNCTION "public"."fn_instructor_free"("uuid", "date", time without time zone, "uuid", boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_instructor_free"("uuid", "date", time without time zone, "uuid", boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_instructor_free"("uuid", "date", time without time zone, "uuid", boolean) TO "service_role";

CREATE OR REPLACE FUNCTION "public"."fn_book_session"("p_student_id" "uuid", "p_classroom_id" "uuid", "p_course_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_instructor_id" "uuid" DEFAULT NULL::"uuid", "p_schedule_id" "uuid" DEFAULT NULL::"uuid", "p_notes" "text" DEFAULT NULL::"text", "p_admin" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_year      SMALLINT := EXTRACT(YEAR  FROM p_date)::SMALLINT;
  v_month     SMALLINT := EXTRACT(MONTH FROM p_date)::SMALLINT;
  v_error     TEXT;
  v_available INT;
  v_new_id    UUID;
BEGIN
  v_error := fn_validate_schedule_rules(p_student_id, p_date, p_start_time, p_admin);
  IF v_error IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', v_error);
  END IF;

  IF fn_is_blocked(p_date, p_start_time, p_classroom_id) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'La academia esta cerrada en esa fecha y horario.');
  END IF;

  IF NOT fn_slot_available(p_classroom_id, p_date, p_start_time) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El salon no esta disponible en ese horario.');
  END IF;

  IF NOT fn_student_free(p_student_id, p_date, p_start_time) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El estudiante ya tiene otra clase en ese horario.');
  END IF;

  IF p_instructor_id IS NOT NULL THEN
    v_error := fn_instructor_free(p_instructor_id, p_date, p_start_time, NULL, p_admin);
    IF v_error IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', v_error);
    END IF;
  END IF;

  SELECT classes_available INTO v_available
  FROM fn_monthly_usage(p_student_id, v_year, v_month);

  IF v_available <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El estudiante ha utilizado todas sus clases del mes '
      || v_year::TEXT || '-' || LPAD(v_month::TEXT, 2, '0') || '.');
  END IF;

  INSERT INTO class_sessions (
    student_id, classroom_id, course_id, instructor_id,
    scheduled_date, start_time, status, schedule_id, notes
  ) VALUES (
    p_student_id, p_classroom_id, p_course_id, p_instructor_id,
    p_date, p_start_time, 'confirmed', p_schedule_id, p_notes
  ) RETURNING id INTO v_new_id;

  INSERT INTO monthly_quotas (student_id, period_year, period_month, quota_total)
  VALUES (p_student_id, v_year, v_month, 8)
  ON CONFLICT (student_id, period_year, period_month) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'session_id', v_new_id);
END;
$$;


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
  -- Solo el admin agenda pruebas: no exige disponibilidad configurada.
  v_msg := fn_instructor_free(p_instructor_id, p_date, p_start_time, p_exclude_enrollment_id, true);
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


COMMIT;

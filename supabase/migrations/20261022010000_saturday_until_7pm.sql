-- Sábados: horario ampliado a 8:00 AM – 7:00 PM (última clase a las 6:00 PM).

BEGIN;

ALTER TABLE "public"."class_sessions" DROP CONSTRAINT "cs_valid_saturday";
ALTER TABLE "public"."class_sessions" ADD CONSTRAINT "cs_valid_saturday" CHECK (
  ((EXTRACT(isodow FROM "scheduled_date"))::smallint <> 6)
  OR (("start_time" >= '08:00:00'::time) AND ("start_time" <= '18:00:00'::time))
);

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
  -- El admin puede agendarlos a cualquier hora dentro del horario.
  IF p_admin THEN
    RETURN NULL;
  END IF;

  SELECT student_type INTO v_student_type
  FROM students WHERE id = p_student_id;

  IF v_student_type = 'new' AND p_start_time < '17:00'::TIME THEN
    RETURN 'Los estudiantes nuevos solo pueden agendar clases de 5:00 PM a 10:00 PM de lunes a viernes.';
  END IF;

  RETURN NULL;  -- Válido
END;
$$;

CREATE OR REPLACE FUNCTION "public"."fn_available_slots"("p_date" "date", "p_student_id" "uuid" DEFAULT NULL::"uuid", "p_instructor_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("slot_time" time without time zone, "classroom_id" "uuid", "classroom_name" "text", "is_available" boolean, "has_instructor" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  WITH slots AS (
    SELECT gs::TIME AS slot_time
    FROM generate_series(
      (p_date::TEXT || ' 08:00')::TIMESTAMP,
      CASE
        WHEN EXTRACT(ISODOW FROM p_date)::INT = 6
          THEN (p_date::TEXT || ' 18:00')::TIMESTAMP
        ELSE   (p_date::TEXT || ' 21:00')::TIMESTAMP
      END,
      INTERVAL '1 hour'
    ) gs
    WHERE EXTRACT(ISODOW FROM p_date)::INT != 7
  ),
  rooms AS (
    SELECT id, name FROM classrooms WHERE is_active = true
  ),
  -- Si hay disponibilidad configurada, precalcular qué slots tienen instructor disponible
  avail_configured AS (
    SELECT EXISTS (SELECT 1 FROM instructor_availability LIMIT 1) AS has_avail
  ),
  instructor_avail_slots AS (
    SELECT DISTINCT ia.start_time, ia.end_time
    FROM instructor_availability ia
    JOIN instructors i ON i.id = ia.instructor_id AND i.status = 'active'
    WHERE ia.day_of_week = EXTRACT(ISODOW FROM p_date)::SMALLINT
  ),
  slot_instructor AS (
    SELECT
      s.slot_time,
      (
        NOT (SELECT has_avail FROM avail_configured)
        OR EXISTS (
          SELECT 1 FROM instructor_avail_slots ias
          WHERE ias.start_time <= s.slot_time
            AND ias.end_time >= (s.slot_time + INTERVAL '1 hour')
        )
      ) AS has_instructor
    FROM slots s
  )
  SELECT
    s.slot_time,
    r.id              AS classroom_id,
    r.name            AS classroom_name,
    NOT fn_is_blocked(p_date, s.slot_time, r.id)
    AND fn_slot_available(r.id, p_date, s.slot_time)
    AND (p_student_id IS NULL    OR fn_student_free(p_student_id, p_date, s.slot_time))
    AND (p_instructor_id IS NULL OR (fn_instructor_free(p_instructor_id, p_date, s.slot_time) IS NULL))
    AND si.has_instructor
    AS is_available,
    si.has_instructor
  FROM slots s
  CROSS JOIN rooms r
  JOIN slot_instructor si ON si.slot_time = s.slot_time
  ORDER BY s.slot_time, r.name;
$$;

COMMIT;

-- fn_available_slots alimenta los colores Disponible/Ocupado de la grilla de agenda.
-- La grilla entre semana ahora arranca a las 8am (ver widen_weekday_schedule_range),
-- así que este generador de slots debe cubrir el mismo rango para que el color sea correcto.

CREATE OR REPLACE FUNCTION "public"."fn_available_slots"("p_date" "date", "p_student_id" "uuid" DEFAULT NULL::"uuid", "p_instructor_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("slot_time" time without time zone, "classroom_id" "uuid", "classroom_name" "text", "is_available" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  WITH slots AS (
    SELECT gs::TIME AS slot_time
    FROM generate_series(
      (p_date::TEXT || ' 08:00')::TIMESTAMP,
      CASE
        WHEN EXTRACT(ISODOW FROM p_date)::INT = 6
          THEN (p_date::TEXT || ' 13:00')::TIMESTAMP
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
  )
  SELECT
    s.slot_time,
    r.id              AS classroom_id,
    r.name            AS classroom_name,
    NOT fn_is_blocked(p_date, s.slot_time, r.id)
    AND fn_slot_available(r.id, p_date, s.slot_time)
    AND (p_student_id IS NULL    OR fn_student_free(p_student_id, p_date, s.slot_time))
    AND (p_instructor_id IS NULL OR (fn_instructor_free(p_instructor_id, p_date, s.slot_time) IS NULL))
    -- Solo filtrar por disponibilidad de instructor si hay al menos uno configurado
    AND (
      NOT (SELECT has_avail FROM avail_configured)
      OR EXISTS (
        SELECT 1 FROM instructor_avail_slots ias
        WHERE ias.start_time <= s.slot_time
          AND ias.end_time >= (s.slot_time + INTERVAL '1 hour')
      )
    )
    AS is_available
  FROM slots s
  CROSS JOIN rooms r
  ORDER BY s.slot_time, r.name;
$$;

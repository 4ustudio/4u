-- fn_instructor_free nunca consultaba instructor_availability_blocks: un instructor
-- podia bloquear una fecha/hora y admin (o el propio instructor via "Gestionar
-- clases") igual podia agendarle una clase ahi, porque fn_book_session solo llama
-- fn_instructor_free (disponibilidad + choque de clases), no el bloqueo puntual.
-- El filtro de bloqueos existente solo vivia en TypeScript (loadInstructorDayContext,
-- usado por /agendar del lado estudiante) — nunca a nivel de base de datos.
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
    SELECT 1 FROM class_sessions
    WHERE instructor_id  = p_instructor_id
      AND scheduled_date = p_date
      AND status NOT IN ('cancelled', 'rescheduled')
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND start_time < (p_start_time + INTERVAL '1 hour')
      AND (start_time + INTERVAL '1 hour') > p_start_time
  ) THEN
    RETURN 'El instructor ya tiene otra clase en ese horario.';
  END IF;

  -- 3. No tiene ese horario bloqueado
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

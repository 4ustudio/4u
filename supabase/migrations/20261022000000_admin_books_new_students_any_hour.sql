-- El admin puede agendar estudiantes nuevos a cualquier hora (la regla
-- "nuevos solo desde las 5 PM entre semana" queda solo para el portal del
-- estudiante). fn_book_session solo la ejecuta service_role, asi que el flag
-- p_admin no es explotable desde el cliente.

BEGIN;

DROP FUNCTION "public"."fn_validate_schedule_rules"("uuid", "date", time without time zone);
DROP FUNCTION "public"."fn_book_session"("p_student_id" "uuid", "p_classroom_id" "uuid", "p_course_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_instructor_id" "uuid", "p_schedule_id" "uuid", "p_notes" "text");

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

  -- Sábado: 8:00 AM – 2:00 PM (última clase empieza 1:00 PM, termina 2:00 PM)
  IF v_dow = 6 THEN
    IF p_start_time < '08:00'::TIME OR p_start_time > '13:00'::TIME THEN
      RETURN 'Los sábados el horario de clases es 8:00 AM – 2:00 PM (última clase a la 1:00 PM).';
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

GRANT ALL ON FUNCTION "public"."fn_validate_schedule_rules"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_admin" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_validate_schedule_rules"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_admin" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_validate_schedule_rules"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_admin" boolean) TO "service_role";

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
    v_error := fn_instructor_free(p_instructor_id, p_date, p_start_time);
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

REVOKE ALL ON FUNCTION "public"."fn_book_session"("p_student_id" "uuid", "p_classroom_id" "uuid", "p_course_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_instructor_id" "uuid", "p_schedule_id" "uuid", "p_notes" "text", "p_admin" boolean) FROM PUBLIC, "anon", "authenticated";
GRANT ALL ON FUNCTION "public"."fn_book_session"("p_student_id" "uuid", "p_classroom_id" "uuid", "p_course_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_instructor_id" "uuid", "p_schedule_id" "uuid", "p_notes" "text", "p_admin" boolean) TO "service_role";

COMMIT;

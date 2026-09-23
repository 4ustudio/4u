-- Permite agendar clases entre semana desde las 8:00 AM (antes 10:00 AM),
-- para estudiantes cuya disponibilidad no cabe en el horario estándar.

ALTER TABLE "public"."class_sessions" DROP CONSTRAINT "cs_valid_weekday";
ALTER TABLE "public"."class_sessions" ADD CONSTRAINT "cs_valid_weekday" CHECK (
  ((EXTRACT(isodow FROM "scheduled_date"))::smallint > 5)
  OR (("start_time" >= '08:00:00'::time) AND ("start_time" <= '21:00:00'::time))
);

CREATE OR REPLACE FUNCTION "public"."fn_validate_schedule_rules"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone) RETURNS "text"
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

  -- Restricción para estudiantes nuevos: solo desde 5:00 PM (L-V)
  SELECT student_type INTO v_student_type
  FROM students WHERE id = p_student_id;

  IF v_student_type = 'new' AND p_start_time < '17:00'::TIME THEN
    RETURN 'Los estudiantes nuevos solo pueden agendar clases de 5:00 PM a 10:00 PM de lunes a viernes.';
  END IF;

  RETURN NULL;  -- Válido
END;
$$;

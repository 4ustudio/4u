-- ═══════════════════════════════════════════════════════════════════
-- Portal de Estudiantes — Migración completa
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 0. Columnas extendidas de students (necesarias para el panel admin)
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_name      TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_name       TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address         TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS city            TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date      DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS profession      TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS music_genre     TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS document_type   TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS document_number TEXT;

-- 1. Columna que vincula cada estudiante con su cuenta Auth
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) UNIQUE;

CREATE INDEX IF NOT EXISTS students_user_id_idx ON students(user_id);

-- ── Acceso de lectura para usuarios autenticados (necesario para reservas) ──

DROP POLICY IF EXISTS "authenticated_read_courses" ON courses;
CREATE POLICY "authenticated_read_courses"
  ON courses FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "authenticated_read_classrooms" ON classrooms;
CREATE POLICY "authenticated_read_classrooms"
  ON classrooms FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "authenticated_read_instructors" ON instructors;
CREATE POLICY "authenticated_read_instructors"
  ON instructors FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "authenticated_read_blocked_dates" ON blocked_dates;
CREATE POLICY "authenticated_read_blocked_dates"
  ON blocked_dates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "authenticated_read_instructor_availability" ON instructor_availability;
CREATE POLICY "authenticated_read_instructor_availability"
  ON instructor_availability FOR SELECT
  USING (true);

-- Hacer fn_book_session SECURITY DEFINER para que inserte class_sessions
-- sin necesitar policy de INSERT para el usuario autenticado
CREATE OR REPLACE FUNCTION fn_book_session(
  p_student_id    UUID,
  p_classroom_id  UUID,
  p_course_id     UUID,
  p_date          DATE,
  p_start_time    TIME,
  p_instructor_id UUID DEFAULT NULL,
  p_schedule_id   UUID DEFAULT NULL,
  p_notes         TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_year      SMALLINT := EXTRACT(YEAR  FROM p_date)::SMALLINT;
  v_month     SMALLINT := EXTRACT(MONTH FROM p_date)::SMALLINT;
  v_error     TEXT;
  v_available INT;
  v_new_id    UUID;
BEGIN
  v_error := fn_validate_schedule_rules(p_student_id, p_date, p_start_time);
  IF v_error IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', v_error);
  END IF;
  IF fn_is_blocked(p_date, p_start_time, p_classroom_id) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'La academia está cerrada en esa fecha y horario.');
  END IF;
  IF NOT fn_slot_available(p_classroom_id, p_date, p_start_time) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El salón ya está ocupado en ese horario.');
  END IF;
  IF NOT fn_student_free(p_student_id, p_date, p_start_time) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Ya tienes una clase agendada en ese horario.');
  END IF;
  IF p_instructor_id IS NOT NULL AND NOT fn_instructor_free(p_instructor_id, p_date, p_start_time) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El instructor no está disponible en ese horario.');
  END IF;
  SELECT classes_available INTO v_available
  FROM fn_monthly_usage(p_student_id, v_year, v_month);
  IF v_available <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error',
      'No tienes clases disponibles este mes.');
  END IF;
  INSERT INTO class_sessions (
    student_id, classroom_id, course_id, instructor_id,
    schedule_id, scheduled_date, start_time, status, notes
  ) VALUES (
    p_student_id, p_classroom_id, p_course_id, p_instructor_id,
    p_schedule_id, p_date, p_start_time, 'pending', p_notes
  ) RETURNING id INTO v_new_id;
  RETURN jsonb_build_object('success', true, 'session_id', v_new_id);
END;
$$;

-- 2. RLS: students — el estudiante puede leer solo su propio registro
DROP POLICY IF EXISTS "student_read_own" ON students;
CREATE POLICY "student_read_own"
  ON students FOR SELECT
  USING (auth.uid() = user_id);

-- 3. RLS: class_sessions — el estudiante ve solo sus clases
DROP POLICY IF EXISTS "student_read_own_sessions" ON class_sessions;
CREATE POLICY "student_read_own_sessions"
  ON class_sessions FOR SELECT
  USING (
    student_id = (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- 4. RLS: monthly_quotas — el estudiante ve solo su cuota
DROP POLICY IF EXISTS "student_read_own_quotas" ON monthly_quotas;
CREATE POLICY "student_read_own_quotas"
  ON monthly_quotas FOR SELECT
  USING (
    student_id = (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- 5. RLS: student_schedules — el estudiante ve solo sus horarios fijos
DROP POLICY IF EXISTS "student_read_own_schedules" ON student_schedules;
CREATE POLICY "student_read_own_schedules"
  ON student_schedules FOR SELECT
  USING (
    student_id = (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════
-- Portal de Estudiantes — Migración
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Columna que vincula cada estudiante con su cuenta Auth
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) UNIQUE;

CREATE INDEX IF NOT EXISTS students_user_id_idx ON students(user_id);

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

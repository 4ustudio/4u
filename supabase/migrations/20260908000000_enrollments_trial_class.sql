-- Agendar la primera sesión de reconocimiento (clase de prueba) de un lead:
-- fecha/hora/instructor sobre la propia fila de enrollments (el lead aún no es student,
-- no amerita una fila en class_sessions).

ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS trial_date         DATE,
  ADD COLUMN IF NOT EXISTS trial_time         TIME,
  ADD COLUMN IF NOT EXISTS trial_instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_trial_date ON enrollments (trial_date) WHERE trial_date IS NOT NULL;

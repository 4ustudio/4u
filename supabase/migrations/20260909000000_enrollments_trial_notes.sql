-- Observaciones de la clase de prueba, editables por admin (leads) e instructor (portal).
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS trial_notes TEXT;

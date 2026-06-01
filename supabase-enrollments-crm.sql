-- ============================================================
-- CRM Migration — Enrollments
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Depende de: supabase-enrollments.sql (tabla enrollments base)
-- ============================================================

-- ── 1. Nuevas columnas en enrollments ───────────────────────
-- preferred_time puede no existir si la tabla se creó con supabase-setup.sql

ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS preferred_time        TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes        TEXT,
  ADD COLUMN IF NOT EXISTS converted_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS converted_student_id  UUID;

-- Rellenar filas existentes que queden en NULL
UPDATE enrollments SET preferred_time = '' WHERE preferred_time IS NULL;

-- Ampliar el CHECK de status para incluir 'converted'
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check
  CHECK (status IN ('pending', 'contacted', 'scheduled', 'cancelled', 'converted'));

-- ── 2. Tabla de eventos / timeline ──────────────────────────

CREATE TABLE IF NOT EXISTS enrollment_events (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  enrollment_id UUID        NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL
                  CHECK (type IN (
                    'form_received', 'status_changed',
                    'whatsapp_sent', 'called', 'email_sent',
                    'note_added', 'converted'
                  )),
  description   TEXT        NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enrollment_events_enrollment
  ON enrollment_events (enrollment_id, created_at DESC);

-- ── 3. RLS para enrollment_events ───────────────────────────

ALTER TABLE enrollment_events ENABLE ROW LEVEL SECURITY;

-- ── 4. Políticas para Supabase Realtime (admin autenticado) ──
-- El navegador del admin usa role=authenticated; necesita SELECT para
-- recibir eventos de postgres_changes en tiempo real.

CREATE POLICY IF NOT EXISTS "authenticated_select_enrollments" ON enrollments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "authenticated_update_enrollments" ON enrollments
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "authenticated_all_enrollment_events" ON enrollment_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Agregar tablas a la publicación de Realtime (por si no están ya)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'enrollments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE enrollments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'enrollment_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE enrollment_events;
  END IF;
END $$;

-- ── 4. Trigger: evento inicial al crear inscripción ─────────

CREATE OR REPLACE FUNCTION fn_enrollment_initial_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO enrollment_events (enrollment_id, type, description)
  VALUES (NEW.id, 'form_received', 'Formulario de inscripción recibido');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollment_initial_event ON enrollments;
CREATE TRIGGER trg_enrollment_initial_event
  AFTER INSERT ON enrollments
  FOR EACH ROW EXECUTE FUNCTION fn_enrollment_initial_event();

-- ── 5. Retroactivo: evento inicial para inscripciones existentes ─

INSERT INTO enrollment_events (enrollment_id, type, description, created_at)
SELECT id, 'form_received', 'Formulario de inscripción recibido', created_at
FROM enrollments
WHERE id NOT IN (
  SELECT DISTINCT enrollment_id FROM enrollment_events WHERE type = 'form_received'
);

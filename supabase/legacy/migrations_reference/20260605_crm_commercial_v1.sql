-- ────────────────────────────────────────────────────────────────────────────
-- CRM Comercial V1 — enrollments como fuente de verdad del embudo comercial
-- Seguro para ejecutar: solo operaciones aditivas, sin pérdida de datos.
-- ────────────────────────────────────────────────────────────────────────────

-- ── 1. Nuevos campos en enrollments ─────────────────────────────────────────

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS source            text,
  ADD COLUMN IF NOT EXISTS assigned_to       uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS last_contact_at   timestamptz,
  ADD COLUMN IF NOT EXISTS next_followup_at  timestamptz,
  ADD COLUMN IF NOT EXISTS lost_reason       text;

-- ── 2. Ampliar CHECK de status — borra el constraint existente por contenido
--    (independiente del nombre que Supabase le haya asignado) ─────────────────

DO $$
DECLARE
  _cname text;
BEGIN
  SELECT c.conname INTO _cname
  FROM pg_constraint c
  JOIN pg_class     r ON r.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = r.relnamespace
  WHERE n.nspname = 'public'
    AND r.relname  = 'enrollments'
    AND c.contype  = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%status%'
  LIMIT 1;

  IF _cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.enrollments DROP CONSTRAINT %I', _cname);
    RAISE NOTICE 'Dropped constraint: %', _cname;
  ELSE
    RAISE NOTICE 'No status CHECK constraint found — skipping drop.';
  END IF;
END;
$$;

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_status_check
  CHECK (status IN (
    'pending',
    'contacted',
    'scheduled',      -- legacy (equivalente a clase_prueba)
    'clase_prueba',
    'cancelled',      -- legacy (equivalente a perdido)
    'perdido',
    'converted'
  ));

-- ── 3. CHECK de source (columna nueva — no puede existir constraint previo) ──

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_source_check
  CHECK (source IS NULL OR source IN (
    'inscripcion',
    'whatsapp', 'instagram', 'facebook', 'google',
    'referido', 'web', 'presencial', 'otro'
  ));

-- ── 4. Vincular appointments con enrollments (nullable — no rompe registros) ─

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS enrollment_id uuid REFERENCES public.enrollments(id);

-- ── 5. Índices ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_enrollments_source
  ON public.enrollments(source);

CREATE INDEX IF NOT EXISTS idx_enrollments_status
  ON public.enrollments(status);

CREATE INDEX IF NOT EXISTS idx_enrollments_next_followup
  ON public.enrollments(next_followup_at)
  WHERE next_followup_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_enrollment_id
  ON public.appointments(enrollment_id)
  WHERE enrollment_id IS NOT NULL;

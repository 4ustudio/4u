-- Fase 1: persistencia de aceptación de términos y condiciones
-- Agrega columnas de consentimiento a enrollments

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS terms_accepted      BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version       TEXT,
  ADD COLUMN IF NOT EXISTS data_consent        BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_consent       BOOLEAN      NOT NULL DEFAULT false;

-- Índice para auditorías rápidas por versión
CREATE INDEX IF NOT EXISTS idx_enrollments_terms_version
  ON public.enrollments (terms_version)
  WHERE terms_accepted = true;

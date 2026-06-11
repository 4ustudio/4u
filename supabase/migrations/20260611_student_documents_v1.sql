-- student_documents: expediente legal reutilizable por tipo de documento
-- Diseñado para: terms_and_conditions, image_consent, habeas_data, certificados, etc.

CREATE TABLE IF NOT EXISTS public.student_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID REFERENCES public.students(id) ON DELETE SET NULL,
  enrollment_id    UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  document_type    TEXT NOT NULL,       -- 'terms_and_conditions' | 'image_consent' | 'habeas_data' | ...
  document_version TEXT NOT NULL,
  signed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_url          TEXT,
  signature_url    TEXT,               -- PNG en Storage (nunca base64 en BD)
  document_hash    TEXT,               -- SHA-256 del PDF final
  ip_address       TEXT,
  user_agent       TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_student_documents_enrollment
  ON public.student_documents (enrollment_id);

CREATE INDEX IF NOT EXISTS idx_student_documents_student
  ON public.student_documents (student_id)
  WHERE student_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_documents_type_version
  ON public.student_documents (document_type, document_version);

-- RLS
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- Insert anónimo: flujo de inscripción pública (sin sesión)
CREATE POLICY "anon_insert_student_documents"
  ON public.student_documents
  FOR INSERT TO anon
  WITH CHECK (true);

-- Estudiante autenticado: solo puede ver sus propios documentos
-- students.user_id = auth.uid() es la relación canónica del proyecto
CREATE POLICY "student_select_own_documents"
  ON public.student_documents
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

-- Admin: usa service_role que bypasa RLS — no requiere política explícita.

-- Columnas adicionales en enrollments para el PDF del contrato
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS id_document TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;

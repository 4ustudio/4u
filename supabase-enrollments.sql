-- ============================================================
-- Tabla: enrollments
-- Leads del formulario público /inscripcion
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollments (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ   DEFAULT now() NOT NULL,

  -- ¿Para quién?
  student_type    TEXT          NOT NULL CHECK (student_type IN ('self', 'child')),
  student_name    TEXT          NOT NULL,
  student_age     SMALLINT      NOT NULL CHECK (student_age >= 6 AND student_age < 120),

  -- Acudiente (obligatorio si student_type = 'child')
  guardian_name   TEXT,

  -- Contacto
  phone           TEXT          NOT NULL,
  email           TEXT          NOT NULL,

  -- Interés
  course_interest TEXT          NOT NULL,
  level           TEXT          NOT NULL CHECK (level IN ('never', 'beginner', 'intermediate', 'advanced')),
  preferred_time  TEXT          NOT NULL,

  -- CRM
  status          TEXT          NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'contacted', 'scheduled', 'cancelled')),
  notes           TEXT,
  source          TEXT          NOT NULL DEFAULT 'inscripcion'
);

-- Índices para el panel admin
CREATE INDEX IF NOT EXISTS idx_enrollments_status  ON enrollments (status);
CREATE INDEX IF NOT EXISTS idx_enrollments_created ON enrollments (created_at DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante anónimo puede INSERT (formulario público)
DROP POLICY IF EXISTS "public_can_insert_enrollments" ON enrollments;
CREATE POLICY "public_can_insert_enrollments" ON enrollments
  FOR INSERT TO anon
  WITH CHECK (true);

-- Solo el service_role (admin) puede SELECT, UPDATE, DELETE
-- (no hace falta política explícita: service_role bypassa RLS por defecto)

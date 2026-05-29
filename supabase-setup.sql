-- ============================================================
-- 4U Studio Academy — Tabla de citas / leads
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE appointments (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ   DEFAULT now() NOT NULL,

  -- Datos del lead
  name        TEXT          NOT NULL,
  phone       TEXT          NOT NULL,
  email       TEXT,
  age         SMALLINT      CHECK (age > 0 AND age < 120),

  -- Intención
  course      TEXT          NOT NULL,
  modality    TEXT          NOT NULL DEFAULT 'presencial'
                            CHECK (modality IN ('presencial', 'virtual')),
  notes       TEXT,

  -- CRM
  status      TEXT          NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'contacted', 'scheduled', 'cancelled')),
  source      TEXT          NOT NULL DEFAULT 'website'
);

-- Índices
CREATE INDEX idx_appointments_status     ON appointments (status);
CREATE INDEX idx_appointments_created_at ON appointments (created_at DESC);
CREATE INDEX idx_appointments_phone      ON appointments (phone);

-- ============================================================
-- RLS: habilitar seguridad por fila
-- ============================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Política: el formulario público puede insertar (anon key)
CREATE POLICY "public_can_insert" ON appointments
  FOR INSERT TO anon
  WITH CHECK (true);

-- Nota: SELECT / UPDATE / DELETE solo con service_role (fase /admin)
-- No se necesita ninguna política adicional hoy.
-- ============================================================

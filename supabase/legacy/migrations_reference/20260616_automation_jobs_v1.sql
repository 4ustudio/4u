-- ══════════════════════════════════════════════════════════
-- V1.7 — Motor de Automatizaciones
-- ══════════════════════════════════════════════════════════

-- ── automation_jobs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','completed','failed')),
  payload       JSONB NOT NULL DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para el job runner
CREATE INDEX idx_automation_jobs_status ON public.automation_jobs (status);
CREATE INDEX idx_automation_jobs_scheduled ON public.automation_jobs (scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_automation_jobs_type ON public.automation_jobs (type);

-- ── notification_templates ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type     TEXT NOT NULL UNIQUE,
  channel  TEXT NOT NULL DEFAULT 'whatsapp',
  template TEXT NOT NULL,
  active   BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed: templates iniciales ─────────────────────────────
INSERT INTO public.notification_templates (type, channel, template) VALUES
  ('class_reminder_24h',    'whatsapp', 'Hola {{nombre}}, te recordamos tu clase mañana a las {{hora}} en {{salon}}.'),
  ('class_reminder_2h',     'whatsapp', 'Hola {{nombre}}, tu clase inicia en 2 horas a las {{hora}}.'),
  ('payment_due_tomorrow',  'whatsapp', 'Hola {{nombre}}, tu pago vence mañana. Monto: {{monto}}.'),
  ('payment_overdue_3d',    'whatsapp', 'Hola {{nombre}}, tienes un pago pendiente de hace 3 días. Monto: {{monto}}.'),
  ('payment_overdue_7d',    'whatsapp', 'Hola {{nombre}}, tienes un pago vencido hace 7 días. Por favor regulariza tu situación.')
ON CONFLICT (type) DO NOTHING;

-- ── RLS ──────────────────────────────────────────────────
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Solo service_role (admin) puede operar estas tablas
CREATE POLICY "admin_all_automation_jobs"
  ON public.automation_jobs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "admin_all_notification_templates"
  ON public.notification_templates FOR ALL
  USING (auth.role() = 'service_role');

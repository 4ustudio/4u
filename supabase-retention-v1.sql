-- ============================================================
-- 4U Studio Academy — Retencion y Reactivacion V1
-- Historial permanente. Sin eliminacion fisica de estudiantes.
-- No modifica pagos, reservas ni autenticacion.
-- ============================================================

-- 1. Campos nuevos en students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS student_status TEXT NOT NULL DEFAULT 'activo'
    CHECK (student_status IN ('lead', 'matriculado', 'activo', 'riesgo', 'inactivo', 'exalumno')),
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_since DATE,
  ADD COLUMN IF NOT EXISTS plan_expires_at DATE,
  ADD COLUMN IF NOT EXISTS next_payment_due_at DATE,
  ADD COLUMN IF NOT EXISTS retention_score SMALLINT NOT NULL DEFAULT 100
    CHECK (retention_score >= 0 AND retention_score <= 100),
  ADD COLUMN IF NOT EXISTS primary_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_reason TEXT,
  ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ;

UPDATE students
SET
  student_since    = COALESCE(student_since, enrolled_at, created_at::date),
  last_activity_at = COALESCE(last_activity_at, updated_at, created_at),
  student_status   = CASE
    WHEN status = 'inactive' THEN 'inactivo'
    WHEN status = 'suspended' THEN 'inactivo'
    WHEN student_status IS NOT NULL THEN student_status
    ELSE 'activo'
  END
WHERE student_since IS NULL
   OR last_activity_at IS NULL
   OR student_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_students_student_status ON students(student_status);
CREATE INDEX IF NOT EXISTS idx_students_last_activity ON students(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_students_plan_expires ON students(plan_expires_at);
CREATE INDEX IF NOT EXISTS idx_students_next_payment_due ON students(next_payment_due_at);
CREATE INDEX IF NOT EXISTS idx_students_primary_course ON students(primary_course_id);
CREATE INDEX IF NOT EXISTS idx_students_archived_at ON students(archived_at);
CREATE INDEX IF NOT EXISTS idx_students_retention_score ON students(retention_score);

-- Helper idempotente para updated_at en tablas nuevas
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Historial permanente de actividad
CREATE TABLE IF NOT EXISTS student_activity_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  event_type  TEXT NOT NULL CHECK (event_type IN (
    'lead_created',
    'student_created',
    'enrolled',
    'plan_purchased',
    'plan_renewed',
    'class_booked',
    'class_completed',
    'class_cancelled',
    'class_rescheduled',
    'class_no_show',
    'login',
    'portal_activity',
    'follow_up',
    'reactivated',
    'archived',
    'status_changed'
  )),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source      TEXT NOT NULL DEFAULT 'system',
  description TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by  UUID
);

CREATE INDEX IF NOT EXISTS idx_student_activity_student
  ON student_activity_events(student_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_activity_type
  ON student_activity_events(event_type, occurred_at DESC);

-- 3. Observaciones administrativas historicas
CREATE TABLE IF NOT EXISTS student_admin_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  note_type   TEXT NOT NULL DEFAULT 'general'
    CHECK (note_type IN ('general', 'seguimiento', 'reactivacion', 'academico', 'comercial', 'administrativo')),
  note        TEXT NOT NULL,
  follow_up_at TIMESTAMPTZ,
  outcome     TEXT,
  created_by  UUID,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_student_admin_notes_student
  ON student_admin_notes(student_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_student_admin_notes_updated_at ON student_admin_notes;
CREATE TRIGGER trg_student_admin_notes_updated_at
  BEFORE UPDATE ON student_admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 4. Alertas administrativas
CREATE TABLE IF NOT EXISTS retention_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  student_id  UUID REFERENCES students(id) ON DELETE RESTRICT,
  alert_type  TEXT NOT NULL CHECK (alert_type IN (
    'risk_30_days',
    'inactive_60_days',
    'exstudent_90_days',
    'plan_expiring',
    'no_upcoming_classes',
    'repeat_lead',
    'manual'
  )),
  severity    TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  status      TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'dismissed')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  due_at      TIMESTAMPTZ,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_retention_alerts_open
  ON retention_alerts(alert_type, created_at DESC)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_retention_alerts_student
  ON retention_alerts(student_id, created_at DESC);

-- 5. Tareas de reactivacion
CREATE TABLE IF NOT EXISTS reactivation_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  assigned_to       UUID,
  task_type         TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'done', 'dismissed')),
  priority          TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  title             TEXT NOT NULL,
  description       TEXT,
  due_at            TIMESTAMPTZ,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_reactivation_tasks_status
  ON reactivation_tasks(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactivation_tasks_student
  ON reactivation_tasks(student_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_reactivation_tasks_updated_at ON reactivation_tasks;
CREATE TRIGGER trg_reactivation_tasks_updated_at
  BEFORE UPDATE ON reactivation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 6. Campanas preparadas. V1 no envia automaticamente.
CREATE TABLE IF NOT EXISTS campaign_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at      TIMESTAMPTZ,
  student_id   UUID REFERENCES students(id) ON DELETE RESTRICT,
  campaign_key TEXT NOT NULL,
  channel      TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'internal')),
  status       TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'sent', 'skipped', 'failed')),
  subject      TEXT,
  body         TEXT NOT NULL,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_campaign_messages_status
  ON campaign_messages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_student
  ON campaign_messages(student_id, created_at DESC);

-- 7. Instrumentos estudiados derivados del historial real
CREATE OR REPLACE VIEW v_student_instruments_history AS
SELECT
  cs.student_id,
  cs.course_id,
  c.name AS course_name,
  COUNT(*) FILTER (WHERE cs.status = 'completed') AS completed_classes,
  COUNT(*) FILTER (WHERE cs.status = 'cancelled') AS cancelled_classes,
  COUNT(*) FILTER (WHERE cs.status = 'rescheduled') AS rescheduled_classes,
  COUNT(*) FILTER (WHERE cs.status = 'no_show') AS no_show_classes,
  COUNT(*) AS total_sessions,
  MAX(cs.scheduled_date) AS last_session_at
FROM class_sessions cs
JOIN courses c ON c.id = cs.course_id
GROUP BY cs.student_id, cs.course_id, c.name;

-- 8. Vista base de retencion
CREATE OR REPLACE VIEW v_retention_students AS
SELECT
  s.id,
  s.name,
  s.phone,
  s.email,
  s.student_status,
  s.status AS operational_status,
  s.last_activity_at,
  GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - COALESCE(s.last_activity_at, s.created_at))) / 86400))::INT AS days_since_activity,
  s.student_since,
  s.enrolled_at,
  s.plan_expires_at,
  s.next_payment_due_at,
  s.retention_score,
  s.primary_course_id,
  c.name AS primary_course_name,
  s.archived_at,
  s.archived_reason,
  s.reactivated_at,
  COALESCE(cls.completed_classes, 0) AS completed_classes,
  COALESCE(cls.upcoming_classes, 0) AS upcoming_classes,
  COALESCE(cls.cancelled_classes, 0) AS cancelled_classes,
  COALESCE(hist.instruments_count, 0) AS instruments_count,
  COALESCE(hist.instructors_count, 0) AS instructors_count
FROM students s
LEFT JOIN courses c ON c.id = s.primary_course_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE cs.status = 'completed') AS completed_classes,
    COUNT(*) FILTER (
      WHERE cs.status IN ('pending', 'confirmed')
        AND cs.scheduled_date >= CURRENT_DATE
    ) AS upcoming_classes,
    COUNT(*) FILTER (WHERE cs.status IN ('cancelled', 'no_show')) AS cancelled_classes
  FROM class_sessions cs
  WHERE cs.student_id = s.id
) cls ON TRUE
LEFT JOIN LATERAL (
  SELECT
    COUNT(DISTINCT cs.course_id) AS instruments_count,
    COUNT(DISTINCT cs.instructor_id) FILTER (WHERE cs.instructor_id IS NOT NULL) AS instructors_count
  FROM class_sessions cs
  WHERE cs.student_id = s.id
) hist ON TRUE;

-- 9. Dashboard de retencion
CREATE OR REPLACE VIEW v_retention_dashboard AS
WITH base AS (
  SELECT
    COUNT(*) FILTER (WHERE student_status = 'activo' AND archived_at IS NULL) AS activos,
    COUNT(*) FILTER (WHERE student_status = 'riesgo' AND archived_at IS NULL) AS en_riesgo,
    COUNT(*) FILTER (WHERE student_status = 'inactivo' AND archived_at IS NULL) AS inactivos,
    COUNT(*) FILTER (WHERE student_status = 'exalumno' AND archived_at IS NULL) AS exalumnos,
    COUNT(*) FILTER (WHERE reactivated_at >= date_trunc('month', now())) AS reactivados_mes,
    COUNT(*) FILTER (
      WHERE plan_expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    ) AS planes_por_vencer,
    COUNT(*) FILTER (
      WHERE archived_at IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM class_sessions cs
          WHERE cs.student_id = students.id
            AND cs.status IN ('pending', 'confirmed')
            AND cs.scheduled_date >= CURRENT_DATE
        )
    ) AS sin_clases_proximas
  FROM students
)
SELECT
  activos AS active_students,
  en_riesgo AS risk_students,
  inactivos AS inactive_students,
  exalumnos AS alumni_students,
  reactivados_mes AS reactivated_this_month,
  planes_por_vencer AS plans_expiring_week,
  sin_clases_proximas AS without_upcoming_sessions,
  (activos + en_riesgo + inactivos + exalumnos) AS total_students,
  ROUND(
    (activos::numeric * 100)
    / NULLIF((activos + en_riesgo + inactivos + exalumnos), 0),
    1
  ) AS retention_rate,
  ROUND(
    (reactivados_mes::numeric * 100)
    / NULLIF((reactivados_mes + en_riesgo + inactivos + exalumnos), 0),
    1
  ) AS reactivation_rate
FROM base;

-- 10. Estudiantes con mayor riesgo
CREATE OR REPLACE VIEW v_high_risk_students AS
SELECT *
FROM v_retention_students
WHERE archived_at IS NULL
  AND (
    student_status IN ('riesgo', 'inactivo', 'exalumno')
    OR retention_score <= 55
    OR upcoming_classes = 0
  )
ORDER BY retention_score ASC, days_since_activity DESC;

-- 11. Registrar actividad
CREATE OR REPLACE FUNCTION fn_record_student_activity(
  p_student_id UUID,
  p_event_type TEXT,
  p_source TEXT DEFAULT 'system',
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_status TEXT;
BEGIN
  SELECT student_status INTO v_previous_status
  FROM students
  WHERE id = p_student_id;

  INSERT INTO student_activity_events (
    student_id,
    event_type,
    source,
    description,
    metadata
  )
  VALUES (
    p_student_id,
    p_event_type,
    COALESCE(p_source, 'system'),
    p_description,
    COALESCE(p_metadata, '{}'::jsonb)
  );

  UPDATE students
  SET
    last_activity_at = now(),
    student_status = CASE
      WHEN student_status IN ('riesgo', 'inactivo', 'exalumno') THEN 'activo'
      ELSE student_status
    END,
    reactivated_at = CASE
      WHEN student_status IN ('riesgo', 'inactivo', 'exalumno') THEN now()
      ELSE reactivated_at
    END
  WHERE id = p_student_id;

  IF v_previous_status IN ('riesgo', 'inactivo', 'exalumno') THEN
    INSERT INTO student_activity_events (student_id, event_type, description, metadata)
    VALUES (
      p_student_id,
      'reactivated',
      'Reactivado por nueva actividad',
      jsonb_build_object('previous_status', v_previous_status)
    );
  END IF;
END;
$$;

-- 12. RLS: se usa service_role desde Server Actions en V1
ALTER TABLE student_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactivation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;

-- V2 documentado: student_tags para segmentacion administrativa
-- CREATE TABLE student_tags (...);

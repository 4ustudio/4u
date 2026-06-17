-- ============================================================
-- 4U Studio Academy — Operación Académica V1
-- Confirmación de Asistencia + Cancelación por Instructor
-- ============================================================

-- ── 1. Nuevos campos en class_sessions ──────────────────────

ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS attendance_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (attendance_status IN ('pending', 'confirmed', 'declined', 'rescheduled', 'no_response')),
  ADD COLUMN IF NOT EXISTS attendance_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attendance_confirmation_token UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS attendance_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS second_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT
    CHECK (cancelled_by IN ('student', 'instructor', 'admin'));

-- Token único para clases existentes que no tienen uno
UPDATE class_sessions
SET attendance_confirmation_token = gen_random_uuid()
WHERE attendance_confirmation_token IS NULL;

-- ── 2. Índices operativos ────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cs_attendance_status
  ON class_sessions (attendance_status)
  WHERE status NOT IN ('cancelled', 'rescheduled');

CREATE INDEX IF NOT EXISTS idx_cs_confirmation_token
  ON class_sessions (attendance_confirmation_token)
  WHERE attendance_confirmation_token IS NOT NULL;

-- Clases que necesitan primer recordatorio (24h antes)
CREATE INDEX IF NOT EXISTS idx_cs_reminder_first
  ON class_sessions (scheduled_date, attendance_reminder_sent_at)
  WHERE status NOT IN ('cancelled', 'rescheduled')
    AND attendance_reminder_sent_at IS NULL;

-- Clases que necesitan segundo recordatorio (3h antes, siguen pending)
CREATE INDEX IF NOT EXISTS idx_cs_reminder_second
  ON class_sessions (scheduled_date, second_reminder_sent_at, attendance_status)
  WHERE status NOT IN ('cancelled', 'rescheduled')
    AND second_reminder_sent_at IS NULL
    AND attendance_status = 'pending';

-- ── 3. Función y trigger CRM de retención ───────────────────
-- Reglas:
--   declined: 1 → sin penalización | 2 consecutivos → alerta | 3 en 30 días → -10
--   no_response: 2 → -5
--   no_show (status): 3 → student_status = 'riesgo'

CREATE OR REPLACE FUNCTION fn_attendance_crm_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_declined_last_30   INT;
  v_no_response_recent INT;
  v_no_show_recent     INT;
BEGIN
  -- Solo actuar en cambios reales de attendance_status
  IF NEW.attendance_status = OLD.attendance_status THEN
    RETURN NEW;
  END IF;

  -- ── declined ────────────────────────────────────────────
  IF NEW.attendance_status = 'declined' THEN
    -- Contar declined en los últimos 30 días (incluye el actual)
    SELECT COUNT(*) INTO v_declined_last_30
    FROM class_sessions
    WHERE student_id = NEW.student_id
      AND attendance_status = 'declined'
      AND scheduled_date >= (CURRENT_DATE - INTERVAL '30 days')
      AND id != NEW.id;

    -- +1 por el que acaba de cambiarse = v_declined_last_30 + 1 total
    IF v_declined_last_30 + 1 >= 3 THEN
      -- 3 declined en 30 días → reducir retention_score
      UPDATE students
      SET retention_score  = GREATEST(0, retention_score - 10),
          last_activity_at = now()
      WHERE id = NEW.student_id;

      INSERT INTO student_activity_events (student_id, event_type, description, source)
      VALUES (NEW.student_id, 'status_changed',
        '3 clases rechazadas en 30 días — penalización automática', 'system');

    ELSIF v_declined_last_30 + 1 = 2 THEN
      -- 2 consecutivos → solo alerta (sin penalización)
      INSERT INTO student_activity_events (student_id, event_type, description, source)
      VALUES (NEW.student_id, 'status_changed',
        '2 clases rechazadas consecutivas — alerta de seguimiento', 'system');
    END IF;
    -- 1 declined → sin acción
  END IF;

  -- ── no_response ─────────────────────────────────────────
  IF NEW.attendance_status = 'no_response' THEN
    SELECT COUNT(*) INTO v_no_response_recent
    FROM class_sessions
    WHERE student_id = NEW.student_id
      AND attendance_status = 'no_response'
      AND scheduled_date >= (CURRENT_DATE - INTERVAL '30 days')
      AND id != NEW.id;

    IF v_no_response_recent + 1 >= 2 THEN
      UPDATE students
      SET retention_score  = GREATEST(0, retention_score - 5),
          last_activity_at = now()
      WHERE id = NEW.student_id;

      INSERT INTO student_activity_events (student_id, event_type, description, source)
      VALUES (NEW.student_id, 'status_changed',
        '2 clases sin respuesta — penalización automática', 'system');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendance_crm ON class_sessions;
CREATE TRIGGER trg_attendance_crm
  AFTER UPDATE OF attendance_status ON class_sessions
  FOR EACH ROW EXECUTE FUNCTION fn_attendance_crm_rules();

-- ── 4. Trigger para no_show → student_status = 'riesgo' ─────

CREATE OR REPLACE FUNCTION fn_no_show_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_no_show_count INT;
BEGIN
  IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
    SELECT COUNT(*) INTO v_no_show_count
    FROM class_sessions
    WHERE student_id = NEW.student_id
      AND status = 'no_show'
      AND scheduled_date >= (CURRENT_DATE - INTERVAL '60 days')
      AND id != NEW.id;

    IF v_no_show_count + 1 >= 3 THEN
      UPDATE students
      SET student_status = 'riesgo'
      WHERE id = NEW.student_id
        AND student_status NOT IN ('inactivo', 'exalumno');

      INSERT INTO student_activity_events (student_id, event_type, description, source)
      VALUES (NEW.student_id, 'status_changed',
        '3 no-show en 60 días — estado cambiado a riesgo', 'system');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_no_show_risk ON class_sessions;
CREATE TRIGGER trg_no_show_risk
  AFTER UPDATE OF status ON class_sessions
  FOR EACH ROW EXECUTE FUNCTION fn_no_show_risk();

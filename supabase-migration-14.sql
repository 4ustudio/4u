-- ============================================================
-- MIGRACIÓN 14 — ASISTENCIA ACADÉMICA
-- ============================================================
-- Fecha: 2026-06-16
-- Requerimiento: Release v1.6 — Asistencia y Dashboard Académico
--
-- 1. Extiende attendance_status para soportar registro simplificado
-- 2. Vistas para indicadores académicos
-- ============================================================

-- ── 1. Extender CHECK de attendance_status ──────────────────

ALTER TABLE class_sessions
  DROP CONSTRAINT IF EXISTS class_sessions_attendance_status_check;

ALTER TABLE class_sessions
  ADD CONSTRAINT class_sessions_attendance_status_check
  CHECK (attendance_status IN (
    'pending', 'confirmed', 'declined', 'rescheduled', 'no_response',
    'attended', 'absent', 'no_show'
  ));

-- ── 2. Vistas para indicadores académicos ───────────────────

CREATE OR REPLACE VIEW v_academic_attendance AS
SELECT
  instructor_id,
  course_id,
  COUNT(*) AS total_sessions,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
  COUNT(*) FILTER (WHERE attendance_status = 'attended') AS attended,
  COUNT(*) FILTER (WHERE attendance_status = 'absent') AS absent,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'completed') / NULLIF(COUNT(*), 0), 1
  ) AS attendance_rate
FROM class_sessions
WHERE scheduled_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY GROUPING SETS (
  (instructor_id, course_id),
  (instructor_id),
  (course_id)
);

CREATE OR REPLACE VIEW v_academic_risk AS
SELECT
  s.id AS student_id,
  s.name AS student_name,
  s.student_status,
  s.retention_score,
  COUNT(cs.id) FILTER (WHERE cs.status = 'no_show' AND cs.scheduled_date >= CURRENT_DATE - INTERVAL '60 days') AS recent_no_shows,
  COUNT(cs.id) FILTER (WHERE cs.scheduled_date >= CURRENT_DATE - INTERVAL '90 days') AS total_90d,
  COUNT(cs.id) FILTER (WHERE cs.status = 'completed' AND cs.scheduled_date >= CURRENT_DATE - INTERVAL '90 days') AS completed_90d,
  ROUND(
    100.0 * COUNT(cs.id) FILTER (WHERE cs.status = 'completed' AND cs.scheduled_date >= CURRENT_DATE - INTERVAL '90 days')
    / NULLIF(COUNT(cs.id) FILTER (WHERE cs.scheduled_date >= CURRENT_DATE - INTERVAL '90 days'), 0), 1
  ) AS attendance_rate_90d,
  CASE
    WHEN COUNT(cs.id) FILTER (WHERE cs.status = 'no_show' AND cs.scheduled_date >= CURRENT_DATE - INTERVAL '60 days') >= 3 THEN 'critical'
    WHEN ROUND(
      100.0 * COUNT(cs.id) FILTER (WHERE cs.status = 'completed' AND cs.scheduled_date >= CURRENT_DATE - INTERVAL '90 days')
      / NULLIF(COUNT(cs.id) FILTER (WHERE cs.scheduled_date >= CURRENT_DATE - INTERVAL '90 days'), 0), 1
    ) < 50 THEN 'warning'
    ELSE 'ok'
  END AS risk_level
FROM students s
LEFT JOIN class_sessions cs ON cs.student_id = s.id AND cs.scheduled_date >= CURRENT_DATE - INTERVAL '90 days'
WHERE s.status = 'active'
GROUP BY s.id, s.name, s.student_status, s.retention_score;

-- ============================================================
-- FIN DE MIGRACIÓN 14
-- ============================================================

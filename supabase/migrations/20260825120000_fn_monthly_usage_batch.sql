-- Versión batch de fn_monthly_usage para evitar N+1 al cargar la lista de
-- estudiantes (una RPC por alumno). Misma lógica, pero sobre un array de ids.
CREATE OR REPLACE FUNCTION fn_monthly_usage_batch(
  p_student_ids UUID[],
  p_year        SMALLINT,
  p_month       SMALLINT
)
RETURNS TABLE (
  student_id          UUID,
  quota_total         SMALLINT,
  classes_scheduled   BIGINT,
  classes_completed   BIGINT,
  late_cancellations  SMALLINT,
  classes_available   INT
) LANGUAGE SQL STABLE AS $$
  WITH ids AS (
    SELECT DISTINCT s AS student_id FROM unnest(p_student_ids) AS s
  ),
  quota AS (
    SELECT
      i.student_id,
      COALESCE(mq.quota_total,        8)::SMALLINT AS quota_total,
      COALESCE(mq.late_cancellations, 0)::SMALLINT AS late_cancellations
    FROM ids i
    LEFT JOIN monthly_quotas mq
      ON  mq.student_id   = i.student_id
      AND mq.period_year  = p_year
      AND mq.period_month = p_month
  ),
  usage AS (
    SELECT
      i.student_id,
      COUNT(cs.*) FILTER (WHERE cs.status IN ('pending',   'confirmed'))::BIGINT AS classes_scheduled,
      COUNT(cs.*) FILTER (WHERE cs.status IN ('completed', 'no_show'))  ::BIGINT AS classes_completed
    FROM ids i
    LEFT JOIN class_sessions cs
      ON  cs.student_id = i.student_id
      AND EXTRACT(YEAR  FROM cs.scheduled_date)::SMALLINT = p_year
      AND EXTRACT(MONTH FROM cs.scheduled_date)::SMALLINT = p_month
      AND cs.status NOT IN ('cancelled', 'rescheduled')
    GROUP BY i.student_id
  ),
  adjustments AS (
    SELECT
      i.student_id,
      COALESCE(SUM(ca.delta), 0)::INT AS net_delta
    FROM ids i
    LEFT JOIN credit_adjustments ca
      ON  ca.student_id   = i.student_id
      AND ca.period_year  = p_year
      AND ca.period_month = p_month
    GROUP BY i.student_id
  )
  SELECT
    q.student_id,
    q.quota_total,
    u.classes_scheduled,
    u.classes_completed,
    q.late_cancellations,
    GREATEST(0,
      q.quota_total
      - u.classes_scheduled::INT
      - u.classes_completed::INT
      - q.late_cancellations::INT
      + a.net_delta
    )::INT AS classes_available
  FROM quota q
  JOIN usage u       ON u.student_id = q.student_id
  JOIN adjustments a ON a.student_id = q.student_id;
$$;

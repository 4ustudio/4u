-- Elimina fn_update_student_risk_levels().
--
-- La función escribía students.risk_level con los valores 'HIGH' / 'MEDIUM' /
-- 'LOW', pero el constraint chk_students_risk_level solo admite
-- 'bajo' | 'medio' | 'alto' | 'critico'. Cada UPDATE violaba el check, así que
-- la función falló en todas sus ejecuciones desde que se creó y nunca llegó a
-- escribir un solo registro.
--
-- No se traduce ni se repara porque el cálculo ya está resuelto en TypeScript:
-- computeRiskLevel() en app/admin/_actions/retention.ts, que corre a diario
-- dentro de runRetentionDailyJob() (invocado por el cron
-- /api/cron/attendance-reminders). Mantener las dos implementaciones dejaría
-- dos definiciones distintas de "riesgo" compitiendo por la misma columna.
--
-- El cron /api/cron/risk-update, único consumidor de esta función, se elimina
-- junto con ella.

DROP FUNCTION IF EXISTS "public"."fn_update_student_risk_levels"();

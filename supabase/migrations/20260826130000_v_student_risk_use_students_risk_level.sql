-- Fase 0 del plan de unificación Retención/Recuperación/Indicadores.
--
-- v_student_risk recalculaba "computed_risk_level" (HIGH/MEDIUM/LOW) desde
-- cero con su propia fórmula (pagos vencidos + 1 umbral de días), ignorando
-- el valor ya calculado por runRetentionDailyJob() en students.risk_level
-- (bajo/medio/alto/critico). Eso hacía que un mismo alumno pudiera verse
-- "en riesgo" en /admin/retencion y "sin riesgo" en /admin/reactivacion.
--
-- Se reemplaza el CASE por un mapeo directo desde students.risk_level, que
-- pasa a ser la única fuente de verdad. NULL (alumno aún sin correr el cron,
-- o sin riesgo) cae en 'LOW' para preservar el comportamiento por defecto
-- que ya tenía la vista.

CREATE OR REPLACE VIEW "public"."v_student_risk" WITH ("security_invoker"='true') AS
 SELECT "s"."id",
    COALESCE((("s"."first_name" || ' '::"text") || "s"."last_name"), "s"."name") AS "full_name",
    "s"."phone",
    "s"."email",
    "s"."student_status",
    "s"."last_activity_at",
    "s"."last_completed_class_at",
    "s"."plan_expires_at",
    "s"."next_payment_due_at",
    "s"."retention_score",
    "s"."risk_level",
    "s"."risk_reason",
    "s"."plan_name",
    ("count"("p"."id") FILTER (WHERE (("p"."status" <> 'paid'::"text") AND ("p"."due_date" < CURRENT_DATE))))::integer AS "overdue_payments_count",
    COALESCE("sum"("p"."final_amount") FILTER (WHERE (("p"."status" <> 'paid'::"text") AND ("p"."due_date" < CURRENT_DATE))), (0)::numeric) AS "overdue_amount",
    ("count"("p"."id") FILTER (WHERE (("p"."status" <> 'paid'::"text") AND ("p"."due_date" >= CURRENT_DATE))))::integer AS "pending_payments_count",
    COALESCE("sum"("p"."final_amount") FILTER (WHERE (("p"."status" <> 'paid'::"text") AND ("p"."due_date" >= CURRENT_DATE))), (0)::numeric) AS "pending_amount",
    (EXTRACT(day FROM ("now"() - ("s"."last_completed_class_at")::timestamp with time zone)))::integer AS "days_since_last_class",
    (EXTRACT(day FROM ("now"() - "s"."last_activity_at")))::integer AS "days_since_last_activity",
        CASE "s"."risk_level"
            WHEN 'critico' THEN 'HIGH'::"text"
            WHEN 'alto'    THEN 'HIGH'::"text"
            WHEN 'medio'   THEN 'MEDIUM'::"text"
            WHEN 'bajo'    THEN 'LOW'::"text"
            ELSE 'LOW'::"text"
        END AS "computed_risk_level"
   FROM ("public"."students" "s"
     LEFT JOIN "public"."payments" "p" ON (("p"."student_id" = "s"."id")))
  WHERE ("s"."archived_at" IS NULL)
  GROUP BY "s"."id", "s"."name", "s"."first_name", "s"."last_name", "s"."student_status", "s"."last_activity_at", "s"."last_completed_class_at", "s"."plan_expires_at", "s"."next_payment_due_at", "s"."retention_score", "s"."risk_level", "s"."risk_reason", "s"."plan_name", "s"."phone", "s"."email";

ALTER VIEW "public"."v_student_risk" OWNER TO "postgres";

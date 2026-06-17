


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."session_status_t" AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'rescheduled',
    'no_show'
);


ALTER TYPE "public"."session_status_t" OWNER TO "postgres";


CREATE TYPE "public"."student_status_t" AS ENUM (
    'active',
    'inactive',
    'suspended'
);


ALTER TYPE "public"."student_status_t" OWNER TO "postgres";


CREATE TYPE "public"."student_type_t" AS ENUM (
    'new',
    'regular'
);


ALTER TYPE "public"."student_type_t" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_overdue_payments"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE payments
  SET status     = 'overdue',
      updated_at = now()
  WHERE status   = 'pending'
    AND due_date < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."compute_overdue_payments"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_attendance_crm_rules"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."fn_attendance_crm_rules"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_available_slots"("p_date" "date", "p_student_id" "uuid" DEFAULT NULL::"uuid", "p_instructor_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("slot_time" time without time zone, "classroom_id" "uuid", "classroom_name" "text", "is_available" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  WITH slots AS (
    SELECT gs::TIME AS slot_time
    FROM generate_series(
      CASE
        WHEN EXTRACT(ISODOW FROM p_date)::INT = 6
          THEN (p_date::TEXT || ' 08:00')::TIMESTAMP
        ELSE   (p_date::TEXT || ' 10:00')::TIMESTAMP
      END,
      CASE
        WHEN EXTRACT(ISODOW FROM p_date)::INT = 6
          THEN (p_date::TEXT || ' 13:00')::TIMESTAMP
        ELSE   (p_date::TEXT || ' 21:00')::TIMESTAMP
      END,
      INTERVAL '1 hour'
    ) gs
    WHERE EXTRACT(ISODOW FROM p_date)::INT != 7
  ),
  rooms AS (
    SELECT id, name FROM classrooms WHERE is_active = true
  ),
  -- Si hay disponibilidad configurada, precalcular qué slots tienen instructor disponible
  avail_configured AS (
    SELECT EXISTS (SELECT 1 FROM instructor_availability LIMIT 1) AS has_avail
  ),
  instructor_avail_slots AS (
    SELECT DISTINCT ia.start_time, ia.end_time
    FROM instructor_availability ia
    JOIN instructors i ON i.id = ia.instructor_id AND i.status = 'active'
    WHERE ia.day_of_week = EXTRACT(ISODOW FROM p_date)::SMALLINT
  )
  SELECT
    s.slot_time,
    r.id              AS classroom_id,
    r.name            AS classroom_name,
    NOT fn_is_blocked(p_date, s.slot_time, r.id)
    AND fn_slot_available(r.id, p_date, s.slot_time)
    AND (p_student_id IS NULL    OR fn_student_free(p_student_id, p_date, s.slot_time))
    AND (p_instructor_id IS NULL OR (fn_instructor_free(p_instructor_id, p_date, s.slot_time) IS NULL))
    -- Solo filtrar por disponibilidad de instructor si hay al menos uno configurado
    AND (
      NOT (SELECT has_avail FROM avail_configured)
      OR EXISTS (
        SELECT 1 FROM instructor_avail_slots ias
        WHERE ias.start_time <= s.slot_time
          AND ias.end_time >= (s.slot_time + INTERVAL '1 hour')
      )
    )
    AS is_available
  FROM slots s
  CROSS JOIN rooms r
  ORDER BY s.slot_time, r.name;
$$;


ALTER FUNCTION "public"."fn_available_slots"("p_date" "date", "p_student_id" "uuid", "p_instructor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_book_session"("p_student_id" "uuid", "p_classroom_id" "uuid", "p_course_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_instructor_id" "uuid" DEFAULT NULL::"uuid", "p_schedule_id" "uuid" DEFAULT NULL::"uuid", "p_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_year      SMALLINT := EXTRACT(YEAR  FROM p_date)::SMALLINT;
  v_month     SMALLINT := EXTRACT(MONTH FROM p_date)::SMALLINT;
  v_error     TEXT;
  v_available INT;
  v_new_id    UUID;
BEGIN
  v_error := fn_validate_schedule_rules(p_student_id, p_date, p_start_time);
  IF v_error IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', v_error);
  END IF;

  IF fn_is_blocked(p_date, p_start_time, p_classroom_id) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'La academia esta cerrada en esa fecha y horario.');
  END IF;

  IF NOT fn_slot_available(p_classroom_id, p_date, p_start_time) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El salon no esta disponible en ese horario.');
  END IF;

  IF NOT fn_student_free(p_student_id, p_date, p_start_time) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El estudiante ya tiene otra clase en ese horario.');
  END IF;

  IF p_instructor_id IS NOT NULL THEN
    v_error := fn_instructor_free(p_instructor_id, p_date, p_start_time);
    IF v_error IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', v_error);
    END IF;
  END IF;

  SELECT classes_available INTO v_available
  FROM fn_monthly_usage(p_student_id, v_year, v_month);

  IF v_available <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El estudiante ha utilizado todas sus clases del mes '
      || v_year::TEXT || '-' || LPAD(v_month::TEXT, 2, '0') || '.');
  END IF;

  INSERT INTO class_sessions (
    student_id, classroom_id, course_id, instructor_id,
    scheduled_date, start_time, status, schedule_id, notes
  ) VALUES (
    p_student_id, p_classroom_id, p_course_id, p_instructor_id,
    p_date, p_start_time, 'confirmed', p_schedule_id, p_notes
  ) RETURNING id INTO v_new_id;

  INSERT INTO monthly_quotas (student_id, period_year, period_month, quota_total)
  VALUES (p_student_id, v_year, v_month, 8)
  ON CONFLICT (student_id, period_year, period_month) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'session_id', v_new_id);
END;
$$;


ALTER FUNCTION "public"."fn_book_session"("p_student_id" "uuid", "p_classroom_id" "uuid", "p_course_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_instructor_id" "uuid", "p_schedule_id" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_cancel_session"("p_session_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_session  class_sessions%ROWTYPE;
  v_class_ts TIMESTAMPTZ;
  v_is_late  BOOLEAN;
BEGIN
  SELECT * INTO v_session FROM class_sessions WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sesión no encontrada.');
  END IF;

  IF v_session.status NOT IN ('pending', 'confirmed') THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Solo se pueden cancelar clases en estado pending o confirmed.');
  END IF;

  -- Calcular si es cancelación tardía usando zona horaria Colombia (UTC-5)
  v_class_ts :=
    (v_session.scheduled_date::TEXT || ' ' || v_session.start_time::TEXT)::TIMESTAMP
    AT TIME ZONE 'America/Bogota';

  v_is_late := (v_class_ts - now()) < INTERVAL '24 hours';

  UPDATE class_sessions SET
    status              = 'cancelled',
    cancelled_at        = now(),
    cancellation_reason = p_reason,
    late_cancellation   = v_is_late
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success',           true,
    'late_cancellation', v_is_late,
    'message', CASE
      WHEN v_is_late
        THEN 'Clase cancelada. La cancelación fue con menos de 24 horas de anticipación; la clase se considera tomada y consume cupo mensual.'
      ELSE
        'Clase cancelada exitosamente. Puedes reagendar dentro del mismo mes calendario.'
    END
  );
END;
$$;


ALTER FUNCTION "public"."fn_cancel_session"("p_session_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_enrollment_initial_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$ BEGIN INSERT INTO enrollment_events (enrollment_id, type, description) VALUES (NEW.id, 'form_received', 'Formulario de inscripción recibido'); RETURN NEW; END; $$;


ALTER FUNCTION "public"."fn_enrollment_initial_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_generate_monthly_sessions"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_schedule  student_schedules%ROWTYPE;
  v_date      DATE;
  v_first_day DATE := make_date(p_year::INT, p_month::INT, 1);
  v_last_day  DATE := (make_date(p_year::INT, p_month::INT, 1) + INTERVAL '1 month - 1 day')::DATE;
  v_generated INT  := 0;
  v_skipped   INT  := 0;
  v_errors    TEXT[] := '{}';
  v_result    JSONB;
  v_quota     INT;
BEGIN
  v_date := v_first_day;
  WHILE v_date <= v_last_day LOOP
    FOR v_schedule IN
      SELECT * FROM student_schedules
      WHERE student_id = p_student_id
        AND status      = 'active'
        AND active_from <= v_date
        AND (active_until IS NULL OR active_until >= v_date)
        AND day_of_week = EXTRACT(ISODOW FROM v_date)::SMALLINT
      ORDER BY start_time
    LOOP
      IF EXISTS (
        SELECT 1 FROM class_sessions
        WHERE student_id    = p_student_id
          AND scheduled_date = v_date
          AND start_time     = v_schedule.start_time
          AND schedule_id    = v_schedule.id
          AND status NOT IN ('cancelled', 'rescheduled')
      ) THEN
        v_skipped := v_skipped + 1;
      ELSE
        v_result := fn_book_session(
          p_student_id    := p_student_id,
          p_classroom_id  := v_schedule.classroom_id,
          p_course_id     := v_schedule.course_id,
          p_date          := v_date,
          p_start_time    := v_schedule.start_time,
          p_instructor_id := v_schedule.instructor_id,
          p_schedule_id   := v_schedule.id
        );
        IF (v_result->>'success')::BOOLEAN THEN
          v_generated := v_generated + 1;
        ELSE
          v_skipped := v_skipped + 1;
          v_errors  := array_append(v_errors,
            to_char(v_date, 'YYYY-MM-DD') || ' ' || v_schedule.start_time::TEXT
            || ': ' || (v_result->>'error'));
        END IF;
      END IF;
    END LOOP;
    SELECT classes_available INTO v_quota
    FROM fn_monthly_usage(p_student_id, p_year, p_month);
    IF v_quota <= 0 THEN
      EXIT;
    END IF;
    v_date := v_date + INTERVAL '1 day';
  END LOOP;
  RETURN jsonb_build_object(
    'generated', v_generated,
    'skipped',   v_skipped,
    'errors',    to_jsonb(v_errors)
  );
END;
$$;


ALTER FUNCTION "public"."fn_generate_monthly_sessions"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_generate_retention_alerts"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  v_count integer := 0;
  r RECORD;
BEGIN
  -- Resolver alertas abiertas de estudiantes que volvieron a LOW
  UPDATE retention_alerts
  SET status = 'resolved', resolved_at = now()
  WHERE status = 'open'
    AND student_id IN (
      SELECT id FROM v_student_risk WHERE computed_risk_level = 'LOW'
    );

  FOR r IN
    SELECT * FROM v_student_risk
    WHERE computed_risk_level IN ('HIGH', 'MEDIUM')
  LOOP

    -- Alerta por pagos vencidos
    IF r.overdue_payments_count > 0 THEN
      INSERT INTO retention_alerts (student_id, alert_type, severity, title, message, metadata)
      SELECT
        r.id, 'payment_overdue', 'critical',
        'Pago vencido: ' || r.full_name,
        r.overdue_payments_count || ' pago(s) vencido(s) — $' || r.overdue_amount::text,
        jsonb_build_object('overdue_count', r.overdue_payments_count,
                           'overdue_amount', r.overdue_amount,
                           'risk_level', r.computed_risk_level)
      WHERE NOT EXISTS (
        SELECT 1 FROM retention_alerts
        WHERE student_id = r.id AND alert_type = 'payment_overdue' AND status = 'open'
      );
      v_count := v_count + 1;
    END IF;

    -- Alerta por múltiples pagos pendientes
    IF r.pending_payments_count > 1 AND r.overdue_payments_count = 0 THEN
      INSERT INTO retention_alerts (student_id, alert_type, severity, title, message, metadata)
      SELECT
        r.id, 'payment_pending', 'warning',
        'Pagos pendientes: ' || r.full_name,
        r.pending_payments_count || ' pago(s) pendiente(s) — $' || r.pending_amount::text,
        jsonb_build_object('pending_count', r.pending_payments_count,
                           'pending_amount', r.pending_amount,
                           'risk_level', r.computed_risk_level)
      WHERE NOT EXISTS (
        SELECT 1 FROM retention_alerts
        WHERE student_id = r.id AND alert_type = 'payment_pending' AND status = 'open'
      );
      v_count := v_count + 1;
    END IF;

    -- Alerta por ausencia prolongada
    IF r.days_since_last_class IS NOT NULL AND r.days_since_last_class > 14 THEN
      INSERT INTO retention_alerts (student_id, alert_type, severity, title, message, metadata)
      SELECT
        r.id, 'attendance_gap',
        CASE WHEN r.days_since_last_class > 30 THEN 'critical' ELSE 'warning' END,
        'Sin clases: ' || r.full_name,
        r.days_since_last_class || ' días sin clase completada',
        jsonb_build_object('days_since_last_class', r.days_since_last_class,
                           'risk_level', r.computed_risk_level)
      WHERE NOT EXISTS (
        SELECT 1 FROM retention_alerts
        WHERE student_id = r.id AND alert_type = 'attendance_gap' AND status = 'open'
      );
      v_count := v_count + 1;
    END IF;

  END LOOP;

  RETURN v_count;
END;
$_$;


ALTER FUNCTION "public"."fn_generate_retention_alerts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_handle_late_cancellation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF NEW.late_cancellation = true AND OLD.late_cancellation = false THEN
    INSERT INTO monthly_quotas (
      student_id, period_year, period_month, quota_total, late_cancellations
    ) VALUES (
      NEW.student_id,
      EXTRACT(YEAR  FROM NEW.scheduled_date)::SMALLINT,
      EXTRACT(MONTH FROM NEW.scheduled_date)::SMALLINT,
      8, 1
    )
    ON CONFLICT (student_id, period_year, period_month)
    DO UPDATE SET
      late_cancellations = monthly_quotas.late_cancellations + 1;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_handle_late_cancellation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_instructor_free"("p_instructor_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$  -- NULL = libre, TEXT = mensaje de error
DECLARE
  v_dow SMALLINT := EXTRACT(ISODOW FROM p_date)::SMALLINT;
BEGIN
  -- 1. Tiene ventana de disponibilidad que cubra la clase completa (1h)
  IF NOT EXISTS (
    SELECT 1 FROM instructor_availability
    WHERE instructor_id = p_instructor_id
      AND day_of_week   = v_dow
      AND start_time   <= p_start_time
      AND end_time     >= (p_start_time + INTERVAL '1 hour')
  ) THEN
    RETURN 'El instructor no tiene disponibilidad configurada en ese horario.';
  END IF;

  -- 2. No tiene otra clase al mismo tiempo
  IF EXISTS (
    SELECT 1 FROM class_sessions
    WHERE instructor_id  = p_instructor_id
      AND scheduled_date = p_date
      AND status NOT IN ('cancelled', 'rescheduled')
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND start_time < (p_start_time + INTERVAL '1 hour')
      AND (start_time + INTERVAL '1 hour') > p_start_time
  ) THEN
    RETURN 'El instructor ya tiene otra clase en ese horario.';
  END IF;

  RETURN NULL;  -- Libre y disponible
END;
$$;


ALTER FUNCTION "public"."fn_instructor_free"("p_instructor_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_is_blocked"("p_date" "date", "p_start_time" time without time zone, "p_classroom_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocked_dates
    WHERE blocked_date = p_date
      -- Aplica a todos los salones O al salón específico
      AND (classroom_id IS NULL OR classroom_id = p_classroom_id)
      AND (
        -- Bloqueo día completo
        (start_time IS NULL AND end_time IS NULL)
        OR
        -- La hora de inicio de clase cae dentro del bloqueo
        (start_time <= p_start_time AND end_time > p_start_time)
      )
  );
$$;


ALTER FUNCTION "public"."fn_is_blocked"("p_date" "date", "p_start_time" time without time zone, "p_classroom_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."student_followups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "followup_type" "text" NOT NULL,
    "notes" "text",
    "next_action_date" "date",
    "status" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "result" "text",
    CONSTRAINT "student_followups_followup_type_check" CHECK (("followup_type" = ANY (ARRAY['llamada'::"text", 'whatsapp'::"text", 'email'::"text", 'reunión'::"text", 'observación'::"text"]))),
    CONSTRAINT "student_followups_status_check" CHECK (("status" = ANY (ARRAY['pendiente'::"text", 'completado'::"text", 'sin_respuesta'::"text"])))
);


ALTER TABLE "public"."student_followups" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_latest_followup_per_student"() RETURNS SETOF "public"."student_followups"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT DISTINCT ON (student_id) *
  FROM student_followups
  ORDER BY student_id, created_at DESC;
$$;


ALTER FUNCTION "public"."fn_latest_followup_per_student"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_log_session_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO class_history (session_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_log_session_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_monthly_usage"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint) RETURNS TABLE("quota_total" smallint, "classes_scheduled" bigint, "classes_completed" bigint, "late_cancellations" smallint, "classes_available" integer)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  WITH quota AS (
    SELECT
      COALESCE(mq.quota_total,        8)::SMALLINT AS quota_total,
      COALESCE(mq.late_cancellations, 0)::SMALLINT AS late_cancellations
    FROM (VALUES (1)) v(x)
    LEFT JOIN monthly_quotas mq
      ON  mq.student_id   = p_student_id
      AND mq.period_year  = p_year
      AND mq.period_month = p_month
  ),
  usage AS (
    SELECT
      COUNT(*) FILTER (WHERE status IN ('pending',   'confirmed'))::BIGINT AS classes_scheduled,
      COUNT(*) FILTER (WHERE status IN ('completed', 'no_show'))  ::BIGINT AS classes_completed
    FROM class_sessions
    WHERE student_id = p_student_id
      AND EXTRACT(YEAR  FROM scheduled_date)::SMALLINT = p_year
      AND EXTRACT(MONTH FROM scheduled_date)::SMALLINT = p_month
      AND status NOT IN ('cancelled', 'rescheduled')
  ),
  -- Ajustes administrativos: restauraciones y descuentos excepcionales
  adjustments AS (
    SELECT COALESCE(SUM(delta), 0)::INT AS net_delta
    FROM credit_adjustments
    WHERE student_id   = p_student_id
      AND period_year  = p_year
      AND period_month = p_month
  )
  SELECT
    q.quota_total,
    u.classes_scheduled,
    u.classes_completed,
    q.late_cancellations,
    GREATEST(0,
      q.quota_total
      - u.classes_scheduled::INT
      - u.classes_completed::INT
      - q.late_cancellations::INT
      + a.net_delta          -- suma ajustes admin (+restaura / -descuenta)
    )::INT AS classes_available
  FROM quota q, usage u, adjustments a;
$$;


ALTER FUNCTION "public"."fn_monthly_usage"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_no_show_risk"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."fn_no_show_risk"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_record_student_activity"("p_student_id" "uuid", "p_event_type" "text", "p_source" "text" DEFAULT 'system'::"text", "p_description" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_previous_status TEXT;
  v_is_system_event BOOLEAN;
BEGIN
  -- Eventos del sistema de retención/cron: no deben reactivar al estudiante
  -- ni actualizar last_activity_at (eso lo gestiona el cron directamente)
  v_is_system_event := (
    p_source = 'system'
    AND p_event_type IN ('status_changed', 'archived')
  );

  SELECT student_status INTO v_previous_status
  FROM students WHERE id = p_student_id;

  -- Registrar el evento siempre
  INSERT INTO student_activity_events (
    student_id, event_type, source, description, metadata
  ) VALUES (
    p_student_id,
    p_event_type,
    COALESCE(p_source, 'system'),
    p_description,
    COALESCE(p_metadata, '{}')
  );

  -- Solo reactivar y tocar last_activity_at en eventos reales del estudiante
  IF NOT v_is_system_event THEN
    UPDATE students SET
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
  END IF;
END;
$$;


ALTER FUNCTION "public"."fn_record_student_activity"("p_student_id" "uuid", "p_event_type" "text", "p_source" "text", "p_description" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_reschedule_session"("p_session_id" "uuid", "p_new_classroom_id" "uuid", "p_new_date" "date", "p_new_start_time" time without time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_session  class_sessions%ROWTYPE;
  v_class_ts TIMESTAMPTZ;
  v_error    TEXT;
  v_new_id   UUID;
BEGIN
  SELECT * INTO v_session FROM class_sessions WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sesión no encontrada.');
  END IF;

  IF v_session.status NOT IN ('pending', 'confirmed') THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Solo se pueden reagendar clases en estado pending o confirmed.');
  END IF;

  -- Regla 24h: también aplica para reagendar
  v_class_ts :=
    (v_session.scheduled_date::TEXT || ' ' || v_session.start_time::TEXT)::TIMESTAMP
    AT TIME ZONE 'America/Bogota';

  IF (v_class_ts - now()) < INTERVAL '24 hours' THEN
    RETURN jsonb_build_object('success', false, 'error',
      'No se puede reagendar: faltan menos de 24 horas para la clase.');
  END IF;

  -- Solo dentro del mismo mes calendario
  IF EXTRACT(YEAR  FROM p_new_date)::INT != EXTRACT(YEAR  FROM v_session.scheduled_date)::INT
  OR EXTRACT(MONTH FROM p_new_date)::INT != EXTRACT(MONTH FROM v_session.scheduled_date)::INT
  THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Solo se puede reagendar dentro del mismo mes calendario. Las clases no se trasladan al mes siguiente.');
  END IF;

  -- Validar el nuevo slot completo
  v_error := fn_validate_schedule_rules(v_session.student_id, p_new_date, p_new_start_time);
  IF v_error IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', v_error);
  END IF;

  IF fn_is_blocked(p_new_date, p_new_start_time, p_new_classroom_id) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'La academia está cerrada en ese nuevo horario.');
  END IF;

  -- p_session_id se excluye para no conflictuar consigo mismo
  IF NOT fn_slot_available(p_new_classroom_id, p_new_date, p_new_start_time, p_session_id) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El salón no está disponible en el nuevo horario.');
  END IF;

  IF NOT fn_student_free(v_session.student_id, p_new_date, p_new_start_time, p_session_id) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El estudiante ya tiene otra clase en el nuevo horario.');
  END IF;

  IF v_session.instructor_id IS NOT NULL THEN
    v_error := fn_instructor_free(v_session.instructor_id, p_new_date, p_new_start_time, p_session_id);
    IF v_error IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', v_error);
    END IF;
  END IF;

  -- Marcar la sesión original como reagendada
  UPDATE class_sessions SET status = 'rescheduled' WHERE id = p_session_id;

  -- Crear la nueva sesión heredando los datos del original
  INSERT INTO class_sessions (
    student_id, classroom_id, course_id, instructor_id,
    scheduled_date, start_time, status,
    original_session_id, schedule_id, notes
  ) VALUES (
    v_session.student_id, p_new_classroom_id, v_session.course_id, v_session.instructor_id,
    p_new_date, p_new_start_time, 'confirmed',
    p_session_id, v_session.schedule_id, v_session.notes
  ) RETURNING id INTO v_new_id;

  -- Vincular la original a la nueva (cadena bidireccional)
  UPDATE class_sessions SET rescheduled_to_id = v_new_id WHERE id = p_session_id;

  RETURN jsonb_build_object('success', true, 'new_session_id', v_new_id);
END;
$$;


ALTER FUNCTION "public"."fn_reschedule_session"("p_session_id" "uuid", "p_new_classroom_id" "uuid", "p_new_date" "date", "p_new_start_time" time without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_restore_credit"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint, "p_reason" "text", "p_admin_user" "text", "p_session_id" "uuid" DEFAULT NULL::"uuid", "p_notes" "text" DEFAULT NULL::"text", "p_delta" smallint DEFAULT 1) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_usage    RECORD;
  v_adj_id   UUID;
BEGIN
  -- Validar que el estudiante existe
  IF NOT EXISTS (SELECT 1 FROM students WHERE id = p_student_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Estudiante no encontrado.');
  END IF;

  -- Validar motivo
  IF p_reason NOT IN ('enfermedad','emergencia','cortesia_comercial','error_operativo','otro') THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Motivo inválido. Usa: enfermedad, emergencia, cortesia_comercial, error_operativo, otro.');
  END IF;

  -- Validar que admin_user no esté vacío
  IF p_admin_user IS NULL OR trim(p_admin_user) = '' THEN
    RETURN jsonb_build_object('success', false, 'error',
      'admin_user es obligatorio para trazabilidad.');
  END IF;

  -- Advertencia: si restaurar llevaría a más clases que la cuota original
  -- Se permite igual (el admin tiene autoridad) pero se informa
  SELECT * INTO v_usage FROM fn_monthly_usage(p_student_id, p_year, p_month);

  -- Registrar el ajuste (registro inmutable)
  INSERT INTO credit_adjustments (
    student_id, period_year, period_month,
    delta, reason, session_id, admin_user, notes
  ) VALUES (
    p_student_id, p_year, p_month,
    p_delta, p_reason, p_session_id, p_admin_user, p_notes
  ) RETURNING id INTO v_adj_id;

  RETURN jsonb_build_object(
    'success',             true,
    'adjustment_id',       v_adj_id,
    'delta',               p_delta,
    'classes_available_before', v_usage.classes_available,
    'classes_available_after',  GREATEST(0, v_usage.classes_available + p_delta::INT),
    'message', CASE
      WHEN p_delta > 0 THEN
        p_delta::TEXT || ' clase(s) restaurada(s) para '
        || p_year::TEXT || '-' || LPAD(p_month::TEXT, 2, '0')
        || '. Motivo: ' || p_reason || '.'
      ELSE
        ABS(p_delta)::TEXT || ' clase(s) descontada(s) para '
        || p_year::TEXT || '-' || LPAD(p_month::TEXT, 2, '0')
        || '. Motivo: ' || p_reason || '.'
    END
  );
END;
$$;


ALTER FUNCTION "public"."fn_restore_credit"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint, "p_reason" "text", "p_admin_user" "text", "p_session_id" "uuid", "p_notes" "text", "p_delta" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_slot_available"("p_classroom_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM class_sessions
    WHERE classroom_id  = p_classroom_id
      AND scheduled_date = p_date
      AND status NOT IN ('cancelled', 'rescheduled')
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      -- Overlap check: dos clases de 60 min se solapan si sus rangos se intersectan
      -- [A.start, A.start+1h) ∩ [B.start, B.start+1h) ≠ ∅
      AND start_time < (p_start_time + INTERVAL '1 hour')
      AND (start_time + INTERVAL '1 hour') > p_start_time
  );
$$;


ALTER FUNCTION "public"."fn_slot_available"("p_classroom_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_student_free"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM class_sessions
    WHERE student_id    = p_student_id
      AND scheduled_date = p_date
      AND status NOT IN ('cancelled', 'rescheduled')
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND start_time < (p_start_time + INTERVAL '1 hour')
      AND (start_time + INTERVAL '1 hour') > p_start_time
  );
$$;


ALTER FUNCTION "public"."fn_student_free"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_student_risk_levels"() RETURNS TABLE("updated_count" integer, "log_msg" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_updated int := 0;
  rec RECORD;
  v_new_level text;
BEGIN
  FOR rec IN
    SELECT
      s.id,
      s.student_status,
      s.last_completed_class_at,
      s.last_activity_at,
      COALESCE(
        COUNT(p.id) FILTER (WHERE p.status != 'paid' AND p.due_date < CURRENT_DATE),
        0
      )::int AS overdue_count,
      COALESCE(
        COUNT(p.id) FILTER (WHERE p.status != 'paid'),
        0
      )::int AS pending_count,
      EXTRACT(DAY FROM NOW() - s.last_completed_class_at::timestamptz)::int AS days_no_class
    FROM students s
    LEFT JOIN payments p ON p.student_id = s.id
    WHERE s.archived_at IS NULL
    GROUP BY s.id, s.student_status, s.last_completed_class_at, s.last_activity_at
  LOOP
    -- Determinar nivel
    IF rec.overdue_count > 0 OR COALESCE(rec.days_no_class, 0) > 30 THEN
      v_new_level := 'HIGH';
    ELSIF rec.pending_count > 1 OR COALESCE(rec.days_no_class, 0) > 14 THEN
      v_new_level := 'MEDIUM';
    ELSE
      v_new_level := 'LOW';
    END IF;

    -- Actualizar si cambió
    UPDATE students
    SET risk_level = v_new_level,
        updated_at = NOW()
    WHERE id = rec.id AND (risk_level IS DISTINCT FROM v_new_level);

    IF FOUND THEN
      v_updated := v_updated + 1;
      -- Log del cambio
      INSERT INTO system_activity_log (
        entity_type, entity_id, action, description,
        new_data, source, severity, created_by_system
      ) VALUES (
        'student', rec.id::text, 'risk_level_updated',
        'Nivel de riesgo actualizado a ' || v_new_level,
        jsonb_build_object('risk_level', v_new_level, 'days_no_class', rec.days_no_class, 'overdue_count', rec.overdue_count),
        'cron_job', 'info', true
      );
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_updated, format('Actualizados %s estudiantes', v_updated);
END;
$$;


ALTER FUNCTION "public"."fn_update_student_risk_levels"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_validate_schedule_rules"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone) RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_dow          SMALLINT := EXTRACT(ISODOW FROM p_date)::SMALLINT;
  -- ISODOW: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb, 7=Dom
  v_student_type student_type_t;
BEGIN
  -- Domingo: cerrado
  IF v_dow = 7 THEN
    RETURN 'La academia no opera los domingos.';
  END IF;

  -- Sábado: 8:00 AM – 2:00 PM (última clase empieza 1:00 PM, termina 2:00 PM)
  IF v_dow = 6 THEN
    IF p_start_time < '08:00'::TIME OR p_start_time > '13:00'::TIME THEN
      RETURN 'Los sábados el horario de clases es 8:00 AM – 2:00 PM (última clase a la 1:00 PM).';
    END IF;
    RETURN NULL;
  END IF;

  -- Lunes–Viernes: 10:00 AM – 10:00 PM (última clase empieza 9:00 PM, termina 10:00 PM)
  IF p_start_time < '10:00'::TIME OR p_start_time > '21:00'::TIME THEN
    RETURN 'El horario de lunes a viernes es 10:00 AM – 10:00 PM (última clase a las 9:00 PM).';
  END IF;

  -- Restricción para estudiantes nuevos: solo desde 5:00 PM (L-V)
  SELECT student_type INTO v_student_type
  FROM students WHERE id = p_student_id;

  IF v_student_type = 'new' AND p_start_time < '17:00'::TIME THEN
    RETURN 'Los estudiantes nuevos solo pueden agendar clases de 5:00 PM a 10:00 PM de lunes a viernes.';
  END IF;

  RETURN NULL;  -- Válido
END;
$$;


ALTER FUNCTION "public"."fn_validate_schedule_rules"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_student_payment_fields"("p_student_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_last_paid_month  date;
  v_next_due         date;
BEGIN
  -- Último mes pagado (status = 'paid')
  SELECT make_date(period_year::int, period_month::int, 1)
  INTO v_last_paid_month
  FROM payments
  WHERE student_id = p_student_id
    AND status = 'paid'
  ORDER BY period_year DESC, period_month DESC
  LIMIT 1;

  IF v_last_paid_month IS NOT NULL THEN
    -- El plan vence al final del mes pagado
    UPDATE students SET
      plan_expires_at     = (v_last_paid_month + interval '1 month' - interval '1 day')::date,
      next_payment_due_at = (v_last_paid_month + interval '1 month')::date,
      updated_at          = now()
    WHERE id = p_student_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."sync_student_payment_fields"("p_student_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "age" smallint,
    "course" "text" NOT NULL,
    "modality" "text" DEFAULT 'presencial'::"text" NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "source" "text" DEFAULT 'website'::"text" NOT NULL,
    "enrollment_id" "uuid",
    CONSTRAINT "appointments_age_check" CHECK ((("age" > 0) AND ("age" < 120))),
    CONSTRAINT "appointments_modality_check" CHECK (("modality" = ANY (ARRAY['presencial'::"text", 'virtual'::"text"]))),
    CONSTRAINT "appointments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'contacted'::"text", 'scheduled'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "scheduled_for" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "automation_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."automation_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blocked_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "blocked_date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "reason" "text" NOT NULL,
    "classroom_id" "uuid",
    "created_by" "text",
    CONSTRAINT "blocked_dates_check" CHECK (((("start_time" IS NULL) AND ("end_time" IS NULL)) OR (("start_time" IS NOT NULL) AND ("end_time" IS NOT NULL) AND ("end_time" > "start_time"))))
);


ALTER TABLE "public"."blocked_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sent_at" timestamp with time zone,
    "student_id" "uuid",
    "campaign_key" "text" NOT NULL,
    "channel" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "subject" "text",
    "body" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "campaign_messages_channel_check" CHECK (("channel" = ANY (ARRAY['email'::"text", 'whatsapp'::"text", 'internal'::"text"]))),
    CONSTRAINT "campaign_messages_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending'::"text", 'sent'::"text", 'skipped'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."campaign_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "changed_by" "text",
    "old_status" "public"."session_status_t",
    "new_status" "public"."session_status_t" NOT NULL,
    "reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."class_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "instructor_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "schedule_id" "uuid",
    "scheduled_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "status" "public"."session_status_t" DEFAULT 'pending'::"public"."session_status_t" NOT NULL,
    "original_session_id" "uuid",
    "rescheduled_to_id" "uuid",
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "late_cancellation" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "attendance_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attendance_confirmed_at" timestamp with time zone,
    "attendance_confirmation_token" "uuid" DEFAULT "gen_random_uuid"(),
    "attendance_reminder_sent_at" timestamp with time zone,
    "second_reminder_sent_at" timestamp with time zone,
    "cancelled_by" "text",
    CONSTRAINT "class_sessions_attendance_status_check" CHECK (("attendance_status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'declined'::"text", 'rescheduled'::"text", 'no_response'::"text", 'attended'::"text", 'absent'::"text", 'no_show'::"text"]))),
    CONSTRAINT "class_sessions_cancelled_by_check" CHECK (("cancelled_by" = ANY (ARRAY['student'::"text", 'instructor'::"text", 'admin'::"text"]))),
    CONSTRAINT "cs_cancelled_needs_ts" CHECK ((("status" <> 'cancelled'::"public"."session_status_t") OR ("cancelled_at" IS NOT NULL))),
    CONSTRAINT "cs_no_sunday" CHECK (((EXTRACT(isodow FROM "scheduled_date"))::smallint <> 7)),
    CONSTRAINT "cs_valid_saturday" CHECK ((((EXTRACT(isodow FROM "scheduled_date"))::smallint <> 6) OR (("start_time" >= '08:00:00'::time without time zone) AND ("start_time" <= '13:00:00'::time without time zone)))),
    CONSTRAINT "cs_valid_weekday" CHECK ((((EXTRACT(isodow FROM "scheduled_date"))::smallint > 5) OR (("start_time" >= '10:00:00'::time without time zone) AND ("start_time" <= '21:00:00'::time without time zone))))
);

ALTER TABLE ONLY "public"."class_sessions" REPLICA IDENTITY FULL;


ALTER TABLE "public"."class_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classroom_courses" (
    "classroom_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL
);


ALTER TABLE "public"."classroom_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classrooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "allows_drums" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."classrooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_adjustments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "period_year" smallint NOT NULL,
    "period_month" smallint NOT NULL,
    "delta" smallint NOT NULL,
    "reason" "text" NOT NULL,
    "session_id" "uuid",
    "admin_user" "text" NOT NULL,
    "notes" "text",
    CONSTRAINT "credit_adjustments_delta_check" CHECK (("delta" <> 0)),
    CONSTRAINT "credit_adjustments_period_month_check" CHECK ((("period_month" >= 1) AND ("period_month" <= 12))),
    CONSTRAINT "credit_adjustments_period_year_check" CHECK (("period_year" >= 2024)),
    CONSTRAINT "credit_adjustments_reason_check" CHECK (("reason" = ANY (ARRAY['enfermedad'::"text", 'emergencia'::"text", 'cortesia_comercial'::"text", 'error_operativo'::"text", 'otro'::"text"])))
);


ALTER TABLE "public"."credit_adjustments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "enrollment_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text" NOT NULL,
    CONSTRAINT "enrollment_events_type_check" CHECK (("type" = ANY (ARRAY['form_received'::"text", 'status_changed'::"text", 'whatsapp_sent'::"text", 'called'::"text", 'email_sent'::"text", 'note_added'::"text", 'converted'::"text"])))
);


ALTER TABLE "public"."enrollment_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "student_type" "text" NOT NULL,
    "student_name" "text" NOT NULL,
    "student_age" smallint NOT NULL,
    "guardian_name" "text",
    "phone" "text" NOT NULL,
    "email" "text" NOT NULL,
    "course_interest" "text" NOT NULL,
    "level" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "source" "text" DEFAULT 'inscripcion'::"text" NOT NULL,
    "preferred_time" "text",
    "internal_notes" "text",
    "converted_at" timestamp with time zone,
    "converted_student_id" "uuid",
    "assigned_to" "uuid",
    "last_contact_at" timestamp with time zone,
    "next_followup_at" timestamp with time zone,
    "lost_reason" "text",
    "terms_accepted" boolean DEFAULT false NOT NULL,
    "terms_accepted_at" timestamp with time zone,
    "terms_version" "text",
    "data_consent" boolean DEFAULT false NOT NULL,
    "image_consent" boolean DEFAULT false NOT NULL,
    "music_genre" "text",
    "payment_method" "text",
    "id_document" "text",
    "city" "text",
    "eps" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    CONSTRAINT "enrollments_level_check" CHECK (("level" = ANY (ARRAY['never'::"text", 'beginner'::"text", 'intermediate'::"text", 'advanced'::"text"]))),
    CONSTRAINT "enrollments_source_check" CHECK ((("source" IS NULL) OR ("source" = ANY (ARRAY['inscripcion'::"text", 'whatsapp'::"text", 'instagram'::"text", 'facebook'::"text", 'google'::"text", 'referido'::"text", 'web'::"text", 'presencial'::"text", 'otro'::"text"])))),
    CONSTRAINT "enrollments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'contacted'::"text", 'scheduled'::"text", 'clase_prueba'::"text", 'cancelled'::"text", 'perdido'::"text", 'converted'::"text"]))),
    CONSTRAINT "enrollments_student_age_check" CHECK ((("student_age" >= 6) AND ("student_age" < 120))),
    CONSTRAINT "enrollments_student_type_check" CHECK (("student_type" = ANY (ARRAY['self'::"text", 'child'::"text"])))
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructor_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instructor_id" "uuid" NOT NULL,
    "day_of_week" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "valid_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_until" "date",
    "notes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "instructor_availability_check" CHECK (("end_time" > "start_time")),
    CONSTRAINT "instructor_availability_check1" CHECK ((("end_time" - "start_time") >= '01:00:00'::interval)),
    CONSTRAINT "instructor_availability_day_of_week_check" CHECK ((("day_of_week" >= 1) AND ("day_of_week" <= 6))),
    CONSTRAINT "instructor_availability_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."instructor_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructor_availability_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "instructor_id" "uuid" NOT NULL,
    "blocked_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "reason" "text" NOT NULL,
    "created_by" "text" DEFAULT 'system'::"text" NOT NULL,
    "created_by_name" "text",
    CONSTRAINT "instructor_availability_blocks_check" CHECK (("end_time" > "start_time")),
    CONSTRAINT "instructor_availability_blocks_check1" CHECK ((("end_time" - "start_time") >= '01:00:00'::interval))
);


ALTER TABLE "public"."instructor_availability_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructor_availability_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instructor_id" "uuid" NOT NULL,
    "availability_id" "uuid",
    "action" "text" NOT NULL,
    "day_of_week" integer,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "status" "text",
    "valid_from" "date",
    "valid_until" "date",
    "notes" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "changed_by" "text",
    "block_id" "uuid",
    "blocked_date" "date",
    "block_reason" "text",
    "block_start_time" time without time zone,
    "block_end_time" time without time zone,
    "changed_by_name" "text",
    "prev_values" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "instructor_availability_log_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'updated'::"text", 'deleted'::"text", 'blocked'::"text", 'unblocked'::"text", 'extended'::"text"])))
);


ALTER TABLE "public"."instructor_availability_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructor_courses" (
    "instructor_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL
);


ALTER TABLE "public"."instructor_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    CONSTRAINT "instructors_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."instructors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."journey_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "journey_id" "uuid",
    "user_id" "uuid",
    "anon_key" "text",
    "event_type" "text" NOT NULL,
    "feature" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "journey_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['journey_started'::"text", 'journey_completed'::"text", 'cta_clicked'::"text", 'appointment_created'::"text"]))),
    CONSTRAINT "journey_events_feature_check" CHECK (("feature" = ANY (ARRAY['perfil'::"text", 'sueno'::"text", 'carrera'::"text"])))
);


ALTER TABLE "public"."journey_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monthly_quotas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "period_year" smallint NOT NULL,
    "period_month" smallint NOT NULL,
    "quota_total" smallint DEFAULT 8 NOT NULL,
    "late_cancellations" smallint DEFAULT 0 NOT NULL,
    CONSTRAINT "monthly_quotas_late_cancellations_check" CHECK (("late_cancellations" >= 0)),
    CONSTRAINT "monthly_quotas_period_month_check" CHECK ((("period_month" >= 1) AND ("period_month" <= 12))),
    CONSTRAINT "monthly_quotas_period_year_check" CHECK (("period_year" >= 2024)),
    CONSTRAINT "monthly_quotas_quota_total_check" CHECK (("quota_total" > 0))
);


ALTER TABLE "public"."monthly_quotas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."music_journeys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "anon_key" "text",
    "feature" "text" NOT NULL,
    "input_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "result_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "music_score" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "career_type" "text",
    "recommended_courses" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "music_journeys_feature_check" CHECK (("feature" = ANY (ARRAY['perfil'::"text", 'sueno'::"text", 'carrera'::"text"])))
);


ALTER TABLE "public"."music_journeys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "channel" "text" DEFAULT 'whatsapp'::"text" NOT NULL,
    "template" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "period_year" smallint NOT NULL,
    "period_month" smallint NOT NULL,
    "payment_type" "text" DEFAULT 'monthly_fee'::"text" NOT NULL,
    "currency" "text" DEFAULT 'COP'::"text" NOT NULL,
    "original_amount" numeric(12,2) NOT NULL,
    "discount_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "final_amount" numeric(12,2) NOT NULL,
    "discount_percent" integer DEFAULT 0,
    "discount_reason" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "due_date" "date" NOT NULL,
    "paid_at" timestamp with time zone,
    "payment_method" "text",
    "external_ref" "text",
    "gateway_response" "jsonb" DEFAULT '{}'::"jsonb",
    "plan_name" "text",
    "notes" "text",
    "registered_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "payments_check" CHECK ((("final_amount" >= (0)::numeric) AND ("final_amount" = ("original_amount" - "discount_amount")))),
    CONSTRAINT "payments_discount_amount_check" CHECK (("discount_amount" >= (0)::numeric)),
    CONSTRAINT "payments_discount_percent_check" CHECK ((("discount_percent" >= 0) AND ("discount_percent" <= 100))),
    CONSTRAINT "payments_original_amount_check" CHECK (("original_amount" >= (0)::numeric)),
    CONSTRAINT "payments_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['efectivo'::"text", 'transferencia'::"text", 'nequi'::"text", 'daviplata'::"text", 'wompi'::"text", 'pse'::"text", 'tarjeta'::"text", 'bold'::"text", 'otro'::"text"]))),
    CONSTRAINT "payments_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['monthly_fee'::"text", 'partial_payment'::"text", 'adjustment'::"text", 'scholarship'::"text", 'refund'::"text"]))),
    CONSTRAINT "payments_period_month_check" CHECK ((("period_month" >= 1) AND ("period_month" <= 12))),
    CONSTRAINT "payments_period_year_check" CHECK (("period_year" >= 2024)),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'overdue'::"text", 'waived'::"text", 'partial'::"text", 'voided'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reactivation_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "student_id" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "task_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "due_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "reactivation_tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "reactivation_tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'done'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."reactivation_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."retention_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "student_id" "uuid",
    "alert_type" "text" NOT NULL,
    "severity" "text" DEFAULT 'warning'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "due_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "retention_alerts_alert_type_check" CHECK (("alert_type" = ANY (ARRAY['risk_30_days'::"text", 'inactive_60_days'::"text", 'exstudent_90_days'::"text", 'plan_expiring'::"text", 'no_upcoming_classes'::"text", 'repeat_lead'::"text", 'manual'::"text", 'payment_overdue'::"text", 'payment_pending'::"text", 'attendance_gap'::"text"]))),
    CONSTRAINT "retention_alerts_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'critical'::"text"]))),
    CONSTRAINT "retention_alerts_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."retention_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."retention_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "total_activo" integer DEFAULT 0,
    "total_riesgo" integer DEFAULT 0,
    "total_inactivo" integer DEFAULT 0,
    "total_exalumno" integer DEFAULT 0,
    "total_reactivated_month" integer DEFAULT 0,
    "retention_rate" numeric(5,2),
    "churn_rate" numeric(5,2),
    "reactivation_rate" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."retention_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_activity_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'system'::"text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "student_activity_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['lead_created'::"text", 'student_created'::"text", 'enrolled'::"text", 'plan_purchased'::"text", 'plan_renewed'::"text", 'class_booked'::"text", 'class_completed'::"text", 'class_cancelled'::"text", 'class_rescheduled'::"text", 'class_no_show'::"text", 'login'::"text", 'portal_activity'::"text", 'follow_up'::"text", 'reactivated'::"text", 'archived'::"text", 'status_changed'::"text", 'payment.received'::"text", 'payment.discount_applied'::"text", 'payment.overdue'::"text"])))
);


ALTER TABLE "public"."student_activity_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_admin_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "note_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "note" "text" NOT NULL,
    "follow_up_at" timestamp with time zone,
    "outcome" "text",
    "created_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "student_admin_notes_note_type_check" CHECK (("note_type" = ANY (ARRAY['general'::"text", 'seguimiento'::"text", 'reactivacion'::"text", 'academico'::"text", 'comercial'::"text", 'administrativo'::"text"])))
);


ALTER TABLE "public"."student_admin_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "enrollment_id" "uuid",
    "document_type" "text" NOT NULL,
    "document_version" "text" NOT NULL,
    "signed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pdf_url" "text",
    "signature_url" "text",
    "document_hash" "text",
    "ip_address" "text",
    "user_agent" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "instructor_id" "uuid",
    "course_id" "uuid" NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "day_of_week" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "active_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "active_until" "date",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    CONSTRAINT "student_schedules_check" CHECK ((("active_until" IS NULL) OR ("active_until" >= "active_from"))),
    CONSTRAINT "student_schedules_day_of_week_check" CHECK ((("day_of_week" >= 1) AND ("day_of_week" <= 6))),
    CONSTRAINT "student_schedules_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."student_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "old_status" "text",
    "new_status" "text" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "changed_by" "text" DEFAULT 'system'::"text",
    "reason" "text",
    "days_inactive" integer,
    "retention_score" integer
);


ALTER TABLE "public"."student_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "status" "public"."student_status_t" DEFAULT 'active'::"public"."student_status_t" NOT NULL,
    "student_type" "public"."student_type_t" DEFAULT 'new'::"public"."student_type_t" NOT NULL,
    "enrolled_at" "date" DEFAULT CURRENT_DATE NOT NULL,
    "lead_id" "uuid",
    "notes" "text",
    "user_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "address" "text",
    "city" "text",
    "birth_date" "date",
    "profession" "text",
    "music_genre" "text",
    "document_type" "text",
    "document_number" "text",
    "plain_password" "text",
    "student_status" "text" DEFAULT 'activo'::"text" NOT NULL,
    "last_activity_at" timestamp with time zone,
    "student_since" "date",
    "plan_expires_at" "date",
    "next_payment_due_at" "date",
    "retention_score" smallint DEFAULT 100 NOT NULL,
    "primary_course_id" "uuid",
    "archived_at" timestamp with time zone,
    "archived_reason" "text",
    "reactivated_at" timestamp with time zone,
    "risk_reason" "text",
    "last_completed_class_at" "date",
    "risk_level" "text",
    "payment_method" "text",
    "plan_name" "text",
    "birthday_benefit_year" integer,
    "birthday_benefit_used" boolean DEFAULT false NOT NULL,
    "birthday_discount_percent" integer DEFAULT 10 NOT NULL,
    "eps" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    CONSTRAINT "chk_students_risk_level" CHECK ((("risk_level" IS NULL) OR ("risk_level" = ANY (ARRAY['bajo'::"text", 'medio'::"text", 'alto'::"text", 'critico'::"text"])))),
    CONSTRAINT "students_retention_score_check" CHECK ((("retention_score" >= 0) AND ("retention_score" <= 100))),
    CONSTRAINT "students_student_status_check" CHECK (("student_status" = ANY (ARRAY['lead'::"text", 'matriculado'::"text", 'activo'::"text", 'riesgo'::"text", 'inactivo'::"text", 'exalumno'::"text"])))
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "actor_user_id" "uuid",
    "actor_name" "text",
    "actor_role" "text",
    "entity_type" "text" NOT NULL,
    "entity_id" "text",
    "action" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "source" "text",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "created_by_system" boolean DEFAULT false,
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    CONSTRAINT "system_activity_log_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."system_activity_log" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_academic_attendance" WITH ("security_invoker"='true') AS
 SELECT "instructor_id",
    "course_id",
    "count"(*) AS "total_sessions",
    "count"(*) FILTER (WHERE ("status" = 'completed'::"public"."session_status_t")) AS "completed",
    "count"(*) FILTER (WHERE ("status" = 'no_show'::"public"."session_status_t")) AS "no_shows",
    "count"(*) FILTER (WHERE ("status" = 'cancelled'::"public"."session_status_t")) AS "cancelled",
    "count"(*) FILTER (WHERE ("attendance_status" = 'attended'::"text")) AS "attended",
    "count"(*) FILTER (WHERE ("attendance_status" = 'absent'::"text")) AS "absent",
    "round"(((100.0 * ("count"(*) FILTER (WHERE ("status" = 'completed'::"public"."session_status_t")))::numeric) / (NULLIF("count"(*), 0))::numeric), 1) AS "attendance_rate"
   FROM "public"."class_sessions"
  WHERE ("scheduled_date" >= (CURRENT_DATE - '90 days'::interval))
  GROUP BY GROUPING SETS (("instructor_id", "course_id"), ("instructor_id"), ("course_id"));


ALTER VIEW "public"."v_academic_attendance" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_academic_risk" WITH ("security_invoker"='true') AS
 SELECT "s"."id" AS "student_id",
    "s"."name" AS "student_name",
    "s"."student_status",
    "s"."retention_score",
    "count"("cs"."id") FILTER (WHERE (("cs"."status" = 'no_show'::"public"."session_status_t") AND ("cs"."scheduled_date" >= (CURRENT_DATE - '60 days'::interval)))) AS "recent_no_shows",
    "count"("cs"."id") FILTER (WHERE ("cs"."scheduled_date" >= (CURRENT_DATE - '90 days'::interval))) AS "total_90d",
    "count"("cs"."id") FILTER (WHERE (("cs"."status" = 'completed'::"public"."session_status_t") AND ("cs"."scheduled_date" >= (CURRENT_DATE - '90 days'::interval)))) AS "completed_90d",
    "round"(((100.0 * ("count"("cs"."id") FILTER (WHERE (("cs"."status" = 'completed'::"public"."session_status_t") AND ("cs"."scheduled_date" >= (CURRENT_DATE - '90 days'::interval)))))::numeric) / (NULLIF("count"("cs"."id") FILTER (WHERE ("cs"."scheduled_date" >= (CURRENT_DATE - '90 days'::interval))), 0))::numeric), 1) AS "attendance_rate_90d",
        CASE
            WHEN ("count"("cs"."id") FILTER (WHERE (("cs"."status" = 'no_show'::"public"."session_status_t") AND ("cs"."scheduled_date" >= (CURRENT_DATE - '60 days'::interval)))) >= 3) THEN 'critical'::"text"
            WHEN ("round"(((100.0 * ("count"("cs"."id") FILTER (WHERE (("cs"."status" = 'completed'::"public"."session_status_t") AND ("cs"."scheduled_date" >= (CURRENT_DATE - '90 days'::interval)))))::numeric) / (NULLIF("count"("cs"."id") FILTER (WHERE ("cs"."scheduled_date" >= (CURRENT_DATE - '90 days'::interval))), 0))::numeric), 1) < (50)::numeric) THEN 'warning'::"text"
            ELSE 'ok'::"text"
        END AS "risk_level"
   FROM ("public"."students" "s"
     LEFT JOIN "public"."class_sessions" "cs" ON ((("cs"."student_id" = "s"."id") AND ("cs"."scheduled_date" >= (CURRENT_DATE - '90 days'::interval)))))
  WHERE ("s"."status" = 'active'::"public"."student_status_t")
  GROUP BY "s"."id", "s"."name", "s"."student_status", "s"."retention_score";


ALTER VIEW "public"."v_academic_risk" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_retention_students" WITH ("security_invoker"='true') AS
 SELECT "s"."id",
    "s"."name",
    "s"."first_name",
    "s"."last_name",
    "s"."phone",
    "s"."email",
    "s"."student_status",
    "s"."status" AS "operational_status",
    "s"."risk_level",
    "s"."risk_reason",
    "s"."last_activity_at",
    "s"."last_completed_class_at",
    (GREATEST((0)::numeric, "floor"((EXTRACT(epoch FROM ("now"() - COALESCE(GREATEST(("s"."last_completed_class_at")::timestamp with time zone, "s"."last_activity_at"), "s"."last_activity_at", "s"."created_at"))) / (86400)::numeric))))::integer AS "days_since_activity",
    "s"."student_since",
    "s"."enrolled_at",
    "s"."plan_expires_at",
    "s"."next_payment_due_at",
    "s"."retention_score",
    "s"."primary_course_id",
    "c"."name" AS "primary_course_name",
    "s"."archived_at",
    "s"."archived_reason",
    "s"."reactivated_at",
    COALESCE("cls"."completed_classes", (0)::bigint) AS "completed_classes",
    COALESCE("cls"."upcoming_classes", (0)::bigint) AS "upcoming_classes",
    COALESCE("cls"."cancelled_classes", (0)::bigint) AS "cancelled_classes",
    COALESCE("cls"."no_shows_30d", (0)::bigint) AS "no_shows_30d",
    COALESCE("cls"."no_response_30d", (0)::bigint) AS "no_response_30d",
    COALESCE("hist"."instruments_count", (0)::bigint) AS "instruments_count",
    COALESCE("hist"."instructors_count", (0)::bigint) AS "instructors_count",
    "last_instr"."instructor_name"
   FROM (((("public"."students" "s"
     LEFT JOIN "public"."courses" "c" ON (("c"."id" = "s"."primary_course_id")))
     LEFT JOIN LATERAL ( SELECT "count"(*) FILTER (WHERE ("cs"."status" = 'completed'::"public"."session_status_t")) AS "completed_classes",
            "count"(*) FILTER (WHERE (("cs"."status" = ANY (ARRAY['pending'::"public"."session_status_t", 'confirmed'::"public"."session_status_t"])) AND ("cs"."scheduled_date" >= CURRENT_DATE))) AS "upcoming_classes",
            "count"(*) FILTER (WHERE ("cs"."status" = ANY (ARRAY['cancelled'::"public"."session_status_t", 'no_show'::"public"."session_status_t"]))) AS "cancelled_classes",
            "count"(*) FILTER (WHERE (("cs"."status" = 'no_show'::"public"."session_status_t") AND ("cs"."scheduled_date" >= (CURRENT_DATE - '30 days'::interval)))) AS "no_shows_30d",
            "count"(*) FILTER (WHERE (("cs"."attendance_status" = 'no_response'::"text") AND ("cs"."scheduled_date" >= (CURRENT_DATE - '30 days'::interval)))) AS "no_response_30d"
           FROM "public"."class_sessions" "cs"
          WHERE ("cs"."student_id" = "s"."id")) "cls" ON (true))
     LEFT JOIN LATERAL ( SELECT "count"(DISTINCT "cs"."course_id") AS "instruments_count",
            "count"(DISTINCT "cs"."instructor_id") FILTER (WHERE ("cs"."instructor_id" IS NOT NULL)) AS "instructors_count"
           FROM "public"."class_sessions" "cs"
          WHERE ("cs"."student_id" = "s"."id")) "hist" ON (true))
     LEFT JOIN LATERAL ( SELECT "i"."name" AS "instructor_name"
           FROM ("public"."class_sessions" "cs"
             JOIN "public"."instructors" "i" ON (("i"."id" = "cs"."instructor_id")))
          WHERE (("cs"."student_id" = "s"."id") AND ("cs"."instructor_id" IS NOT NULL))
          ORDER BY "cs"."scheduled_date" DESC
         LIMIT 1) "last_instr" ON (true));


ALTER VIEW "public"."v_retention_students" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_high_risk_students" WITH ("security_invoker"='true') AS
 SELECT "id",
    "name",
    "first_name",
    "last_name",
    "phone",
    "email",
    "student_status",
    "operational_status",
    "risk_level",
    "risk_reason",
    "last_activity_at",
    "last_completed_class_at",
    "days_since_activity",
    "student_since",
    "enrolled_at",
    "plan_expires_at",
    "next_payment_due_at",
    "retention_score",
    "primary_course_id",
    "primary_course_name",
    "archived_at",
    "archived_reason",
    "reactivated_at",
    "completed_classes",
    "upcoming_classes",
    "cancelled_classes",
    "no_shows_30d",
    "no_response_30d",
    "instruments_count",
    "instructors_count",
    "instructor_name"
   FROM "public"."v_retention_students"
  WHERE (("archived_at" IS NULL) AND (("student_status" = ANY (ARRAY['riesgo'::"text", 'inactivo'::"text", 'exalumno'::"text"])) OR ("retention_score" <= 55) OR ("upcoming_classes" = 0)))
  ORDER BY "retention_score", "days_since_activity" DESC;


ALTER VIEW "public"."v_high_risk_students" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_journey_funnel" WITH ("security_invoker"='true') AS
 SELECT "j"."feature",
    "j"."career_type",
    "count"(DISTINCT "j"."id") AS "total_journeys",
    "count"(DISTINCT
        CASE
            WHEN ("e"."event_type" = 'journey_completed'::"text") THEN "e"."journey_id"
            ELSE NULL::"uuid"
        END) AS "completed",
    "count"(DISTINCT
        CASE
            WHEN ("e"."event_type" = 'cta_clicked'::"text") THEN "e"."journey_id"
            ELSE NULL::"uuid"
        END) AS "cta_clicks",
    "count"(DISTINCT
        CASE
            WHEN ("e"."event_type" = 'appointment_created'::"text") THEN "e"."journey_id"
            ELSE NULL::"uuid"
        END) AS "appointments",
    "round"(((("count"(DISTINCT
        CASE
            WHEN ("e"."event_type" = 'appointment_created'::"text") THEN "e"."journey_id"
            ELSE NULL::"uuid"
        END))::numeric / (NULLIF("count"(DISTINCT "j"."id"), 0))::numeric) * (100)::numeric), 1) AS "conversion_pct"
   FROM ("public"."music_journeys" "j"
     LEFT JOIN "public"."journey_events" "e" ON (("e"."journey_id" = "j"."id")))
  GROUP BY "j"."feature", "j"."career_type";


ALTER VIEW "public"."v_journey_funnel" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_monthly_recovery_rate" WITH ("security_invoker"='true') AS
 SELECT "date_trunc"('month'::"text", "f"."created_at") AS "month",
    "count"(DISTINCT "f"."student_id") FILTER (WHERE ("f"."result" = 'Recuperado'::"text")) AS "recovered",
    "count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = ANY (ARRAY['riesgo'::"text", 'inactivo'::"text"]))) AS "at_risk_total",
    "round"(((("count"(DISTINCT "f"."student_id") FILTER (WHERE ("f"."result" = 'Recuperado'::"text")))::numeric / (NULLIF("count"(DISTINCT "f"."student_id"), 0))::numeric) * (100)::numeric), 1) AS "recovery_rate_pct"
   FROM ("public"."student_followups" "f"
     JOIN "public"."students" "s" ON (("s"."id" = "f"."student_id")))
  GROUP BY ("date_trunc"('month'::"text", "f"."created_at"))
  ORDER BY ("date_trunc"('month'::"text", "f"."created_at")) DESC;


ALTER VIEW "public"."v_monthly_recovery_rate" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_retention_by_instructor" WITH ("security_invoker"='true') AS
 SELECT "i"."id" AS "instructor_id",
    "i"."name" AS "instructor_name",
    "count"(DISTINCT "s"."id") AS "total_students",
    "count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = 'activo'::"text")) AS "activos",
    "count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = 'riesgo'::"text")) AS "en_riesgo",
    "count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = ANY (ARRAY['inactivo'::"text", 'exalumno'::"text"]))) AS "perdidos",
    "round"("avg"("s"."retention_score"), 1) AS "avg_score",
    "round"(((("count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = 'activo'::"text")))::numeric / (NULLIF("count"(DISTINCT "s"."id"), 0))::numeric) * (100)::numeric), 1) AS "retention_rate_pct"
   FROM (("public"."instructors" "i"
     JOIN "public"."class_sessions" "cs" ON (("cs"."instructor_id" = "i"."id")))
     JOIN "public"."students" "s" ON ((("s"."id" = "cs"."student_id") AND ("s"."archived_at" IS NULL))))
  GROUP BY "i"."id", "i"."name"
  ORDER BY ("round"(((("count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = 'activo'::"text")))::numeric / (NULLIF("count"(DISTINCT "s"."id"), 0))::numeric) * (100)::numeric), 1)) DESC NULLS LAST;


ALTER VIEW "public"."v_retention_by_instructor" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_retention_by_instrument" WITH ("security_invoker"='true') AS
 SELECT "c"."id" AS "course_id",
    "c"."name" AS "instrument_name",
    "count"(DISTINCT "s"."id") AS "total_students",
    "count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = 'activo'::"text")) AS "activos",
    "count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = 'riesgo'::"text")) AS "en_riesgo",
    "count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = ANY (ARRAY['inactivo'::"text", 'exalumno'::"text"]))) AS "perdidos",
    "round"("avg"("s"."retention_score"), 1) AS "avg_score",
    "round"(((("count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = 'activo'::"text")))::numeric / (NULLIF("count"(DISTINCT "s"."id"), 0))::numeric) * (100)::numeric), 1) AS "retention_rate_pct"
   FROM (("public"."courses" "c"
     JOIN "public"."class_sessions" "cs" ON (("cs"."course_id" = "c"."id")))
     JOIN "public"."students" "s" ON ((("s"."id" = "cs"."student_id") AND ("s"."archived_at" IS NULL))))
  GROUP BY "c"."id", "c"."name"
  ORDER BY ("round"(((("count"(DISTINCT "s"."id") FILTER (WHERE ("s"."student_status" = 'activo'::"text")))::numeric / (NULLIF("count"(DISTINCT "s"."id"), 0))::numeric) * (100)::numeric), 1)) DESC NULLS LAST;


ALTER VIEW "public"."v_retention_by_instrument" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_retention_by_source" WITH ("security_invoker"='true') AS
 SELECT COALESCE("e"."source", 'directo'::"text") AS "source",
    "count"("s"."id") AS "total_students",
    "count"(*) FILTER (WHERE ("s"."student_status" = 'activo'::"text")) AS "activos",
    "count"(*) FILTER (WHERE ("s"."student_status" = 'riesgo'::"text")) AS "en_riesgo",
    "count"(*) FILTER (WHERE ("s"."student_status" = 'inactivo'::"text")) AS "inactivos",
    "count"(*) FILTER (WHERE ("s"."student_status" = 'exalumno'::"text")) AS "exalumnos",
    "count"(*) FILTER (WHERE ("s"."reactivated_at" IS NOT NULL)) AS "reactivados",
    ("round"("avg"(EXTRACT(days FROM (COALESCE("s"."archived_at", "now"()) - ("s"."enrolled_at")::timestamp with time zone)))))::integer AS "avg_lifetime_days",
    "round"(((("count"(*) FILTER (WHERE ("s"."student_status" = 'activo'::"text")))::numeric / (NULLIF("count"("s"."id"), 0))::numeric) * (100)::numeric), 1) AS "retention_rate_pct"
   FROM ("public"."students" "s"
     LEFT JOIN "public"."enrollments" "e" ON (("s"."lead_id" = "e"."id")))
  WHERE ("s"."archived_at" IS NULL)
  GROUP BY COALESCE("e"."source", 'directo'::"text")
  ORDER BY ("count"("s"."id")) DESC;


ALTER VIEW "public"."v_retention_by_source" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_retention_dashboard" WITH ("security_invoker"='true') AS
 WITH "base" AS (
         SELECT "count"(*) FILTER (WHERE (("students"."student_status" = 'activo'::"text") AND ("students"."archived_at" IS NULL))) AS "activos",
            "count"(*) FILTER (WHERE (("students"."student_status" = 'riesgo'::"text") AND ("students"."archived_at" IS NULL))) AS "en_riesgo",
            "count"(*) FILTER (WHERE (("students"."student_status" = 'inactivo'::"text") AND ("students"."archived_at" IS NULL))) AS "inactivos",
            "count"(*) FILTER (WHERE (("students"."student_status" = 'exalumno'::"text") AND ("students"."archived_at" IS NULL))) AS "exalumnos",
            "count"(*) FILTER (WHERE ("students"."reactivated_at" >= "date_trunc"('month'::"text", "now"()))) AS "reactivados_mes",
            "count"(*) FILTER (WHERE (("students"."plan_expires_at" >= CURRENT_DATE) AND ("students"."plan_expires_at" <= (CURRENT_DATE + '7 days'::interval)))) AS "planes_por_vencer",
            "count"(*) FILTER (WHERE (("students"."archived_at" IS NULL) AND (NOT (EXISTS ( SELECT 1
                   FROM "public"."class_sessions" "cs"
                  WHERE (("cs"."student_id" = "students"."id") AND ("cs"."status" = ANY (ARRAY['pending'::"public"."session_status_t", 'confirmed'::"public"."session_status_t"])) AND ("cs"."scheduled_date" >= CURRENT_DATE))))))) AS "sin_clases_proximas"
           FROM "public"."students"
        )
 SELECT "activos" AS "active_students",
    "en_riesgo" AS "risk_students",
    "inactivos" AS "inactive_students",
    "exalumnos" AS "alumni_students",
    "reactivados_mes" AS "reactivated_this_month",
    "planes_por_vencer" AS "plans_expiring_week",
    "sin_clases_proximas" AS "without_upcoming_sessions",
    ((("activos" + "en_riesgo") + "inactivos") + "exalumnos") AS "total_students",
    "round"(((("activos")::numeric * (100)::numeric) / (NULLIF(((("activos" + "en_riesgo") + "inactivos") + "exalumnos"), 0))::numeric), 1) AS "retention_rate",
    "round"(((("reactivados_mes")::numeric * (100)::numeric) / (NULLIF(((("reactivados_mes" + "en_riesgo") + "inactivos") + "exalumnos"), 0))::numeric), 1) AS "reactivation_rate"
   FROM "base";


ALTER VIEW "public"."v_retention_dashboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_student_instruments_history" WITH ("security_invoker"='true') AS
 SELECT "cs"."student_id",
    "cs"."course_id",
    "c"."name" AS "course_name",
    "count"(*) FILTER (WHERE ("cs"."status" = 'completed'::"public"."session_status_t")) AS "completed_classes",
    "count"(*) FILTER (WHERE ("cs"."status" = 'cancelled'::"public"."session_status_t")) AS "cancelled_classes",
    "count"(*) FILTER (WHERE ("cs"."status" = 'rescheduled'::"public"."session_status_t")) AS "rescheduled_classes",
    "count"(*) FILTER (WHERE ("cs"."status" = 'no_show'::"public"."session_status_t")) AS "no_show_classes",
    "count"(*) AS "total_sessions",
    "max"("cs"."scheduled_date") AS "last_session_at"
   FROM ("public"."class_sessions" "cs"
     JOIN "public"."courses" "c" ON (("c"."id" = "cs"."course_id")))
  GROUP BY "cs"."student_id", "cs"."course_id", "c"."name";


ALTER VIEW "public"."v_student_instruments_history" OWNER TO "postgres";


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
        CASE
            WHEN (("count"("p"."id") FILTER (WHERE (("p"."status" <> 'paid'::"text") AND ("p"."due_date" < CURRENT_DATE))) > 0) OR (EXTRACT(day FROM ("now"() - ("s"."last_completed_class_at")::timestamp with time zone)) > (30)::numeric)) THEN 'HIGH'::"text"
            WHEN (("count"("p"."id") FILTER (WHERE ("p"."status" <> 'paid'::"text")) > 1) OR (EXTRACT(day FROM ("now"() - ("s"."last_completed_class_at")::timestamp with time zone)) > (14)::numeric)) THEN 'MEDIUM'::"text"
            ELSE 'LOW'::"text"
        END AS "computed_risk_level"
   FROM ("public"."students" "s"
     LEFT JOIN "public"."payments" "p" ON (("p"."student_id" = "s"."id")))
  WHERE ("s"."archived_at" IS NULL)
  GROUP BY "s"."id", "s"."name", "s"."first_name", "s"."last_name", "s"."student_status", "s"."last_activity_at", "s"."last_completed_class_at", "s"."plan_expires_at", "s"."next_payment_due_at", "s"."retention_score", "s"."risk_level", "s"."risk_reason", "s"."plan_name", "s"."phone", "s"."email";


ALTER VIEW "public"."v_student_risk" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_jobs"
    ADD CONSTRAINT "automation_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_messages"
    ADD CONSTRAINT "campaign_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_history"
    ADD CONSTRAINT "class_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_sessions"
    ADD CONSTRAINT "class_sessions_attendance_confirmation_token_key" UNIQUE ("attendance_confirmation_token");



ALTER TABLE ONLY "public"."class_sessions"
    ADD CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classroom_courses"
    ADD CONSTRAINT "classroom_courses_pkey" PRIMARY KEY ("classroom_id", "course_id");



ALTER TABLE ONLY "public"."classrooms"
    ADD CONSTRAINT "classrooms_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."classrooms"
    ADD CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."credit_adjustments"
    ADD CONSTRAINT "credit_adjustments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollment_events"
    ADD CONSTRAINT "enrollment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructor_availability_blocks"
    ADD CONSTRAINT "instructor_availability_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructor_availability"
    ADD CONSTRAINT "instructor_availability_instructor_id_day_of_week_start_tim_key" UNIQUE ("instructor_id", "day_of_week", "start_time");



ALTER TABLE ONLY "public"."instructor_availability_log"
    ADD CONSTRAINT "instructor_availability_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructor_availability"
    ADD CONSTRAINT "instructor_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructor_courses"
    ADD CONSTRAINT "instructor_courses_pkey" PRIMARY KEY ("instructor_id", "course_id");



ALTER TABLE ONLY "public"."instructors"
    ADD CONSTRAINT "instructors_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."instructors"
    ADD CONSTRAINT "instructors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."journey_events"
    ADD CONSTRAINT "journey_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_quotas"
    ADD CONSTRAINT "monthly_quotas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_quotas"
    ADD CONSTRAINT "monthly_quotas_student_id_period_year_period_month_key" UNIQUE ("student_id", "period_year", "period_month");



ALTER TABLE ONLY "public"."music_journeys"
    ADD CONSTRAINT "music_journeys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_type_key" UNIQUE ("type");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reactivation_tasks"
    ADD CONSTRAINT "reactivation_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."retention_alerts"
    ADD CONSTRAINT "retention_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."retention_snapshots"
    ADD CONSTRAINT "retention_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."retention_snapshots"
    ADD CONSTRAINT "retention_snapshots_snapshot_date_key" UNIQUE ("snapshot_date");



ALTER TABLE ONLY "public"."student_activity_events"
    ADD CONSTRAINT "student_activity_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_admin_notes"
    ADD CONSTRAINT "student_admin_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_documents"
    ADD CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_followups"
    ADD CONSTRAINT "student_followups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_schedules"
    ADD CONSTRAINT "student_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_status_history"
    ADD CONSTRAINT "student_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."system_activity_log"
    ADD CONSTRAINT "system_activity_log_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_appointments_created_at" ON "public"."appointments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_appointments_enrollment_id" ON "public"."appointments" USING "btree" ("enrollment_id") WHERE ("enrollment_id" IS NOT NULL);



CREATE INDEX "idx_appointments_phone" ON "public"."appointments" USING "btree" ("phone");



CREATE INDEX "idx_appointments_status" ON "public"."appointments" USING "btree" ("status");



CREATE INDEX "idx_automation_jobs_scheduled" ON "public"."automation_jobs" USING "btree" ("scheduled_for") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_automation_jobs_status" ON "public"."automation_jobs" USING "btree" ("status");



CREATE INDEX "idx_automation_jobs_type" ON "public"."automation_jobs" USING "btree" ("type");



CREATE INDEX "idx_avail_blocks_instructor" ON "public"."instructor_availability_blocks" USING "btree" ("instructor_id", "blocked_date" DESC);



CREATE UNIQUE INDEX "idx_avail_blocks_no_overlap" ON "public"."instructor_availability_blocks" USING "btree" ("instructor_id", "blocked_date", "start_time");



CREATE INDEX "idx_avail_log_action" ON "public"."instructor_availability_log" USING "btree" ("action");



CREATE INDEX "idx_avail_log_instructor" ON "public"."instructor_availability_log" USING "btree" ("instructor_id", "changed_at" DESC);



CREATE INDEX "idx_blocked_dates" ON "public"."blocked_dates" USING "btree" ("blocked_date");



CREATE INDEX "idx_campaign_messages_status" ON "public"."campaign_messages" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_campaign_messages_student" ON "public"."campaign_messages" USING "btree" ("student_id", "created_at" DESC);



CREATE INDEX "idx_class_history_session" ON "public"."class_history" USING "btree" ("session_id", "created_at" DESC);



CREATE INDEX "idx_credit_adj_session" ON "public"."credit_adjustments" USING "btree" ("session_id") WHERE ("session_id" IS NOT NULL);



CREATE INDEX "idx_credit_adj_student" ON "public"."credit_adjustments" USING "btree" ("student_id", "period_year", "period_month");



CREATE INDEX "idx_cs_attendance_status" ON "public"."class_sessions" USING "btree" ("attendance_status") WHERE ("status" <> ALL (ARRAY['cancelled'::"public"."session_status_t", 'rescheduled'::"public"."session_status_t"]));



CREATE UNIQUE INDEX "idx_cs_classroom_slot" ON "public"."class_sessions" USING "btree" ("classroom_id", "scheduled_date", "start_time") WHERE ("status" <> ALL (ARRAY['cancelled'::"public"."session_status_t", 'rescheduled'::"public"."session_status_t"]));



CREATE INDEX "idx_cs_confirmation_token" ON "public"."class_sessions" USING "btree" ("attendance_confirmation_token") WHERE ("attendance_confirmation_token" IS NOT NULL);



CREATE INDEX "idx_cs_date_status" ON "public"."class_sessions" USING "btree" ("scheduled_date", "status");



CREATE INDEX "idx_cs_instructor_date" ON "public"."class_sessions" USING "btree" ("instructor_id", "scheduled_date") WHERE ("status" <> ALL (ARRAY['cancelled'::"public"."session_status_t", 'rescheduled'::"public"."session_status_t"]));



CREATE INDEX "idx_cs_original" ON "public"."class_sessions" USING "btree" ("original_session_id") WHERE ("original_session_id" IS NOT NULL);



CREATE INDEX "idx_cs_reminder_first" ON "public"."class_sessions" USING "btree" ("scheduled_date", "attendance_reminder_sent_at") WHERE (("status" <> ALL (ARRAY['cancelled'::"public"."session_status_t", 'rescheduled'::"public"."session_status_t"])) AND ("attendance_reminder_sent_at" IS NULL));



CREATE INDEX "idx_cs_reminder_second" ON "public"."class_sessions" USING "btree" ("scheduled_date", "second_reminder_sent_at", "attendance_status") WHERE (("status" <> ALL (ARRAY['cancelled'::"public"."session_status_t", 'rescheduled'::"public"."session_status_t"])) AND ("second_reminder_sent_at" IS NULL) AND ("attendance_status" = 'pending'::"text"));



CREATE INDEX "idx_cs_schedule" ON "public"."class_sessions" USING "btree" ("schedule_id") WHERE ("schedule_id" IS NOT NULL);



CREATE INDEX "idx_cs_student_date" ON "public"."class_sessions" USING "btree" ("student_id", "scheduled_date") WHERE ("status" <> ALL (ARRAY['cancelled'::"public"."session_status_t", 'rescheduled'::"public"."session_status_t"]));



CREATE INDEX "idx_cs_student_month" ON "public"."class_sessions" USING "btree" ("student_id", "scheduled_date") WHERE ("status" <> ALL (ARRAY['cancelled'::"public"."session_status_t", 'rescheduled'::"public"."session_status_t"]));



CREATE INDEX "idx_enrollment_events_enrollment" ON "public"."enrollment_events" USING "btree" ("enrollment_id", "created_at" DESC);



CREATE INDEX "idx_enrollments_created" ON "public"."enrollments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_enrollments_next_followup" ON "public"."enrollments" USING "btree" ("next_followup_at") WHERE ("next_followup_at" IS NOT NULL);



CREATE INDEX "idx_enrollments_source" ON "public"."enrollments" USING "btree" ("source");



CREATE INDEX "idx_enrollments_status" ON "public"."enrollments" USING "btree" ("status");



CREATE INDEX "idx_enrollments_terms_version" ON "public"."enrollments" USING "btree" ("terms_version") WHERE ("terms_accepted" = true);



CREATE INDEX "idx_instructor_avail" ON "public"."instructor_availability" USING "btree" ("instructor_id", "day_of_week");



CREATE INDEX "idx_instructor_availability_instructor" ON "public"."instructor_availability" USING "btree" ("instructor_id");



CREATE INDEX "idx_instructor_availability_log_instructor" ON "public"."instructor_availability_log" USING "btree" ("instructor_id");



CREATE INDEX "idx_instructor_courses_course" ON "public"."instructor_courses" USING "btree" ("course_id");



CREATE INDEX "idx_monthly_quotas_student" ON "public"."monthly_quotas" USING "btree" ("student_id", "period_year", "period_month");



CREATE INDEX "idx_payments_external_ref" ON "public"."payments" USING "btree" ("external_ref") WHERE ("external_ref" IS NOT NULL);



CREATE INDEX "idx_payments_period" ON "public"."payments" USING "btree" ("period_year", "period_month", "status");



CREATE INDEX "idx_payments_status_due" ON "public"."payments" USING "btree" ("status", "due_date");



CREATE INDEX "idx_payments_student_id" ON "public"."payments" USING "btree" ("student_id");



CREATE INDEX "idx_payments_student_period" ON "public"."payments" USING "btree" ("student_id", "period_year", "period_month");



CREATE INDEX "idx_reactivation_tasks_status" ON "public"."reactivation_tasks" USING "btree" ("status", "updated_at" DESC);



CREATE INDEX "idx_reactivation_tasks_student" ON "public"."reactivation_tasks" USING "btree" ("student_id", "updated_at" DESC);



CREATE INDEX "idx_retention_alerts_open" ON "public"."retention_alerts" USING "btree" ("alert_type", "created_at" DESC) WHERE ("status" = 'open'::"text");



CREATE INDEX "idx_retention_alerts_student" ON "public"."retention_alerts" USING "btree" ("student_id", "created_at" DESC);



CREATE INDEX "idx_sal_action" ON "public"."system_activity_log" USING "btree" ("action");



CREATE INDEX "idx_sal_actor_user_id" ON "public"."system_activity_log" USING "btree" ("actor_user_id");



CREATE INDEX "idx_sal_created_at" ON "public"."system_activity_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_sal_entity_type" ON "public"."system_activity_log" USING "btree" ("entity_type");



CREATE INDEX "idx_sal_severity" ON "public"."system_activity_log" USING "btree" ("severity");



CREATE INDEX "idx_schedules_classroom" ON "public"."student_schedules" USING "btree" ("classroom_id", "day_of_week");



CREATE INDEX "idx_schedules_instructor" ON "public"."student_schedules" USING "btree" ("instructor_id", "day_of_week");



CREATE INDEX "idx_schedules_student" ON "public"."student_schedules" USING "btree" ("student_id", "status");



CREATE INDEX "idx_student_activity_student" ON "public"."student_activity_events" USING "btree" ("student_id", "occurred_at" DESC);



CREATE INDEX "idx_student_activity_type" ON "public"."student_activity_events" USING "btree" ("event_type", "occurred_at" DESC);



CREATE INDEX "idx_student_admin_notes_student" ON "public"."student_admin_notes" USING "btree" ("student_id", "created_at" DESC);



CREATE INDEX "idx_student_documents_enrollment" ON "public"."student_documents" USING "btree" ("enrollment_id");



CREATE INDEX "idx_student_documents_student" ON "public"."student_documents" USING "btree" ("student_id") WHERE ("student_id" IS NOT NULL);



CREATE INDEX "idx_student_documents_type_version" ON "public"."student_documents" USING "btree" ("document_type", "document_version");



CREATE INDEX "idx_students_archived_at" ON "public"."students" USING "btree" ("archived_at");



CREATE INDEX "idx_students_last_activity" ON "public"."students" USING "btree" ("last_activity_at");



CREATE INDEX "idx_students_next_payment_due" ON "public"."students" USING "btree" ("next_payment_due_at");



CREATE INDEX "idx_students_phone" ON "public"."students" USING "btree" ("phone");



CREATE INDEX "idx_students_plan_expires" ON "public"."students" USING "btree" ("plan_expires_at");



CREATE INDEX "idx_students_primary_course" ON "public"."students" USING "btree" ("primary_course_id");



CREATE INDEX "idx_students_retention_score" ON "public"."students" USING "btree" ("retention_score");



CREATE INDEX "idx_students_status" ON "public"."students" USING "btree" ("status");



CREATE INDEX "idx_students_student_status" ON "public"."students" USING "btree" ("student_status");



CREATE INDEX "journey_events_created_at_idx" ON "public"."journey_events" USING "btree" ("created_at" DESC);



CREATE INDEX "journey_events_event_type_idx" ON "public"."journey_events" USING "btree" ("event_type");



CREATE INDEX "journey_events_feature_idx" ON "public"."journey_events" USING "btree" ("feature");



CREATE INDEX "journey_events_journey_id_idx" ON "public"."journey_events" USING "btree" ("journey_id");



CREATE INDEX "music_journeys_anon_key_idx" ON "public"."music_journeys" USING "btree" ("anon_key");



CREATE INDEX "music_journeys_created_at_idx" ON "public"."music_journeys" USING "btree" ("created_at" DESC);



CREATE INDEX "music_journeys_feature_idx" ON "public"."music_journeys" USING "btree" ("feature");



CREATE INDEX "music_journeys_user_id_idx" ON "public"."music_journeys" USING "btree" ("user_id");



CREATE INDEX "student_followups_student_idx" ON "public"."student_followups" USING "btree" ("student_id", "created_at" DESC);



CREATE INDEX "students_user_id_idx" ON "public"."students" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_attendance_crm" AFTER UPDATE OF "attendance_status" ON "public"."class_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."fn_attendance_crm_rules"();



CREATE OR REPLACE TRIGGER "trg_enrollment_initial_event" AFTER INSERT ON "public"."enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_enrollment_initial_event"();



CREATE OR REPLACE TRIGGER "trg_late_cancellation" AFTER UPDATE ON "public"."class_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."fn_handle_late_cancellation"();



CREATE OR REPLACE TRIGGER "trg_no_show_risk" AFTER UPDATE OF "status" ON "public"."class_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."fn_no_show_risk"();



CREATE OR REPLACE TRIGGER "trg_reactivation_tasks_updated_at" BEFORE UPDATE ON "public"."reactivation_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_schedules_updated_at" BEFORE UPDATE ON "public"."student_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_session_audit" AFTER UPDATE ON "public"."class_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."fn_log_session_change"();



CREATE OR REPLACE TRIGGER "trg_sessions_updated_at" BEFORE UPDATE ON "public"."class_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_student_admin_notes_updated_at" BEFORE UPDATE ON "public"."student_admin_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_students_updated_at" BEFORE UPDATE ON "public"."students" FOR EACH ROW EXECUTE FUNCTION "public"."fn_set_updated_at"();



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id");



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_messages"
    ADD CONSTRAINT "campaign_messages_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."class_history"
    ADD CONSTRAINT "class_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_sessions"
    ADD CONSTRAINT "class_sessions_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id");



ALTER TABLE ONLY "public"."class_sessions"
    ADD CONSTRAINT "class_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");



ALTER TABLE ONLY "public"."class_sessions"
    ADD CONSTRAINT "class_sessions_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id");



ALTER TABLE ONLY "public"."class_sessions"
    ADD CONSTRAINT "class_sessions_original_session_id_fkey" FOREIGN KEY ("original_session_id") REFERENCES "public"."class_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."class_sessions"
    ADD CONSTRAINT "class_sessions_rescheduled_to_id_fkey" FOREIGN KEY ("rescheduled_to_id") REFERENCES "public"."class_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."class_sessions"
    ADD CONSTRAINT "class_sessions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."student_schedules"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."class_sessions"
    ADD CONSTRAINT "class_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id");



ALTER TABLE ONLY "public"."classroom_courses"
    ADD CONSTRAINT "classroom_courses_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classroom_courses"
    ADD CONSTRAINT "classroom_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_adjustments"
    ADD CONSTRAINT "credit_adjustments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollment_events"
    ADD CONSTRAINT "enrollment_events_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."credit_adjustments"
    ADD CONSTRAINT "fk_credit_adj_session" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "fk_enrollments_converted_student" FOREIGN KEY ("converted_student_id") REFERENCES "public"."students"("id") ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."instructor_availability_blocks"
    ADD CONSTRAINT "instructor_availability_blocks_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructor_availability"
    ADD CONSTRAINT "instructor_availability_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructor_availability_log"
    ADD CONSTRAINT "instructor_availability_log_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "public"."instructor_availability"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."instructor_availability_log"
    ADD CONSTRAINT "instructor_availability_log_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructor_courses"
    ADD CONSTRAINT "instructor_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructor_courses"
    ADD CONSTRAINT "instructor_courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journey_events"
    ADD CONSTRAINT "journey_events_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "public"."music_journeys"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."journey_events"
    ADD CONSTRAINT "journey_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."monthly_quotas"
    ADD CONSTRAINT "monthly_quotas_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."music_journeys"
    ADD CONSTRAINT "music_journeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."reactivation_tasks"
    ADD CONSTRAINT "reactivation_tasks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."retention_alerts"
    ADD CONSTRAINT "retention_alerts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."student_activity_events"
    ADD CONSTRAINT "student_activity_events_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."student_admin_notes"
    ADD CONSTRAINT "student_admin_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."student_documents"
    ADD CONSTRAINT "student_documents_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_documents"
    ADD CONSTRAINT "student_documents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_followups"
    ADD CONSTRAINT "student_followups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."student_followups"
    ADD CONSTRAINT "student_followups_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_schedules"
    ADD CONSTRAINT "student_schedules_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id");



ALTER TABLE ONLY "public"."student_schedules"
    ADD CONSTRAINT "student_schedules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");



ALTER TABLE ONLY "public"."student_schedules"
    ADD CONSTRAINT "student_schedules_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_schedules"
    ADD CONSTRAINT "student_schedules_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_status_history"
    ADD CONSTRAINT "student_status_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_primary_course_id_fkey" FOREIGN KEY ("primary_course_id") REFERENCES "public"."courses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "activity_log_admin_insert" ON "public"."system_activity_log" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "activity_log_read" ON "public"."system_activity_log" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['owner'::"text", 'super_admin'::"text", 'admin'::"text"])));



CREATE POLICY "admin_all_automation_jobs" ON "public"."automation_jobs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "admin_all_notification_templates" ON "public"."notification_templates" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "admin_full_access" ON "public"."class_history" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'instructor'::"text"]))))));



CREATE POLICY "admin_full_access" ON "public"."instructor_availability_log" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "admin_full_access" ON "public"."instructor_courses" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'instructor'::"text"]))))));



CREATE POLICY "admin_insert_class_sessions" ON "public"."class_sessions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'owner'::"text", 'super_admin'::"text", 'staff_admin'::"text"]))))));



CREATE POLICY "admin_staff_access" ON "public"."student_followups" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "admin_update_class_sessions" ON "public"."class_sessions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'owner'::"text", 'super_admin'::"text", 'staff_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'owner'::"text", 'super_admin'::"text", 'staff_admin'::"text"]))))));



CREATE POLICY "anon_insert_student_documents" ON "public"."student_documents" FOR INSERT TO "anon" WITH CHECK (true);



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_delete_availability_blocks" ON "public"."instructor_availability_blocks" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "authenticated_insert_availability_blocks" ON "public"."instructor_availability_blocks" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "authenticated_insert_enrollment_events" ON "public"."enrollment_events" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "authenticated_select_activity_events" ON "public"."student_activity_events" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_select_admin_notes" ON "public"."student_admin_notes" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_select_availability_blocks" ON "public"."instructor_availability_blocks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_blocked_dates" ON "public"."blocked_dates" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_select_campaign_messages" ON "public"."campaign_messages" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_select_class_sessions" ON "public"."class_sessions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_credit_adjustments" ON "public"."credit_adjustments" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_select_enrollment_events" ON "public"."enrollment_events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_enrollments" ON "public"."enrollments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_select_instructor_availability" ON "public"."instructor_availability" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_select_reactivation_tasks" ON "public"."reactivation_tasks" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_select_retention_alerts" ON "public"."retention_alerts" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_select_snapshots" ON "public"."retention_snapshots" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_select_status_history" ON "public"."student_status_history" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "authenticated_update_availability_blocks" ON "public"."instructor_availability_blocks" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_write_blocked_dates" ON "public"."blocked_dates" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."automation_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blocked_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classroom_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classrooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_adjustments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollment_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enrollments_admin_update" ON "public"."enrollments" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'staff'::"text"]))))));



CREATE POLICY "insert_journey_event" ON "public"."journey_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "insert_own_journey" ON "public"."music_journeys" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."instructor_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instructor_availability_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instructor_availability_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instructor_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instructors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."journey_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monthly_quotas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."music_journeys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments_admin_all" ON "public"."payments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "payments_student_read" ON "public"."payments" FOR SELECT TO "authenticated" USING (("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."user_id" = "auth"."uid"()))));



CREATE POLICY "public read" ON "public"."classroom_courses" FOR SELECT USING (true);



CREATE POLICY "public_can_insert" ON "public"."appointments" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "public_can_insert_enrollments" ON "public"."enrollments" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "public_select_classrooms" ON "public"."classrooms" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "public_select_courses" ON "public"."courses" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "public_select_instructors" ON "public"."instructors" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."reactivation_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."retention_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."retention_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_journey_event" ON "public"."journey_events" FOR SELECT USING (((("user_id" IS NOT NULL) AND ("user_id" = "auth"."uid"())) OR ("anon_key" IS NOT NULL)));



CREATE POLICY "select_own_journey" ON "public"."music_journeys" FOR SELECT USING (((("user_id" IS NOT NULL) AND ("user_id" = "auth"."uid"())) OR ("anon_key" IS NOT NULL)));



ALTER TABLE "public"."student_activity_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_admin_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_followups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "student_read_own" ON "public"."students" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "student_read_own_quotas" ON "public"."monthly_quotas" FOR SELECT USING (("student_id" = ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."user_id" = "auth"."uid"()))));



CREATE POLICY "student_read_own_schedules" ON "public"."student_schedules" FOR SELECT USING (("student_id" = ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."user_id" = "auth"."uid"()))));



CREATE POLICY "student_read_own_sessions" ON "public"."class_sessions" FOR SELECT USING (("student_id" = ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."student_schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "student_select_own_documents" ON "public"."student_documents" FOR SELECT TO "authenticated" USING (("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."student_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "students_admin_select" ON "public"."students" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_user_meta_data" ->> 'role'::"text") = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'owner'::"text", 'super_admin'::"text", 'sales'::"text"]))))));



ALTER TABLE "public"."system_activity_log" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."blocked_dates";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."class_sessions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."enrollment_events";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."enrollments";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."compute_overdue_payments"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."compute_overdue_payments"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_attendance_crm_rules"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_attendance_crm_rules"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_attendance_crm_rules"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_available_slots"("p_date" "date", "p_student_id" "uuid", "p_instructor_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_available_slots"("p_date" "date", "p_student_id" "uuid", "p_instructor_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_book_session"("p_student_id" "uuid", "p_classroom_id" "uuid", "p_course_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_instructor_id" "uuid", "p_schedule_id" "uuid", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_book_session"("p_student_id" "uuid", "p_classroom_id" "uuid", "p_course_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_instructor_id" "uuid", "p_schedule_id" "uuid", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_cancel_session"("p_session_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_cancel_session"("p_session_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_cancel_session"("p_session_id" "uuid", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_enrollment_initial_event"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_enrollment_initial_event"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_generate_monthly_sessions"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_generate_monthly_sessions"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_generate_monthly_sessions"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_generate_retention_alerts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_generate_retention_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_handle_late_cancellation"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_handle_late_cancellation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_handle_late_cancellation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_instructor_free"("p_instructor_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_instructor_free"("p_instructor_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_instructor_free"("p_instructor_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_is_blocked"("p_date" "date", "p_start_time" time without time zone, "p_classroom_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_is_blocked"("p_date" "date", "p_start_time" time without time zone, "p_classroom_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_is_blocked"("p_date" "date", "p_start_time" time without time zone, "p_classroom_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."student_followups" TO "anon";
GRANT ALL ON TABLE "public"."student_followups" TO "authenticated";
GRANT ALL ON TABLE "public"."student_followups" TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_latest_followup_per_student"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_latest_followup_per_student"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_log_session_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_log_session_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_log_session_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_monthly_usage"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_monthly_usage"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_monthly_usage"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_no_show_risk"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_no_show_risk"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_no_show_risk"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_record_student_activity"("p_student_id" "uuid", "p_event_type" "text", "p_source" "text", "p_description" "text", "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_record_student_activity"("p_student_id" "uuid", "p_event_type" "text", "p_source" "text", "p_description" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_reschedule_session"("p_session_id" "uuid", "p_new_classroom_id" "uuid", "p_new_date" "date", "p_new_start_time" time without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_reschedule_session"("p_session_id" "uuid", "p_new_classroom_id" "uuid", "p_new_date" "date", "p_new_start_time" time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_reschedule_session"("p_session_id" "uuid", "p_new_classroom_id" "uuid", "p_new_date" "date", "p_new_start_time" time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_restore_credit"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint, "p_reason" "text", "p_admin_user" "text", "p_session_id" "uuid", "p_notes" "text", "p_delta" smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_restore_credit"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint, "p_reason" "text", "p_admin_user" "text", "p_session_id" "uuid", "p_notes" "text", "p_delta" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_restore_credit"("p_student_id" "uuid", "p_year" smallint, "p_month" smallint, "p_reason" "text", "p_admin_user" "text", "p_session_id" "uuid", "p_notes" "text", "p_delta" smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_slot_available"("p_classroom_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_slot_available"("p_classroom_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_slot_available"("p_classroom_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_student_free"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_student_free"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_student_free"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone, "p_exclude_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_update_student_risk_levels"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_update_student_risk_levels"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_validate_schedule_rules"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."fn_validate_schedule_rules"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_validate_schedule_rules"("p_student_id" "uuid", "p_date" "date", "p_start_time" time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_student_payment_fields"("p_student_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_student_payment_fields"("p_student_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."automation_jobs" TO "anon";
GRANT ALL ON TABLE "public"."automation_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."blocked_dates" TO "anon";
GRANT ALL ON TABLE "public"."blocked_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."blocked_dates" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_messages" TO "anon";
GRANT ALL ON TABLE "public"."campaign_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_messages" TO "service_role";



GRANT ALL ON TABLE "public"."class_history" TO "anon";
GRANT ALL ON TABLE "public"."class_history" TO "authenticated";
GRANT ALL ON TABLE "public"."class_history" TO "service_role";



GRANT ALL ON TABLE "public"."class_sessions" TO "anon";
GRANT ALL ON TABLE "public"."class_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."class_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."classroom_courses" TO "anon";
GRANT ALL ON TABLE "public"."classroom_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."classroom_courses" TO "service_role";



GRANT ALL ON TABLE "public"."classrooms" TO "anon";
GRANT ALL ON TABLE "public"."classrooms" TO "authenticated";
GRANT ALL ON TABLE "public"."classrooms" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."credit_adjustments" TO "anon";
GRANT ALL ON TABLE "public"."credit_adjustments" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_adjustments" TO "service_role";



GRANT ALL ON TABLE "public"."enrollment_events" TO "anon";
GRANT ALL ON TABLE "public"."enrollment_events" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollment_events" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_availability" TO "anon";
GRANT ALL ON TABLE "public"."instructor_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_availability" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_availability_blocks" TO "anon";
GRANT ALL ON TABLE "public"."instructor_availability_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_availability_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_availability_log" TO "anon";
GRANT ALL ON TABLE "public"."instructor_availability_log" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_availability_log" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_courses" TO "anon";
GRANT ALL ON TABLE "public"."instructor_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_courses" TO "service_role";



GRANT ALL ON TABLE "public"."instructors" TO "anon";
GRANT ALL ON TABLE "public"."instructors" TO "authenticated";
GRANT ALL ON TABLE "public"."instructors" TO "service_role";



GRANT ALL ON TABLE "public"."journey_events" TO "anon";
GRANT ALL ON TABLE "public"."journey_events" TO "authenticated";
GRANT ALL ON TABLE "public"."journey_events" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_quotas" TO "anon";
GRANT ALL ON TABLE "public"."monthly_quotas" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_quotas" TO "service_role";



GRANT ALL ON TABLE "public"."music_journeys" TO "anon";
GRANT ALL ON TABLE "public"."music_journeys" TO "authenticated";
GRANT ALL ON TABLE "public"."music_journeys" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."reactivation_tasks" TO "anon";
GRANT ALL ON TABLE "public"."reactivation_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."reactivation_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."retention_alerts" TO "anon";
GRANT ALL ON TABLE "public"."retention_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."retention_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."retention_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."retention_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."retention_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."student_activity_events" TO "anon";
GRANT ALL ON TABLE "public"."student_activity_events" TO "authenticated";
GRANT ALL ON TABLE "public"."student_activity_events" TO "service_role";



GRANT ALL ON TABLE "public"."student_admin_notes" TO "anon";
GRANT ALL ON TABLE "public"."student_admin_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."student_admin_notes" TO "service_role";



GRANT ALL ON TABLE "public"."student_documents" TO "anon";
GRANT ALL ON TABLE "public"."student_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."student_documents" TO "service_role";



GRANT ALL ON TABLE "public"."student_schedules" TO "anon";
GRANT ALL ON TABLE "public"."student_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."student_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."student_status_history" TO "anon";
GRANT ALL ON TABLE "public"."student_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."student_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."system_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."system_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."system_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."v_academic_attendance" TO "anon";
GRANT ALL ON TABLE "public"."v_academic_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."v_academic_attendance" TO "service_role";



GRANT ALL ON TABLE "public"."v_academic_risk" TO "anon";
GRANT ALL ON TABLE "public"."v_academic_risk" TO "authenticated";
GRANT ALL ON TABLE "public"."v_academic_risk" TO "service_role";



GRANT ALL ON TABLE "public"."v_retention_students" TO "anon";
GRANT ALL ON TABLE "public"."v_retention_students" TO "authenticated";
GRANT ALL ON TABLE "public"."v_retention_students" TO "service_role";



GRANT ALL ON TABLE "public"."v_high_risk_students" TO "anon";
GRANT ALL ON TABLE "public"."v_high_risk_students" TO "authenticated";
GRANT ALL ON TABLE "public"."v_high_risk_students" TO "service_role";



GRANT ALL ON TABLE "public"."v_journey_funnel" TO "anon";
GRANT ALL ON TABLE "public"."v_journey_funnel" TO "authenticated";
GRANT ALL ON TABLE "public"."v_journey_funnel" TO "service_role";



GRANT ALL ON TABLE "public"."v_monthly_recovery_rate" TO "anon";
GRANT ALL ON TABLE "public"."v_monthly_recovery_rate" TO "authenticated";
GRANT ALL ON TABLE "public"."v_monthly_recovery_rate" TO "service_role";



GRANT ALL ON TABLE "public"."v_retention_by_instructor" TO "anon";
GRANT ALL ON TABLE "public"."v_retention_by_instructor" TO "authenticated";
GRANT ALL ON TABLE "public"."v_retention_by_instructor" TO "service_role";



GRANT ALL ON TABLE "public"."v_retention_by_instrument" TO "anon";
GRANT ALL ON TABLE "public"."v_retention_by_instrument" TO "authenticated";
GRANT ALL ON TABLE "public"."v_retention_by_instrument" TO "service_role";



GRANT ALL ON TABLE "public"."v_retention_by_source" TO "anon";
GRANT ALL ON TABLE "public"."v_retention_by_source" TO "authenticated";
GRANT ALL ON TABLE "public"."v_retention_by_source" TO "service_role";



GRANT ALL ON TABLE "public"."v_retention_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."v_retention_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."v_retention_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."v_student_instruments_history" TO "anon";
GRANT ALL ON TABLE "public"."v_student_instruments_history" TO "authenticated";
GRANT ALL ON TABLE "public"."v_student_instruments_history" TO "service_role";



GRANT ALL ON TABLE "public"."v_student_risk" TO "anon";
GRANT ALL ON TABLE "public"."v_student_risk" TO "authenticated";
GRANT ALL ON TABLE "public"."v_student_risk" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "public_select_classrooms" on "public"."classrooms";

drop policy "public_select_courses" on "public"."courses";

drop policy "public_select_instructors" on "public"."instructors";


  create policy "public_select_classrooms"
  on "public"."classrooms"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "public_select_courses"
  on "public"."courses"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "public_select_instructors"
  on "public"."instructors"
  as permissive
  for select
  to anon, authenticated
using (true);




-- ============================================================
-- AUDITORÍA DE SEGURIDAD — 2026-06-16
-- Aplicada vía MCP Supabase (versiones remotas registradas):
--   20260616215704  security_fix_views_rls_functions_20260616
--   20260616215818  security_revoke_public_execute_admin_fns_20260616
--   20260616220029  security_enrollment_events_restrict_policy_20260616
--   20260616220539  security_revoke_remaining_fn_execute_20260616
-- ============================================================

-- ============================================================
-- 1. VIEWS → SECURITY INVOKER (12 views)
-- Rollback: ALTER VIEW public.x RESET (security_invoker);
-- ============================================================
ALTER VIEW public.v_academic_attendance         SET (security_invoker = true);
ALTER VIEW public.v_academic_risk               SET (security_invoker = true);
ALTER VIEW public.v_high_risk_students          SET (security_invoker = true);
ALTER VIEW public.v_journey_funnel              SET (security_invoker = true);
ALTER VIEW public.v_monthly_recovery_rate       SET (security_invoker = true);
ALTER VIEW public.v_retention_by_instructor     SET (security_invoker = true);
ALTER VIEW public.v_retention_by_instrument     SET (security_invoker = true);
ALTER VIEW public.v_retention_by_source         SET (security_invoker = true);
ALTER VIEW public.v_retention_dashboard         SET (security_invoker = true);
ALTER VIEW public.v_retention_students          SET (security_invoker = true);
ALTER VIEW public.v_student_instruments_history SET (security_invoker = true);
ALTER VIEW public.v_student_risk                SET (security_invoker = true);

-- ============================================================
-- 2. instructor_availability_blocks — políticas RLS mínimas
-- Rollback: DROP POLICY "authenticated_*_availability_blocks" ON ...;
-- ============================================================
CREATE POLICY "authenticated_select_availability_blocks"
  ON public.instructor_availability_blocks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_availability_blocks"
  ON public.instructor_availability_blocks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_availability_blocks"
  ON public.instructor_availability_blocks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_availability_blocks"
  ON public.instructor_availability_blocks
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 3. Fijar search_path en 25 funciones (previene search_path hijacking)
-- Rollback: ALTER FUNCTION public.x(...) RESET search_path;
-- ============================================================
ALTER FUNCTION public.fn_set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_log_session_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_handle_late_cancellation() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_is_blocked(p_date date, p_start_time time without time zone, p_classroom_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_slot_available(p_classroom_id uuid, p_date date, p_start_time time without time zone, p_exclude_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_student_free(p_student_id uuid, p_date date, p_start_time time without time zone, p_exclude_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_instructor_free(p_instructor_id uuid, p_date date, p_start_time time without time zone, p_exclude_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_validate_schedule_rules(p_student_id uuid, p_date date, p_start_time time without time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_monthly_usage(p_student_id uuid, p_year smallint, p_month smallint) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_cancel_session(p_session_id uuid, p_reason text) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_restore_credit(p_student_id uuid, p_year smallint, p_month smallint, p_reason text, p_admin_user text, p_session_id uuid, p_notes text, p_delta smallint) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_reschedule_session(p_session_id uuid, p_new_classroom_id uuid, p_new_date date, p_new_start_time time without time zone) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_generate_monthly_sessions(p_student_id uuid, p_year smallint, p_month smallint) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_available_slots(p_date date, p_student_id uuid, p_instructor_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_enrollment_initial_event() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_book_session(p_student_id uuid, p_classroom_id uuid, p_course_id uuid, p_date date, p_start_time time without time zone, p_instructor_id uuid, p_schedule_id uuid, p_notes text) SET search_path = public, pg_temp;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_record_student_activity(p_student_id uuid, p_event_type text, p_source text, p_description text, p_metadata jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_attendance_crm_rules() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_no_show_risk() SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_student_payment_fields(p_student_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.compute_overdue_payments() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_update_student_risk_levels() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_latest_followup_per_student() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_generate_retention_alerts() SET search_path = public, pg_temp;

-- ============================================================
-- 4. REVOKE EXECUTE — 9 funciones
-- Solo service_role y postgres conservan EXECUTE
-- Rollback: GRANT EXECUTE ON FUNCTION public.x(...) TO authenticated;
-- ============================================================

-- Funciones admin (solo service_role debe invocarlas)
REVOKE EXECUTE ON FUNCTION public.compute_overdue_payments()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_update_student_risk_levels()   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_generate_retention_alerts()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_latest_followup_per_student()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_student_payment_fields(uuid) FROM PUBLIC, anon, authenticated;

-- Funciones server-only (llamadas exclusivamente vía adminClient/service_role)
REVOKE EXECUTE ON FUNCTION public.fn_available_slots(date, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_book_session(uuid, uuid, uuid, date, time without time zone, uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_record_student_activity(uuid, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
-- fn_enrollment_initial_event: trigger AFTER INSERT ON enrollments — nunca RPC directo
REVOKE EXECUTE ON FUNCTION public.fn_enrollment_initial_event()
  FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 5. enrollment_events — política append-only (SELECT + INSERT)
-- Elimina UPDATE y DELETE para authenticated
-- Rollback:
--   DROP POLICY "authenticated_select_enrollment_events" ON public.enrollment_events;
--   DROP POLICY "authenticated_insert_enrollment_events" ON public.enrollment_events;
--   CREATE POLICY "authenticated_all_enrollment_events"
--     ON public.enrollment_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ============================================================
DROP POLICY IF EXISTS "authenticated_all_enrollment_events" ON public.enrollment_events;

CREATE POLICY "authenticated_select_enrollment_events"
  ON public.enrollment_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_enrollment_events"
  ON public.enrollment_events
  FOR INSERT TO authenticated WITH CHECK (true);

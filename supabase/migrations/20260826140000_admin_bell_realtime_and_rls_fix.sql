-- Habilita Realtime para las tablas que alimentan la campana de
-- notificaciones del admin: system_activity_log (eventos efímeros) y
-- retention_alerts (alertas persistentes de riesgo académico y morosidad).
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retention_alerts;

-- Corrige activity_log_read: comparaba contra auth.jwt() ->> 'role', que es
-- el rol de Postgres (siempre 'authenticated' para cualquier usuario
-- logueado), nunca el rol de negocio guardado en app_metadata. Esto
-- bloqueaba todo SELECT admin sobre esta tabla desde el cliente browser
-- (anon/authenticated key). No fue corregida por la migración
-- 20260806121724 (esa solo reescribió policies que mencionaban
-- literalmente raw_user_meta_data; esta usa una expresión distinta).
DROP POLICY IF EXISTS "activity_log_read" ON public.system_activity_log;
CREATE POLICY "activity_log_read" ON public.system_activity_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
        AND (users.raw_app_meta_data ->> 'role') = ANY (ARRAY['owner','super_admin','admin'])
    )
  );

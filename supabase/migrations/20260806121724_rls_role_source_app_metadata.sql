-- El rol de autorización pasa de auth.users.raw_user_meta_data (editable por el
-- propio usuario vía el SDK cliente con la anon key — hueco de escalación de
-- privilegios) a raw_app_meta_data (solo editable con service_role).
--
-- Requiere que el backfill (scripts/backfill-app-metadata-role.mjs) ya haya
-- corrido antes de aplicar esta migración, o los usuarios existentes pierden
-- acceso hasta que se corra.
--
-- Reescribe las policies leyendo su definición real desde pg_policies y
-- sustituyendo el identificador (en vez de retipear las expresiones a mano,
-- que en boolean anidados con ARRAY[...] es fácil desbalancear un paréntesis).

DO $$
DECLARE
  pol RECORD;
  n INT := 0;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual ILIKE '%raw_user_meta_data%' OR with_check ILIKE '%raw_user_meta_data%')
  LOOP
    IF pol.qual IS NOT NULL AND pol.with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename,
        replace(pol.qual, 'raw_user_meta_data', 'raw_app_meta_data'),
        replace(pol.with_check, 'raw_user_meta_data', 'raw_app_meta_data')
      );
    ELSIF pol.qual IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s)',
        pol.policyname, pol.schemaname, pol.tablename,
        replace(pol.qual, 'raw_user_meta_data', 'raw_app_meta_data')
      );
    ELSIF pol.with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename,
        replace(pol.with_check, 'raw_user_meta_data', 'raw_app_meta_data')
      );
    END IF;
    n := n + 1;
  END LOOP;

  RAISE NOTICE 'Policies migradas a raw_app_meta_data: %', n;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Music 4U IA — Tablas: music_journeys + journey_events
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Tabla principal de jornadas musicales
CREATE TABLE IF NOT EXISTS music_journeys (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_key            TEXT,
  feature             TEXT NOT NULL CHECK (feature IN ('perfil', 'sueno', 'carrera')),
  input_data          JSONB NOT NULL DEFAULT '{}',
  result_data         JSONB NOT NULL DEFAULT '{}',
  music_score         JSONB NOT NULL DEFAULT '{}',
  -- { creatividad, disciplina, interpretacion, produccion, performance } 0-100
  career_type         TEXT,
  recommended_courses TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS music_journeys_user_id_idx   ON music_journeys(user_id);
CREATE INDEX IF NOT EXISTS music_journeys_anon_key_idx  ON music_journeys(anon_key);
CREATE INDEX IF NOT EXISTS music_journeys_feature_idx   ON music_journeys(feature);
CREATE INDEX IF NOT EXISTS music_journeys_created_at_idx ON music_journeys(created_at DESC);

-- 2. Tabla de eventos de conversión
CREATE TABLE IF NOT EXISTS journey_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id   UUID REFERENCES music_journeys(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_key     TEXT,
  event_type   TEXT NOT NULL CHECK (event_type IN (
    'journey_started', 'journey_completed', 'cta_clicked', 'appointment_created'
  )),
  feature      TEXT NOT NULL CHECK (feature IN ('perfil', 'sueno', 'carrera')),
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journey_events_journey_id_idx  ON journey_events(journey_id);
CREATE INDEX IF NOT EXISTS journey_events_event_type_idx  ON journey_events(event_type);
CREATE INDEX IF NOT EXISTS journey_events_feature_idx     ON journey_events(feature);
CREATE INDEX IF NOT EXISTS journey_events_created_at_idx  ON journey_events(created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────

ALTER TABLE music_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_events  ENABLE ROW LEVEL SECURITY;

-- Anónimos y autenticados pueden insertar sus propios journeys
CREATE POLICY "insert_own_journey" ON music_journeys
  FOR INSERT WITH CHECK (true);

-- Solo pueden leer los suyos (por user_id o anon_key)
CREATE POLICY "select_own_journey" ON music_journeys
  FOR SELECT USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR (anon_key IS NOT NULL)
  );

-- Eventos: insert libre, select propio
CREATE POLICY "insert_journey_event" ON journey_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "select_journey_event" ON journey_events
  FOR SELECT USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR (anon_key IS NOT NULL)
  );

-- ── Vista analítica (para admin) ─────────────────────────────────────
CREATE OR REPLACE VIEW v_journey_funnel AS
SELECT
  j.feature,
  j.career_type,
  COUNT(DISTINCT j.id)                                              AS total_journeys,
  COUNT(DISTINCT CASE WHEN e.event_type = 'journey_completed'
    THEN e.journey_id END)                                          AS completed,
  COUNT(DISTINCT CASE WHEN e.event_type = 'cta_clicked'
    THEN e.journey_id END)                                          AS cta_clicks,
  COUNT(DISTINCT CASE WHEN e.event_type = 'appointment_created'
    THEN e.journey_id END)                                          AS appointments,
  ROUND(
    COUNT(DISTINCT CASE WHEN e.event_type = 'appointment_created'
      THEN e.journey_id END)::NUMERIC
    / NULLIF(COUNT(DISTINCT j.id), 0) * 100, 1
  )                                                                 AS conversion_pct
FROM music_journeys j
LEFT JOIN journey_events e ON e.journey_id = j.id
GROUP BY j.feature, j.career_type;

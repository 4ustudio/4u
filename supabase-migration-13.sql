-- ============================================================
-- MIGRACIÓN 13 — DISPONIBILIDAD INTELIGENTE DE INSTRUCTORES
-- ============================================================
-- Fecha: 2026-06-16
-- Requerimiento: Release v1.5 — Disponibilidad Inteligente
--
-- 1. Columnas faltantes en instructor_availability
-- 2. Columnas faltantes en instructor_availability_log (tabla ya existe)
-- 3. Tabla de bloqueos por fecha específica (nueva)
-- ============================================================

-- ── 1. Columnas adicionales para instructor_availability ────

ALTER TABLE instructor_availability
  ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'blocked'));

ALTER TABLE instructor_availability
  ADD COLUMN IF NOT EXISTS valid_from DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE instructor_availability
  ADD COLUMN IF NOT EXISTS valid_until DATE;

ALTER TABLE instructor_availability
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE instructor_availability
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── 2. Columnas faltantes en instructor_availability_log ─────

-- La tabla ya existe con: id, instructor_id, availability_id, action,
-- day_of_week, start_time, end_time, status, valid_from, valid_until,
-- notes, changed_at, changed_by.
-- Agregamos las columnas nuevas para soportar historial completo.

ALTER TABLE instructor_availability_log
  ADD COLUMN IF NOT EXISTS block_id          UUID;

ALTER TABLE instructor_availability_log
  ADD COLUMN IF NOT EXISTS blocked_date     DATE;

ALTER TABLE instructor_availability_log
  ADD COLUMN IF NOT EXISTS block_reason     TEXT;

ALTER TABLE instructor_availability_log
  ADD COLUMN IF NOT EXISTS block_start_time TIME;

ALTER TABLE instructor_availability_log
  ADD COLUMN IF NOT EXISTS block_end_time   TIME;

ALTER TABLE instructor_availability_log
  ADD COLUMN IF NOT EXISTS changed_by_name  TEXT;

ALTER TABLE instructor_availability_log
  ADD COLUMN IF NOT EXISTS prev_values      JSONB DEFAULT '{}';

-- Ampliar CHECK de action para nuevos tipos
ALTER TABLE instructor_availability_log
  DROP CONSTRAINT IF EXISTS instructor_availability_log_action_check;

ALTER TABLE instructor_availability_log
  ADD CONSTRAINT instructor_availability_log_action_check
  CHECK (action IN (
    'created', 'updated', 'deleted',
    'blocked', 'unblocked',
    'extended'
  ));

-- Índices (usa changed_at que ya existe en la tabla)
CREATE INDEX IF NOT EXISTS idx_avail_log_instructor
  ON instructor_availability_log (instructor_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_avail_log_action
  ON instructor_availability_log (action);

-- ── 3. Bloqueos por fecha específica (tabla nueva) ──────────

CREATE TABLE IF NOT EXISTS instructor_availability_blocks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,

  instructor_id   UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  blocked_date    DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  reason          TEXT NOT NULL,

  created_by      TEXT NOT NULL DEFAULT 'system',
  created_by_name TEXT,

  -- No dos bloqueos solapados del mismo instructor en la misma fecha
  CHECK (end_time > start_time),
  CHECK (end_time - start_time >= INTERVAL '1 hour')
);

CREATE INDEX IF NOT EXISTS idx_avail_blocks_instructor
  ON instructor_availability_blocks (instructor_id, blocked_date DESC);

-- Índice único para evitar solapamiento: mismo instructor, misma fecha,
-- rangos que se intersectan
CREATE UNIQUE INDEX IF NOT EXISTS idx_avail_blocks_no_overlap
  ON instructor_availability_blocks (instructor_id, blocked_date, start_time);

-- ============================================================
-- FIN DE MIGRACIÓN 13
-- ============================================================

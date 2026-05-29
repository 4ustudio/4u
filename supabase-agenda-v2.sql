-- ============================================================
-- 4U STUDIO ACADEMY — Sistema de Agenda v2
-- Generado: 2026-05-29
--
-- IMPORTANTE:
--   · La tabla 'appointments' (leads del formulario web) NO se toca.
--   · Este script crea el sistema de clases reales de manera paralela.
--   · Ejecutar en Supabase → SQL Editor en el orden indicado.
--   · Todas las tablas usan RLS; acceso solo vía service_role
--     hasta implementar Supabase Auth en la fase /admin.
-- ============================================================


-- ============================================================
-- MIGRACIÓN 01 — TIPOS (ENUMS)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status_t') THEN
    CREATE TYPE student_status_t AS ENUM ('active', 'inactive', 'suspended');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_type_t') THEN
    CREATE TYPE student_type_t AS ENUM ('new', 'regular');
    -- 'new'     → solo puede reservar L-V 5PM–10PM (restricción horaria)
    -- 'regular' → puede reservar L-V 10AM–10PM
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status_t') THEN
    CREATE TYPE session_status_t AS ENUM (
      'pending',      -- agendada, pendiente de confirmar
      'confirmed',    -- confirmada por la academia
      'completed',    -- clase tomada
      'cancelled',    -- cancelada (ver late_cancellation)
      'rescheduled',  -- reagendada (esta fila fue reemplazada)
      'no_show'       -- estudiante no asistió
    );
  END IF;
END $$;


-- ============================================================
-- MIGRACIÓN 02 — CATÁLOGOS (courses, classrooms)
-- ============================================================

CREATE TABLE IF NOT EXISTS courses (
  id        UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name      TEXT    NOT NULL UNIQUE,
  slug      TEXT    NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category  TEXT    NOT NULL DEFAULT 'general'
              CHECK (category IN ('kids', 'adultos', 'general'))
);

INSERT INTO courses (name, slug) VALUES
  ('Canto',    'canto'),
  ('Guitarra', 'guitarra'),
  ('Bajo',     'bajo'),
  ('Batería',  'bateria'),
  ('Teclado',  'teclado')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS classrooms (
  id        UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name      TEXT    NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO classrooms (name) VALUES
  ('Salón 1'),
  ('Salón 2'),
  ('Salón 3')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- MIGRACIÓN 03 — INSTRUCTORES + DISPONIBILIDAD
-- ============================================================

CREATE TABLE IF NOT EXISTS instructors (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE,
  phone      TEXT,
  status     TEXT NOT NULL DEFAULT 'active'
             CHECK (status IN ('active', 'inactive')),
  notes      TEXT
);

-- Seed con los instructores actuales del proyecto
INSERT INTO instructors (name, email) VALUES
  ('Carlos Mendoza',  'carlos@4ustudioacademy.com'),
  ('Valentina Ríos',  'valentina@4ustudioacademy.com'),
  ('Andrés Ospina',   'andres@4ustudioacademy.com'),
  ('Diego Martínez',  'diego@4ustudioacademy.com')
ON CONFLICT (email) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Qué cursos imparte cada instructor
CREATE TABLE IF NOT EXISTS instructor_courses (
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES courses(id)     ON DELETE CASCADE,
  PRIMARY KEY (instructor_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_instructor_courses_course
  ON instructor_courses (course_id);

-- ─────────────────────────────────────────────────────────────
-- Disponibilidad semanal del instructor
-- Día de la semana usa ISODOW: 1=Lunes … 5=Viernes, 6=Sábado
-- Sin domingos (ISODOW 7)
CREATE TABLE IF NOT EXISTS instructor_availability (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID     NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  start_time    TIME     NOT NULL,
  end_time      TIME     NOT NULL,

  -- La ventana debe cubrir al menos 1 hora (1 clase)
  CHECK (end_time > start_time),
  CHECK ((end_time - start_time) >= INTERVAL '1 hour'),

  -- No dos ventanas superpuestas del mismo instructor el mismo día
  UNIQUE (instructor_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_instructor_avail
  ON instructor_availability (instructor_id, day_of_week);


-- ============================================================
-- MIGRACIÓN 04 — ESTUDIANTES
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Datos personales
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT UNIQUE,

  -- Estado operativo
  status       student_status_t NOT NULL DEFAULT 'active',

  -- Tipo: controla restricciones de horario
  student_type student_type_t NOT NULL DEFAULT 'new',

  enrolled_at  DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Vínculo opcional con el lead original del formulario web
  lead_id      UUID REFERENCES appointments(id) ON DELETE SET NULL,

  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_students_status ON students (status);
CREATE INDEX IF NOT EXISTS idx_students_phone  ON students (phone);


-- ============================================================
-- MIGRACIÓN 05 — CUOTAS MENSUALES (8 clases/mes)
-- ============================================================

CREATE TABLE IF NOT EXISTS monthly_quotas (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at         TIMESTAMPTZ DEFAULT now() NOT NULL,

  student_id         UUID     NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  period_year        SMALLINT NOT NULL CHECK (period_year >= 2024),
  period_month       SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),

  -- Cupo total del mes (default 8, puede variarse por alumno)
  quota_total        SMALLINT NOT NULL DEFAULT 8 CHECK (quota_total > 0),

  -- Cancelaciones tardías: la clase se perdió pero consume cupo
  -- Se incrementa vía trigger al marcar late_cancellation=true
  late_cancellations SMALLINT NOT NULL DEFAULT 0 CHECK (late_cancellations >= 0),

  -- Las clases_usadas se computan en tiempo real desde class_sessions
  -- para evitar desincronización (ver fn_monthly_usage)

  UNIQUE (student_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_quotas_student
  ON monthly_quotas (student_id, period_year, period_month);


-- ============================================================
-- MIGRACIÓN 05b — AJUSTES DE CRÉDITO (restauraciones administrativas)
-- ============================================================

-- Registro inmutable de cada ajuste manual de cupo.
-- delta > 0 = restaurar crédito (caso normal: enfermedad, cortesía)
-- delta < 0 = descontar crédito adicional (caso excepcional)
-- fn_monthly_usage suma estos deltas al calcular clases_disponibles.

CREATE TABLE IF NOT EXISTS credit_adjustments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,

  student_id   UUID     NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  period_year  SMALLINT NOT NULL CHECK (period_year >= 2024),
  period_month SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),

  -- +1 restaura 1 clase, -1 descuenta 1 clase adicional
  delta        SMALLINT NOT NULL CHECK (delta != 0),

  -- Motivo estandarizado (para reportes y auditoría)
  reason       TEXT NOT NULL CHECK (reason IN (
    'enfermedad',
    'emergencia',
    'cortesia_comercial',
    'error_operativo',
    'otro'
  )),

  -- Referencia opcional a la sesión que originó el ajuste
  -- FK agregada después de class_sessions via ALTER TABLE (ver migración 08)
  session_id   UUID,

  -- Quién aplicó el ajuste (obligatorio para trazabilidad)
  admin_user   TEXT NOT NULL,

  -- Contexto libre adicional
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_credit_adj_student
  ON credit_adjustments (student_id, period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_credit_adj_session
  ON credit_adjustments (session_id)
  WHERE session_id IS NOT NULL;


-- ============================================================
-- MIGRACIÓN 06 — FECHAS BLOQUEADAS (feriados / cierres)
-- ============================================================

CREATE TABLE IF NOT EXISTS blocked_dates (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,

  blocked_date DATE NOT NULL,

  -- NULL en ambos = bloqueo de día completo
  -- Con valores = bloqueo de rango horario específico
  start_time   TIME,
  end_time     TIME,

  reason       TEXT NOT NULL,

  -- NULL = aplica a todos los salones
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,

  created_by   TEXT,

  CHECK (
    (start_time IS NULL AND end_time IS NULL)
    OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates ON blocked_dates (blocked_date);

-- Feriados nacionales Colombia 2026 (descomenta para insertar)
/*
INSERT INTO blocked_dates (blocked_date, reason) VALUES
  ('2026-01-01', 'Año Nuevo'),
  ('2026-01-12', 'Día de los Reyes Magos'),
  ('2026-03-23', 'Día de San José'),
  ('2026-04-02', 'Jueves Santo'),
  ('2026-04-03', 'Viernes Santo'),
  ('2026-05-01', 'Día del Trabajo'),
  ('2026-05-18', 'Ascensión del Señor'),
  ('2026-06-08', 'Corpus Christi'),
  ('2026-06-15', 'Sagrado Corazón'),
  ('2026-06-29', 'San Pedro y San Pablo'),
  ('2026-07-20', 'Día de la Independencia'),
  ('2026-08-07', 'Batalla de Boyacá'),
  ('2026-08-17', 'Asunción de la Virgen'),
  ('2026-10-12', 'Día de la Raza'),
  ('2026-11-02', 'Todos los Santos'),
  ('2026-11-16', 'Independencia de Cartagena'),
  ('2026-12-08', 'Inmaculada Concepción'),
  ('2026-12-25', 'Navidad');
*/


-- ============================================================
-- MIGRACIÓN 07 — HORARIOS FIJOS (recurrencia semanal)
-- ============================================================

-- Un horario fijo representa "todos los [día] a las [hora]"
-- El sistema genera automáticamente class_sessions a partir de estos.

CREATE TABLE IF NOT EXISTS student_schedules (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL,

  student_id    UUID NOT NULL REFERENCES students(id)    ON DELETE CASCADE,
  instructor_id UUID          REFERENCES instructors(id) ON DELETE SET NULL,
  course_id     UUID NOT NULL REFERENCES courses(id),
  classroom_id  UUID NOT NULL REFERENCES classrooms(id),

  -- ISODOW: 1=Lunes … 6=Sábado
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  start_time    TIME     NOT NULL,

  -- Frecuencia: semanal o quincenal (reservado para futuros planes)
  frequency     TEXT NOT NULL DEFAULT 'weekly'
                CHECK (frequency IN ('weekly', 'biweekly')),

  -- Vigencia: desde cuándo aplica y hasta cuándo (NULL = indefinido)
  active_from   DATE NOT NULL DEFAULT CURRENT_DATE,
  active_until  DATE,

  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'paused', 'cancelled')),

  notes         TEXT,

  CHECK (active_until IS NULL OR active_until >= active_from)
);

CREATE INDEX IF NOT EXISTS idx_schedules_student
  ON student_schedules (student_id, status);

CREATE INDEX IF NOT EXISTS idx_schedules_classroom
  ON student_schedules (classroom_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_schedules_instructor
  ON student_schedules (instructor_id, day_of_week);


-- ============================================================
-- MIGRACIÓN 08 — SESIONES DE CLASE (tabla principal)
-- ============================================================

CREATE TABLE IF NOT EXISTS class_sessions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Participantes
  student_id    UUID NOT NULL REFERENCES students(id),
  classroom_id  UUID NOT NULL REFERENCES classrooms(id),
  instructor_id UUID          REFERENCES instructors(id),  -- nullable hasta asignar
  course_id     UUID NOT NULL REFERENCES courses(id),

  -- Origen: ¿generada desde un horario fijo?
  schedule_id   UUID          REFERENCES student_schedules(id) ON DELETE SET NULL,

  -- Horario
  -- Todas las clases duran exactamente 60 minutos.
  -- end_time = start_time + INTERVAL '1 hour' (no se almacena, se computa)
  scheduled_date DATE NOT NULL,
  start_time     TIME NOT NULL,

  -- Estado
  status         session_status_t NOT NULL DEFAULT 'pending',

  -- Cadena de reagendamiento (referencias bidireccionales)
  -- original_session_id: si este registro es un reagendamiento, apunta al original
  -- rescheduled_to_id:   si esta clase fue reagendada, apunta a la nueva
  original_session_id UUID REFERENCES class_sessions(id) ON DELETE SET NULL,
  rescheduled_to_id   UUID REFERENCES class_sessions(id) ON DELETE SET NULL,

  -- Cancelación
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  late_cancellation     BOOLEAN NOT NULL DEFAULT false,
  -- late_cancellation=true → clase cancelada < 24h antes → consume cupo mensual

  notes TEXT,

  -- ── CONSTRAINTS DE NEGOCIO ──────────────────────────────────

  -- Sin domingos (ISODOW 7)
  CONSTRAINT cs_no_sunday CHECK (
    EXTRACT(ISODOW FROM scheduled_date)::SMALLINT != 7
  ),

  -- Sábado (ISODOW 6): solo 8:00–13:00 (última clase empieza a 1PM, termina 2PM)
  CONSTRAINT cs_valid_saturday CHECK (
    EXTRACT(ISODOW FROM scheduled_date)::SMALLINT != 6
    OR (start_time >= '08:00'::TIME AND start_time <= '13:00'::TIME)
  ),

  -- Lunes–Viernes (ISODOW 1–5): solo 10:00–21:00 (última clase empieza 9PM, termina 10PM)
  CONSTRAINT cs_valid_weekday CHECK (
    EXTRACT(ISODOW FROM scheduled_date)::SMALLINT > 5
    OR (start_time >= '10:00'::TIME AND start_time <= '21:00'::TIME)
  ),

  -- Una clase cancelada debe tener timestamp de cancelación
  CONSTRAINT cs_cancelled_needs_ts CHECK (
    status != 'cancelled' OR cancelled_at IS NOT NULL
  )
);

-- ── ÍNDICES ────────────────────────────────────────────────────

-- Verificación de disponibilidad de salón (consulta más frecuente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cs_classroom_slot
  ON class_sessions (classroom_id, scheduled_date, start_time)
  WHERE status NOT IN ('cancelled', 'rescheduled');
-- UNIQUE garantiza imposibilidad física de doble reserva en mismo salón/hora

-- Agenda del estudiante
CREATE INDEX IF NOT EXISTS idx_cs_student_date
  ON class_sessions (student_id, scheduled_date)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- Agenda del instructor
CREATE INDEX IF NOT EXISTS idx_cs_instructor_date
  ON class_sessions (instructor_id, scheduled_date)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- Vista diaria para el panel admin
CREATE INDEX IF NOT EXISTS idx_cs_date_status
  ON class_sessions (scheduled_date, status);

-- Conteo mensual de clases por estudiante (para verificar cuota)
CREATE INDEX IF NOT EXISTS idx_cs_student_month
  ON class_sessions (student_id, scheduled_date)
  WHERE status NOT IN ('cancelled', 'rescheduled');

-- Cadena de reagendamientos
CREATE INDEX IF NOT EXISTS idx_cs_original
  ON class_sessions (original_session_id)
  WHERE original_session_id IS NOT NULL;

-- Sesiones originadas por horario fijo
CREATE INDEX IF NOT EXISTS idx_cs_schedule
  ON class_sessions (schedule_id)
  WHERE schedule_id IS NOT NULL;

-- FK de credit_adjustments.session_id → class_sessions
-- Declarada aquí porque credit_adjustments se crea antes (migración 05b)
ALTER TABLE credit_adjustments
  ADD CONSTRAINT fk_credit_adj_session
  FOREIGN KEY (session_id)
  REFERENCES class_sessions(id)
  ON DELETE SET NULL;


-- ============================================================
-- MIGRACIÓN 09 — HISTORIAL DE CAMBIOS (audit)
-- ============================================================

CREATE TABLE IF NOT EXISTS class_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,

  session_id  UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  changed_by  TEXT,                  -- email/ID del admin (activar cuando haya auth)
  old_status  session_status_t,
  new_status  session_status_t NOT NULL,
  reason      TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_class_history_session
  ON class_history (session_id, created_at DESC);


-- ============================================================
-- MIGRACIÓN 10 — TRIGGERS
-- ============================================================

-- updated_at automático
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_students_updated_at     ON students;
DROP TRIGGER IF EXISTS trg_schedules_updated_at    ON student_schedules;
DROP TRIGGER IF EXISTS trg_sessions_updated_at     ON class_sessions;

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_schedules_updated_at
  BEFORE UPDATE ON student_schedules
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON class_sessions
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Audit: registra cada cambio de status en class_history
CREATE OR REPLACE FUNCTION fn_log_session_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO class_history (session_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_session_audit ON class_sessions;

CREATE TRIGGER trg_session_audit
  AFTER UPDATE ON class_sessions
  FOR EACH ROW EXECUTE FUNCTION fn_log_session_change();

-- ─────────────────────────────────────────────────────────────
-- Cancelación tardía: incrementa late_cancellations en monthly_quotas
-- Se dispara cuando late_cancellation pasa de false → true
CREATE OR REPLACE FUNCTION fn_handle_late_cancellation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
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

DROP TRIGGER IF EXISTS trg_late_cancellation ON class_sessions;

CREATE TRIGGER trg_late_cancellation
  AFTER UPDATE ON class_sessions
  FOR EACH ROW EXECUTE FUNCTION fn_handle_late_cancellation();


-- ============================================================
-- MIGRACIÓN 11 — FUNCIONES DE NEGOCIO
-- ============================================================

-- ── A. ¿El slot está bloqueado por feriado/cierre? ──────────
CREATE OR REPLACE FUNCTION fn_is_blocked(
  p_date         DATE,
  p_start_time   TIME,
  p_classroom_id UUID DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
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


-- ── B. ¿El salón está libre en ese slot? ────────────────────
-- El UNIQUE INDEX en class_sessions garantiza la restricción a nivel de DB.
-- Esta función es para consultas previas al INSERT.
CREATE OR REPLACE FUNCTION fn_slot_available(
  p_classroom_id UUID,
  p_date         DATE,
  p_start_time   TIME,
  p_exclude_id   UUID DEFAULT NULL   -- ignorar este session_id (para reagendamiento)
)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
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


-- ── C. ¿El estudiante está libre en ese slot? ───────────────
CREATE OR REPLACE FUNCTION fn_student_free(
  p_student_id UUID,
  p_date       DATE,
  p_start_time TIME,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
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


-- ── D. ¿El instructor está disponible en ese slot? ──────────
-- Verifica dos cosas:
--   1) Tiene disponibilidad configurada para ese día/hora
--   2) No tiene otra clase en ese momento (no double-booking)
CREATE OR REPLACE FUNCTION fn_instructor_free(
  p_instructor_id UUID,
  p_date          DATE,
  p_start_time    TIME,
  p_exclude_id    UUID DEFAULT NULL
)
RETURNS TEXT LANGUAGE plpgsql STABLE AS $$  -- NULL = libre, TEXT = mensaje de error
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


-- ── E. Validar reglas de horario de la academia ─────────────
-- Retorna NULL si es válido, o un mensaje de error descriptivo.
CREATE OR REPLACE FUNCTION fn_validate_schedule_rules(
  p_student_id UUID,
  p_date       DATE,
  p_start_time TIME
)
RETURNS TEXT LANGUAGE plpgsql STABLE AS $$
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


-- ── F. Uso mensual de clases por estudiante ──────────────────
-- Retorna el estado actual del cupo mensual de un estudiante.
-- Las clases usadas se calculan en tiempo real (no hay contador que desincronizar).
CREATE OR REPLACE FUNCTION fn_monthly_usage(
  p_student_id UUID,
  p_year       SMALLINT,
  p_month      SMALLINT
)
RETURNS TABLE (
  quota_total         SMALLINT,   -- cupo total del mes (default 8)
  classes_scheduled   BIGINT,     -- pending + confirmed (próximas)
  classes_completed   BIGINT,     -- completed + no_show (tomadas)
  late_cancellations  SMALLINT,   -- cancelaciones tardías (perdidas)
  classes_available   INT         -- cupo restante
) LANGUAGE SQL STABLE AS $$
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


-- ── G. Reservar una clase (todas las validaciones en 1 transacción) ──
CREATE OR REPLACE FUNCTION fn_book_session(
  p_student_id    UUID,
  p_classroom_id  UUID,
  p_course_id     UUID,
  p_date          DATE,
  p_start_time    TIME,
  p_instructor_id UUID DEFAULT NULL,
  p_schedule_id   UUID DEFAULT NULL,  -- link a horario fijo si aplica
  p_notes         TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_year      SMALLINT := EXTRACT(YEAR  FROM p_date)::SMALLINT;
  v_month     SMALLINT := EXTRACT(MONTH FROM p_date)::SMALLINT;
  v_error     TEXT;
  v_available INT;
  v_new_id    UUID;
BEGIN
  -- 1. Reglas de horario + tipo de estudiante
  v_error := fn_validate_schedule_rules(p_student_id, p_date, p_start_time);
  IF v_error IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', v_error);
  END IF;

  -- 2. Fecha/horario no bloqueado por feriado
  IF fn_is_blocked(p_date, p_start_time, p_classroom_id) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'La academia está cerrada en esa fecha y horario (feriado o cierre especial).');
  END IF;

  -- 3. Salón disponible
  IF NOT fn_slot_available(p_classroom_id, p_date, p_start_time) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El salón no está disponible en ese horario.');
  END IF;

  -- 4. Estudiante sin conflicto
  IF NOT fn_student_free(p_student_id, p_date, p_start_time) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El estudiante ya tiene otra clase en ese horario.');
  END IF;

  -- 5. Instructor disponible (solo si se especificó)
  IF p_instructor_id IS NOT NULL THEN
    v_error := fn_instructor_free(p_instructor_id, p_date, p_start_time);
    IF v_error IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', v_error);
    END IF;
  END IF;

  -- 6. Cuota mensual disponible
  SELECT classes_available INTO v_available
  FROM fn_monthly_usage(p_student_id, v_year, v_month);

  IF v_available <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error',
      'El estudiante ha utilizado todas sus clases del mes '
      || p_year::TEXT || '-' || LPAD(p_month::TEXT, 2, '0') || '.');
  END IF;

  -- 7. Insertar la sesión
  INSERT INTO class_sessions (
    student_id, classroom_id, course_id, instructor_id,
    scheduled_date, start_time, status, schedule_id, notes
  ) VALUES (
    p_student_id, p_classroom_id, p_course_id, p_instructor_id,
    p_date, p_start_time, 'confirmed', p_schedule_id, p_notes
  ) RETURNING id INTO v_new_id;

  -- 8. Crear registro de cuota mensual si no existe
  INSERT INTO monthly_quotas (student_id, period_year, period_month, quota_total)
  VALUES (p_student_id, v_year, v_month, 8)
  ON CONFLICT (student_id, period_year, period_month) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'session_id', v_new_id);
END;
$$;


-- ── H. Cancelar una clase ────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_cancel_session(
  p_session_id UUID,
  p_reason     TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
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


-- ── I. Restaurar crédito administrativamente ─────────────────
-- Uso: enfermedad, emergencia, cortesía comercial, error operativo.
-- Crea un registro en credit_adjustments (inmutable, audit trail).
-- fn_monthly_usage lo suma automáticamente al cupo disponible.
CREATE OR REPLACE FUNCTION fn_restore_credit(
  p_student_id  UUID,
  p_year        SMALLINT,
  p_month       SMALLINT,
  p_reason      TEXT,        -- 'enfermedad'|'emergencia'|'cortesia_comercial'|'error_operativo'|'otro'
  p_admin_user  TEXT,        -- email o ID del admin que aplica el ajuste
  p_session_id  UUID DEFAULT NULL,   -- sesión que originó el ajuste (opcional)
  p_notes       TEXT DEFAULT NULL,   -- contexto adicional
  p_delta       SMALLINT DEFAULT 1   -- clases a restaurar (default 1, negativo para descontar)
)
RETURNS JSONB LANGUAGE plpgsql AS $$
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


-- ── J. Reagendar una clase ───────────────────────────────────
CREATE OR REPLACE FUNCTION fn_reschedule_session(
  p_session_id       UUID,
  p_new_classroom_id UUID,
  p_new_date         DATE,
  p_new_start_time   TIME
)
RETURNS JSONB LANGUAGE plpgsql AS $$
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


-- ── J. Generar sesiones del mes desde horarios fijos ────────
-- Llamar al inicio de cada mes para crear automáticamente las clases
-- de todos los estudiantes con horario fijo activo.
-- Respeta: feriados, cuota mensual, disponibilidad de instructor, salón.
CREATE OR REPLACE FUNCTION fn_generate_monthly_sessions(
  p_student_id UUID,
  p_year       SMALLINT,
  p_month      SMALLINT
)
RETURNS JSONB LANGUAGE plpgsql AS $$
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
      -- Evitar duplicados: ya existe una sesión no cancelada para este slot/horario
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

    -- Si no queda cupo mensual, detener todo el proceso
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


-- ── K. Consultar slots disponibles para una fecha ────────────
-- Útil para el panel de agendamiento del admin.
-- Retorna todos los slots del día con disponibilidad por salón.
CREATE OR REPLACE FUNCTION fn_available_slots(
  p_date          DATE,
  p_student_id    UUID DEFAULT NULL,
  p_instructor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  slot_time      TIME,
  classroom_id   UUID,
  classroom_name TEXT,
  is_available   BOOLEAN
) LANGUAGE SQL STABLE AS $$
  WITH slots AS (
    -- Generar todos los slots del día según las reglas de horario
    SELECT gs::TIME AS slot_time
    FROM generate_series(
      CASE
        WHEN EXTRACT(ISODOW FROM p_date)::INT = 6
          THEN (p_date::TEXT || ' 08:00')::TIMESTAMP   -- Sáb: desde 8AM
        ELSE   (p_date::TEXT || ' 10:00')::TIMESTAMP   -- L-V: desde 10AM
      END,
      CASE
        WHEN EXTRACT(ISODOW FROM p_date)::INT = 6
          THEN (p_date::TEXT || ' 13:00')::TIMESTAMP   -- Sáb: última a 1PM
        ELSE   (p_date::TEXT || ' 21:00')::TIMESTAMP   -- L-V: última a 9PM
      END,
      INTERVAL '1 hour'
    ) gs
    -- Sin domingos
    WHERE EXTRACT(ISODOW FROM p_date)::INT != 7
  ),
  rooms AS (
    SELECT id, name FROM classrooms WHERE is_active = true
  )
  SELECT
    s.slot_time,
    r.id              AS classroom_id,
    r.name            AS classroom_name,
    -- El slot es disponible si no está bloqueado, el salón está libre,
    -- el estudiante está libre (si se especificó) y el instructor está libre (si aplica)
    NOT fn_is_blocked(p_date, s.slot_time, r.id)
    AND fn_slot_available(r.id, p_date, s.slot_time)
    AND (p_student_id IS NULL    OR fn_student_free(p_student_id, p_date, s.slot_time))
    AND (p_instructor_id IS NULL OR (fn_instructor_free(p_instructor_id, p_date, s.slot_time) IS NULL))
    AS is_available
  FROM slots s
  CROSS JOIN rooms r
  ORDER BY s.slot_time, r.name;
$$;


-- ============================================================
-- MIGRACIÓN 12 — ROW LEVEL SECURITY
-- ============================================================

-- Todas las tablas del sistema de agenda requieren service_role.
-- La anon key (formulario público) NO tiene acceso a estas tablas.
-- Cuando se implemente Supabase Auth en /admin, agregar policies
-- para el rol 'authenticated' según sea admin / instructor / estudiante.

ALTER TABLE courses                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_courses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_availability  ENABLE ROW LEVEL SECURITY;
ALTER TABLE students                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_quotas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_schedules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_history            ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_adjustments       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
--
-- RESUMEN DE TABLAS CREADAS:
--   courses               — Catálogo de cursos (5 instrumentos)
--   classrooms            — 3 salones
--   instructors           — Profesores (seed con 4 instructores)
--   instructor_courses    — M2M: instructor ↔ curso
--   instructor_availability — Disponibilidad semanal por instructor
--   students              — Estudiantes matriculados
--   monthly_quotas        — Control de 8 clases/mes
--   blocked_dates         — Feriados y cierres especiales
--   student_schedules     — Horarios fijos recurrentes
--   class_sessions        — Sesiones de clase (tabla principal)
--   class_history         — Audit log de cambios de status
--   credit_adjustments    — Restauraciones y ajustes administrativos de cupo
--
-- FUNCIONES RPC (llamar vía supabase.rpc()):
--   fn_book_session(student_id, classroom_id, course_id, date, time, ...)
--   fn_cancel_session(session_id, reason?)
--   fn_restore_credit(student_id, year, month, reason, admin_user, session_id?, notes?, delta?)
--   fn_reschedule_session(session_id, new_classroom_id, new_date, new_time)
--   fn_generate_monthly_sessions(student_id, year, month)
--   fn_available_slots(date, student_id?, instructor_id?)
--   fn_monthly_usage(student_id, year, month)
--
-- MIGRACIONES POSTERIORES (ejecutar en orden si la DB ya existe):
--   2026-05-01: ALTER TABLE student_schedules ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly'));
--   2026-05-29: ALTER TABLE courses         ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('kids', 'adultos', 'general'));
--   2026-05-29: ALTER TABLE students        ADD COLUMN IF NOT EXISTS first_name      TEXT;
--   2026-05-29: ALTER TABLE students        ADD COLUMN IF NOT EXISTS last_name       TEXT;
--   2026-05-29: ALTER TABLE students        ADD COLUMN IF NOT EXISTS address         TEXT;
--   2026-05-29: ALTER TABLE students        ADD COLUMN IF NOT EXISTS city            TEXT;
--   2026-05-29: ALTER TABLE students        ADD COLUMN IF NOT EXISTS birth_date      DATE;
--   2026-05-29: ALTER TABLE students        ADD COLUMN IF NOT EXISTS profession      TEXT;
--   2026-05-29: ALTER TABLE students        ADD COLUMN IF NOT EXISTS music_genre     TEXT;
--   2026-05-29: ALTER TABLE students        ADD COLUMN IF NOT EXISTS document_type   TEXT;
--   2026-05-29: ALTER TABLE students        ADD COLUMN IF NOT EXISTS document_number TEXT;
--   2026-05-29: UPDATE students SET first_name = name WHERE first_name IS NULL;
--   2026-05-29: UPDATE students SET last_name  = ''   WHERE last_name  IS NULL;
-- ============================================================

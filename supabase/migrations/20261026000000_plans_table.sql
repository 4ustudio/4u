-- Catálogo de planes editable desde /admin/planes (antes: lista fija en lib/students/plans.ts).
-- students.plan_name y payments.plan_name siguen guardando el nombre como texto.
CREATE TABLE IF NOT EXISTS public.plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL UNIQUE,
  price           integer CHECK (price IS NULL OR price >= 0),
  duration_months integer CHECK (duration_months IS NULL OR duration_months > 0),
  description     text,
  active          boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Deny-all: solo el service role (server actions de admin) lee/escribe.
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.plans FROM anon, authenticated;

INSERT INTO public.plans (name, price, duration_months, sort_order) VALUES
  ('Plan 4 Clases',             600000,  NULL, 10),
  ('Plan 3 Meses',              900000,  3,    20),
  ('Plan 8 Clases',             1100000, NULL, 30),
  ('Plan New Talent',           1100000, NULL, 40),
  ('Plan Fast Talent',          1900000, NULL, 50),
  ('Plan Bandas',               2500000, NULL, 60),
  ('Plan Artista',              3500000, NULL, 70),
  ('Plan Artista Premium',      4500000, NULL, 80),
  ('Plan Profesional',          NULL,    NULL, 90),
  ('Plan Corporativo',          NULL,    NULL, 100),
  ('Plan Kids & Teens',         1100000, NULL, 110),
  ('Plan Premium Kids & Teens', 1600000, NULL, 120)
ON CONFLICT (name) DO NOTHING;

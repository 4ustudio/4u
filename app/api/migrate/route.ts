import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.enrollments (
          id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
          created_at      TIMESTAMPTZ   DEFAULT now() NOT NULL,
          student_type    TEXT          NOT NULL CHECK (student_type IN ('self', 'child')),
          student_name    TEXT          NOT NULL,
          student_age     SMALLINT      NOT NULL CHECK (student_age >= 6 AND student_age < 120),
          guardian_name   TEXT,
          phone           TEXT          NOT NULL,
          email           TEXT          NOT NULL,
          course_interest TEXT          NOT NULL,
          level           TEXT          NOT NULL CHECK (level IN ('never', 'beginner', 'intermediate', 'advanced')),
          status          TEXT          NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'contacted', 'scheduled', 'cancelled')),
          notes           TEXT,
          source          TEXT          NOT NULL DEFAULT 'website'
        );

        ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "public_can_insert_enrollments" ON public.enrollments;
        CREATE POLICY "public_can_insert_enrollments" ON public.enrollments
          FOR INSERT TO anon
          WITH CHECK (true);

        CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments (status);
        CREATE INDEX IF NOT EXISTS idx_enrollments_created ON public.enrollments (created_at DESC);
      `
    })

    if (error) {
      // If exec_sql doesn't exist, try direct insert approach
      return NextResponse.json({
        error: error.message,
        hint: 'Abre el SQL Editor de Supabase y pega el contenido de supabase-setup.sql'
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Tabla enrollments creada' })
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Error desconocido',
      hint: 'Abre Supabase Dashboard → SQL Editor y pega el contenido de supabase-setup.sql'
    }, { status: 500 })
  }
}

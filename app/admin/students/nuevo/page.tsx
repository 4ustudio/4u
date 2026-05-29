import { createAdminClient } from '@/lib/supabase/admin'
import NewStudentForm from './_form'
import type { Lead } from '@/types/admin'

async function getLeads(): Promise<Lead[]> {
  const { data } = await createAdminClient()
    .from('appointments')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

export default async function NuevoEstudiantePage() {
  const leads = await getLeads()
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Nuevo estudiante</h1>
        <p className="text-sm text-white/40 mt-0.5">Crea un estudiante manualmente o desde un lead del formulario web.</p>
      </div>
      <NewStudentForm leads={leads} />
    </div>
  )
}

import NewStudentForm from './_form'

export const dynamic = 'force-dynamic'

export default function NuevoEstudiantePage() {
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Nuevo estudiante</h1>
        <p className="text-sm text-white/40 mt-0.5">Crea un estudiante manualmente.</p>
      </div>
      <NewStudentForm />
    </div>
  )
}

// Fase /admin — autenticación pendiente.
// Cuando se implemente: agregar Supabase Auth aquí y proteger todas las rutas hijas.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {children}
    </div>
  )
}

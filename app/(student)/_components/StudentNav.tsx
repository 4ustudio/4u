'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function StudentNav({ userEmail }: { userEmail: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/mi-cuenta/login')
    router.refresh()
  }

  return (
    <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/images/icons/Recurso 1.png"
            alt="4U Studio Academy"
            width={80}
            height={28}
            className="object-contain"
          />
          <span className="text-xs text-white/30 border-l border-white/10 pl-3 font-roboto">
            Portal Estudiante
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/40 font-roboto hidden sm:block">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-white/50 hover:text-white transition-colors font-roboto px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  )
}

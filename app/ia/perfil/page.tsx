import type { Metadata } from 'next'
import Link from 'next/link'
import PageLayout from '@/components/layout/PageLayout'
import Container from '@/components/ui/Container'
import ProfileQuiz from '@/components/ia/ProfileQuiz'

export const metadata: Metadata = {
  title: 'Perfil Musical Inteligente — Music 4U IA',
  description: 'Descubre tu perfil musical y tu Music Score en 5 dimensiones con solo 5 preguntas.',
}

export default function PerfilPage() {
  return (
    <PageLayout>
      <Container>
        <div className="py-12 sm:py-20 max-w-2xl mx-auto space-y-8">
          <div className="space-y-2">
            <Link href="/ia" className="text-white/40 hover:text-white/70 text-sm transition-colors inline-flex items-center gap-1">
              ← Music 4U IA
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-poppins">
              Perfil Musical <span className="text-[#ff7a00]">Inteligente</span>
            </h1>
            <p className="text-white/50 text-sm">5 preguntas · ~3 min · Resultado inmediato</p>
          </div>

          <ProfileQuiz />
        </div>
      </Container>
    </PageLayout>
  )
}

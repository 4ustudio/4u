import type { Metadata } from 'next'
import Link from 'next/link'
import PageLayout from '@/components/layout/PageLayout'
import Container from '@/components/ui/Container'
import DreamBuilder from '@/components/ia/DreamBuilder'

export const metadata: Metadata = {
  title: 'Constructor de Sueño Musical — Music 4U IA',
  description: 'Define tu sueño musical y obtén un roadmap personalizado con fases e hitos concretos.',
}

export default function SuenoPage() {
  return (
    <PageLayout>
      <Container>
        <div className="py-12 sm:py-20 max-w-2xl mx-auto space-y-8">
          <div className="space-y-2">
            <Link href="/ia" className="text-white/40 hover:text-white/70 text-sm transition-colors inline-flex items-center gap-1">
              ← Music 4U IA
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-poppins">
              Constructor de <span className="text-[#ff7a00]">Sueño Musical</span>
            </h1>
            <p className="text-white/50 text-sm">3 preguntas · ~2 min · Roadmap personalizado</p>
          </div>

          <DreamBuilder />
        </div>
      </Container>
    </PageLayout>
  )
}

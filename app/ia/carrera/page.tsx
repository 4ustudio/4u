import type { Metadata } from 'next'
import Link from 'next/link'
import PageLayout from '@/components/layout/PageLayout'
import Container from '@/components/ui/Container'
import CareerSimulator from '@/components/ia/CareerSimulator'

export const metadata: Metadata = {
  title: 'Simulador de Carrera Musical — Music 4U IA',
  description: 'Toma decisiones en escenarios reales y descubre hacia dónde apunta tu carrera musical.',
}

export default function CarreraPage() {
  return (
    <PageLayout>
      <Container>
        <div className="py-12 sm:py-20 max-w-2xl mx-auto space-y-8">
          <div className="space-y-2">
            <Link href="/ia" className="text-white/40 hover:text-white/70 text-sm transition-colors inline-flex items-center gap-1">
              ← Music 4U IA
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-poppins">
              Simulador de <span className="text-[#ff7a00]">Carrera Musical</span>
            </h1>
            <p className="text-white/50 text-sm">3 escenarios · ~4 min · Carrera proyectada</p>
          </div>

          <CareerSimulator />
        </div>
      </Container>
    </PageLayout>
  )
}

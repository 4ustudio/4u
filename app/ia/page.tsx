import type { Metadata } from 'next'
import Link from 'next/link'
import PageLayout from '@/components/layout/PageLayout'
import Container from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Music 4U IA — Descubre tu identidad musical',
  description: 'Herramientas interactivas para conocer tu perfil musical, construir tu sueño y simular tu carrera.',
}

const TOOLS = [
  {
    href:        '/ia/perfil',
    emoji:       '🎵',
    badge:       '5 preguntas · ~3 min',
    title:       'Perfil Musical Inteligente',
    description: 'Descubre qué tipo de músico eres, tu Music Score en 5 dimensiones y los cursos que mejor se adaptan a ti.',
    cta:         'Descubrir mi perfil',
    color:       'from-orange-500/10 to-transparent',
  },
  {
    href:        '/ia/sueno',
    emoji:       '🌟',
    badge:       '3 preguntas · ~2 min',
    title:       'Constructor de Sueño Musical',
    description: 'Define tu sueño musical y obtén un roadmap personalizado con fases, hitos y el plan que te llevará ahí.',
    cta:         'Construir mi camino',
    color:       'from-yellow-500/10 to-transparent',
  },
  {
    href:        '/ia/carrera',
    emoji:       '🎯',
    badge:       '3 escenarios · ~4 min',
    title:       'Simulador de Carrera Musical',
    description: 'Toma decisiones en escenarios reales y descubre hacia dónde apunta tu carrera musical según tus elecciones.',
    cta:         'Simular mi carrera',
    color:       'from-red-500/10 to-transparent',
  },
]

export default function IAPage() {
  return (
    <PageLayout>
      <Container>
        <div className="py-16 sm:py-24 space-y-16">
          {/* Hero */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="inline-block bg-[#ff7a00]/20 text-[#ff7a00] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Music 4U IA
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-poppins leading-tight">
              Descubre tu<br />
              <span className="text-[#ff7a00]">identidad musical</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              Tres herramientas interactivas diseñadas para que conozcas tu perfil, construyas tu sueño y proyectes tu carrera.
            </p>
          </div>

          {/* Cards */}
          <div className="grid sm:grid-cols-3 gap-6">
            {TOOLS.map(tool => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group relative bg-gradient-to-b ${tool.color} bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 hover:border-[#ff7a00]/40 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="text-4xl">{tool.emoji}</div>
                <div className="space-y-1">
                  <p className="text-white/40 text-xs font-medium">{tool.badge}</p>
                  <h2 className="text-lg font-bold text-white font-poppins group-hover:text-[#ff7a00] transition-colors">
                    {tool.title}
                  </h2>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{tool.description}</p>
                <div className="flex items-center gap-1.5 text-[#ff7a00] text-sm font-semibold">
                  {tool.cta}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </PageLayout>
  )
}

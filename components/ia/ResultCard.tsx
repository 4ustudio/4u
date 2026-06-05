import Link from 'next/link'
import MusicScoreChart from './MusicScoreChart'
import type { MusicScore } from '@/lib/ia/scoring'

type CTAButton = {
  label: string
  href:  string
  primary?: boolean
}

type Props = {
  badge:       string
  title:       string
  tagline:     string
  description: string
  bullets?:    string[]
  score:       MusicScore
  ctas:        CTAButton[]
}

export default function ResultCard({ badge, title, tagline, description, bullets, score, ctas }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-white/10">
        <span className="inline-block bg-[#ff7a00]/20 text-[#ff7a00] text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          {badge}
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white font-poppins">{title}</h2>
        <p className="text-[#ff7a00] font-medium mt-1">{tagline}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        {/* Score */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Tu Music Score</h3>
          <MusicScoreChart score={score} />
        </div>

        {/* Perfil */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">Tu perfil</h3>
            <p className="text-white/80 text-sm leading-relaxed">{description}</p>
          </div>

          {bullets && bullets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">Fortalezas</h3>
              <ul className="space-y-1.5">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <span className="text-[#ff7a00] mt-0.5 shrink-0">→</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-2 pt-2">
            {ctas.map((cta, i) => (
              <Link
                key={i}
                href={cta.href}
                className={
                  cta.primary
                    ? 'block text-center bg-[#ff7a00] hover:bg-[#ff9a3c] text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm'
                    : 'block text-center border border-white/20 hover:border-white/40 text-white/80 hover:text-white py-3 px-6 rounded-xl transition-colors text-sm'
                }
              >
                {cta.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

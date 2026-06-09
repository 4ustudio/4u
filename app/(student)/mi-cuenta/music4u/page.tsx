import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase/server'
import { getUserJourneys, getMusic4UMetrics } from '@/app/(student)/_actions/music4u'
import StudentPortalHeader from '../_components/StudentPortalHeader'
import LinkAnonJourneys from '../_components/LinkAnonJourneys'
import type { MusicScore } from '@/lib/ia/scoring'
import type { JourneyRow, Music4UMetrics } from '@/app/(student)/_actions/music4u'

export const dynamic = 'force-dynamic'

// ── Arquetipos ──────────────────────────────────────────────────────────
const ARCHETYPES: Record<keyof MusicScore, { name: string; tagline: string; color: string }> = {
  creatividad:    { name: 'El Creativo',    tagline: 'Tu intuición musical guía tu expresión artística.',        color: '#ff7a00' },
  disciplina:     { name: 'El Técnico',     tagline: 'La precisión y la constancia definen tu camino.',          color: '#f59e0b' },
  interpretacion: { name: 'El Intérprete',  tagline: 'Dar vida a la música es tu mayor talento.',               color: '#8b5cf6' },
  produccion:     { name: 'El Productor',   tagline: 'Construyes universos sonoros desde cero.',                 color: '#06b6d4' },
  performance:    { name: 'El Performer',   tagline: 'El escenario es tu hogar natural.',                        color: '#ec4899' },
}

const FEATURE_LABELS: Record<string, string> = {
  perfil:  'Perfil Musical',
  sueno:   'Sueño Musical',
  carrera: 'Carrera Proyectada',
}

const SCORE_LABELS: Record<keyof MusicScore, string> = {
  creatividad:    'Creatividad',
  disciplina:     'Disciplina',
  interpretacion: 'Interpretación',
  produccion:     'Producción',
  performance:    'Performance',
}

const SCORE_COLORS: Record<keyof MusicScore, string> = {
  creatividad:    '#ff7a00',
  disciplina:     '#f59e0b',
  interpretacion: '#8b5cf6',
  produccion:     '#06b6d4',
  performance:    '#ec4899',
}

function getDominantKey(score: MusicScore): keyof MusicScore {
  const entries = Object.entries(score) as [keyof MusicScore, number][]
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

function getLevel(val: number) {
  if (val >= 75) return 'Avanzado'
  if (val >= 50) return 'Intermedio'
  if (val >= 30) return 'Básico'
  return 'Inicial'
}

// ── Sub-componentes ─────────────────────────────────────────────────────

function ScoreBars({ score }: { score: MusicScore }) {
  const keys = Object.keys(score) as (keyof MusicScore)[]
  return (
    <div className="space-y-2.5">
      {keys.map(k => (
        <div key={k}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-white/70">{SCORE_LABELS[k]}</span>
            <span className="text-xs text-white/40">{getLevel(score[k])} · {score[k]}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${score[k]}%`, background: SCORE_COLORS[k] }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function LastCard({
  label,
  journey,
  href,
}: {
  label: string
  journey: JourneyRow | undefined
  href: string
}) {
  if (!journey) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-white/30 flex-1">Sin resultados aún.</p>
        <Link href={href} className="text-xs text-[#ff7a00] hover:text-[#ff9a3c] transition-colors">
          Explorar →
        </Link>
      </div>
    )
  }

  const rd = journey.result_data

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{label}</p>
        <span className="text-[10px] text-white/20">
          {new Date(journey.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Contenido según feature */}
      {journey.feature === 'perfil' && (
        <div className="space-y-2 flex-1">
          {rd.archetype && (
            <p className="text-sm font-semibold text-white">{String(rd.archetype)}</p>
          )}
          {rd.description && (
            <p className="text-xs text-white/60 line-clamp-3">{String(rd.description)}</p>
          )}
          {Array.isArray(rd.bullets) && rd.bullets.length > 0 && (
            <ul className="space-y-1">
              {(rd.bullets as string[]).slice(0, 2).map((b, i) => (
                <li key={i} className="text-xs text-white/50 flex gap-1.5">
                  <span className="text-[#ff7a00] shrink-0">→</span>{b}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {journey.feature === 'sueno' && (
        <div className="flex-1 space-y-2">
          {rd.title && <p className="text-sm font-semibold text-white">{String(rd.title)}</p>}
          {rd.description && (
            <p className="text-xs text-white/60 line-clamp-3">{String(rd.description)}</p>
          )}
        </div>
      )}

      {journey.feature === 'carrera' && (
        <div className="flex-1 space-y-2">
          {journey.career_type && (
            <p className="text-sm font-semibold text-white">{journey.career_type}</p>
          )}
          {Array.isArray(journey.recommended_courses) && journey.recommended_courses.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {journey.recommended_courses.slice(0, 3).map((c, i) => (
                <span key={i} className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Link href={href} className="text-xs text-[#ff7a00] hover:text-[#ff9a3c] transition-colors">
          Explorar de nuevo →
        </Link>
      </div>
    </div>
  )
}

function MusicScoreCard({ journey }: { journey: JourneyRow | undefined }) {
  if (!journey) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Music Score</p>
        <p className="text-sm text-white/30 flex-1">Sin resultados aún.</p>
        <Link href="/ia/perfil" className="text-xs text-[#ff7a00] hover:text-[#ff9a3c] transition-colors">
          Descubrir Score →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Music Score</p>
        <span className="text-[10px] text-white/20">
          {new Date(journey.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <ScoreBars score={journey.music_score} />
    </div>
  )
}

function MetricChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
      <p className="text-xl font-bold text-white font-poppins">{value}</p>
      <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
    </div>
  )
}

function HistoryCard({ journey }: { journey: JourneyRow }) {
  const dominant = getDominantKey(journey.music_score)
  const archetype = ARCHETYPES[dominant]
  return (
    <div className="min-w-[200px] max-w-[200px] bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2 shrink-0">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${archetype.color}20`, color: archetype.color }}
        >
          {FEATURE_LABELS[journey.feature] ?? journey.feature}
        </span>
      </div>
      <p className="text-xs font-semibold text-white">{archetype.name}</p>
      <p className="text-[10px] text-white/40">
        {new Date(journey.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      <div className="space-y-1 mt-1">
        {(Object.keys(journey.music_score) as (keyof MusicScore)[]).map(k => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${journey.music_score[k]}%`, background: SCORE_COLORS[k] }} />
            </div>
            <span className="text-[9px] text-white/30 w-5 text-right tabular-nums">{journey.music_score[k]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Página principal ────────────────────────────────────────────────────

export default async function Music4UPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/mi-cuenta/login')

  const [journeys, metrics] = await Promise.all([
    getUserJourneys(user.id),
    getMusic4UMetrics(user.id),
  ])

  const lastPerfil  = journeys.find(j => j.feature === 'perfil')
  const lastSueno   = journeys.find(j => j.feature === 'sueno')
  const lastCarrera = journeys.find(j => j.feature === 'carrera')
  const lastScore   = lastPerfil ?? lastSueno ?? lastCarrera

  // Arquetipo dominante
  const dominantKey   = lastScore ? getDominantKey(lastScore.music_score) : null
  const archetype     = dominantKey ? ARCHETYPES[dominantKey] : null

  const FAVORITE_LABEL = metrics.favorite ? (FEATURE_LABELS[metrics.favorite] ?? metrics.favorite) : '—'

  return (
    <>
      <LinkAnonJourneys userId={user.id} />
      <StudentPortalHeader
        userEmail={user.email}
        avatarUrl={(user.user_metadata?.avatar_url as string | undefined) ?? null}
        firstName={user.user_metadata?.full_name?.split(' ')[0] ?? user.user_metadata?.name?.split(' ')[0] ?? null}
      />
      <main className="min-h-screen bg-[#080808] px-4 pt-[68px] pb-16">
        <div className="mx-auto max-w-[1100px] space-y-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Link href="/mi-cuenta" className="hover:text-white/60 transition-colors">Mi Cuenta</Link>
            <span>/</span>
            <span className="text-white/50">Music 4U IA</span>
          </div>

          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-poppins">
              Music 4U <span className="text-[#ff7a00]">IA</span>
            </h1>
            <p className="text-sm text-white/40 mt-1">Tu identidad musical en un solo lugar.</p>
          </div>

          {/* Arquetipo dominante */}
          {archetype && dominantKey ? (
            <div
              className="rounded-2xl border p-6 sm:p-8"
              style={{ borderColor: `${archetype.color}30`, background: `${archetype.color}08` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <div className="flex-1 space-y-2">
                  <span
                    className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ background: `${archetype.color}20`, color: archetype.color }}
                  >
                    Arquetipo Musical
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white font-poppins">
                    {archetype.name}
                  </h2>
                  <p className="text-white/60 text-sm max-w-md">{archetype.tagline}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="text-center bg-white/5 border border-white/10 rounded-xl px-6 py-3">
                    <p className="text-xs text-white/40 mb-1">Dimensión dominante</p>
                    <p className="text-lg font-bold font-poppins" style={{ color: archetype.color }}>
                      {SCORE_LABELS[dominantKey]}
                    </p>
                    <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
                      {lastScore!.music_score[dominantKey]}
                      <span className="text-sm text-white/30">/100</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center space-y-3">
              <p className="text-white/40 text-sm">Aún no tienes un Arquetipo Musical.</p>
              <Link
                href="/ia/perfil"
                className="inline-block bg-[#ff7a00] hover:bg-[#ff9a3c] text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Descubrir mi Arquetipo →
              </Link>
            </div>
          )}

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3">
            <MetricChip label="Journeys completados" value={metrics.total} />
            <MetricChip label="CTA clicks" value={metrics.ctaClicks} />
            <MetricChip label="Herramienta favorita" value={FAVORITE_LABEL} />
          </div>

          {/* Últimos resultados */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Últimos resultados</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <LastCard label="Perfil Musical"    journey={lastPerfil}  href="/ia/perfil"  />
              <MusicScoreCard                      journey={lastScore}                       />
              <LastCard label="Sueño Musical"     journey={lastSueno}   href="/ia/sueno"   />
              <LastCard label="Carrera Proyectada" journey={lastCarrera} href="/ia/carrera" />
            </div>
          </section>

          {/* Historial */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">
                Historial ({journeys.length})
              </h2>
              <div className="flex gap-2">
                <Link href="/ia" className="text-xs text-[#ff7a00] hover:text-[#ff9a3c] transition-colors">
                  Explorar herramientas →
                </Link>
              </div>
            </div>

            {journeys.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-white/30 text-sm">No hay journeys registrados aún.</p>
                <Link
                  href="/ia"
                  className="inline-block border border-white/20 hover:border-white/40 text-white/60 hover:text-white text-sm px-5 py-2 rounded-xl transition-colors"
                >
                  Empezar con Music 4U IA
                </Link>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {journeys.map(j => <HistoryCard key={j.id} journey={j} />)}
              </div>
            )}
          </section>

        </div>
      </main>
    </>
  )
}

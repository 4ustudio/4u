'use client'

import type { MusicScore } from '@/lib/ia/scoring'

type Props = {
  score: MusicScore
  animate?: boolean
}

const LABELS: Record<keyof MusicScore, string> = {
  creatividad:    'Creatividad',
  disciplina:     'Disciplina',
  interpretacion: 'Interpretación',
  produccion:     'Producción',
  performance:    'Performance',
}

// Abreviaciones para el radar SVG (espacio limitado)
const RADAR_LABELS: Record<keyof MusicScore, string> = {
  creatividad:    'Creatividad',
  disciplina:     'Disciplina',
  interpretacion: 'Interpret.',
  produccion:     'Producción',
  performance:    'Performance',
}

const COLORS: Record<keyof MusicScore, string> = {
  creatividad:    '#ff7a00',
  disciplina:     '#ff9a3c',
  interpretacion: '#ffb366',
  produccion:     '#ffc980',
  performance:    '#ffd9a0',
}

function getLevel(score: number): string {
  if (score >= 75) return 'Avanzado'
  if (score >= 50) return 'Intermedio'
  if (score >= 30) return 'Básico'
  return 'Inicial'
}

export default function MusicScoreChart({ score, animate = true }: Props) {
  const keys = Object.keys(score) as (keyof MusicScore)[]

  // SVG radar (pentágono) — 5 ejes, 200x200
  const cx = 100
  const cy = 100
  const r  = 75
  const angles = keys.map((_, i) => (Math.PI * 2 * i) / 5 - Math.PI / 2)

  function point(val: number, idx: number) {
    const ratio = val / 100
    return {
      x: cx + r * ratio * Math.cos(angles[idx]),
      y: cy + r * ratio * Math.sin(angles[idx]),
    }
  }

  function axisEnd(idx: number) {
    return {
      x: cx + r * Math.cos(angles[idx]),
      y: cy + r * Math.sin(angles[idx]),
    }
  }

  const dataPoints = keys.map((k, i) => point(score[k], i))
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Círculos de fondo (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <div className="space-y-6">
      {/* Radar */}
      <div className="flex justify-center">
        <svg viewBox="-35 -15 270 235" className="w-52 h-52 sm:w-64 sm:h-64" overflow="visible">
          {/* Grilla */}
          {gridLevels.map(level => {
            const pts = angles.map(a => ({
              x: cx + r * level * Math.cos(a),
              y: cy + r * level * Math.sin(a),
            }))
            return (
              <polygon
                key={level}
                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#ffffff15"
                strokeWidth="1"
              />
            )
          })}

          {/* Ejes */}
          {keys.map((_, i) => {
            const end = axisEnd(i)
            return (
              <line
                key={i}
                x1={cx} y1={cy}
                x2={end.x} y2={end.y}
                stroke="#ffffff15"
                strokeWidth="1"
              />
            )
          })}

          {/* Datos */}
          <polygon
            points={polyPoints}
            fill="#ff7a0030"
            stroke="#ff7a00"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Puntos */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ff7a00" />
          ))}

          {/* Labels */}
          {keys.map((k, i) => {
            const lx = cx + (r + 20) * Math.cos(angles[i])
            const ly = cy + (r + 20) * Math.sin(angles[i])
            return (
              <text
                key={k}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff99"
                fontSize="7.5"
                fontFamily="Poppins, sans-serif"
              >
                {RADAR_LABELS[k]}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Barras */}
      <div className="space-y-3">
        {keys.map(k => (
          <div key={k} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/80 font-medium">{LABELS[k]}</span>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs">{getLevel(score[k])}</span>
                <span className="text-white font-semibold tabular-nums w-8 text-right">{score[k]}</span>
              </div>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${score[k]}%`,
                  background: `linear-gradient(90deg, ${COLORS[k]}, ${COLORS[k]}cc)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

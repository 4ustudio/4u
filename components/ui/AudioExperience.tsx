'use client'

import { useState, useRef, useEffect } from 'react'

const AUDIO_SRC   = '/audio/audio-home.mpeg'
const START_SEC   = 12       // segundo más interesante
const DURATION    = 15       // 15 segundos
const MAX_VOL     = 0.18     // 18%
const FADE_IN_MS  = 1600
const FADE_OUT_MS = 2200

type State = 'idle' | 'playing' | 'done'

export default function AudioExperience() {
  const [state, setState] = useState<State>('idle')
  const [visible, setVisible] = useState(false)
  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const timersRef  = useRef<number[]>([])
  const playedRef  = useRef(false)

  /* ── helpers ──────────────────────────────────────────────────────── */
  function addTimer(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
  }

  function clearAll() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  function fadeVolume(audio: HTMLAudioElement, from: number, to: number, ms: number, done?: () => void) {
    const steps = 32
    const dt = ms / steps
    const dv = (to - from) / steps
    let i = 0
    const tick = () => {
      i++
      audio.volume = Math.max(0, Math.min(1, from + dv * i))
      if (i < steps) addTimer(tick, dt)
      else done?.()
    }
    addTimer(tick, dt)
  }

  /* ── iniciar reproducción ─────────────────────────────────────────── */
  function startAudio() {
    if (playedRef.current) return
    playedRef.current = true

    // Usar <source> con type explícito para forzar MIME audio/mpeg
    // El archivo tiene extensión .mpeg pero es MP3 — Next.js lo sirve como video/mpeg
    const audio = document.createElement('audio')
    audio.preload = 'auto'
    const src = document.createElement('source')
    src.src  = AUDIO_SRC
    src.type = 'audio/mpeg'        // fuerza el MIME correcto
    audio.appendChild(src)
    audioRef.current = audio

    audio.volume = 0
    audio.currentTime = START_SEC

    const onReady = () => {
      audio.currentTime = START_SEC
      audio.play().then(() => {
        setState('playing')
        setVisible(true)

        // Fade in
        fadeVolume(audio, 0, MAX_VOL, FADE_IN_MS)

        // Fade out antes de terminar
        addTimer(() => {
          fadeVolume(audio, MAX_VOL, 0, FADE_OUT_MS, () => {
            audio.pause()
            setState('done')
            addTimer(() => setVisible(false), 1800)
          })
        }, (DURATION - FADE_OUT_MS / 1000) * 1000)

      }).catch(() => {
        playedRef.current = false
      })
    }

    // canplaythrough garantiza que el archivo está listo
    if (audio.readyState >= 3) {
      onReady()
    } else {
      audio.addEventListener('canplaythrough', onReady, { once: true })
      audio.load()
    }
  }

  /* ── detener manualmente ──────────────────────────────────────────── */
  function stop() {
    clearAll()
    if (audioRef.current) audioRef.current.pause()
    setState('done')
    addTimer(() => setVisible(false), 1000)
  }

  /* ── trigger en primera interacción del usuario ───────────────────── */
  useEffect(() => {
    const events = ['scroll', 'click', 'touchstart', 'mousemove', 'keydown'] as const
    const handler = () => {
      startAudio()
      events.forEach(e => window.removeEventListener(e, handler))
    }
    // Escuchar con once:true para que se dispare solo una vez
    events.forEach(e => window.addEventListener(e, handler, { passive: true, once: true }))

    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      clearAll()
      audioRef.current?.pause()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── UI: badge flotante, aparece solo al reproducir ──────────────── */
  if (!visible) return null

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold font-poppins backdrop-blur-md transition-all duration-500 ${
        state === 'playing'
          ? 'border-[#ff7a00]/45 bg-black/50 text-white shadow-lg shadow-orange-500/10'
          : 'border-white/15 bg-black/30 text-white/50'
      }`}
    >
      {state === 'playing' ? (
        <>
          {/* Ecualizador */}
          <span className="flex items-end gap-[2px] h-3.5 w-4 shrink-0">
            {[0, 1, 2, 3].map(i => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-[#ff7a00]"
                style={{
                  height: '100%',
                  animation: 'eq-bar 0.65s ease-in-out infinite alternate',
                  animationDelay: `${i * 0.14}s`,
                  transformOrigin: 'bottom',
                }}
              />
            ))}
          </span>
          <span className="tracking-wide text-[11px]">4U Studio</span>
          <button
            onClick={stop}
            aria-label="Detener audio"
            className="ml-0.5 text-white/35 hover:text-white/70 transition-colors"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </>
      ) : (
        <span className="text-[11px] text-white/40">♪</span>
      )}
    </div>
  )
}

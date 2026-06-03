'use client'

import { useState, useRef, useEffect } from 'react'

const AUDIO_SRC   = '/audio/audio-home.mpeg'
const START_SEC   = 12     // segundo de inicio (parte interesante)
const DURATION    = 15     // segundos totales a reproducir
const MAX_VOL     = 0.18   // 18% de volumen
const FADE_IN_MS  = 1600
const FADE_OUT_MS = 2200

type State = 'idle' | 'playing' | 'done'

export default function AudioExperience() {
  const [state, setState]   = useState<State>('idle')
  const [visible, setVisible] = useState(false)
  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const timersRef  = useRef<number[]>([])
  const playedRef  = useRef(false)
  const blobUrlRef = useRef<string | null>(null)

  /* ─── helpers ─────────────────────────────────────────────────────── */
  function addTimer(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }
  function clearAll() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }
  function fadeVol(audio: HTMLAudioElement, from: number, to: number, ms: number, done?: () => void) {
    const steps = 32, dt = ms / steps, dv = (to - from) / steps
    let i = 0
    const tick = () => {
      i++
      audio.volume = Math.max(0, Math.min(1, from + dv * i))
      if (i < steps) addTimer(tick, dt)
      else done?.()
    }
    addTimer(tick, dt)
  }

  /* ─── reproducir ──────────────────────────────────────────────────── */
  async function startAudio() {
    if (playedRef.current) return
    playedRef.current = true

    try {
      // Fetch + Blob garantiza el MIME correcto independientemente del servidor
      // Esto evita el bug de Content-Type: video/mpeg que bloquea el audio
      const response = await fetch(AUDIO_SRC)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const buffer = await response.arrayBuffer()
      const blob   = new Blob([buffer], { type: 'audio/mpeg' })
      const url    = URL.createObjectURL(blob)
      blobUrlRef.current = url

      const audio = new Audio(url)
      audioRef.current  = audio
      audio.volume      = 0

      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(), { once: true })
        audio.addEventListener('error', reject, { once: true })
        audio.load()
      })

      // Setear currentTime DESPUÉS de que el archivo esté listo
      audio.currentTime = START_SEC

      await audio.play()

      setState('playing')
      setVisible(true)

      // Fade in
      fadeVol(audio, 0, MAX_VOL, FADE_IN_MS)

      // Fade out y stop
      addTimer(() => {
        fadeVol(audio, MAX_VOL, 0, FADE_OUT_MS, () => {
          audio.pause()
          setState('done')
          addTimer(() => setVisible(false), 1800)
        })
      }, (DURATION - FADE_OUT_MS / 1000) * 1000)

    } catch {
      // Fallo silencioso — el audio es experiencia extra, no crítico
      playedRef.current = false
    }
  }

  /* ─── detener ──────────────────────────────────────────────────────── */
  function stop() {
    clearAll()
    audioRef.current?.pause()
    setState('done')
    addTimer(() => setVisible(false), 800)
  }

  /* ─── trigger en primera interacción ──────────────────────────────── */
  useEffect(() => {
    const events = ['scroll', 'click', 'touchstart', 'mousemove', 'keydown'] as const
    const handler = () => {
      startAudio()
      events.forEach(e => window.removeEventListener(e, handler))
    }
    events.forEach(e => window.addEventListener(e, handler, { passive: true, once: true }))

    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      clearAll()
      audioRef.current?.pause()
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── UI ───────────────────────────────────────────────────────────── */
  if (!visible) return null

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-md transition-all duration-500 ${
      state === 'playing'
        ? 'border-[#ff7a00]/45 bg-black/55 text-white shadow-lg shadow-orange-500/10'
        : 'border-white/15 bg-black/30 text-white/40'
    }`}>
      {state === 'playing' ? (
        <>
          {/* Ecualizador animado */}
          <span className="flex items-end gap-[2px] h-3.5 w-4 shrink-0">
            {[0, 1, 2, 3].map(i => (
              <span key={i} className="w-[3px] rounded-full bg-[#ff7a00]"
                style={{
                  height: '100%',
                  animation: 'eq-bar 0.65s ease-in-out infinite alternate',
                  animationDelay: `${i * 0.14}s`,
                  transformOrigin: 'bottom',
                }}
              />
            ))}
          </span>
          <span className="text-[11px] font-semibold font-poppins tracking-wide select-none">4U Studio</span>
          <button onClick={stop} aria-label="Detener audio"
            className="ml-0.5 text-white/35 hover:text-white/70 transition-colors">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </>
      ) : (
        <span className="text-[11px] text-white/30">♪</span>
      )}
    </div>
  )
}

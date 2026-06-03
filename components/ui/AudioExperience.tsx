'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const AUDIO_SRC   = '/audio/audio-home.mpeg'
const START_SEC   = 12    // empezar en el segundo 12 (parte interesante)
const DURATION    = 15    // reproducir 15 segundos
const MAX_VOL     = 0.18  // 18% — volumen máximo
const FADE_IN_MS  = 1400  // duración del fade in
const FADE_OUT_MS = 2000  // duración del fade out (empieza 2s antes del fin)

type State = 'idle' | 'loading' | 'playing' | 'done'

export default function AudioExperience() {
  const [state, setState] = useState<State>('idle')
  const audioRef  = useRef<HTMLAudioElement | null>(null)
  const timersRef = useRef<number[]>([])
  const frameRef  = useRef<number>(0)

  // Limpieza al desmontar
  useEffect(() => () => {
    clearAll()
    audioRef.current?.pause()
  }, [])

  function clearAll() {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    cancelAnimationFrame(frameRef.current)
  }

  function addTimer(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  // Fade volume suave usando rAF-like con setInterval
  function fadeVolume(audio: HTMLAudioElement, from: number, to: number, durationMs: number, onDone?: () => void) {
    const steps = 30
    const dt = durationMs / steps
    const delta = (to - from) / steps
    let i = 0
    const tick = () => {
      i++
      const vol = Math.max(0, Math.min(1, from + delta * i))
      if (audioRef.current) audioRef.current.volume = vol
      if (i < steps) {
        addTimer(tick, dt)
      } else {
        onDone?.()
      }
    }
    addTimer(tick, dt)
  }

  const toggle = useCallback(() => {
    if (state === 'playing' || state === 'loading') {
      // Detener
      clearAll()
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = START_SEC }
      setState('idle')
      return
    }

    setState('loading')

    if (!audioRef.current) {
      audioRef.current = new Audio(AUDIO_SRC)
    }

    const audio = audioRef.current
    audio.volume = 0
    audio.currentTime = START_SEC

    const startPlayback = () => {
      setState('playing')

      // Fade in: 0 → MAX_VOL
      fadeVolume(audio, 0, MAX_VOL, FADE_IN_MS)

      // Fade out: empieza 2s antes del fin
      addTimer(() => {
        fadeVolume(audio, MAX_VOL, 0, FADE_OUT_MS, () => {
          audio.pause()
          setState('done')
          addTimer(() => setState('idle'), 1500)
        })
      }, (DURATION - FADE_OUT_MS / 1000) * 1000)
    }

    audio.play()
      .then(startPlayback)
      .catch(() => setState('idle'))
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = state === 'playing' || state === 'loading'

  return (
    <button
      onClick={toggle}
      aria-label={isActive ? 'Detener audio' : 'Escucha la experiencia 4U Studio'}
      className={`group relative flex items-center gap-2.5 rounded-full border px-5 py-3 text-sm font-semibold font-poppins transition-all duration-300 select-none ${
        isActive
          ? 'border-[#ff7a00]/60 bg-[#ff7a00]/15 text-white backdrop-blur-md shadow-lg shadow-orange-500/20'
          : state === 'done'
            ? 'border-white/30 bg-white/10 text-white/70 backdrop-blur-md'
            : 'border-white/20 bg-black/35 text-white/85 hover:border-[#ff7a00]/50 hover:bg-black/50 hover:text-white backdrop-blur-md'
      }`}
    >
      {/* Anillo pulsante cuando está reproduciendo */}
      {state === 'playing' && (
        <span className="absolute inset-0 rounded-full border border-[#ff7a00]/40 animate-ping pointer-events-none"/>
      )}

      {/* Ícono */}
      <span className="flex-shrink-0 relative">
        {state === 'loading' ? (
          <svg className="h-4 w-4 animate-spin text-[#ff7a00]" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        ) : state === 'playing' ? (
          /* Ecualizador animado */
          <span className="flex items-end gap-[2px] h-4 w-5">
            {[0, 1, 2, 3].map(i => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-[#ff7a00]"
                style={{
                  height: '100%',
                  animation: `eq-bar 0.7s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.15}s`,
                  transformOrigin: 'bottom',
                }}
              />
            ))}
          </span>
        ) : state === 'done' ? (
          <svg className="h-4 w-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/>
          </svg>
        ) : (
          <svg className="h-4 w-4 text-[#ff7a00]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14l11-7-11-7z"/>
          </svg>
        )}
      </span>

      {/* Texto */}
      <span className="whitespace-nowrap">
        {state === 'loading' && 'Cargando...'}
        {state === 'playing' && 'Reproduciendo · click para detener'}
        {state === 'done'    && '✓ Gracias por escuchar'}
        {state === 'idle'    && 'Escucha la experiencia 4U'}
      </span>
    </button>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'

const AUDIO_SRC   = '/audio/audio-home.mpeg'
const START_SEC   = 12
const DURATION    = 15
const MAX_VOL     = 0.18
const FADE_IN_MS  = 1400
const FADE_OUT_MS = 2000

type State = 'idle' | 'playing' | 'done'

export default function AudioExperience() {
  const [state, setState] = useState<State>('idle')
  const audioRef  = useRef<HTMLAudioElement | null>(null)
  const timersRef = useRef<number[]>([])

  function addTimer(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
  }
  function clearAll() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }
  function fadeVol(audio: HTMLAudioElement, from: number, to: number, ms: number, onDone?: () => void) {
    const steps = 28, dt = ms / steps, dv = (to - from) / steps
    let i = 0
    const tick = () => {
      i++
      audio.volume = Math.max(0, Math.min(1, from + dv * i))
      if (i < steps) addTimer(tick, dt)
      else onDone?.()
    }
    addTimer(tick, dt)
  }

  useEffect(() => () => { clearAll(); audioRef.current?.pause() }, [])

  // ÚNICO punto de entrada: click directo → Safari/Firefox lo permiten
  function handleClick() {
    if (state === 'playing') {
      clearAll()
      audioRef.current?.pause()
      setState('idle')
      return
    }
    if (state !== 'idle') return

    // Crear y reproducir en el mismo stack síncrono del click
    const audio = new Audio(AUDIO_SRC)
    audio.volume = 0
    audioRef.current = audio

    // play() SÍNCRONO dentro del event handler — único método garantizado
    audio.play().then(() => {
      setState('playing')

      // Seek al segundo interesante cuando haya metadata
      const doSeek = () => { audio.currentTime = START_SEC }
      audio.readyState >= 1 ? doSeek() : audio.addEventListener('loadedmetadata', doSeek, { once: true })

      // Fade in
      fadeVol(audio, 0, MAX_VOL, FADE_IN_MS)

      // Fade out + stop
      addTimer(() => {
        fadeVol(audio, MAX_VOL, 0, FADE_OUT_MS, () => {
          audio.pause()
          setState('done')
          addTimer(() => setState('idle'), 2000)
        })
      }, (DURATION - FADE_OUT_MS / 1000) * 1000)

    }).catch(() => setState('idle'))
  }

  /* ── UI ─────────────────────────────────────────────────────────── */
  if (state === 'idle') {
    return (
      <button
        onClick={handleClick}
        className="group flex items-center gap-2.5 rounded-full border border-white/20 bg-black/30 px-5 py-2.5 text-sm font-semibold font-poppins text-white/80 backdrop-blur-md transition-all duration-200 hover:border-[#ff7a00]/50 hover:bg-black/50 hover:text-white active:scale-95"
        aria-label="Escucha la experiencia 4U Studio"
      >
        <svg className="h-4 w-4 text-[#ff7a00] transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.14v14l11-7-11-7z"/>
        </svg>
        <span>Escucha 4U Studio</span>
      </button>
    )
  }

  if (state === 'playing') {
    return (
      <button
        onClick={handleClick}
        className="relative flex items-center gap-2.5 rounded-full border border-[#ff7a00]/50 bg-black/50 px-5 py-2.5 text-sm font-semibold font-poppins text-white backdrop-blur-md shadow-lg shadow-orange-500/15 transition-all duration-200 active:scale-95"
        aria-label="Detener audio"
      >
        {/* Anillo pulsante */}
        <span className="absolute inset-0 rounded-full border border-[#ff7a00]/25 animate-ping pointer-events-none"/>

        {/* Ecualizador */}
        <span className="flex items-end gap-[2px] h-4 w-5 shrink-0">
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
        <span>Reproduciendo</span>
        <svg className="h-3.5 w-3.5 text-white/50 hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    )
  }

  // 'done' — fade out antes de volver a idle
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2.5 rounded-full border border-white/15 bg-black/20 px-5 py-2.5 text-sm font-semibold font-poppins text-white/40 backdrop-blur-md transition-all duration-200"
    >
      <svg className="h-4 w-4 text-[#ff7a00]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/>
      </svg>
      <span>Gracias por escuchar</span>
    </button>
  )
}

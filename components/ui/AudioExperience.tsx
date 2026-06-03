'use client'

import { useState, useRef, useEffect } from 'react'

const AUDIO_SRC   = '/audio/audio-home.mpeg'
const START_SEC   = 12     // segundo de inicio
const DURATION    = 15     // segundos a reproducir
const MAX_VOL     = 0.18   // 18%
const FADE_IN_MS  = 1500
const FADE_OUT_MS = 2200

type State = 'idle' | 'playing' | 'done'

export default function AudioExperience() {
  const [state, setState]     = useState<State>('idle')
  const [visible, setVisible] = useState(false)
  const audioRef  = useRef<HTMLAudioElement | null>(null)
  const timersRef = useRef<number[]>([])
  const playedRef = useRef(false)

  /* ─── helpers ─────────────────────────────────────────────────────── */
  function addTimer(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
  }
  function clearAll() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }
  function fadeVol(audio: HTMLAudioElement, from: number, to: number, ms: number, onDone?: () => void) {
    const steps = 30, dt = ms / steps, dv = (to - from) / steps
    let i = 0
    const tick = () => {
      i++
      audio.volume = Math.max(0, Math.min(1, from + dv * i))
      if (i < steps) addTimer(tick, dt)
      else onDone?.()
    }
    addTimer(tick, dt)
  }

  /* ─── lógica de fade + stop automático ───────────────────────────── */
  function startFades(audio: HTMLAudioElement) {
    setState('playing')
    setVisible(true)
    fadeVol(audio, 0, MAX_VOL, FADE_IN_MS)
    addTimer(() => {
      fadeVol(audio, MAX_VOL, 0, FADE_OUT_MS, () => {
        audio.pause()
        setState('done')
        addTimer(() => setVisible(false), 1800)
      })
    }, (DURATION - FADE_OUT_MS / 1000) * 1000)
  }

  /* ─── reproducir ──────────────────────────────────────────────────── */
  function startAudio() {
    if (playedRef.current) return
    playedRef.current = true

    // IMPORTANTE: new Audio() + play() deben estar en el stack síncrono
    // del gesto del usuario para que Safari/iOS los permita.
    // El header Content-Type: audio/mpeg en next.config.mjs garantiza que
    // el servidor sirve el archivo con el MIME correcto.
    const audio = new Audio(AUDIO_SRC)
    audio.volume = 0
    audioRef.current = audio

    // play() síncrono dentro del gesto — Safari requiere esto
    const promise = audio.play()

    if (promise !== undefined) {
      promise
        .then(() => {
          // Audio corriendo (puede estar buffering), buscar al segundo 12
          // cuando el metadata esté disponible
          const seek = () => {
            audio.currentTime = START_SEC
            startFades(audio)
          }
          if (audio.readyState >= 1) {
            seek()
          } else {
            audio.addEventListener('loadedmetadata', seek, { once: true })
          }
        })
        .catch(() => {
          // Bloqueado (política del navegador o archivo no encontrado)
          playedRef.current = false
        })
    }
  }

  /* ─── detener manualmente ─────────────────────────────────────────── */
  function stop() {
    clearAll()
    audioRef.current?.pause()
    setState('done')
    addTimer(() => setVisible(false), 800)
  }

  /* ─── trigger en primera interacción ──────────────────────────────── */
  useEffect(() => {
    const EVENTS = ['scroll', 'click', 'touchstart', 'keydown'] as const

    // Handler síncrono: startAudio() debe correr en el mismo call stack
    // que el evento del usuario — no puede ser async ni tener await antes
    function handler() {
      startAudio()
      EVENTS.forEach(e => window.removeEventListener(e, handler))
    }

    EVENTS.forEach(e => window.addEventListener(e, handler, { passive: true, once: true }))

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, handler))
      clearAll()
      audioRef.current?.pause()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── UI: badge flotante ─────────────────────────────────────────── */
  if (!visible) return null

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-md transition-all duration-500 ${
      state === 'playing'
        ? 'border-[#ff7a00]/45 bg-black/55 text-white shadow-lg shadow-orange-500/10'
        : 'border-white/15 bg-black/30 text-white/40'
    }`}>
      {state === 'playing' ? (
        <>
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
          <span className="text-[11px] font-semibold font-poppins tracking-wide select-none">
            4U Studio
          </span>
          <button onClick={stop} aria-label="Detener audio"
            className="ml-0.5 text-white/35 hover:text-white/70 transition-colors">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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

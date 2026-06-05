'use client'

import { useState } from 'react'
import QuizStep from './QuizStep'
import ResultCard from './ResultCard'
import { calcProfileScore, type ProfileAnswers } from '@/lib/ia/scoring'
import { getProfile } from '@/lib/ia/profiles'
import { getRecommendedCourses, getRecommendedPlan } from '@/lib/ia/recommendations'
import { trackEvent, saveJourney } from '@/lib/ia/events'

const STEPS = [
  {
    key: 'level',
    question: '¿Cuál es tu nivel musical actual?',
    options: [
      { value: 'none',         label: 'Nunca he tocado',          emoji: '🌱' },
      { value: 'beginner',     label: 'Soy principiante',         emoji: '🎯' },
      { value: 'intermediate', label: 'Toco hace algún tiempo',   emoji: '🎸' },
      { value: 'advanced',     label: 'Tengo nivel avanzado',     emoji: '🌟' },
    ],
  },
  {
    key: 'genres',
    question: '¿Qué géneros te mueven más? (máx. 2)',
    multi: true,
    options: [
      { value: 'rock',      label: 'Rock',        emoji: '🎸' },
      { value: 'pop',       label: 'Pop',         emoji: '🎤' },
      { value: 'jazz',      label: 'Jazz',        emoji: '🎷' },
      { value: 'urbano',    label: 'Urbano',      emoji: '🎧' },
      { value: 'clasico',   label: 'Clásico',     emoji: '🎼' },
      { value: 'electronica', label: 'Electrónica', emoji: '🎛️' },
    ],
  },
  {
    key: 'goal',
    question: '¿Qué te imaginas haciendo con la música?',
    options: [
      { value: 'pleasure', label: 'Tocar por placer',        emoji: '😊' },
      { value: 'perform',  label: 'Actuar en vivo',          emoji: '🎤' },
      { value: 'record',   label: 'Grabar y producir',       emoji: '🎚️' },
      { value: 'teach',    label: 'Enseñar música',          emoji: '📚' },
    ],
  },
  {
    key: 'hours',
    question: '¿Cuánto tiempo puedes dedicarle por semana?',
    options: [
      { value: '1-2', label: '1 a 2 horas',      emoji: '⏱️' },
      { value: '3-5', label: '3 a 5 horas',      emoji: '⏰' },
      { value: '6-10', label: '6 a 10 horas',    emoji: '🕐' },
      { value: '10+', label: 'Más de 10 horas',  emoji: '🔥' },
    ],
  },
  {
    key: 'instrument',
    question: '¿Qué instrumento o área te interesa?',
    options: [
      { value: 'guitar',     label: 'Guitarra',          emoji: '🎸' },
      { value: 'piano',      label: 'Piano / Teclado',   emoji: '🎹' },
      { value: 'voice',      label: 'Canto / Voz',       emoji: '🎤' },
      { value: 'drums',      label: 'Batería',           emoji: '🥁' },
      { value: 'production', label: 'Producción Musical',emoji: '🎛️' },
      { value: 'bass',       label: 'Bajo',              emoji: '🎸' },
    ],
  },
]

type Answers = Partial<ProfileAnswers & { genres: string[] }>

export default function ProfileQuiz() {
  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [result, setResult]   = useState<ReturnType<typeof buildResult> | null>(null)
  const [started, setStarted] = useState(false)

  function buildResult(ans: Answers) {
    const profileAnswers: ProfileAnswers = {
      level:      ans.level ?? 'none',
      genres:     ans.genres ?? [],
      goal:       ans.goal ?? 'pleasure',
      hours:      ans.hours ?? '1-2',
      instrument: ans.instrument ?? 'guitar',
    }
    const score    = calcProfileScore(profileAnswers)
    const profile  = getProfile(score)
    const courses  = getRecommendedCourses(score)
    const plan     = getRecommendedPlan(score)
    return { score, profile, courses, plan, profileAnswers }
  }

  async function handleStart() {
    setStarted(true)
    await trackEvent('journey_started', 'perfil')
  }

  function handleChange(key: string, val: string | string[]) {
    setAnswers(prev => ({ ...prev, [key]: val }))
  }

  async function handleNext() {
    const current = STEPS[step]
    const val = answers[current.key as keyof Answers]
    if (!val || (Array.isArray(val) && val.length === 0)) return

    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      const res = buildResult(answers)
      setResult(res)
      const journeyId = await saveJourney({
        feature:             'perfil',
        input_data:          answers as Record<string, unknown>,
        result_data:         { profile_id: res.profile.id, plan: res.plan.name },
        music_score:         res.score,
        career_type:         res.profile.id,
        recommended_courses: res.courses.map(c => c.name),
      })
      await trackEvent('journey_completed', 'perfil', journeyId ?? undefined, { profile: res.profile.id })
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1)
  }

  const currentStep = STEPS[step]
  const currentVal  = answers[currentStep?.key as keyof Answers] ?? (currentStep?.multi ? [] : '')
  const hasValue    = Array.isArray(currentVal) ? currentVal.length > 0 : !!currentVal

  if (!started) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="text-5xl">🎵</div>
        <h2 className="text-2xl font-bold text-white font-poppins">Descubre tu perfil musical</h2>
        <p className="text-white/60 max-w-sm mx-auto text-sm leading-relaxed">
          5 preguntas. Menos de 3 minutos. Obtén tu Music Score personalizado y descubre qué tipo de músico eres.
        </p>
        <button
          onClick={handleStart}
          className="bg-[#ff7a00] hover:bg-[#ff9a3c] text-white font-semibold py-3 px-8 rounded-xl transition-colors"
        >
          Comenzar ahora
        </button>
      </div>
    )
  }

  if (result) {
    return (
      <ResultCard
        badge="Tu perfil musical"
        title={result.profile.name}
        tagline={result.profile.tagline}
        description={result.profile.description}
        bullets={result.profile.strengths}
        score={result.score}
        ctas={[
          {
            label: 'Ver mi plan recomendado',
            href:  result.plan.href,
            primary: true,
          },
          {
            label: 'Agendar clase gratis',
            href:  '/agendar',
          },
        ]}
      />
    )
  }

  return (
    <div className="space-y-8">
      <QuizStep
        step={step + 1}
        total={STEPS.length}
        question={currentStep.question}
        options={currentStep.options}
        value={currentVal as string | string[]}
        multi={currentStep.multi}
        onChange={val => handleChange(currentStep.key, val)}
      />

      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={handleBack}
            className="flex-1 border border-white/20 text-white/70 hover:text-white hover:border-white/40 py-3 rounded-xl transition-colors text-sm font-medium"
          >
            Anterior
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!hasValue}
          className="flex-1 bg-[#ff7a00] hover:bg-[#ff9a3c] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {step === STEPS.length - 1 ? 'Ver mi perfil' : 'Siguiente'}
        </button>
      </div>
    </div>
  )
}

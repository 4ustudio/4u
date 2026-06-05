'use client'

type Option = {
  value: string
  label: string
  emoji?: string
}

type Props = {
  step:        number
  total:       number
  question:    string
  options:     Option[]
  value:       string | string[]
  multi?:      boolean
  onChange:    (val: string | string[]) => void
}

export default function QuizStep({ step, total, question, options, value, multi, onChange }: Props) {
  function handleSelect(v: string) {
    if (!multi) {
      onChange(v)
      return
    }
    const arr = Array.isArray(value) ? value : []
    if (arr.includes(v)) {
      onChange(arr.filter(x => x !== v))
    } else if (arr.length < 2) {
      onChange([...arr, v])
    }
  }

  function isSelected(v: string) {
    if (Array.isArray(value)) return value.includes(v)
    return value === v
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[#ff7a00] text-sm font-semibold">{step} / {total}</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ff7a00] rounded-full transition-all duration-300"
              style={{ width: `${(step / total) * 100}%` }}
            />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-poppins">{question}</h2>
        {multi && <p className="text-white/50 text-sm">Elige hasta 2 opciones</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`
              flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200
              ${isSelected(opt.value)
                ? 'border-[#ff7a00] bg-[#ff7a00]/10 text-white'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            {opt.emoji && <span className="text-xl shrink-0">{opt.emoji}</span>}
            <span className="text-sm font-medium">{opt.label}</span>
            {isSelected(opt.value) && (
              <span className="ml-auto text-[#ff7a00] shrink-0">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

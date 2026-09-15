'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MdExpandMore } from 'react-icons/md'

export default function PopupSelect({
  value, onChange, options, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/30 text-left"
      >
        <span className={`truncate ${selected ? '' : 'text-white/30'}`}>{selected?.label ?? placeholder}</span>
        <MdExpandMore className="h-4 w-4 text-white/30 shrink-0" aria-hidden="true" />
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={ev => ev.stopPropagation()}
            className="w-full max-w-xs max-h-[70vh] overflow-y-auto rounded-2xl bg-[#141414] border border-white/10 py-2 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              {placeholder}
            </button>
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  o.value === value ? 'text-orange-400 bg-orange-500/10' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

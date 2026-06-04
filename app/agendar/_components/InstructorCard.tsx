'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

interface Props {
  id: string
  name: string
  role: string
  bio: string
  specialties: string[]
  photo?: string | null
}

export default function InstructorCard({ name, role, bio, specialties, photo }: Props) {
  const [open, setOpen] = useState(false)

  // Texto corto para la card (primera oración)
  const shortBio = bio.split(/\.\s/)[0] + '.'

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden shadow-xl shadow-black/40">

        {/* Foto */}
        {photo && (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={photo}
              alt={name}
              fill
              className="object-cover object-top"
              sizes="340px"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, #141414 10%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}
            />
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/15 px-2.5 py-1 text-[11px] font-bold text-green-400 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Disponible
            </span>
          </div>
        )}

        {/* Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-poppins font-extrabold text-white text-base leading-tight">{name}</h3>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#ff7a00' }}>{role}</p>
          </div>

          <p className="text-xs text-white/50 font-roboto leading-relaxed line-clamp-2">{shortBio}</p>

          <button
            onClick={() => setOpen(true)}
            className="text-[11px] font-semibold underline underline-offset-2 transition-colors"
            style={{ color: 'rgba(255,122,0,0.75)' }}
          >
            Ver perfil completo →
          </button>

          {/* Chips especialidades */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {specialties.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: 'rgba(255,122,0,0.12)', border: '1px solid rgba(255,122,0,0.22)', color: '#ff7a00' }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Modal bio completa */}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#141414', border: '1px solid rgba(255,122,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con foto */}
            {photo && (
              <div className="relative h-52 overflow-hidden">
                <Image src={photo} alt={name} fill className="object-cover object-top" sizes="512px" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #141414 5%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center bg-black/50 text-white/70 hover:text-white transition-colors backdrop-blur-sm"
                  aria-label="Cerrar"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Contenido */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="font-poppins font-extrabold text-white text-xl leading-tight">{name}</h2>
                <p className="text-sm font-semibold mt-1" style={{ color: '#ff7a00' }}>{role}</p>
              </div>

              <p className="text-sm text-white/65 font-roboto leading-relaxed">{bio}</p>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,122,0,0.12)', border: '1px solid rgba(255,122,0,0.25)', color: '#ff7a00' }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Disponible esta semana
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

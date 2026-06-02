'use client'

import { useState, useRef, useActionState, useTransition } from 'react'
import Image from 'next/image'
import { updateProfileAction, uploadAvatarAction } from '../../_actions/student'

interface Props {
  firstName:  string
  lastName:   string
  email:      string
  avatarUrl?: string | null
  userId:     string
}

const inputClass =
  'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/40 font-roboto focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/60 focus:border-[#ff7a00]/40 transition-all disabled:opacity-50'

export default function ProfileModal({ firstName, lastName, email, avatarUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(avatarUrl ?? null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [state, action] = useActionState(updateProfileAction, {})

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || email?.[0]?.toUpperCase() || 'U'

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    // Preview local inmediato
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await uploadAvatarAction(fd)
      if (result.error) {
        setUploadError(result.error)
        setPreview(avatarUrl ?? null)
      } else if (result.url) {
        setUploadedUrl(result.url)
      }
    } catch {
      setUploadError('Error al subir la imagen. Intenta de nuevo.')
      setPreview(avatarUrl ?? null)
    } finally {
      setUploading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 text-xs text-white/40 hover:text-white/70 transition-colors font-roboto border border-white/10 hover:border-white/20 rounded-xl px-3 py-2"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        Editar perfil
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white font-poppins">Editar perfil</h2>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {preview ? (
              <Image
                src={preview}
                alt="Avatar"
                width={72}
                height={72}
                unoptimized
                className="h-[72px] w-[72px] rounded-full object-cover border-2 border-[#ff7a00]/40"
              />
            ) : (
              <div className="h-[72px] w-[72px] rounded-full flex items-center justify-center text-xl font-bold text-white border-2 border-[#ff7a00]/40"
                style={{ backgroundColor: '#ff7a00' }}>
                {initials}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <svg className="h-5 w-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                </svg>
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs font-semibold text-[#ff7a00] hover:text-[#ff9933] transition-colors font-poppins disabled:opacity-50"
            >
              {uploading ? 'Subiendo…' : 'Cambiar foto'}
            </button>
            <p className="text-[10px] text-white/30 font-roboto mt-0.5">JPG, PNG o WebP · máx 2MB</p>
            {uploadError && (
              <p className="text-[10px] text-red-400 font-roboto mt-1">{uploadError}</p>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Formulario */}
        <form
          action={(fd) => {
            if (uploadedUrl) fd.set('avatar_url', uploadedUrl)
            startTransition(() => action(fd))
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/60 mb-1.5 font-roboto uppercase tracking-wider">Nombre *</label>
              <input name="first_name" defaultValue={firstName} required disabled={isPending} className={inputClass} placeholder="Nombre" />
            </div>
            <div>
              <label className="block text-[10px] text-white/60 mb-1.5 font-roboto uppercase tracking-wider">Apellido</label>
              <input name="last_name" defaultValue={lastName} disabled={isPending} className={inputClass} placeholder="Apellido" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-white/60 mb-1.5 font-roboto uppercase tracking-wider">Email</label>
            <input value={email} disabled className={inputClass + ' opacity-40 cursor-not-allowed'} />
          </div>

          {state.error && (
            <p className="text-red-400 text-xs font-roboto bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{state.error}</p>
          )}
          {state.success && (
            <p className="text-green-400 text-xs font-roboto bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">✓ Perfil actualizado correctamente</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 border border-zinc-600 text-white/70 hover:text-white hover:border-zinc-500 bg-zinc-800 rounded-xl py-2.5 text-sm font-poppins transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || uploading}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white font-poppins transition-all disabled:opacity-50 hover:brightness-110"
              style={{ backgroundColor: '#ff7a00' }}
            >
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

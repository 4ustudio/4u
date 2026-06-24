'use client'

import { useActionState, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signPortalContract, type ContractSignState } from '../../_actions/contractSign'
import SignatureCanvas, { type SignatureCanvasHandle } from '@/app/inscripcion/_components/SignatureCanvas'

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/40 transition-all'
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1'

const initial: ContractSignState = { status: 'idle' }

export default function ContractSignSection() {
  const router = useRouter()
  const [state, action, isPending] = useActionState(signPortalContract, initial)
  const [sigError, setSigError] = useState<string | null>(null)
  const signatureRef = useRef<SignatureCanvasHandle>(null)

  if (state.status === 'success') {
    router.refresh()
    return null
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSigError(null)

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setSigError('La firma digital es obligatoria. Firma en el recuadro.')
      return
    }

    const fd = new FormData(e.currentTarget)
    fd.append('signature_png', signatureRef.current.toDataURL())
    action(fd)
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 mt-0.5">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M9 15l2 2 4-4"/>
          </svg>
        </span>
        <div>
          <h2 className="font-poppins text-base font-extrabold text-amber-900">Firma tu contrato</h2>
          <p className="text-sm text-amber-700 mt-0.5">
            Formaliza tu matrícula firmando digitalmente tu contrato con 4U Studio Academy.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="portal_id_doc" className={labelClass}>
              Documento de identidad <span className="text-red-500">*</span>
            </label>
            <input
              id="portal_id_doc"
              name="id_document"
              type="text"
              placeholder="Ej: 1234567890"
              required
              autoComplete="off"
              disabled={isPending}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="portal_city" className={labelClass}>
              Ciudad <span className="text-red-500">*</span>
            </label>
            <input
              id="portal_city"
              name="city"
              type="text"
              placeholder="Ej: Bogotá"
              required
              autoComplete="address-level2"
              disabled={isPending}
              className={inputClass}
            />
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-white/60 p-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Al firmar confirmas que has leído y aceptas los{' '}
            <Link href="/terminos" target="_blank" rel="noopener noreferrer" className="text-[#ff7a00] underline underline-offset-2">
              Términos y Condiciones
            </Link>{' '}
            de 4U Studio Academy (Ley 527 de 1999).
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelClass + ' mb-0'}>
              Firma digital <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => { signatureRef.current?.clear(); setSigError(null) }}
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Limpiar
            </button>
          </div>
          <div className="rounded-lg overflow-hidden border border-amber-200">
            <SignatureCanvas ref={signatureRef} disabled={isPending} penColor="#000000" />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Usa el mouse o el dedo para firmar.</p>
        </div>

        {(sigError || (state.status === 'error' && state.message)) && (
          <p className="text-sm text-red-600 font-medium">{sigError ?? state.message}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-[#ff7a00] px-6 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
              </svg>
              Firmando contrato…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="9"/>
              </svg>
              Firmar y guardar contrato
            </>
          )}
        </button>
      </form>
    </section>
  )
}

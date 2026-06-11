'use client'

import { useState, useTransition } from 'react'
import { generateBoldCheckout } from '../_actions'
import type { PaymentStatus } from '../_actions'

interface Props {
  paymentId: string
  status: PaymentStatus
  existingUrl?: string | null
}

export default function BoldCheckoutButton({ paymentId, status, existingUrl }: Props) {
  const [pending, startTransition] = useTransition()
  const [url, setUrl]              = useState<string | null>(existingUrl ?? null)
  const [error, setError]          = useState<string | null>(null)
  const [copied, setCopied]        = useState(false)

  if (status === 'paid' || status === 'voided') return null

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const res = await generateBoldCheckout(paymentId)
      if (res.error) { setError(res.error); return }
      setUrl(res.url)
    })
  }

  async function handleCopy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1">
      {!url ? (
        <button
          onClick={handleGenerate}
          disabled={pending}
          className="text-xs px-3 py-1.5 rounded border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50"
        >
          {pending ? 'Generando...' : 'Generar link Bold'}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-400 underline truncate max-w-[180px]"
            title={url}
          >
            Ver link Bold
          </a>
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 rounded border border-zinc-600 text-zinc-300 hover:border-orange-500 hover:text-orange-400 transition-colors"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

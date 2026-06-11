'use client'

import { useState, useEffect, useRef } from 'react'
import { buildWhatsAppUrl, buildWhatsAppMessage, TEMPLATE_LABEL } from '@/lib/whatsapp'
import { logWhatsAppOpened } from '@/app/admin/_actions/whatsapp'
import type { WhatsAppTemplate, WhatsAppVars } from '@/lib/whatsapp'
import type { ActivityAction } from '@/lib/activity'

// ── Icono WhatsApp ────────────────────────────────────────────────

function WaIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.524 5.84L.057 23.887a.5.5 0 0 0 .606.637l6.198-1.63A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.6-.5-5.1-1.37l-.364-.214-3.77.992.953-3.686-.233-.38A10 10 0 1 1 12 22z"/>
    </svg>
  )
}

// ── Tipos ─────────────────────────────────────────────────────────

export interface WhatsAppButtonProps {
  phone:           string
  template:        WhatsAppTemplate
  vars:            WhatsAppVars
  entityType:      'student' | 'lead' | 'payment' | 'retention'
  entityId:        string
  /** Label del botón. Si no se pasa, muestra solo el ícono. */
  label?:          string
  /** 'icon': solo ícono | 'pill': label compacto | 'full': con preview */
  variant?:        'icon' | 'pill' | 'full'
  /** Acción específica de log (overrides whatsapp.opened) */
  logAction?:      ActivityAction
}

// ── Componente ────────────────────────────────────────────────────

export default function WhatsAppButton({
  phone,
  template,
  vars,
  entityType,
  entityId,
  label,
  variant = 'pill',
  logAction,
}: WhatsAppButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const message = buildWhatsAppMessage(template, vars)
  const url     = buildWhatsAppUrl(phone, message)
  const hasPhone = phone?.trim().length > 0

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleOpen() {
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
    // fire-and-forget
    logWhatsAppOpened({
      entity_type:  entityType,
      entity_id:    entityId,
      contact_name: vars.name ?? '—',
      template,
      action:       logAction,
    })
  }

  if (!hasPhone) {
    return (
      <span
        title="Sin teléfono registrado"
        className="inline-flex items-center gap-1 text-white/20 cursor-not-allowed"
      >
        <WaIcon />
        {label && variant !== 'icon' && <span className="text-xs">{label}</span>}
      </span>
    )
  }

  // ── Variante ícono (sin popover, acción directa) ───────────────
  if (variant === 'icon') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => logWhatsAppOpened({ entity_type: entityType, entity_id: entityId, contact_name: vars.name ?? '—', template, action: logAction })}
        title={`WhatsApp: ${vars.name ?? ''}`}
        className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
      >
        <WaIcon className="h-4 w-4" />
      </a>
    )
  }

  // ── Variante pill / full (con popover de preview) ─────────────
  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={[
          'inline-flex items-center gap-1.5 font-semibold transition-colors rounded-lg border',
          variant === 'full'
            ? 'px-3 py-1.5 text-xs border-green-500/25 text-green-300 hover:bg-green-500/10'
            : 'px-2.5 py-1 text-[11px] border-green-500/20 text-green-400 hover:bg-green-500/8',
        ].join(' ')}
      >
        <WaIcon className="h-3.5 w-3.5 shrink-0" />
        {label ?? TEMPLATE_LABEL[template]}
      </button>

      {open && (
        <div className={[
          'absolute z-50 bg-[#141414] border border-white/12 rounded-xl shadow-2xl',
          'w-72 p-4 space-y-3',
          // Posicionamiento: intenta abrirse arriba primero
          'bottom-full mb-2 left-0',
        ].join(' ')}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-white/30 font-semibold">
              {TEMPLATE_LABEL[template]}
            </p>
            <button onClick={() => setOpen(false)} className="text-white/25 hover:text-white transition-colors">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Preview del mensaje */}
          <div className="bg-[#1a1a1a] rounded-lg p-3 border border-white/6">
            <p className="text-xs text-white/65 leading-relaxed whitespace-pre-line break-words">{message}</p>
          </div>

          <button
            type="button"
            onClick={handleOpen}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-white bg-green-700/80 hover:bg-green-700 rounded-lg transition-colors"
          >
            <WaIcon className="h-4 w-4" />
            Abrir WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}

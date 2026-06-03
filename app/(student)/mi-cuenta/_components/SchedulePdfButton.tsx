'use client'

type PdfSession = {
  scheduled_date?: string
  start_time?: string
  status?: string
  course?: { name?: string | null } | null
  classroom?: { name?: string | null } | null
  instructor?: { name?: string | null } | null
  student?: { name?: string | null } | null
}

interface Props {
  name: string
  roleLabel: string
  monthLabel: string
  sessions: PdfSession[]
}

function esc(v?: string | null) {
  return (v ?? '—').replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c] ?? c))
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:   { label: 'Confirmada',      color: '#166534', bg: '#dcfce7' },
  completed:   { label: 'Completada',      color: '#1e40af', bg: '#dbeafe' },
  pending:     { label: 'Pendiente',       color: '#92400e', bg: '#fef3c7' },
  cancelled:   { label: 'Cancelada',       color: '#991b1b', bg: '#fee2e2' },
  no_show:     { label: 'No asistió',      color: '#991b1b', bg: '#fee2e2' },
  rescheduled: { label: 'Reprogramada',    color: '#6b21a8', bg: '#f3e8ff' },
}

function statusBadge(s?: string) {
  const cfg = STATUS_CONFIG[s ?? ''] ?? { label: 'Programada', color: '#374151', bg: '#f3f4f6' }
  return `<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.03em;background:${cfg.bg};color:${cfg.color}">${cfg.label}</span>`
}

function dateLong(iso?: string) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function SchedulePdfButton({ name, roleLabel, monthLabel, sessions }: Props) {
  function handlePrint() {
    const today = new Date().toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' })
    const totalClasses = sessions.length
    const completed  = sessions.filter(s => s.status === 'completed').length
    const confirmed  = sessions.filter(s => ['confirmed','pending'].includes(s.status ?? '')).length
    const cancelled  = sessions.filter(s => ['cancelled','no_show','rescheduled'].includes(s.status ?? '')).length

    const summaryItems = [
      { label: 'Total', value: totalClasses, color: '#111827' },
      { label: 'Completadas', value: completed,  color: '#1e40af' },
      { label: 'Confirmadas', value: confirmed,  color: '#166534' },
      { label: 'Canceladas',  value: cancelled,  color: '#991b1b' },
    ]

    const summaryHtml = summaryItems.map(it => `
      <div style="text-align:center;padding:12px 16px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb">
        <div style="font-size:22px;font-weight:800;color:${it.color};font-family:'Segoe UI',Arial,sans-serif">${it.value}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:.05em">${it.label}</div>
      </div>`).join('')

    const rows = sessions.length
      ? sessions.map((s, i) => {
          const isEven = i % 2 === 0
          const dateStr = capitalize(dateLong(s.scheduled_date))
          return `<tr>
            <td style="padding:11px 12px;border-bottom:1px solid #f3f4f6;background:${isEven ? '#fff' : '#fafafa'};color:#111827;font-size:12px">${dateStr}</td>
            <td style="padding:11px 12px;border-bottom:1px solid #f3f4f6;background:${isEven ? '#fff' : '#fafafa'};color:#374151;font-size:12px;font-weight:600">${esc(s.start_time?.slice(0,5))}</td>
            <td style="padding:11px 12px;border-bottom:1px solid #f3f4f6;background:${isEven ? '#fff' : '#fafafa'};color:#111827;font-size:12px;font-weight:600">${esc(s.course?.name)}</td>
            <td style="padding:11px 12px;border-bottom:1px solid #f3f4f6;background:${isEven ? '#fff' : '#fafafa'};color:#6b7280;font-size:12px">${esc(s.instructor?.name ?? s.student?.name)}</td>
            <td style="padding:11px 12px;border-bottom:1px solid #f3f4f6;background:${isEven ? '#fff' : '#fafafa'};color:#6b7280;font-size:12px">${esc(s.classroom?.name)}</td>
            <td style="padding:11px 12px;border-bottom:1px solid #f3f4f6;background:${isEven ? '#fff' : '#fafafa'}">${statusBadge(s.status)}</td>
          </tr>`
        }).join('')
      : `<tr><td colspan="6" style="padding:36px;text-align:center;color:#9ca3af;font-size:13px">No hay clases programadas para este periodo.</td></tr>`

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Horario 4U Studio — ${esc(name)}</title>
  <style>
    @page { size: A4; margin: 16mm 18mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #111827; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div style="border-bottom:3px solid #ff7a00;padding-bottom:18px;margin-bottom:22px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="color:#ff7a00;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px">4U Studio Academy</div>
        <div style="font-size:28px;font-weight:800;color:#111827;letter-spacing:-.01em;line-height:1.1">Horario de clases</div>
        <div style="font-size:14px;color:#6b7280;margin-top:4px;text-transform:capitalize">${esc(monthLabel)}</div>
      </div>
      <div style="text-align:right;font-size:12px;color:#6b7280;line-height:1.8">
        <div><strong style="color:#111827">${esc(name)}</strong></div>
        <div>${esc(roleLabel)}</div>
        <div>Generado el ${today}</div>
      </div>
    </div>
  </div>

  <!-- Resumen -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px">
    ${summaryHtml}
  </div>

  <!-- Tabla -->
  <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
    <thead>
      <tr style="background:#111827">
        <th style="padding:11px 12px;text-align:left;color:#fff;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">Fecha</th>
        <th style="padding:11px 12px;text-align:left;color:#fff;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">Hora</th>
        <th style="padding:11px 12px;text-align:left;color:#fff;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">Clase</th>
        <th style="padding:11px 12px;text-align:left;color:#fff;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">${roleLabel === 'Instructor' ? 'Estudiante' : 'Instructor'}</th>
        <th style="padding:11px 12px;text-align:left;color:#fff;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">Salón</th>
        <th style="padding:11px 12px;text-align:left;color:#fff;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">Estado</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Disclaimer -->
  <div style="margin-top:20px;padding:12px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px">
    <div style="font-size:10px;font-weight:700;color:#92400e;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">Política de asistencia</div>
    <div style="font-size:11px;color:#78350f;line-height:1.5">Las clases a las que no asististe y que no fueron canceladas con al menos <strong>24 horas de anticipación</strong> se contabilizan como clases tomadas y se descuentan de tu plan mensual.</div>
  </div>

  <!-- Footer -->
  <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #e5e7eb">
    <div style="font-size:10px;color:#9ca3af">Horarios en zona horaria America/Bogotá</div>
    <div style="font-size:10px;color:#ff7a00;font-weight:700;letter-spacing:.06em;text-transform:uppercase">4U Studio Academy</div>
  </div>

  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
    if (!win) {
      const a = document.createElement('a')
      a.href = url
      a.download = `horario-4u-${name.replace(/\s+/g, '-').toLowerCase()}.html`
      a.click()
    }
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ff7a00]/35 bg-white px-4 py-2.5 text-sm font-bold text-[#ff7a00] shadow-sm transition-all hover:bg-[#ff7a00] hover:text-white active:scale-95"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <path d="M7 10l5 5 5-5"/>
        <path d="M12 15V3"/>
      </svg>
      Descargar horario PDF
    </button>
  )
}

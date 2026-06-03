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

function clean(value?: string | null) {
  return value ? value.replace(/[<>&]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[char] ?? char)) : '-'
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    no_show: 'No asistió',
    rescheduled: 'Reprogramada',
  }
  return labels[status ?? ''] ?? 'Programada'
}

function dateLabel(iso?: string) {
  if (!iso) return '-'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function SchedulePdfButton({ name, roleLabel, monthLabel, sessions }: Props) {
  function handlePrint() {
    const rows = sessions.length
      ? sessions.map(s => `
        <tr>
          <td>${dateLabel(s.scheduled_date)}</td>
          <td>${clean(s.start_time?.slice(0, 5))}</td>
          <td>${clean(s.course?.name)}</td>
          <td>${clean(s.instructor?.name ?? s.student?.name)}</td>
          <td>${clean(s.classroom?.name)}</td>
          <td>${statusLabel(s.status)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="6" class="empty">No hay clases programadas para este periodo.</td></tr>'

    const html = `<!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Horario 4U Studio - ${clean(name)}</title>
        <style>
          @page { size: A4; margin: 18mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
          .brand { color: #ff7a00; font-weight: 800; letter-spacing: .08em; font-size: 12px; text-transform: uppercase; }
          h1 { margin: 8px 0 4px; font-size: 28px; }
          p { margin: 0; color: #6b7280; }
          .header { border-bottom: 3px solid #ff7a00; padding-bottom: 18px; margin-bottom: 22px; }
          .meta { display: flex; justify-content: space-between; gap: 16px; margin-top: 14px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #111; color: white; padding: 11px 9px; text-align: left; }
          td { border-bottom: 1px solid #e5e7eb; padding: 10px 9px; vertical-align: top; }
          tr:nth-child(even) td { background: #fafafa; }
          .empty { text-align: center; color: #6b7280; padding: 28px; }
          .footer { margin-top: 24px; font-size: 11px; color: #6b7280; }
        </style>
      </head>
      <body>
        <section class="header">
          <div class="brand">4U Studio Academy</div>
          <h1>Horario de clases</h1>
          <p>${clean(monthLabel)}</p>
          <div class="meta">
            <span><strong>Perfil:</strong> ${clean(name)}</span>
            <span><strong>Rol:</strong> ${clean(roleLabel)}</span>
            <span><strong>Generado:</strong> ${new Date().toLocaleDateString('es-CO')}</span>
          </div>
        </section>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Clase</th>
              <th>${roleLabel === 'Instructor' ? 'Estudiante' : 'Instructor'}</th>
              <th>Salon</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">Los horarios se muestran en la zona horaria America/Bogota.</div>
        <script>window.addEventListener('load', () => { window.print(); });</script>
      </body>
      </html>`

    const win = window.open('', '_blank', 'noopener,noreferrer')
    if (!win) return
    win.document.open()
    win.document.write(html)
    win.document.close()
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ff7a00]/35 bg-white px-4 py-2.5 text-sm font-bold text-[#ff7a00] shadow-sm transition hover:bg-[#ff7a00] hover:text-white"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </svg>
      Descargar horario PDF
    </button>
  )
}

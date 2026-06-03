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
  return (v ?? '-').replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c] ?? c))
}

function statusLabel(s?: string) {
  return ({ pending:'Pendiente', confirmed:'Confirmada', completed:'Completada', cancelled:'Cancelada', no_show:'No asistió', rescheduled:'Reprogramada' }[s ?? '']) ?? 'Programada'
}

function dateLong(iso?: string) {
  if (!iso) return '-'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

export default function SchedulePdfButton({ name, roleLabel, monthLabel, sessions }: Props) {
  function handlePrint() {
    const rows = sessions.length
      ? sessions.map(s => `<tr>
          <td>${dateLong(s.scheduled_date)}</td>
          <td>${esc(s.start_time?.slice(0,5))}</td>
          <td>${esc(s.course?.name)}</td>
          <td>${esc(s.instructor?.name ?? s.student?.name)}</td>
          <td>${esc(s.classroom?.name)}</td>
          <td>${statusLabel(s.status)}</td>
        </tr>`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:28px">No hay clases programadas para este periodo.</td></tr>'

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Horario 4U Studio — ${esc(name)}</title>
<style>
@page{size:A4;margin:18mm}*{box-sizing:border-box}
body{font-family:Arial,sans-serif;color:#111827;margin:0}
.brand{color:#ff7a00;font-weight:800;letter-spacing:.08em;font-size:12px;text-transform:uppercase}
h1{margin:8px 0 4px;font-size:26px}p.sub{margin:0;color:#6b7280}
.hdr{border-bottom:3px solid #ff7a00;padding-bottom:16px;margin-bottom:20px}
.meta{display:flex;justify-content:space-between;gap:12px;margin-top:12px;font-size:13px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#111;color:#fff;padding:10px 8px;text-align:left;font-size:11px;letter-spacing:.04em}
td{border-bottom:1px solid #e5e7eb;padding:9px 8px;vertical-align:top}
tr:nth-child(even) td{background:#fafafa}
.footer{margin-top:20px;font-size:11px;color:#9ca3af}
</style></head><body>
<div class="hdr">
  <div class="brand">4U Studio Academy</div>
  <h1>Horario de clases</h1>
  <p class="sub">${esc(monthLabel)}</p>
  <div class="meta">
    <span><strong>Perfil:</strong> ${esc(name)}</span>
    <span><strong>Rol:</strong> ${esc(roleLabel)}</span>
    <span><strong>Generado:</strong> ${new Date().toLocaleDateString('es-CO')}</span>
  </div>
</div>
<table>
  <thead><tr>
    <th>Fecha</th><th>Hora</th><th>Clase</th>
    <th>${roleLabel === 'Instructor' ? 'Estudiante' : 'Instructor'}</th>
    <th>Salón</th><th>Estado</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<p class="footer">Horarios en zona horaria America/Bogotá · 4U Studio Academy</p>
<script>window.onload=function(){window.print()}</script>
</body></html>`

    // Blob URL — no popup blocker, no CSP issue (called from user click)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, '_blank')
    // Revoke after 30s — enough time for print dialog
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
    if (!win) {
      // Fallback: force download as HTML
      const a = document.createElement('a')
      a.href = url; a.download = `horario-4u-${name.replace(/\s+/g,'-').toLowerCase()}.html`; a.click()
    }
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ff7a00]/35 bg-white px-4 py-2.5 text-sm font-bold text-[#ff7a00] shadow-sm transition-all hover:bg-[#ff7a00] hover:text-white active:scale-95"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>
      </svg>
      Descargar horario PDF
    </button>
  )
}

import { Resend } from 'resend'

interface ReminderData {
  studentName:  string
  studentEmail: string | null
  dateLabel:    string
  timeLabel:    string
  confirmUrl:   string
  variant:      'day-before' | 'same-day'
}

function emailShell(data: ReminderData, logoUrl: string): string {
  const heading = data.variant === 'day-before'
    ? '¡Tu clase es mañana!'
    : '¡Tu clase es hoy!'
  const intro = data.variant === 'day-before'
    ? `Hola ${data.studentName}, te recordamos que tienes clase mañana <b>${data.dateLabel}</b> a las <b>${data.timeLabel}</b>hs.`
    : `Hola ${data.studentName}, tu clase de hoy es a las <b>${data.timeLabel}</b>hs.`

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f0f0f;color:#e5e5e5;border-radius:12px;">
      <img src="${logoUrl}" alt="4U Studio Academy" width="140" style="display:block;margin:0 0 20px;max-width:140px;height:auto;" />
      <h1 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 12px;">${heading}</h1>
      <p style="font-size:14px;color:#aaa;margin:0 0 20px;line-height:1.6;">${intro}</p>
      <p style="font-size:14px;color:#aaa;margin:0 0 20px;line-height:1.6;">
        Confírmanos tu asistencia dando clic abajo — nos ayuda a organizar el salón e instructor.
      </p>
      <div style="margin-top:8px;">
        <a href="${data.confirmUrl}" style="display:inline-block;background:#ff7a00;color:#fff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Confirmar asistencia
        </a>
      </div>
      <p style="font-size:12px;color:#555;margin:24px 0 0;">4U Studio Academy</p>
    </div>
  `
}

export async function sendClassReminderEmail(data: ReminderData): Promise<{ ok: boolean; error?: string }> {
  if (!data.studentEmail) return { ok: false, error: 'sin_email' }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY no configurada' }

  try {
    const resend    = new Resend(apiKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://4ustudioacademy.com'
    const logoUrl   = `${siteUrl}/images/icons/Recurso%201.png`

    const subject = data.variant === 'day-before'
      ? '¡Tu clase es mañana! — 4U Studio Academy'
      : '¡Tu clase es hoy! — 4U Studio Academy'

    const { error } = await resend.emails.send({
      from:    `4U Studio Academy <${fromEmail}>`,
      to:      [data.studentEmail],
      subject,
      html:    emailShell(data, logoUrl),
    })

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error desconocido' }
  }
}

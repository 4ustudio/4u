import { Resend } from 'resend'
import { ACADEMY } from '@/lib/constants'

function emailShell(title: string, bodyHtml: string, ctaUrl: string, ctaLabel: string, logoUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f0f0f;color:#e5e5e5;border-radius:12px;">
      <img src="${logoUrl}" alt="4U Studio Academy" width="140" style="display:block;margin:0 0 20px;max-width:140px;height:auto;" />
      <h1 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 12px;">${title}</h1>
      ${bodyHtml}
      <div style="margin-top:20px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#ff7a00;color:#fff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">
          ${ctaLabel}
        </a>
      </div>
      <p style="font-size:12px;color:#555;margin:24px 0 0;">4U Studio Academy</p>
    </div>
  `
}

async function sendAdminEmail(subject: string, title: string, bodyHtml: string, ctaPath: string, ctaLabel: string): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('[email] RESEND_API_KEY no configurada')
      return
    }
    const resend    = new Resend(apiKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://4ustudioacademy.com'
    const logoUrl   = `${siteUrl}/images/icons/Recurso%201.png`

    await resend.emails.send({
      from:    `4U Studio Academy <${fromEmail}>`,
      to:      [ACADEMY.email],
      subject,
      html: emailShell(title, bodyHtml, `${siteUrl}${ctaPath}`, ctaLabel, logoUrl),
    })
  } catch (err) {
    console.error('[email] Error enviando notificación admin:', err)
  }
}

export async function sendInstructorAvailabilityChangedEmail(params: {
  instructorId: string
  instructorName: string
  summary: string
}): Promise<void> {
  await sendAdminEmail(
    `Horario actualizado — ${params.instructorName}`,
    'Un instructor actualizó su horario',
    `<p style="font-size:14px;color:#aaa;margin:0 0 20px;line-height:1.6;">
      <strong style="color:#fff;">${params.instructorName}</strong> actualizó su disponibilidad: ${params.summary}
    </p>`,
    `/admin/instructors/${params.instructorId}/disponibilidad`,
    'Ver disponibilidad',
  )
}

export async function sendInstructorDateBlockedEmail(params: {
  instructorId: string
  instructorName: string
  blockedDate: string
  reason: string
}): Promise<void> {
  await sendAdminEmail(
    `Fecha bloqueada — ${params.instructorName}`,
    'Un instructor bloqueó una fecha',
    `<p style="font-size:14px;color:#aaa;margin:0 0 20px;line-height:1.6;">
      <strong style="color:#fff;">${params.instructorName}</strong> bloqueó el ${params.blockedDate}: ${params.reason}
    </p>`,
    `/admin/instructors/${params.instructorId}/disponibilidad`,
    'Ver disponibilidad',
  )
}

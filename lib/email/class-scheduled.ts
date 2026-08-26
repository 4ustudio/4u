import { Resend } from 'resend'

interface Person {
  name:  string
  email: string | null
}

interface ClassScheduledData {
  student:      Person
  instructor:   Person
  course:       { name: string }
  classroom:    { name: string }
  date:         string
  time:         string
  notes?:       string
  repeatWeeks?: number
}

function detailsTable(data: ClassScheduledData, otherRoleLabel: string, otherName: string): string {
  const repeatRow = data.repeatWeeks && data.repeatWeeks > 0
    ? `<tr><td colspan="2" style="padding:8px 0 0;color:#ff7a00;font-size:13px;">Esta clase se repetirá durante ${data.repeatWeeks + 1} semanas.</td></tr>`
    : ''

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
      <tr><td style="padding:8px 0;color:#888;width:130px;">Curso</td><td style="padding:8px 0;color:#fff;">${data.course.name}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Fecha</td><td style="padding:8px 0;color:#fff;">${data.date}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Hora</td><td style="padding:8px 0;color:#fff;font-weight:700;">${data.time}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">${otherRoleLabel}</td><td style="padding:8px 0;color:#fff;">${otherName}</td></tr>
      <tr><td style="padding:8px 0;color:#888;">Salón</td><td style="padding:8px 0;color:#fff;">${data.classroom.name}</td></tr>
      ${repeatRow}
    </table>
  `
}

function emailShell(greetingName: string, details: string, ctaUrl: string, ctaLabel: string, logoUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f0f0f;color:#e5e5e5;border-radius:12px;">
      <img src="${logoUrl}" alt="4U Studio Academy" width="140" style="display:block;margin:0 0 20px;max-width:140px;height:auto;" />
      <h1 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 12px;">¡Clase agendada!</h1>
      <p style="font-size:14px;color:#aaa;margin:0 0 20px;line-height:1.6;">
        Hola ${greetingName}, tu clase fue agendada correctamente.
      </p>
      ${details}
      <div style="margin-top:8px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#ff7a00;color:#fff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">
          ${ctaLabel}
        </a>
      </div>
      <p style="font-size:12px;color:#555;margin:24px 0 0;">4U Studio Academy</p>
    </div>
  `
}

export async function sendClassScheduledEmails(data: ClassScheduledData): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('[email] RESEND_API_KEY no configurada')
      return
    }

    const resend    = new Resend(apiKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://4ustudioacademy.com'
    const logoUrl = `${siteUrl}/images/icons/Recurso%201.png`

    const sends: Promise<unknown>[] = []

    if (data.student.email) {
      sends.push(resend.emails.send({
        from:    `4U Studio Academy <${fromEmail}>`,
        to:      [data.student.email],
        subject: '¡Tu clase fue agendada! — 4U Studio Academy',
        html: emailShell(
          data.student.name,
          detailsTable(data, 'Instructor', data.instructor.name),
          `${siteUrl}/mi-cuenta`,
          'Ver mi clase',
          logoUrl,
        ),
      }))
    }

    if (data.instructor.email) {
      sends.push(resend.emails.send({
        from:    `4U Studio Academy <${fromEmail}>`,
        to:      [data.instructor.email],
        subject: `Nueva clase agendada — ${data.student.name}`,
        html: emailShell(
          data.instructor.name,
          detailsTable(data, 'Estudiante', data.student.name),
          `${siteUrl}/admin/agenda`,
          'Ver agenda',
          logoUrl,
        ),
      }))
    }

    if (sends.length === 0) return

    const results = await Promise.allSettled(sends)
    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('[email] Error enviando correo de clase agendada:', result.reason)
      }
    })
  } catch (err) {
    console.error('[email] Error inesperado enviando correos de clase agendada:', err)
  }
}

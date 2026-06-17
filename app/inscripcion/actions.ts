'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { ACADEMY, TERMS } from '@/lib/constants'
import { activity } from '@/lib/activity'
import type {
  EnrollmentFormState,
  EnrollmentInsert,
  StudentType,
  Level,
} from '@/types/enrollment'

const PHONE_RE = /^[+]?[\d\s\-().]{7,20}$/

const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM',  '2:00 PM',  '3:00 PM',
  '4:00 PM',  '5:00 PM',  '6:00 PM',  '7:00 PM',
]

const LEVEL_LABEL: Record<string, string> = {
  never:        'Nunca ha estudiado música',
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
}

function validate(form: Partial<EnrollmentInsert>): EnrollmentFormState['errors'] | null {
  const errors: NonNullable<EnrollmentFormState['errors']> = {}

  if (!form.student_type || !['self', 'child'].includes(form.student_type)) {
    errors.student_type = 'Selecciona una opción'
  }
  if (!form.student_name?.trim()) {
    errors.student_name = 'El nombre del estudiante es obligatorio'
  } else if (form.student_name.trim().length < 2) {
    errors.student_name = 'Ingresa el nombre completo'
  }
  if (!form.student_age || form.student_age < 6) {
    errors.student_age = 'La edad mínima es 6 años'
  } else if (form.student_age > 100) {
    errors.student_age = 'Ingresa una edad válida'
  }
  if (form.student_type === 'child' && !form.guardian_name?.trim()) {
    errors.guardian_name = 'El nombre del acudiente es obligatorio'
  }
  if (!form.phone?.trim()) {
    errors.phone = 'El WhatsApp es obligatorio'
  } else if (!PHONE_RE.test(form.phone.trim())) {
    errors.phone = 'Ingresa un número válido (mín. 7 dígitos)'
  }
  if (!form.email?.trim()) {
    errors.email = 'El correo electrónico es obligatorio'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido'
  }
  if (!form.course_interest?.trim()) {
    errors.course_interest = 'Selecciona un curso de interés'
  }
  if (!form.level || !['never', 'beginner', 'intermediate', 'advanced'].includes(form.level)) {
    errors.level = 'Selecciona tu nivel actual'
  }
  if (!form.preferred_time?.trim() || !TIME_SLOTS.includes(form.preferred_time.trim())) {
    errors.preferred_time = 'Selecciona una hora preferida'
  }
  if (!form.terms_accepted) {
    errors.terms = 'Debes aceptar los términos y condiciones'
  }
  if (!form.data_consent) {
    errors.data_consent = 'Debes autorizar el tratamiento de datos personales'
  }

  return Object.keys(errors).length > 0 ? errors : null
}

async function sendUserConfirmation(
  data: EnrollmentInsert,
) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  try {
    const resend    = new Resend(apiKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

    await resend.emails.send({
      from:    `4U Studio Academy <${fromEmail}>`,
      to:      [data.email],
      subject: '¡Tu inscripción en 4U Studio Academy fue recibida!',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f0f0f;color:#e5e5e5;border-radius:12px;">
          <h1 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 12px;">¡Hola, ${data.student_name}!</h1>
          <p style="font-size:14px;color:#aaa;margin:0 0 20px;line-height:1.6;">
            Recibimos tu inscripción en <strong style="color:#ff7a00;">4U Studio Academy</strong>.<br/>
            Pronto recibirás un mensaje a tu WhatsApp (<strong style="color:#fff;">${data.phone}</strong>) para programar tu primera sesión.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
            <tr><td style="padding:6px 0;color:#888;width:130px;">Curso</td><td style="padding:6px 0;color:#fff;">${data.course_interest}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Nivel</td><td style="padding:6px 0;color:#fff;">${LEVEL_LABEL[data.level] ?? data.level}</td></tr>
            <tr><td style="padding:6px 0;color:#888;">Hora preferida</td><td style="padding:6px 0;color:#fff;font-weight:700;">${data.preferred_time}</td></tr>
          </table>
          <p style="font-size:12px;color:#555;margin:0;">¿Tienes dudas? Escríbenos por WhatsApp o a contacto@4ustudioacademy.com</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Error enviando confirmación al usuario:', err)
  }
}

async function sendAdminNotification(
  data: EnrollmentInsert,
) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  try {
    const resend    = new Resend(apiKey)
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

    await resend.emails.send({
      from:    `4U Studio Academy <${fromEmail}>`,
      to:      [ACADEMY.email],
      subject: `Nueva inscripción: ${data.student_name} — ${data.course_interest}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0f0f0f;color:#e5e5e5;border-radius:12px;">
          <div style="margin-bottom:20px;">
            <span style="background:#ff7a00;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.1em;">Nueva Inscripción</span>
          </div>
          <h1 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 4px;">${data.student_name}</h1>
          <p style="font-size:13px;color:#888;margin:0 0 24px;">${new Date().toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })}</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#888;width:140px;">Para quién</td><td style="padding:8px 0;color:#fff;">${data.student_type === 'self' ? 'Para sí mismo' : 'Para su hijo/a'}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Edad</td><td style="padding:8px 0;color:#fff;">${data.student_age} años</td></tr>
            ${data.guardian_name ? `<tr><td style="padding:8px 0;color:#888;">Acudiente</td><td style="padding:8px 0;color:#fff;">${data.guardian_name}</td></tr>` : ''}
            <tr><td colspan="2" style="padding:4px 0;border-top:1px solid #222;"></td></tr>
            <tr><td style="padding:8px 0;color:#888;">WhatsApp</td><td style="padding:8px 0;"><a href="https://wa.me/${data.phone.replace(/[^0-9]/g, '')}" style="color:#ff7a00;">${data.phone}</a></td></tr>
            <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;"><a href="mailto:${data.email}" style="color:#ff7a00;">${data.email}</a></td></tr>
            <tr><td colspan="2" style="padding:4px 0;border-top:1px solid #222;"></td></tr>
            <tr><td style="padding:8px 0;color:#888;">Curso</td><td style="padding:8px 0;color:#fff;">${data.course_interest}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Nivel</td><td style="padding:8px 0;color:#fff;">${LEVEL_LABEL[data.level] ?? data.level}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Hora preferida</td><td style="padding:8px 0;color:#fff;font-weight:700;">${data.preferred_time}</td></tr>
            ${data.id_document ? `<tr><td style="padding:8px 0;color:#888;">Documento</td><td style="padding:8px 0;color:#fff;">${data.id_document}</td></tr>` : ''}
            ${data.city ? `<tr><td style="padding:8px 0;color:#888;">Ciudad</td><td style="padding:8px 0;color:#fff;">${data.city}</td></tr>` : ''}
            ${data.notes ? `<tr><td colspan="2" style="padding:4px 0;border-top:1px solid #222;"></td></tr><tr><td style="padding:8px 0;color:#888;vertical-align:top;">Comentarios</td><td style="padding:8px 0;color:#fff;">${data.notes}</td></tr>` : ''}
          </table>
          <div style="margin-top:28px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://4ustudioacademy.com'}/admin/enrollments"
               style="display:inline-block;background:#ff7a00;color:#fff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">
              Ver en el admin →
            </a>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('Error enviando notificación email:', err)
  }
}

export async function generateAndSaveEnrollment(
  _prevState: EnrollmentFormState,
  formData: FormData,
): Promise<EnrollmentFormState> {
  const signedAt = new Date().toISOString()

  // ── 1. Validar datos del formulario principal ──
  const raw: Partial<EnrollmentInsert> = {
    student_type:    (formData.get('student_type') as StudentType) ?? undefined,
    student_name:    (formData.get('student_name') as string | null)?.trim() ?? '',
    student_age:     Number(formData.get('student_age')) || 0,
    guardian_name:   (formData.get('guardian_name') as string | null)?.trim() || undefined,
    phone:           (formData.get('phone') as string | null)?.trim() ?? '',
    email:           (formData.get('email') as string | null)?.trim() ?? '',
    course_interest: (formData.get('course_interest') as string | null)?.trim() ?? '',
    level:           (formData.get('level') as Level) ?? undefined,
    preferred_time:  (formData.get('preferred_time') as string | null)?.trim() ?? '',
    payment_method:  (formData.get('payment_method') as string | null)?.trim() || undefined,
    music_genre:     (formData.get('music_genre') as string | null)?.trim() || undefined,
    notes:           (formData.get('notes') as string | null)?.trim() || undefined,
    source:          'inscripcion',
    terms_accepted:    formData.get('terms') === 'on',
    terms_accepted_at: signedAt,
    terms_version:     TERMS.version,
    data_consent:      formData.get('data_consent') === 'on',
    image_consent:     formData.get('image_consent') === 'on',
    id_document:       (formData.get('id_document') as string | null)?.trim() || undefined,
    city:              (formData.get('city') as string | null)?.trim() || undefined,
    eps:               (formData.get('eps') as string | null)?.trim() || undefined,
    emergency_contact_name:  (formData.get('emergency_contact_name') as string | null)?.trim() || undefined,
    emergency_contact_phone: (formData.get('emergency_contact_phone') as string | null)?.trim() || undefined,
  }

  const errors = validate(raw)
  if (errors) return { status: 'error', errors }

  try {
    const admin = createAdminClient()

    // ── 2. Insertar enrollment ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: enrollment, error: enrollError } = await (admin as any)
      .from('enrollments')
      .insert(raw as EnrollmentInsert)
      .select('id')
      .single()

    if (enrollError || !enrollment?.id) {
      console.error('Supabase insert error:', enrollError?.code, enrollError?.message)
      const code = enrollError?.code
      let message = 'Error al enviar tu inscripción. Intenta de nuevo.'
      if (code === '42P01') message = 'Error de configuración: tabla no existe. Contacta al administrador.'
      if (code === '42703') message = 'Error de configuración: columna faltante. Contacta al administrador.'
      if (code === '42501') message = 'Error de permisos en la base de datos. Contacta al administrador.'
      return { status: 'error', message }
    }

    const enrollmentId = enrollment.id

    // ── 3. Activity log + Correos (en paralelo, no bloquean) ──
    await Promise.all([
      activity.leadCreated({
        lead_id:    enrollmentId,
        lead_name:  raw.student_name ?? '',
        instrument: raw.course_interest ?? undefined,
        source:     'inscripcion',
        created_by_system: true,
      }),
      sendAdminNotification(raw as EnrollmentInsert),
      sendUserConfirmation(raw as EnrollmentInsert),
    ])

    return {
      status:  'success',
      message: '¡Inscripción recibida! Te contactaremos pronto.',
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    const message =
      err instanceof Error && err.message.includes('variables de entorno')
        ? 'Error de configuración del servidor. Contacta al administrador.'
        : 'Error de conexión. Intenta de nuevo en un momento.'
    return { status: 'error', message }
  }
}

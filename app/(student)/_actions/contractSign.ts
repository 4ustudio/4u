'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createAuthServerClient } from '@/lib/supabase/server'
import { generateAndStoreContract } from '@/lib/pdf/generateContract'
import { TERMS } from '@/lib/constants'
import type { StudentDocumentInsert } from '@/types/documents'

export type ContractSignState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export async function signPortalContract(
  _prev: ContractSignState,
  formData: FormData,
): Promise<ContractSignState> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: 'No autenticado' }

  const idDocument = (formData.get('id_document') as string)?.trim()
  const city       = (formData.get('city') as string)?.trim()
  const signaturePng = formData.get('signature_png') as string

  if (!idDocument || idDocument.length < 5)
    return { status: 'error', message: 'Documento de identidad obligatorio (mín. 5 caracteres)' }
  if (!city)
    return { status: 'error', message: 'Ciudad obligatoria' }
  if (!signaturePng?.startsWith('data:image/png;base64,'))
    return { status: 'error', message: 'Firma digital obligatoria. Firma en el recuadro.' }

  const admin = createAdminClient()

  const { data: student } = await admin
    .from('students')
    .select('id, first_name, last_name, name, phone, email, lead_id, primary_course_id, courses:primary_course_id(name)')
    .eq('user_id', user.id)
    .single()

  if (!student) return { status: 'error', message: 'Estudiante no encontrado' }

  // Verificar que no haya contrato previo
  const { data: existing } = await admin
    .from('student_documents')
    .select('id')
    .eq('student_id', student.id)
    .eq('document_type', 'terms_and_conditions')
    .limit(1)
    .maybeSingle()

  if (existing) return { status: 'error', message: 'Ya tienes un contrato firmado' }

  const signedAt      = new Date().toISOString()
  const enrollmentId  = (student.lead_id as string | null) ?? student.id
  const studentName   = [student.first_name, student.last_name].filter(Boolean).join(' ') || (student.name as string) || 'Estudiante'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseInterest = (student.courses as any)?.name ?? 'Música'

  try {
    const contractResult = await generateAndStoreContract({
      enrollmentId,
      studentName,
      idDocument,
      phone:          (student.phone as string) ?? '',
      city,
      signedAt,
      termsVersion:   TERMS.version,
      courseInterest,
      signaturePngBase64: signaturePng,
    })

    const docInsert: StudentDocumentInsert = {
      student_id:       student.id,
      enrollment_id:    (student.lead_id as string | null) ?? null,
      document_type:    'terms_and_conditions',
      document_version: TERMS.version,
      signed_at:        signedAt,
      pdf_url:          contractResult.pdfUrl,
      signature_url:    contractResult.signatureUrl,
      document_hash:    contractResult.documentHash,
      metadata: {
        student_name:    studentName,
        course_interest: courseInterest,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from('student_documents').insert(docInsert)
    if (error) {
      console.error('student_documents insert error:', error.message)
      return { status: 'error', message: 'Error guardando el documento. Intenta de nuevo.' }
    }

    return { status: 'success' }
  } catch (err) {
    console.error('Error signing portal contract:', err)
    return { status: 'error', message: 'Error generando el contrato. Intenta de nuevo.' }
  }
}

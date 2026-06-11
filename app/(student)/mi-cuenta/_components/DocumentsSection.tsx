import { createAdminClient } from '@/lib/supabase/admin'
import { getSignedUrl } from '@/lib/storage'
import type { StudentDocument } from '@/types/documents'

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  terms_and_conditions: 'Términos y Condiciones',
  image_consent:        'Autorización de imagen',
  habeas_data:          'Habeas Data',
  certificate:          'Certificado',
  special_agreement:    'Acuerdo especial',
}

interface Props {
  studentId:   string
  enrollmentId?: string | null
}

export default async function DocumentsSection({ studentId, enrollmentId }: Props) {
  const admin = createAdminClient()

  // Buscar por student_id o enrollment_id (cubre leads no convertidos aún)
  let query = admin
    .from('student_documents')
    .select('*')
    .order('signed_at', { ascending: false })

  if (studentId) {
    query = admin
      .from('student_documents')
      .select('*')
      .or(`student_id.eq.${studentId}${enrollmentId ? `,enrollment_id.eq.${enrollmentId}` : ''}`)
      .order('signed_at', { ascending: false })
  }

  const { data: docs } = await query
  const documents = (docs ?? []) as StudentDocument[]

  if (documents.length === 0) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-1">Documentación</h2>
        <p className="text-sm text-gray-400">Sin documentos registrados.</p>
      </section>
    )
  }

  // Generar signed URLs (1 hora)
  const docsWithUrls = await Promise.all(
    documents.map(async (doc) => {
      let viewUrl:     string | null = null
      let downloadUrl: string | null = null

      if (doc.pdf_url) {
        try {
          viewUrl     = await getSignedUrl(doc.pdf_url, 3600)
          downloadUrl = await getSignedUrl(doc.pdf_url, 86400)
        } catch {
          // Storage path inválido — ignorar
        }
      }

      return { doc, viewUrl, downloadUrl }
    }),
  )

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-gray-900 mb-4">Documentación</h2>
      <div className="space-y-3">
        {docsWithUrls.map(({ doc, viewUrl, downloadUrl }) => (
          <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {DOCUMENT_TYPE_LABEL[doc.document_type] ?? doc.document_type}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Versión {doc.document_version} · Firmado el{' '}
                {new Date(doc.signed_at).toLocaleDateString('es-CO', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            {(viewUrl || downloadUrl) && (
              <div className="flex items-center gap-2 shrink-0">
                {viewUrl && (
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Ver
                  </a>
                )}
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={`Contrato_4UStudio_v${doc.document_version}.pdf`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff7a00] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition-all"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Descargar
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

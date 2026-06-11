export type DocumentType =
  | 'terms_and_conditions'
  | 'image_consent'
  | 'habeas_data'
  | 'certificate'
  | 'special_agreement'

export interface StudentDocument {
  id:               string
  student_id:       string | null
  enrollment_id:    string | null
  document_type:    DocumentType | string
  document_version: string
  signed_at:        string
  pdf_url:          string | null
  signature_url:    string | null
  document_hash:    string | null
  ip_address:       string | null
  user_agent:       string | null
  metadata:         Record<string, unknown> | null
  created_at:       string
}

export interface StudentDocumentInsert {
  student_id?:       string | null
  enrollment_id?:    string | null
  document_type:     DocumentType | string
  document_version:  string
  signed_at:         string
  pdf_url?:          string | null
  signature_url?:    string | null
  document_hash?:    string | null
  ip_address?:       string | null
  user_agent?:       string | null
  metadata?:         Record<string, unknown> | null
}

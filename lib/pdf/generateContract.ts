'use server'

import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createHash } from 'crypto'
import { uploadFile } from '@/lib/storage'
import { ContractPDF } from './ContractPDF'
import type { ContractData } from './ContractPDF'
import type { ReactElement, JSXElementConstructor } from 'react'

export interface GenerateContractInput {
  enrollmentId:     string
  studentName:      string
  idDocument:       string
  phone:            string
  city:             string
  signedAt:         string
  termsVersion:     string
  courseInterest:   string
  signaturePngBase64: string // data URL o raw base64
}

export interface GenerateContractResult {
  pdfUrl:       string
  signatureUrl: string
  documentHash: string
  pdfBuffer:    Buffer
}

export async function generateAndStoreContract(
  input: GenerateContractInput,
): Promise<GenerateContractResult> {
  const timestamp = new Date(input.signedAt).getTime()

  // 1. Subir PNG de firma a Storage
  const sigBase64 = input.signaturePngBase64.replace(/^data:image\/png;base64,/, '')
  const sigBuffer = Buffer.from(sigBase64, 'base64')
  const sigPath   = `contracts/${input.enrollmentId}/${timestamp}_signature.png`
  await uploadFile(sigPath, sigBuffer, 'image/png')

  // 2. Generar PDF con la firma embebida
  const contractData: ContractData = {
    studentName:      input.studentName,
    idDocument:       input.idDocument,
    phone:            input.phone,
    city:             input.city,
    signedAt:         input.signedAt,
    termsVersion:     input.termsVersion,
    courseInterest:   input.courseInterest,
    signatureDataUrl: input.signaturePngBase64,
  }

  type PdfEl = ReactElement<DocumentProps, JSXElementConstructor<DocumentProps>>

  // Primer render para obtener hash
  const pdfBufferForHash = await renderToBuffer(
    React.createElement(ContractPDF, { data: contractData }) as PdfEl,
  )
  const documentHash = createHash('sha256').update(pdfBufferForHash).digest('hex')

  // Segundo render con hash embebido en el documento
  const pdfBuffer = await renderToBuffer(
    React.createElement(ContractPDF, { data: { ...contractData, documentHash } }) as PdfEl,
  )

  // 3. Subir PDF a Storage
  const pdfPath = `contracts/${input.enrollmentId}/${timestamp}_contract.pdf`
  await uploadFile(pdfPath, pdfBuffer, 'application/pdf')

  return {
    pdfUrl:       pdfPath,
    signatureUrl: sigPath,
    documentHash,
    pdfBuffer,
  }
}

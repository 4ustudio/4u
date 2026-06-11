import React from 'react'
import {
  Document, Page, Text, View, Image, StyleSheet, Font,
} from '@react-pdf/renderer'
import { TERMS_V2 } from '@/lib/legal/terms-v2.0'

Font.register({
  family: 'Helvetica',
  fonts: [],
})

const C = {
  black:  '#0a0a0a',
  white:  '#ffffff',
  orange: '#ff7a00',
  gray1:  '#1a1a1a',
  gray2:  '#2a2a2a',
  gray3:  '#555555',
  gray4:  '#888888',
  gray5:  '#cccccc',
  border: '#333333',
}

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingHorizontal: 48,
    paddingVertical: 44,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#222222',
    lineHeight: 1.6,
  },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: `1.5 solid ${C.orange}` },
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.black, letterSpacing: 0.5 },
  headerSub:   { fontSize: 8, color: C.gray4, marginTop: 3 },
  badge:       { backgroundColor: C.orange, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:   { fontSize: 7, color: C.white, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8 },
  // Sections
  section:       { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionNum:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.orange, width: 20 },
  sectionTitle:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.black, textTransform: 'uppercase', letterSpacing: 0.4 },
  clause:        { flexDirection: 'row', marginBottom: 4 },
  clauseId:      { fontSize: 8, color: C.gray4, width: 28, marginTop: 1, flexShrink: 0 },
  clauseText:    { fontSize: 8.5, color: '#333333', flex: 1, lineHeight: 1.55 },
  // Signature page
  signPage:      { backgroundColor: '#fafafa' },
  signTitle:     { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 4 },
  signSubtitle:  { fontSize: 8, color: C.gray4, marginBottom: 24 },
  fieldRow:      { marginBottom: 14 },
  fieldLabel:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray4, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  fieldValue:    { fontSize: 10, color: C.black, borderBottom: `1 solid ${C.border}`, paddingBottom: 4 },
  fieldGrid:     { flexDirection: 'row', gap: 20 },
  fieldHalf:     { flex: 1 },
  signatureBox:  { marginTop: 20, marginBottom: 8 },
  signatureLabel:{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray4, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  signatureImg:  { width: 200, height: 70, border: `1 solid ${C.border}`, borderRadius: 4 },
  footer:        { position: 'absolute', bottom: 24, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', borderTop: `0.5 solid ${C.border}`, paddingTop: 6 },
  footerText:    { fontSize: 7, color: C.gray4 },
  hashBox:       { backgroundColor: '#f5f5f5', borderRadius: 4, padding: 8, marginTop: 16 },
  hashLabel:     { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  hashText:      { fontSize: 6.5, color: C.gray3, fontFamily: 'Courier' },
  divider:       { height: 0.5, backgroundColor: C.border, marginVertical: 14 },
  legalNote:     { fontSize: 7.5, color: C.gray4, lineHeight: 1.5, marginTop: 12, borderLeft: `2 solid ${C.orange}`, paddingLeft: 8 },
})

export interface ContractData {
  studentName:      string
  idDocument:       string
  phone:            string
  city:             string
  signedAt:         string
  termsVersion:     string
  courseInterest:   string
  signatureDataUrl: string // base64 data URL del PNG (solo para renderizado PDF, no persiste en BD)
  documentHash?:    string
}

export function ContractPDF({ data }: { data: ContractData }) {
  const signedDate = new Date(data.signedAt).toLocaleString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Bogota',
  })

  return (
    <Document
      title={`Contrato 4U Studio Academy — ${data.studentName}`}
      author="4U Studio Academy"
      subject="Términos y Condiciones — Contrato firmado digitalmente"
      creator="4U Studio Academy — Sistema de contratos digitales"
    >
      {/* ── Páginas de términos ── */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>4U Studio Academy</Text>
            <Text style={s.headerSub}>Términos y Condiciones de Inscripción · Versión {data.termsVersion} · {TERMS_V2.effectiveDate}</Text>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeText}>CONTRATO DIGITAL</Text>
          </View>
        </View>

        {/* Secciones 1–6 */}
        {TERMS_V2.sections.slice(0, 6).map((sec) => (
          <View key={sec.number} style={s.section} wrap={false}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionNum}>{sec.number}.</Text>
              <Text style={s.sectionTitle}>{sec.title}</Text>
            </View>
            {sec.clauses.map((c) => (
              <View key={c.id} style={s.clause}>
                <Text style={s.clauseId}>{c.id}</Text>
                <Text style={s.clauseText}>{c.text}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>4U Studio Academy · contacto@4ustudioacademy.com · Bogotá, Colombia</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* Secciones 7–12 en segunda página */}
      <Page size="A4" style={s.page}>
        {TERMS_V2.sections.slice(6).map((sec) => (
          <View key={sec.number} style={s.section} wrap={false}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionNum}>{sec.number}.</Text>
              <Text style={s.sectionTitle}>{sec.title}</Text>
            </View>
            {sec.clauses.map((c) => (
              <View key={c.id} style={s.clause}>
                <Text style={s.clauseId}>{c.id}</Text>
                <Text style={s.clauseText}>{c.text}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>4U Studio Academy · contacto@4ustudioacademy.com · Bogotá, Colombia</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* ── Página de firma ── */}
      <Page size="A4" style={[s.page, s.signPage]}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>4U Studio Academy</Text>
            <Text style={s.headerSub}>Página de firma · Contrato Términos y Condiciones v{data.termsVersion}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: '#1a1a1a' }]}>
            <Text style={s.badgeText}>FIRMADO DIGITALMENTE</Text>
          </View>
        </View>

        <Text style={s.signTitle}>Declaración de aceptación</Text>
        <Text style={s.signSubtitle}>
          El firmante declara haber leído y aceptado en su totalidad los Términos y Condiciones de 4U Studio Academy,
          versión {data.termsVersion}, con plena validez jurídica según la Ley 527 de 1999 (Comercio Electrónico, Colombia).
        </Text>

        <View style={s.fieldGrid}>
          <View style={s.fieldHalf}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Nombre completo</Text>
              <Text style={s.fieldValue}>{data.studentName}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Documento de identidad</Text>
              <Text style={s.fieldValue}>{data.idDocument}</Text>
            </View>
          </View>
          <View style={s.fieldHalf}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Teléfono / WhatsApp</Text>
              <Text style={s.fieldValue}>{data.phone}</Text>
            </View>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Ciudad</Text>
              <Text style={s.fieldValue}>{data.city}</Text>
            </View>
          </View>
        </View>

        <View style={s.fieldGrid}>
          <View style={s.fieldHalf}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Curso de interés</Text>
              <Text style={s.fieldValue}>{data.courseInterest}</Text>
            </View>
          </View>
          <View style={s.fieldHalf}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Fecha y hora de aceptación (Bogotá)</Text>
              <Text style={s.fieldValue}>{signedDate}</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.signatureBox}>
          <Text style={s.signatureLabel}>Firma digital del estudiante / acudiente</Text>
          <Image style={s.signatureImg} src={data.signatureDataUrl} />
        </View>

        <Text style={s.legalNote}>
          Este documento fue generado automáticamente por el sistema de contratos digitales de 4U Studio Academy.
          La firma digital fue capturada electrónicamente en el momento de la inscripción y es equivalente a una
          firma manuscrita conforme a la Ley 527 de 1999. Versión del documento: {data.termsVersion}.
        </Text>

        {data.documentHash && (
          <View style={s.hashBox}>
            <Text style={s.hashLabel}>Hash de integridad (SHA-256)</Text>
            <Text style={s.hashText}>{data.documentHash}</Text>
            <Text style={[s.hashLabel, { marginTop: 4 }]}>
              Este código permite verificar que el documento no fue alterado tras su generación.
            </Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>4U Studio Academy · contacto@4ustudioacademy.com · Bogotá, Colombia</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

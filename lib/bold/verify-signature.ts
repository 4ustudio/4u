import { createHmac } from 'crypto'

/**
 * Valida la firma Bold del webhook.
 * Algoritmo: HMAC-SHA256( Base64(rawBody), secretKey ) → hex → comparar con x-bold-signature
 * En sandbox, Bold firma con secretKey = "" (string vacío).
 */
export function verifyBoldSignature(rawBody: string, signature: string, secretKey: string): boolean {
  const base64Body = Buffer.from(rawBody).toString('base64')
  const expected   = createHmac('sha256', secretKey).update(base64Body).digest('hex')
  return expected === signature
}

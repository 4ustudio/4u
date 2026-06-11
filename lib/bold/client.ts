import type { BoldCreateLinkResponse } from './types'

const BOLD_API_BASE = 'https://integrations.api.bold.co'

// Usa llaves de test mientras BOLD_SANDBOX=true
function getApiKey(): string {
  const isSandbox = process.env.BOLD_SANDBOX === 'true'
  const key = isSandbox ? process.env.BOLD_PUBLIC_KEY_TEST : process.env.BOLD_PUBLIC_KEY
  if (!key) throw new Error(`Bold API key no configurada (sandbox=${isSandbox})`)
  return key
}

export interface CreateBoldLinkParams {
  paymentId: string     // Nuestro payments.id — va en reference para match en webhook
  amount: number        // En pesos COP (entero)
  description?: string
  expiresAt?: string    // ISO 8601
}

export async function createBoldPaymentLink(params: CreateBoldLinkParams): Promise<BoldCreateLinkResponse> {
  const apiKey = getApiKey()

  const body = {
    amount_type: 'CLOSE',
    amount: {
      currency: 'COP',
      total_amount: Math.round(params.amount),
      tip_amount: 0,
    },
    reference: params.paymentId,
    ...(params.description && { description: params.description }),
    ...(params.expiresAt && { expiration_date: params.expiresAt }),
  }

  const res = await fetch(`${BOLD_API_BASE}/online/link/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `x-api-key ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bold API error ${res.status}: ${text}`)
  }

  return res.json() as Promise<BoldCreateLinkResponse>
}

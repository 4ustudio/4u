// CloudEvents spec — Bold webhook payload
export type BoldEventType =
  | 'SALE_APPROVED'
  | 'SALE_REJECTED'
  | 'VOID_APPROVED'
  | 'VOID_REJECTED'

export interface BoldWebhookPayload {
  id: string
  type: BoldEventType
  subject: string        // Bold payment_id (e.g. "CNPCGSPS2WBA8")
  source: string
  spec_version: string
  time: number
  data: {
    payment_id: string
    metadata: {
      reference?: string  // Nuestro payments.id
    }
    amount: {
      currency: string
      total: number
    }
    payment_method?: string
    [key: string]: unknown
  }
}

export interface BoldCreateLinkResponse {
  payload: {
    payment_link: string  // "LNK_xxx"
    url: string           // "https://checkout.bold.co/LNK_xxx"
  }
  errors: unknown[]
}

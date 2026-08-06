// Rate limit en memoria — best-effort. En Fluid Compute la instancia se
// reutiliza entre requests, pero no hay estado compartido entre instancias/regiones.
// Sirve como primera línea de defensa contra spam/scripts, no contra un atacante distribuido.
const buckets = new Map<string, { count: number; resetAt: number }>()
let lastCleanup = 0

function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  if (now - lastCleanup > windowMs) {
    cleanup(now)
    lastCleanup = now
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) return false

  bucket.count++
  return true
}

export function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headersList.get('x-real-ip') ?? 'unknown'
}

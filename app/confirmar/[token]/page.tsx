import { redirect } from 'next/navigation'

// Redirige a la API que procesa el token
export default async function ConfirmarPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(`/api/confirm/${token}`)
}

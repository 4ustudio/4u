'use client'

import { useActionState } from 'react'
import { inviteStudentAction } from '@/app/admin/_actions/students'

type Props = {
  studentId: string
  email: string | null
  hasAccount: boolean
}

const initial: { error?: string; success?: boolean; resent?: boolean } = {}

export default function InviteStudentButton({ studentId, email, hasAccount }: Props) {
  const [state, action, isPending] = useActionState(inviteStudentAction, initial)

  if (!email) {
    return (
      <p className="text-xs text-white/30 font-roboto italic">
        Agrega un email para enviar acceso al portal.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="student_id" value={studentId} />

      {state.success && (
        <p className="text-xs text-green-400 font-roboto">
          {state.resent
            ? 'Invitación reenviada correctamente.'
            : 'Acceso al portal enviado. El estudiante recibirá un email.'}
        </p>
      )}

      {state.error && (
        <p className="text-xs text-red-400 font-roboto">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-50 font-poppins"
        style={{
          backgroundColor: hasAccount ? 'rgba(255,255,255,0.06)' : 'rgba(255,122,0,0.15)',
          color: hasAccount ? 'rgba(255,255,255,0.6)' : '#ff7a00',
          border: hasAccount ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,122,0,0.3)',
        }}
      >
        {isPending ? 'Enviando...' : hasAccount ? 'Reenviar acceso al portal' : 'Enviar acceso al portal'}
      </button>

      {hasAccount && (
        <p className="text-[10px] text-white/30 font-roboto text-center">
          Ya tiene cuenta activa · {email}
        </p>
      )}
    </form>
  )
}

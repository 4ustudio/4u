import { getAuthUser } from '@/lib/supabase/server'

export async function getActorInfo(): Promise<{ actor_name: string; actor_user_id: string; actor_role: string } | null> {
  try {
    const { data: { user } } = await getAuthUser()
    if (!user) return null
    return {
      actor_user_id: user.id,
      actor_name: (user.user_metadata?.name as string) ?? user.email ?? 'Admin',
      actor_role:  (user.user_metadata?.role as string) ?? 'admin',
    }
  } catch { return null }
}

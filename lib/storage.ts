'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'documents'

export async function uploadFile(
  path: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType, upsert: false })

  if (error) throw new Error(`Storage upload failed [${path}]: ${error.message}`)
  return path
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL failed [${path}]: ${error?.message}`)
  }
  return data.signedUrl
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.storage.from(BUCKET).remove([path])
}

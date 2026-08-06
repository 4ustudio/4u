/**
 * Backfill: copia auth.users.user_metadata.role → app_metadata.role
 *
 * user_metadata es editable por el propio usuario (anon key) — el rol nunca
 * debió vivir ahí. app_metadata solo lo puede escribir service_role.
 *
 * Por defecto corre en modo dry-run (no escribe nada, solo muestra qué haría).
 * Uso:
 *   node scripts/backfill-app-metadata-role.mjs           → dry-run
 *   node scripts/backfill-app-metadata-role.mjs --apply    → escribe de verdad
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const APPLY = process.argv.includes('--apply')
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const VALID_ROLES = new Set(['owner', 'super_admin', 'admin', 'sales', 'instructor', 'student'])

async function listAllUsers() {
  const users = []
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`listUsers: ${error.message}`)
    users.push(...data.users)
    if (data.users.length < perPage) break
    page++
  }
  return users
}

async function main() {
  console.log(`═══ Backfill app_metadata.role — modo: ${APPLY ? 'APPLY (escribe)' : 'DRY-RUN (solo muestra)'} ═══\n`)

  const users = await listAllUsers()
  console.log(`Usuarios totales: ${users.length}\n`)

  let toBackfill = 0
  let alreadySet = 0
  let noRole = 0
  let invalidRole = 0
  let errors = 0

  for (const user of users) {
    const currentApp = user.app_metadata?.role
    const currentUser = user.user_metadata?.role

    if (currentApp && VALID_ROLES.has(currentApp)) {
      alreadySet++
      continue
    }

    if (!currentUser) {
      noRole++
      continue
    }

    if (!VALID_ROLES.has(currentUser)) {
      invalidRole++
      console.warn(`  ⚠ ${user.email ?? user.id}: role inválido en user_metadata ("${currentUser}") — omitido, revisar a mano.`)
      continue
    }

    toBackfill++
    console.log(`  ${APPLY ? '✓' : '→'} ${user.email ?? user.id}: user_metadata.role="${currentUser}" → app_metadata.role`)

    if (APPLY) {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, role: currentUser },
      })
      if (error) {
        errors++
        console.error(`    ✗ Error actualizando ${user.email ?? user.id}: ${error.message}`)
      }
    }
  }

  console.log('\n── Resumen ──────────────────────────────────')
  console.log(`  Ya tenían app_metadata.role válido: ${alreadySet}`)
  console.log(`  ${APPLY ? 'Backfilleados' : 'A backfillear'}: ${toBackfill}`)
  console.log(`  Sin ningún role (ignorados):        ${noRole}`)
  console.log(`  Role inválido (revisar a mano):     ${invalidRole}`)
  if (APPLY) console.log(`  Errores:                            ${errors}`)

  if (!APPLY && toBackfill > 0) {
    console.log('\nEsto fue un dry-run. Para aplicar de verdad:')
    console.log('  node scripts/backfill-app-metadata-role.mjs --apply')
  }

  if (APPLY && errors > 0) {
    console.error('\n❌ Hubo errores — revisar antes de aplicar la migración RLS.')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message)
  process.exit(1)
})

// Ejecuta migraciones SQL en Supabase
// Uso: node scripts/run-migration.mjs
// Requiere: SUPABASE_SERVICE_ROLE_KEY en .env.local

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url   = process.env.NEXT_PUBLIC_SUPABASE_URL
const key   = process.env.SUPABASE_SERVICE_ROLE_KEY
const files = process.argv.slice(2)

if (!url || !key) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const migrations = files.length > 0
  ? files
  : ['supabase-setup.sql', 'supabase-agenda-v2.sql', 'supabase-student-portal.sql']

async function run() {
  for (const file of migrations) {
    try {
      const sql = readFileSync(file, 'utf-8')
      // Ejecutar vía REST ejecutando cada statement como query raw
      // Nota: Esto requiere que el proyecto tenga pg-api habilitado
      console.log(`📄 ${file} — no se puede ejecutar SQL raw mediante REST API.`)
      console.log('   Pégalo en Supabase Dashboard → SQL Editor.')
    } catch (e) {
      console.error(`❌ Error leyendo ${file}:`, e.message)
    }
  }
}

run()

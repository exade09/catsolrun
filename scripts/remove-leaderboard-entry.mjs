// Removes leaderboard rows by nickname (case-insensitive).
// Usage: node scripts/remove-leaderboard-entry.mjs <nickname> [--dry-run]
// Requires DATABASE_URL (read from .env.local, .env, or the environment).

import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const nickname = args.find((value) => !value.startsWith('--'))

if (!nickname) {
  console.error('Usage: node scripts/remove-leaderboard-entry.mjs <nickname> [--dry-run]')
  process.exit(1)
}

async function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  for (const file of ['.env.local', '.env']) {
    try {
      const contents = await readFile(file, 'utf8')
      const match = contents.match(/^\s*DATABASE_URL\s*=\s*(.+)$/m)
      if (match) return match[1].trim().replace(/^["']|["']$/g, '')
    } catch {
      // Try the next candidate file.
    }
  }
  return null
}

const databaseUrl = await readDatabaseUrl()
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add it to .env.local or the environment.')
  process.exit(1)
}

const sql = neon(databaseUrl)

const matches = await sql`
  SELECT player_id, nickname, best_distance, best_sol
  FROM meowave_leaderboard
  WHERE LOWER(nickname) = LOWER(${nickname})
`

if (matches.length === 0) {
  console.log(`No leaderboard row matches "${nickname}".`)
  process.exit(0)
}

console.log(`Matched ${matches.length} row(s):`)
for (const row of matches) {
  console.log(`  ${row.nickname} — ${row.best_distance} m, ${row.best_sol} SOL (${row.player_id})`)
}

if (dryRun) {
  console.log('\nDry run: nothing was deleted.')
  process.exit(0)
}

await sql`DELETE FROM meowave_leaderboard WHERE LOWER(nickname) = LOWER(${nickname})`

const remaining = await sql`
  SELECT nickname, best_distance, best_sol
  FROM meowave_leaderboard
  ORDER BY best_distance DESC, best_sol DESC, created_at ASC
`

console.log(`\nDeleted. Remaining ${remaining.length} row(s):`)
for (const [index, row] of remaining.entries()) {
  console.log(`  ${index + 1}. ${row.nickname} — ${row.best_distance} m, ${row.best_sol} SOL`)
}

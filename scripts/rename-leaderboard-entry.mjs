// Renames a leaderboard row (case-insensitive match on the current nickname).
// Usage: node scripts/rename-leaderboard-entry.mjs <from> <to> [--dry-run]
// Requires DATABASE_URL (read from .env.local, .env, or the environment).

import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'

// Mirrors src/leaderboard/types.ts, which the app and API share. Node cannot
// import the TypeScript source directly, so the rules are restated here.
const NICKNAME_MIN_LENGTH = 2
const NICKNAME_MAX_LENGTH = 16
const NICKNAME_PATTERN = /^[\p{L}\p{N}](?:[\p{L}\p{N}_ -]*[\p{L}\p{N}_-])?$/u

const normalizeNickname = (value) => value.trim().replace(/\s+/g, ' ')

const getNicknameError = (value) => {
  const nickname = normalizeNickname(value)
  const length = Array.from(nickname).length
  if (length < NICKNAME_MIN_LENGTH) return `Use at least ${NICKNAME_MIN_LENGTH} characters`
  if (length > NICKNAME_MAX_LENGTH) return `Use no more than ${NICKNAME_MAX_LENGTH} characters`
  if (!NICKNAME_PATTERN.test(nickname)) {
    return 'Use letters, numbers, spaces, underscores, or hyphens'
  }
  return null
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const positional = args.filter((value) => !value.startsWith('--'))
const [from, to] = positional

if (!from || !to) {
  console.error('Usage: node scripts/rename-leaderboard-entry.mjs <from> <to> [--dry-run]')
  process.exit(1)
}

// Reuse the same validation the API applies, so a rename cannot write a
// nickname the app itself would reject.
const nickname = normalizeNickname(to)
const invalid = getNicknameError(nickname)
if (invalid) {
  console.error(`"${to}" is not a valid nickname: ${invalid}`)
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
  WHERE LOWER(nickname) = LOWER(${from})
`

if (matches.length === 0) {
  console.log(`No leaderboard row matches "${from}".`)
  process.exit(0)
}

console.log(`Matched ${matches.length} row(s):`)
for (const row of matches) {
  console.log(`  ${row.nickname} -> ${nickname} (${row.best_distance} m, ${row.best_sol} SOL)`)
}

if (dryRun) {
  console.log('\nDry run: nothing was written.')
  process.exit(0)
}

await sql`
  UPDATE meowave_leaderboard
  SET nickname = ${nickname}, updated_at = NOW()
  WHERE LOWER(nickname) = LOWER(${from})
`

const remaining = await sql`
  SELECT nickname, best_distance, best_sol
  FROM meowave_leaderboard
  ORDER BY best_distance DESC, best_sol DESC, created_at ASC
`

console.log(`\nRenamed. Leaderboard now holds ${remaining.length} row(s):`)
for (const [index, row] of remaining.entries()) {
  console.log(`  ${index + 1}. ${row.nickname} — ${row.best_distance} m, ${row.best_sol} SOL`)
}

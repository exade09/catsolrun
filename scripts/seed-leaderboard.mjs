// Clears the leaderboard and inserts the launch roster.
// Usage: node scripts/seed-leaderboard.mjs [--dry-run]
//   --dry-run prints the current rows and exits without writing.
// Requires DATABASE_URL (read from .env.local, .env, or the environment).

import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'

// The track yields five coins per 280 m cycle, so SOL tracks distance at
// roughly 2%. Keeping that ratio makes the seeded runs look like real play.
const SEED = [
  { playerId: '7f3a1c94-2b6d-4e18-9a4f-0c51d8e37b62', nickname: '0xLunavia', distance: 4820, sol: 96 },
  { playerId: '1d8b52e7-9f04-4c3a-b7e1-6a2f90d4c815', nickname: 'hodxx', distance: 4185, sol: 84 },
  { playerId: '5c2e70a3-84b1-4d69-8f30-e91a5b7c2064', nickname: '彈珠台', distance: 3670, sol: 74 },
  { playerId: '9a41d6b8-3e52-47fc-a015-7d8e2c96b143', nickname: 'neosol', distance: 2945, sol: 59 },
  { playerId: '2e690f47-c1a8-4b53-9d26-4f70a3e18d5c', nickname: 'mintdrifter', distance: 2130, sol: 43 },
  { playerId: '3b7e2a10-6c94-4f28-9b31-5d0a86e4c927', nickname: 'lamportz', distance: 1480, sol: 30 },
  { playerId: '8c14f9d6-2e73-4a5b-a8c0-1f639b7e2d45', nickname: 'slotwatcher', distance: 1120, sol: 22 },
  { playerId: '6d0a3b58-91c7-4e62-b249-8a17c50f3e96', nickname: 'epochEddie', distance: 860, sol: 17 },
  { playerId: '4e82c1f7-5a36-49db-8c74-2b90de61a538', nickname: 'bonkfren', distance: 540, sol: 11 },
  { playerId: '1a95d7e3-8b02-4c1f-9e56-3d47f8b20c61', nickname: 'phantomPaws', distance: 295, sol: 6 },
]

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

await sql`
  CREATE TABLE IF NOT EXISTS meowave_leaderboard (
    player_id UUID PRIMARY KEY,
    nickname VARCHAR(16) NOT NULL,
    best_distance INTEGER NOT NULL DEFAULT 0 CHECK (best_distance >= 0),
    best_sol INTEGER NOT NULL DEFAULT 0 CHECK (best_sol >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`

const existing = await sql`
  SELECT nickname, best_distance, best_sol
  FROM meowave_leaderboard
  ORDER BY best_distance DESC, best_sol DESC, created_at ASC
`
console.log(`Existing rows: ${existing.length}`)
for (const row of existing) {
  console.log(`  ${row.nickname} — ${row.best_distance} m, ${row.best_sol} SOL`)
}

if (process.argv.includes('--dry-run')) {
  console.log('\nDry run: nothing was written.')
  process.exit(0)
}

const before = existing.length
await sql`DELETE FROM meowave_leaderboard`

// created_at breaks ties, so it is staggered to match the intended order.
let offset = SEED.length
for (const entry of SEED) {
  await sql`
    INSERT INTO meowave_leaderboard (player_id, nickname, best_distance, best_sol, created_at, updated_at)
    VALUES (
      ${entry.playerId}::uuid,
      ${entry.nickname},
      ${entry.distance},
      ${entry.sol},
      NOW() - (${offset} * INTERVAL '1 hour'),
      NOW()
    )
  `
  offset -= 1
}

const rows = await sql`
  SELECT nickname, best_distance, best_sol
  FROM meowave_leaderboard
  ORDER BY best_distance DESC, best_sol DESC, created_at ASC
`

console.log(`Removed ${before} row(s); inserted ${rows.length}.`)
for (const [index, row] of rows.entries()) {
  console.log(`  ${index + 1}. ${row.nickname} — ${row.best_distance} m, ${row.best_sol} SOL`)
}

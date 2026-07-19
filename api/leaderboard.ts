import { neon } from '@neondatabase/serverless'
import { getNicknameError, normalizeNickname, type LeaderboardEntry, type LeaderboardResponse, type RunSubmission } from '../src/leaderboard/types.js'

type Sql = ReturnType<typeof neon>

interface LeaderboardRow {
  player_id: string
  nickname: string
  best_distance: number
  best_sol: number
  rank: number | string
}

const PLAYER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
let schemaPromise: Promise<void> | null = null

function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  })
}

function getDatabase(): Sql | null {
  const databaseUrl = process.env.DATABASE_URL
  return databaseUrl ? neon(databaseUrl) : null
}

async function ensureSchema(sql: Sql): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
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
      await sql`
        CREATE INDEX IF NOT EXISTS meowave_leaderboard_rank_idx
        ON meowave_leaderboard (best_distance DESC, best_sol DESC, created_at ASC)
      `
    })().catch((error: unknown) => {
      schemaPromise = null
      throw error
    })
  }
  await schemaPromise
}

function toEntry(row: LeaderboardRow, currentPlayerId: string | null): LeaderboardEntry {
  return {
    rank: Number(row.rank),
    nickname: row.nickname,
    distance: Number(row.best_distance),
    sol: Number(row.best_sol),
    isCurrent: currentPlayerId !== null && row.player_id === currentPlayerId,
  }
}

async function readLeaderboard(sql: Sql, currentPlayerId: string | null): Promise<LeaderboardResponse> {
  const rows = await sql`
    SELECT
      player_id,
      nickname,
      best_distance,
      best_sol,
      ROW_NUMBER() OVER (ORDER BY best_distance DESC, best_sol DESC, created_at ASC) AS rank
    FROM meowave_leaderboard
    ORDER BY best_distance DESC, best_sol DESC, created_at ASC
    LIMIT 20
  ` as LeaderboardRow[]

  let currentEntry: LeaderboardEntry | null = null
  if (currentPlayerId) {
    const currentRows = await sql`
      WITH ranked AS (
        SELECT
          player_id,
          nickname,
          best_distance,
          best_sol,
          ROW_NUMBER() OVER (ORDER BY best_distance DESC, best_sol DESC, created_at ASC) AS rank
        FROM meowave_leaderboard
      )
      SELECT player_id, nickname, best_distance, best_sol, rank
      FROM ranked
      WHERE player_id = ${currentPlayerId}::uuid
      LIMIT 1
    ` as LeaderboardRow[]
    const currentRow = currentRows[0]
    if (currentRow) currentEntry = toEntry(currentRow, currentPlayerId)
  }

  return {
    entries: rows.map((row) => toEntry(row, currentPlayerId)),
    currentEntry,
  }
}

function parseSubmission(value: unknown): { submission?: RunSubmission; error?: string } {
  if (!value || typeof value !== 'object') return { error: 'Invalid run payload' }
  const body = value as Partial<RunSubmission>
  if (typeof body.playerId !== 'string' || !PLAYER_ID_PATTERN.test(body.playerId)) {
    return { error: 'Invalid player profile' }
  }
  if (typeof body.nickname !== 'string') return { error: 'A nickname is required' }
  const nicknameError = getNicknameError(body.nickname)
  if (nicknameError) return { error: nicknameError }
  if (!Number.isInteger(body.distance) || (body.distance ?? -1) < 0 || (body.distance ?? 0) > 10_000_000) {
    return { error: 'Invalid run distance' }
  }
  if (!Number.isInteger(body.sol) || (body.sol ?? -1) < 0 || (body.sol ?? 0) > 10_000_000) {
    return { error: 'Invalid SOL count' }
  }
  return {
    submission: {
      playerId: body.playerId,
      nickname: normalizeNickname(body.nickname),
      distance: body.distance ?? 0,
      sol: body.sol ?? 0,
    },
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    const sql = getDatabase()
    if (!sql) return json({ error: 'Leaderboard database is not connected yet' }, 503)

    try {
      await ensureSchema(sql)
      if (request.method === 'GET') {
        const playerId = new URL(request.url).searchParams.get('playerId')
        const currentPlayerId = playerId && PLAYER_ID_PATTERN.test(playerId) ? playerId : null
        const leaderboard = await readLeaderboard(sql, currentPlayerId)
        return json(leaderboard, 200, { 'Cache-Control': 'private, no-store' })
      }

      if (request.method === 'POST') {
        const parsed = parseSubmission(await request.json().catch(() => null))
        if (!parsed.submission) return json({ error: parsed.error ?? 'Invalid run payload' }, 400)
        const { playerId, nickname, distance, sol } = parsed.submission
        await sql`
          INSERT INTO meowave_leaderboard (player_id, nickname, best_distance, best_sol)
          VALUES (${playerId}::uuid, ${nickname}, ${distance}, ${sol})
          ON CONFLICT (player_id) DO UPDATE SET
            nickname = EXCLUDED.nickname,
            best_sol = CASE
              WHEN EXCLUDED.best_distance > meowave_leaderboard.best_distance THEN EXCLUDED.best_sol
              WHEN EXCLUDED.best_distance = meowave_leaderboard.best_distance
                THEN GREATEST(meowave_leaderboard.best_sol, EXCLUDED.best_sol)
              ELSE meowave_leaderboard.best_sol
            END,
            best_distance = GREATEST(meowave_leaderboard.best_distance, EXCLUDED.best_distance),
            updated_at = NOW()
        `
        return json(await readLeaderboard(sql, playerId), 201)
      }

      return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' })
    } catch (error) {
      console.error('Leaderboard request failed.', error)
      return json({ error: 'The leaderboard is temporarily unavailable' }, 500)
    }
  },
}

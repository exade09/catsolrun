export type LeaderboardSource = 'demo' | 'local'

export interface RunResult {
  score: number
  distance: number
  sol: number
  bestCombo: number
}

export interface LeaderboardEntry extends RunResult {
  id: string
  player: string
  source: LeaderboardSource
}

export interface LeaderboardGateway {
  list: (identity?: string | null) => Promise<LeaderboardEntry[]>
  submit: (result: RunResult, identity?: string | null) => Promise<void>
}

const LOCAL_RESULT_KEY = 'sol-cat-run:leaderboard-result'

const demoEntries: LeaderboardEntry[] = [
  { id: 'demo-1', player: 'MIDNIGHT.CAT', distance: 6_840, sol: 412, score: 148_250, bestCombo: 38, source: 'demo' },
  { id: 'demo-2', player: 'TUNNELWAVE', distance: 5_960, sol: 367, score: 129_780, bestCombo: 34, source: 'demo' },
  { id: 'demo-3', player: 'BYTEPAWS', distance: 5_320, sol: 301, score: 111_420, bestCombo: 27, source: 'demo' },
  { id: 'demo-4', player: 'LOWPOLY.LUV', distance: 4_770, sol: 283, score: 98_610, bestCombo: 24, source: 'demo' },
  { id: 'demo-5', player: 'ECHO//RUN', distance: 4_090, sol: 226, score: 84_350, bestCombo: 21, source: 'demo' },
  { id: 'demo-6', player: 'NEONWHISKER', distance: 3_640, sol: 194, score: 73_840, bestCombo: 19, source: 'demo' },
]

function toWholeNonNegative(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : null
}

function normalizeRunResult(result: RunResult): RunResult {
  return {
    score: toWholeNonNegative(result.score) ?? 0,
    distance: toWholeNonNegative(result.distance) ?? 0,
    sol: toWholeNonNegative(result.sol) ?? 0,
    bestCombo: toWholeNonNegative(result.bestCombo) ?? 0,
  }
}

function parseStoredEntry(value: unknown): LeaderboardEntry | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const score = toWholeNonNegative(record.score)
  const distance = toWholeNonNegative(record.distance)
  const sol = toWholeNonNegative(record.sol)
  const bestCombo = toWholeNonNegative(record.bestCombo)
  if (score === null || distance === null || sol === null || bestCombo === null) return null

  return {
    id: 'local-player',
    player: typeof record.player === 'string' && record.player.trim() ? record.player : 'YOU / LOCAL',
    source: 'local',
    score,
    distance,
    sol,
    bestCombo,
  }
}

function playerLabel(identity?: string | null): string {
  return identity ? `${identity.slice(0, 4)}…${identity.slice(-4)}` : 'YOU / LOCAL'
}

function safeParseLocalResult(): LeaderboardEntry | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(LOCAL_RESULT_KEY)
    return value ? parseStoredEntry(JSON.parse(value) as unknown) : null
  } catch {
    return null
  }
}

export function saveLocalLeaderboardResult(
  result: RunResult,
  identity?: string | null,
): LeaderboardEntry {
  const existing = safeParseLocalResult()
  const normalizedResult = normalizeRunResult(result)
  const next = existing && existing.score > normalizedResult.score
    ? existing
    : {
        ...normalizedResult,
        id: 'local-player',
        player: playerLabel(identity),
        source: 'local' as const,
      }

  if (typeof window === 'undefined') return next
  try {
    window.localStorage.setItem(LOCAL_RESULT_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('sol-cat:leaderboard-updated'))
  } catch {
    // Local storage can be disabled; the game remains fully playable.
  }
  return next
}

export function getLocalLeaderboardResult(identity?: string | null): LeaderboardEntry | null {
  const entry = safeParseLocalResult()
  if (!entry) return null
  return {
    ...entry,
    player: playerLabel(identity),
  }
}

export const localLeaderboardService: LeaderboardGateway = {
  async list(identity) {
    const localEntry = getLocalLeaderboardResult(identity)
    return [...demoEntries, ...(localEntry ? [localEntry] : [])].sort(
      (a, b) => b.score - a.score,
    )
  },
  async submit(result, identity) {
    saveLocalLeaderboardResult(result, identity)
  },
}

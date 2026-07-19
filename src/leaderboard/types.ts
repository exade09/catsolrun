export const NICKNAME_MIN_LENGTH = 2
export const NICKNAME_MAX_LENGTH = 16

export interface LeaderboardEntry {
  rank: number
  nickname: string
  distance: number
  sol: number
  isCurrent: boolean
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  currentEntry: LeaderboardEntry | null
}

export interface RunSubmission {
  playerId: string
  nickname: string
  distance: number
  sol: number
}

export function normalizeNickname(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function getNicknameError(value: string): string | null {
  const nickname = normalizeNickname(value)
  const length = Array.from(nickname).length
  if (length < NICKNAME_MIN_LENGTH) return `Use at least ${NICKNAME_MIN_LENGTH} characters`
  if (length > NICKNAME_MAX_LENGTH) return `Use no more than ${NICKNAME_MAX_LENGTH} characters`
  if (!/^[\p{L}\p{N}](?:[\p{L}\p{N}_ -]*[\p{L}\p{N}_-])?$/u.test(nickname)) {
    return 'Use letters, numbers, spaces, underscores, or hyphens'
  }
  return null
}

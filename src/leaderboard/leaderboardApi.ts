import type { LeaderboardResponse, RunSubmission } from './types'

export const LEADERBOARD_UPDATED_EVENT = 'meowave:leaderboard-updated'

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: unknown }
    if (typeof body.error === 'string') return body.error
  } catch {
    // The API may be unavailable before the Vercel database is connected.
  }
  return 'The leaderboard is temporarily unavailable.'
}

export async function fetchLeaderboard(playerId: string, signal?: AbortSignal): Promise<LeaderboardResponse> {
  const search = new URLSearchParams({ playerId })
  const response = await fetch(`/api/leaderboard?${search}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(await readError(response))
  return response.json() as Promise<LeaderboardResponse>
}

export async function submitRun(submission: RunSubmission): Promise<LeaderboardResponse> {
  const response = await fetch('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(submission),
  })
  if (!response.ok) throw new Error(await readError(response))
  const result = await response.json() as LeaderboardResponse
  window.dispatchEvent(new CustomEvent(LEADERBOARD_UPDATED_EVENT, { detail: result }))
  return result
}

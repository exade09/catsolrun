import type { LeaderboardResponse, RunSubmission } from './types'

export const LEADERBOARD_UPDATED_EVENT = 'meowave:leaderboard-updated'
const PENDING_RUN_STORAGE_KEY = 'meowave-pending-run-v1'

let pendingRunFlush: Promise<LeaderboardResponse | null> | null = null

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

function isRunSubmission(value: unknown): value is RunSubmission {
  if (!value || typeof value !== 'object') return false
  const submission = value as Partial<RunSubmission>
  return typeof submission.playerId === 'string'
    && typeof submission.nickname === 'string'
    && Number.isInteger(submission.distance)
    && Number.isInteger(submission.sol)
}

function readPendingRun(): RunSubmission | null {
  try {
    const stored = window.localStorage.getItem(PENDING_RUN_STORAGE_KEY)
    if (!stored) return null
    const submission: unknown = JSON.parse(stored)
    if (isRunSubmission(submission)) return submission
    window.localStorage.removeItem(PENDING_RUN_STORAGE_KEY)
  } catch {
    // A restricted browser can reject local storage while still allowing the API request.
  }
  return null
}

function queuePendingRun(submission: RunSubmission): boolean {
  try {
    const pending = readPendingRun()
    let next = submission

    if (pending?.playerId === submission.playerId) {
      if (pending.distance > submission.distance) {
        next = { ...pending, nickname: submission.nickname }
      } else if (pending.distance === submission.distance) {
        next = { ...submission, sol: Math.max(pending.sol, submission.sol) }
      }
    }

    window.localStorage.setItem(PENDING_RUN_STORAGE_KEY, JSON.stringify(next))
    return true
  } catch {
    return false
  }
}

function clearPendingRun(submission: RunSubmission): boolean {
  try {
    const pending = readPendingRun()
    if (!pending) return true
    if (
      pending.playerId === submission.playerId
      && pending.nickname === submission.nickname
      && pending.distance === submission.distance
      && pending.sol === submission.sol
    ) {
      window.localStorage.removeItem(PENDING_RUN_STORAGE_KEY)
    }
    return true
  } catch {
    return false
  }
}

async function postRun(submission: RunSubmission): Promise<LeaderboardResponse> {
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

async function flushPendingRun(): Promise<LeaderboardResponse | null> {
  let lastResult: LeaderboardResponse | null = null

  while (true) {
    const pending = readPendingRun()
    if (!pending) return lastResult
    lastResult = await postRun(pending)
    if (!clearPendingRun(pending)) return lastResult
  }
}

export async function retryPendingRun(): Promise<LeaderboardResponse | null> {
  if (pendingRunFlush) return pendingRunFlush
  pendingRunFlush = flushPendingRun()
  try {
    return await pendingRunFlush
  } finally {
    pendingRunFlush = null
  }
}

export async function submitRun(submission: RunSubmission): Promise<LeaderboardResponse> {
  if (!queuePendingRun(submission)) return postRun(submission)
  const result = await retryPendingRun()
  if (!result) return postRun(submission)
  return result
}

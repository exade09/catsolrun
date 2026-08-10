import type {
  CreditRunRequest,
  RegisterRewardRequest,
  RewardCreditResponse,
  RewardMutationRequest,
  RewardSnapshotResponse,
  RewardWithdrawalResponse,
  SimulateEligibilityRequest,
  WithdrawRewardRequest,
} from './types'

const REWARDS_ENDPOINT = '/api/rewards'
const REQUEST_TIMEOUT_MS = 5_000

async function postBestEffort<T>(
  request: RewardMutationRequest,
  isResult: (value: unknown) => value is T,
): Promise<T | null> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(REWARDS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
    if (!response.ok) return null
    const body: unknown = await response.json()
    return isResult(body) ? body : null
  } catch {
    // The Reward Lab must remain usable as an explicitly local simulation.
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}

function hasSnapshot(value: unknown): value is RewardSnapshotResponse {
  if (!value || typeof value !== 'object') return false
  const result = value as { snapshot?: { simulation?: unknown; walletAddress?: unknown } }
  return result.snapshot?.simulation === true
    && typeof result.snapshot.walletAddress === 'string'
}

function hasCredit(value: unknown): value is RewardCreditResponse {
  if (!hasSnapshot(value)) return false
  const result = value as Partial<RewardCreditResponse>
  return Boolean(result.credit)
    && typeof result.credit?.creditedLamports === 'string'
    && typeof result.credit?.runId === 'string'
}

function hasWithdrawal(value: unknown): value is RewardWithdrawalResponse {
  if (!hasSnapshot(value)) return false
  const result = value as Partial<RewardWithdrawalResponse>
  return Boolean(result.withdrawal)
    && result.withdrawal?.transactionSignature === null
    && typeof result.withdrawal?.requestId === 'string'
}

export function registerRewardProfile(
  playerId: string,
  walletAddress: string,
): Promise<RewardSnapshotResponse | null> {
  const request: RegisterRewardRequest = { action: 'register', playerId, walletAddress }
  return postBestEffort(request, hasSnapshot)
}

export function requestDemoEligibility(
  playerId: string,
  walletAddress: string,
): Promise<RewardSnapshotResponse | null> {
  const request: SimulateEligibilityRequest = {
    action: 'simulateEligibility',
    playerId,
    walletAddress,
  }
  return postBestEffort(request, hasSnapshot)
}

export function syncRewardCredit(request: CreditRunRequest): Promise<RewardCreditResponse | null> {
  return postBestEffort(request, hasCredit)
}

export function syncDemoWithdrawal(
  request: WithdrawRewardRequest,
): Promise<RewardWithdrawalResponse | null> {
  return postBestEffort(request, hasWithdrawal)
}

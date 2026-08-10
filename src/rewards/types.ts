import type { SIMULATED_REWARD_CURRENCY } from './rewardRules'

export type RewardAction = 'register' | 'simulateEligibility' | 'creditRun' | 'withdraw'
export type SimulatedWithdrawalStatus = 'simulated_complete' | 'rejected'
export type RewardLedgerKind = 'run_credit' | 'simulated_withdrawal'

export interface RegisterRewardRequest {
  action: 'register'
  playerId: string
  walletAddress: string
}

export interface SimulateEligibilityRequest {
  action: 'simulateEligibility'
  playerId: string
  walletAddress: string
}

export interface CreditRunRequest {
  action: 'creditRun'
  playerId: string
  walletAddress: string
  runId: string
  activeSeconds: number
  rawPickups: number
  actions: number
}

export interface WithdrawRewardRequest {
  action: 'withdraw'
  playerId: string
  walletAddress: string
  requestId: string
  amountLamports: number
}

export type RewardMutationRequest =
  | RegisterRewardRequest
  | SimulateEligibilityRequest
  | CreditRunRequest
  | WithdrawRewardRequest

export interface RewardRulesSnapshot {
  eligibilityThresholdUsdCents: number
  minimumWithdrawalLamports: string
  withdrawalActiveGateSeconds: number
  pickupRewardLamports: string
  hourlyCapLamports: string
  dailyCapLamports: string
  minimumMeaningfulRunSeconds: number
  minimumMeaningfulRunActions: number
  meaningfulActionIntervalSeconds: number
}

export interface RewardSnapshot {
  simulation: true
  currency: typeof SIMULATED_REWARD_CURRENCY
  playerId: string
  walletAddress: string
  eligibilityMode: 'simulation'
  eligibilityPassed: boolean
  balanceLamports: string
  lifetimeEarnedLamports: string
  lifetimeWithdrawnLamports: string
  eligibleActiveSeconds: number
  dailyEarnedLamports: string
  canWithdraw: boolean
  rules: RewardRulesSnapshot
  disclaimer: string
}

export interface RewardHistoryEntry {
  eventKey: string
  kind: RewardLedgerKind
  deltaLamports: string
  balanceAfterLamports: string
  runId: string | null
  withdrawalRequestId: string | null
  createdAt: string
}

export interface SimulatedWithdrawalHistoryEntry {
  requestId: string
  amountLamports: string
  status: SimulatedWithdrawalStatus
  reason: string | null
  transactionSignature: null
  createdAt: string
}

export interface RewardSnapshotResponse {
  snapshot: RewardSnapshot
  history: RewardHistoryEntry[]
  withdrawals: SimulatedWithdrawalHistoryEntry[]
}

export interface RunCreditResult {
  runId: string
  activeSeconds: number
  rawPickups: number
  actions: number
  meaningfulRun: boolean
  creditedActiveSeconds: number
  pickupCreditLamports: string
  proratedHourlyCapLamports: string
  calculatedCreditLamports: string
  creditedLamports: string
  hourlyCapApplied: boolean
  dailyCapApplied: boolean
  idempotentReplay: boolean
  createdAt: string
}

export interface RewardCreditResponse extends RewardSnapshotResponse {
  credit: RunCreditResult
}

export interface SimulatedWithdrawalResult {
  requestId: string
  amountLamports: string
  status: SimulatedWithdrawalStatus
  reason: string | null
  transactionSignature: null
  idempotentReplay: boolean
  createdAt: string
}

export interface RewardWithdrawalResponse extends RewardSnapshotResponse {
  withdrawal: SimulatedWithdrawalResult
}

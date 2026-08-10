export const SIMULATED_REWARD_CURRENCY = 'SIM_SOL' as const
export const SIMULATED_LAMPORTS_PER_SOL = 1_000_000_000
export const SIMULATED_ELIGIBILITY_THRESHOLD_USD_CENTS = 1_000
export const MIN_WITHDRAWAL_LAMPORTS = 250_000_000
export const WITHDRAWAL_ACTIVE_GATE_SECONDS = 7_200
export const PICKUP_REWARD_LAMPORTS = 100_000
export const HOURLY_REWARD_CAP_LAMPORTS = 125_000_000
export const DAILY_REWARD_CAP_LAMPORTS = 300_000_000
export const MAX_CREDIT_RUN_SECONDS = 3_600
export const MAX_RAW_PICKUPS_PER_RUN = 100_000
export const MIN_MEANINGFUL_RUN_SECONDS = 20
export const MIN_MEANINGFUL_RUN_ACTIONS = 2
export const MEANINGFUL_ACTION_INTERVAL_SECONDS = 30
export const MAX_ACTIONS_PER_SECOND = 12
export const MAX_ACTIONS_PER_RUN = MAX_CREDIT_RUN_SECONDS * MAX_ACTIONS_PER_SECOND

export const SIMULATED_REWARD_DISCLAIMER =
  'Demo SOL is a gameplay simulation. It is not cryptocurrency, has no monetary value, and no blockchain transaction or real payout occurs.'

export const REWARD_RULES = {
  currency: SIMULATED_REWARD_CURRENCY,
  lamportsPerSol: SIMULATED_LAMPORTS_PER_SOL,
  eligibilityThresholdUsdCents: SIMULATED_ELIGIBILITY_THRESHOLD_USD_CENTS,
  minimumWithdrawalLamports: MIN_WITHDRAWAL_LAMPORTS,
  withdrawalActiveGateSeconds: WITHDRAWAL_ACTIVE_GATE_SECONDS,
  pickupRewardLamports: PICKUP_REWARD_LAMPORTS,
  hourlyCapLamports: HOURLY_REWARD_CAP_LAMPORTS,
  dailyCapLamports: DAILY_REWARD_CAP_LAMPORTS,
  maximumRunSeconds: MAX_CREDIT_RUN_SECONDS,
  maximumRawPickupsPerRun: MAX_RAW_PICKUPS_PER_RUN,
  minimumMeaningfulRunSeconds: MIN_MEANINGFUL_RUN_SECONDS,
  minimumMeaningfulRunActions: MIN_MEANINGFUL_RUN_ACTIONS,
  meaningfulActionIntervalSeconds: MEANINGFUL_ACTION_INTERVAL_SECONDS,
  maximumActionsPerSecond: MAX_ACTIONS_PER_SECOND,
  maximumActionsPerRun: MAX_ACTIONS_PER_RUN,
} as const

const wholeNonNegative = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0

export interface RunCreditCalculation {
  activeSeconds: number
  rawPickups: number
  pickupCreditLamports: number
  proratedHourlyCapLamports: number
  calculatedCreditLamports: number
  hourlyCapApplied: boolean
}

export function calculateProratedHourlyCap(activeSeconds: number): number {
  const safeSeconds = wholeNonNegative(activeSeconds)
  return Math.floor((HOURLY_REWARD_CAP_LAMPORTS * safeSeconds) / 3_600)
}

export function calculateRunCredit(activeSeconds: number, rawPickups: number): RunCreditCalculation {
  const safeSeconds = wholeNonNegative(activeSeconds)
  const safePickups = wholeNonNegative(rawPickups)
  const pickupCreditLamports = safePickups * PICKUP_REWARD_LAMPORTS
  const proratedHourlyCapLamports = calculateProratedHourlyCap(safeSeconds)
  const calculatedCreditLamports = Math.min(pickupCreditLamports, proratedHourlyCapLamports)

  return {
    activeSeconds: safeSeconds,
    rawPickups: safePickups,
    pickupCreditLamports,
    proratedHourlyCapLamports,
    calculatedCreditLamports,
    hourlyCapApplied: pickupCreditLamports > proratedHourlyCapLamports,
  }
}

export function canSimulateWithdrawal(balanceLamports: number, eligibleActiveSeconds: number): boolean {
  return wholeNonNegative(balanceLamports) >= MIN_WITHDRAWAL_LAMPORTS
    && wholeNonNegative(eligibleActiveSeconds) >= WITHDRAWAL_ACTIVE_GATE_SECONDS
}

export function isMeaningfulRun(activeSeconds: number, actions: number): boolean {
  const safeSeconds = wholeNonNegative(activeSeconds)
  const requiredActions = Math.max(
    MIN_MEANINGFUL_RUN_ACTIONS,
    Math.ceil(safeSeconds / MEANINGFUL_ACTION_INTERVAL_SECONDS),
  )
  return safeSeconds >= MIN_MEANINGFUL_RUN_SECONDS
    && wholeNonNegative(actions) >= requiredActions
}

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
  registerRewardProfile,
  requestDemoEligibility,
  syncDemoWithdrawal,
  syncRewardCredit,
} from '../rewards/rewardsApi'
import {
  DAILY_REWARD_CAP_LAMPORTS,
  MAX_ACTIONS_PER_SECOND,
  MAX_ACTIONS_PER_RUN,
  MAX_CREDIT_RUN_SECONDS,
  MAX_RAW_PICKUPS_PER_RUN,
  MIN_WITHDRAWAL_LAMPORTS,
  calculateRunCredit,
  canSimulateWithdrawal,
  isMeaningfulRun,
} from '../rewards/rewardRules'
import type { SimulatedWithdrawalHistoryEntry } from '../rewards/types'

export type RewardEligibility = 'unchecked' | 'checking' | 'eligible'

export interface CompletedRewardRun {
  runId: string
  rewardAddress: string | null
  activeSeconds: number
  rawPickups: number
  actions: number
  completedAt?: number
}

export interface RewardCreditResult {
  credited: boolean
  lamports: number
  reason?: 'trial' | 'duplicate' | 'not-meaningful' | 'daily-cap' | 'zero-credit'
}

export interface RewardProfile {
  address: string
  eligibility: RewardEligibility
  simulatedUsdCents: number | null
  eligibilitySource: 'api' | 'local' | null
  balanceLamports: number
  lifetimeEarnedLamports: number
  lifetimeWithdrawnLamports: number
  eligibleActiveSeconds: number
  creditedRunIds: string[]
  dailyCreditLamports: Record<string, number>
  withdrawals: SimulatedWithdrawalHistoryEntry[]
}

interface RewardStore {
  playerId: string
  activeAddress: string | null
  profiles: Record<string, RewardProfile>
  error: string | null
  linkAddress: (address: string) => boolean
  unlinkAddress: () => void
  simulateEligibility: () => Promise<boolean>
  creditCompletedRun: (run: CompletedRewardRun) => RewardCreditResult
  withdrawDemo: () => SimulatedWithdrawalHistoryEntry | null
  clearError: () => void
}

const STORAGE_KEY = 'meowave-reward-lab-v1'
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

const createPlayerId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function decodedBase58Length(value: string): number {
  const bytes = [0]
  for (const character of value) {
    const digit = BASE58_ALPHABET.indexOf(character)
    if (digit < 0) return 0
    let carry = digit
    for (let index = 0; index < bytes.length; index += 1) {
      carry += bytes[index]! * 58
      bytes[index] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  let leadingZeroes = 0
  while (leadingZeroes < value.length - 1 && value[leadingZeroes] === '1') leadingZeroes += 1
  return bytes.length + leadingZeroes
}

export function isSyntacticallyValidSolanaAddress(value: string): boolean {
  const normalized = value.trim()
  return normalized.length >= 32
    && normalized.length <= 44
    && decodedBase58Length(normalized) === 32
}

const integerAtLeastZero = (value: number): number =>
  Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))

const utcDayKey = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10)

const createProfile = (address: string): RewardProfile => ({
  address,
  eligibility: 'unchecked',
  simulatedUsdCents: null,
  eligibilitySource: null,
  balanceLamports: 0,
  lifetimeEarnedLamports: 0,
  lifetimeWithdrawnLamports: 0,
  eligibleActiveSeconds: 0,
  creditedRunIds: [],
  dailyCreditLamports: {},
  withdrawals: [],
})

const makeRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

const pruneDailyCredits = (credits: Record<string, number>, timestamp: number): Record<string, number> => {
  const oldest = timestamp - 14 * 24 * 60 * 60 * 1000
  return Object.fromEntries(
    Object.entries(credits).filter(([day]) => Date.parse(`${day}T00:00:00.000Z`) >= oldest),
  )
}

export const useRewardStore = create<RewardStore>()(
  persist(
    (set, get) => ({
      playerId: createPlayerId(),
      activeAddress: null,
      profiles: {},
      error: null,

      linkAddress: (input) => {
        const address = input.trim()
        if (!isSyntacticallyValidSolanaAddress(address)) {
          set({ error: 'That does not look like a valid Solana public address.' })
          return false
        }

        set((state) => ({
          activeAddress: address,
          profiles: state.profiles[address]
            ? state.profiles
            : { ...state.profiles, [address]: createProfile(address) },
          error: null,
        }))
        void registerRewardProfile(get().playerId, address)
        return true
      },

      unlinkAddress: () => set({ activeAddress: null, error: null }),

      simulateEligibility: async () => {
        const { activeAddress: address, playerId } = get()
        if (!address) {
          set({ error: 'Link a public address before running the demo check.' })
          return false
        }

        set((state) => {
          const profile = state.profiles[address]
          if (!profile) return { error: 'Link a public address before running the demo check.' }
          return {
            profiles: {
              ...state.profiles,
              [address]: { ...profile, eligibility: 'checking' as const },
            },
            error: null,
          }
        })

        await registerRewardProfile(playerId, address)
        const response = await requestDemoEligibility(playerId, address)

        set((state) => {
          const profile = state.profiles[address]
          if (!profile) return {}
          return {
            profiles: {
              ...state.profiles,
              [address]: {
                ...profile,
                eligibility: 'eligible' as const,
                // This amount is a UI fixture for the simulation and never an on-chain result.
                simulatedUsdCents: 1_250,
                eligibilitySource: response?.snapshot.eligibilityPassed ? 'api' as const : 'local' as const,
              },
            },
            error: null,
          }
        })
        return true
      },

      creditCompletedRun: (run) => {
        const state = get()
        const address = run.rewardAddress
        const profile = address ? state.profiles[address] : undefined
        if (!address || profile?.eligibility !== 'eligible') {
          return { credited: false, lamports: 0, reason: 'trial' }
        }
        if (profile.creditedRunIds.includes(run.runId)) {
          return { credited: false, lamports: 0, reason: 'duplicate' }
        }

        const completedAt = integerAtLeastZero(run.completedAt ?? Date.now())
        const activeSeconds = Math.min(MAX_CREDIT_RUN_SECONDS, integerAtLeastZero(run.activeSeconds))
        const rawPickups = Math.min(MAX_RAW_PICKUPS_PER_RUN, integerAtLeastZero(run.rawPickups))
        const actionCapForDuration = Math.min(
          MAX_ACTIONS_PER_RUN,
          activeSeconds * MAX_ACTIONS_PER_SECOND + 4,
        )
        const actions = Math.min(actionCapForDuration, integerAtLeastZero(run.actions))
        if (!run.runId.trim() || !isMeaningfulRun(activeSeconds, actions)) {
          return { credited: false, lamports: 0, reason: 'not-meaningful' }
        }
        const calculation = calculateRunCredit(activeSeconds, rawPickups)
        const dayKey = utcDayKey(completedAt)
        const dailyCredits = pruneDailyCredits(profile.dailyCreditLamports, completedAt)
        const alreadyCreditedToday = integerAtLeastZero(dailyCredits[dayKey] ?? 0)
        const dailyRemaining = Math.max(0, DAILY_REWARD_CAP_LAMPORTS - alreadyCreditedToday)
        const creditedLamports = Math.min(calculation.calculatedCreditLamports, dailyRemaining)

        const nextProfile: RewardProfile = {
          ...profile,
          balanceLamports: profile.balanceLamports + creditedLamports,
          lifetimeEarnedLamports: profile.lifetimeEarnedLamports + creditedLamports,
          eligibleActiveSeconds: profile.eligibleActiveSeconds + activeSeconds,
          creditedRunIds: [...profile.creditedRunIds, run.runId],
          dailyCreditLamports: {
            ...dailyCredits,
            [dayKey]: alreadyCreditedToday + creditedLamports,
          },
        }
        set((current) => ({
          profiles: { ...current.profiles, [address]: nextProfile },
          error: null,
        }))

        void syncRewardCredit({
          action: 'creditRun',
          playerId: state.playerId,
          walletAddress: address,
          runId: run.runId,
          activeSeconds,
          rawPickups,
          actions,
        })

        return creditedLamports > 0
          ? { credited: true, lamports: creditedLamports }
          : {
              credited: false,
              lamports: 0,
              reason: calculation.calculatedCreditLamports > 0 ? 'daily-cap' : 'zero-credit',
            }
      },

      withdrawDemo: () => {
        const state = get()
        const address = state.activeAddress
        const profile = address ? state.profiles[address] : undefined
        if (!address || !profile || profile.eligibility !== 'eligible') {
          set({ error: 'Complete the local eligibility simulation first.' })
          return null
        }
        if (!canSimulateWithdrawal(profile.balanceLamports, profile.eligibleActiveSeconds)) {
          set({
            error: profile.eligibleActiveSeconds < 7_200
              ? 'Two active hours are required before a demo withdrawal.'
              : 'The minimum simulated withdrawal is 0.2500 Demo SOL.',
          })
          return null
        }

        const requestId = makeRequestId()
        const createdAt = new Date().toISOString()
        const receipt: SimulatedWithdrawalHistoryEntry = {
          requestId,
          amountLamports: String(MIN_WITHDRAWAL_LAMPORTS),
          status: 'simulated_complete',
          reason: null,
          transactionSignature: null,
          createdAt,
        }
        const nextProfile: RewardProfile = {
          ...profile,
          balanceLamports: profile.balanceLamports - MIN_WITHDRAWAL_LAMPORTS,
          lifetimeWithdrawnLamports: profile.lifetimeWithdrawnLamports + MIN_WITHDRAWAL_LAMPORTS,
          withdrawals: [receipt, ...profile.withdrawals].slice(0, 50),
        }
        set((current) => ({
          profiles: { ...current.profiles, [address]: nextProfile },
          error: null,
        }))
        void syncDemoWithdrawal({
          action: 'withdraw',
          playerId: state.playerId,
          walletAddress: address,
          requestId,
          amountLamports: MIN_WITHDRAWAL_LAMPORTS,
        })
        return receipt
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playerId: state.playerId,
        activeAddress: state.activeAddress,
        profiles: Object.fromEntries(
          Object.entries(state.profiles).map(([address, profile]) => [
            address,
            profile.eligibility === 'checking'
              ? { ...profile, eligibility: 'unchecked' as const }
              : profile,
          ]),
        ),
      }),
    },
  ),
)

export const selectActiveRewardProfile = (state: RewardStore): RewardProfile | null =>
  state.activeAddress ? state.profiles[state.activeAddress] ?? null : null

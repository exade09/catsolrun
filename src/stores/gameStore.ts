import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { GAME_CONFIG } from '../game/config/gameConfig'
import type { PowerUpType } from '../game/types/game'
import { normalizeNickname } from '../leaderboard/types'
import { selectActiveRewardProfile, useRewardStore } from './rewardStore'

export type GamePhase =
  | 'loading'
  | 'menu'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'restarting'

export interface ActivePowerUp {
  type: PowerUpType
  duration: number
  expiresAt: number
}

export interface FinalStats {
  runId: string
  rewardAddress: string | null
  score: number
  distance: number
  sol: number
  rawSol: number
  actions: number
  bestCombo: number
  elapsedTime: number
  nearMisses: number
}

export interface RunMetrics {
  score: number
  distance: number
  sol: number
  rawSol: number
  actions: number
  combo: number
  bestCombo: number
  speed: number
  elapsedTime: number
  nearMisses: number
}

export type RunMetricsUpdate = Partial<RunMetrics>

export interface GameStore extends RunMetrics {
  phase: GamePhase
  countdown: number
  runId: string
  rewardAddress: string | null
  playerId: string
  nickname: string
  bestScore: number
  audioEnabled: boolean
  reducedMotion: boolean
  touchControls: boolean
  activePowerUp: ActivePowerUp | null
  finalStats: FinalStats
  setNickname: (nickname: string) => void
  setPhase: (phase: GamePhase) => void
  setCountdown: (countdown: number) => void
  startRun: () => void
  finishCountdown: () => void
  restartRun: () => void
  finishRestart: () => void
  returnToMenu: () => void
  pauseGame: () => void
  resumeGame: () => void
  togglePause: () => void
  endGame: () => void
  updateRun: (metrics: RunMetricsUpdate) => void
  advanceRun: (deltaSeconds: number, speed?: number) => void
  addScore: (amount: number) => void
  collectSol: (amount?: number) => void
  registerAction: () => void
  setCombo: (combo: number) => void
  breakCombo: () => void
  registerNearMiss: () => void
  activatePowerUp: (type: PowerUpType, duration?: number) => void
  clearPowerUp: (type?: PowerUpType) => void
  consumeShield: () => boolean
  toggleAudio: () => void
  setAudioEnabled: (enabled: boolean) => void
  toggleReducedMotion: () => void
  setReducedMotion: (enabled: boolean) => void
  setTouchControls: (enabled: boolean) => void
}

const EMPTY_FINAL_STATS: FinalStats = {
  runId: '',
  rewardAddress: null,
  score: 0,
  distance: 0,
  sol: 0,
  rawSol: 0,
  actions: 0,
  bestCombo: 0,
  elapsedTime: 0,
  nearMisses: 0,
}

const runDefaults = (): RunMetrics => ({
  score: 0,
  distance: 0,
  sol: 0,
  rawSol: 0,
  actions: 0,
  combo: 0,
  bestCombo: 0,
  speed: GAME_CONFIG.baseSpeed,
  elapsedTime: 0,
  nearMisses: 0,
})

const toFinite = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback

const nonNegative = (value: number, fallback: number): number =>
  Math.max(0, toFinite(value, fallback))

const wholeNonNegative = (value: number, fallback: number): number =>
  Math.floor(nonNegative(value, fallback))

const now = (): number => Date.now()
let pausedAt: number | null = null

const createPlayerId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

const resumePowerUp = (
  powerUp: ActivePowerUp | null,
  pauseStartedAt: number,
  resumedAt: number,
): ActivePowerUp | null => {
  if (powerUp === null || powerUp.expiresAt <= pauseStartedAt) return null
  return { ...powerUp, expiresAt: powerUp.expiresAt + Math.max(0, resumedAt - pauseStartedAt) }
}

const isActive = (powerUp: ActivePowerUp | null, type?: PowerUpType): boolean =>
  powerUp !== null && powerUp.expiresAt > now() && (type === undefined || powerUp.type === type)

const finalStatsFrom = (state: GameStore): FinalStats => ({
  runId: state.runId,
  rewardAddress: state.rewardAddress,
  score: state.score,
  distance: state.distance,
  sol: state.sol,
  rawSol: state.rawSol,
  actions: state.actions,
  bestCombo: state.bestCombo,
  elapsedTime: state.elapsedTime,
  nearMisses: state.nearMisses,
})

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      phase: 'loading',
      countdown: 3,
      runId: createPlayerId(),
      rewardAddress: null,
      playerId: createPlayerId(),
      nickname: '',
      ...runDefaults(),
      bestScore: 0,
      audioEnabled: true,
      reducedMotion: false,
      touchControls: true,
      activePowerUp: null,
      finalStats: EMPTY_FINAL_STATS,

      setNickname: (nickname) => set({ nickname: normalizeNickname(nickname) }),

      setPhase: (phase) => set({ phase }),
      setCountdown: (countdown) => set({ countdown: Math.max(0, Math.ceil(countdown)) }),

      startRun: () => {
        pausedAt = null
        const rewardProfile = selectActiveRewardProfile(useRewardStore.getState())
        set({
          phase: 'countdown',
          countdown: 3,
          runId: createPlayerId(),
          rewardAddress: rewardProfile?.eligibility === 'eligible' ? rewardProfile.address : null,
          ...runDefaults(),
          activePowerUp: null,
          finalStats: EMPTY_FINAL_STATS,
        })
      },

      finishCountdown: () =>
        set((state) =>
          state.phase === 'countdown' || state.phase === 'restarting'
            ? { phase: 'playing', countdown: 0 }
            : {},
        ),

      restartRun: () => {
        pausedAt = null
        const rewardProfile = selectActiveRewardProfile(useRewardStore.getState())
        set({
          phase: 'restarting',
          countdown: 3,
          runId: createPlayerId(),
          rewardAddress: rewardProfile?.eligibility === 'eligible' ? rewardProfile.address : null,
          ...runDefaults(),
          activePowerUp: null,
          finalStats: EMPTY_FINAL_STATS,
        })
      },

      finishRestart: () =>
        set((state) => (state.phase === 'restarting' ? { phase: 'countdown', countdown: 3 } : {})),

      returnToMenu: () => {
        pausedAt = null
        set({
          phase: 'menu',
          countdown: 3,
          rewardAddress: null,
          ...runDefaults(),
          activePowerUp: null,
        })
      },

      pauseGame: () =>
        set((state) => {
          if (state.phase !== 'playing') return {}
          pausedAt = now()
          return { phase: 'paused' }
        }),
      resumeGame: () =>
        set((state) => {
          if (state.phase !== 'paused') return {}
          const resumedAt = now()
          const pauseStartedAt = pausedAt ?? resumedAt
          pausedAt = null
          return {
            phase: 'playing',
            activePowerUp: resumePowerUp(state.activePowerUp, pauseStartedAt, resumedAt),
          }
        }),
      togglePause: () =>
        set((state) => {
          if (state.phase === 'playing') {
            pausedAt = now()
            return { phase: 'paused' }
          }
          if (state.phase === 'paused') {
            const resumedAt = now()
            const pauseStartedAt = pausedAt ?? resumedAt
            pausedAt = null
            return {
              phase: 'playing',
              activePowerUp: resumePowerUp(state.activePowerUp, pauseStartedAt, resumedAt),
            }
          }
          return {}
        }),

      endGame: () =>
        set((state) => {
          if (state.phase === 'gameover') return {}
          pausedAt = null
          const score = wholeNonNegative(state.score, 0)
          return {
            phase: 'gameover',
            score,
            bestScore: Math.max(state.bestScore, score),
            activePowerUp: null,
            finalStats: finalStatsFrom({ ...state, score }),
          }
        }),

      updateRun: (metrics) =>
        set((state) => {
          const score = wholeNonNegative(metrics.score ?? state.score, state.score)
          const distance = nonNegative(metrics.distance ?? state.distance, state.distance)
          const sol = wholeNonNegative(metrics.sol ?? state.sol, state.sol)
          const rawSol = wholeNonNegative(metrics.rawSol ?? state.rawSol, state.rawSol)
          const actions = wholeNonNegative(metrics.actions ?? state.actions, state.actions)
          const combo = wholeNonNegative(metrics.combo ?? state.combo, state.combo)
          const bestCombo = Math.max(
            state.bestCombo,
            combo,
            wholeNonNegative(metrics.bestCombo ?? state.bestCombo, state.bestCombo),
          )
          const speed = Math.min(
            GAME_CONFIG.maxSpeed,
            nonNegative(metrics.speed ?? state.speed, state.speed),
          )
          const elapsedTime = nonNegative(metrics.elapsedTime ?? state.elapsedTime, state.elapsedTime)
          const nearMisses = wholeNonNegative(metrics.nearMisses ?? state.nearMisses, state.nearMisses)
          const activePowerUp = isActive(state.activePowerUp) ? state.activePowerUp : null

          return {
            score,
            distance,
            sol,
            rawSol,
            actions,
            combo,
            bestCombo,
            speed,
            elapsedTime,
            nearMisses,
            activePowerUp,
          }
        }),

      advanceRun: (deltaSeconds, requestedSpeed) =>
        set((state) => {
          if (state.phase !== 'playing') return {}
          const delta = Math.min(0.1, nonNegative(deltaSeconds, 0))
          const naturalSpeed = Math.min(
            GAME_CONFIG.maxSpeed,
            GAME_CONFIG.baseSpeed + (state.elapsedTime + delta) * GAME_CONFIG.speedRampPerSecond,
          )
          const speed = Math.min(
            GAME_CONFIG.maxSpeed,
            nonNegative(requestedSpeed ?? naturalSpeed, naturalSpeed),
          )
          const effectiveSpeed = isActive(state.activePowerUp, 'slowTime') ? speed * 0.72 : speed
          const distanceDelta = effectiveSpeed * delta
          const rhythmMultiplier = isActive(state.activePowerUp, 'rhythm') ? 2 : 1
          const scoreDelta = distanceDelta * (10 + speed * 0.35) * rhythmMultiplier

          return {
            elapsedTime: state.elapsedTime + delta,
            distance: state.distance + distanceDelta,
            score: Math.floor(state.score + scoreDelta),
            speed,
            activePowerUp: isActive(state.activePowerUp) ? state.activePowerUp : null,
          }
        }),

      addScore: (amount) =>
        set((state) => ({ score: wholeNonNegative(state.score + toFinite(amount, 0), state.score) })),

      collectSol: (amount = 1) =>
        set((state) => {
          if (state.phase !== 'playing') return {}
          const pickupCount = Math.max(1, wholeNonNegative(amount, 1))
          const collected = isActive(state.activePowerUp, 'doubleSol') ? pickupCount * 2 : pickupCount
          const combo = state.combo + pickupCount
          const comboMultiplier = 1 + Math.min(3, Math.floor((combo - 1) / 5) * 0.25)
          const rhythmMultiplier = isActive(state.activePowerUp, 'rhythm') ? 2 : 1
          const pickupScore = Math.floor(collected * 100 * comboMultiplier * rhythmMultiplier)

          return {
            sol: state.sol + collected,
            rawSol: state.rawSol + pickupCount,
            combo,
            bestCombo: Math.max(state.bestCombo, combo),
            score: state.score + pickupScore,
          }
        }),

      registerAction: () =>
        set((state) => (state.phase === 'playing' ? { actions: state.actions + 1 } : {})),

      setCombo: (nextCombo) =>
        set((state) => {
          const combo = wholeNonNegative(nextCombo, state.combo)
          return { combo, bestCombo: Math.max(state.bestCombo, combo) }
        }),
      breakCombo: () => set({ combo: 0 }),

      registerNearMiss: () =>
        set((state) => {
          if (state.phase !== 'playing') return {}
          const multiplier = isActive(state.activePowerUp, 'rhythm') ? 2 : 1
          return { nearMisses: state.nearMisses + 1, score: state.score + 250 * multiplier }
        }),

      activatePowerUp: (type, duration = GAME_CONFIG.powerUpDuration) => {
        const safeDuration = Math.max(0.1, nonNegative(duration, GAME_CONFIG.powerUpDuration))
        set({
          activePowerUp: {
            type,
            duration: safeDuration,
            expiresAt: now() + safeDuration * 1000,
          },
        })
      },

      clearPowerUp: (type) =>
        set((state) =>
          state.activePowerUp !== null && (type === undefined || state.activePowerUp.type === type)
            ? { activePowerUp: null }
            : {},
        ),

      consumeShield: () => {
        const state = get()
        if (!isActive(state.activePowerUp, 'shield')) return false
        set({ activePowerUp: null })
        return true
      },

      toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
      setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
      toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setTouchControls: (touchControls) => set({ touchControls }),
    }),
    {
      name: 'meowave-settings-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playerId: state.playerId,
        nickname: state.nickname,
        bestScore: state.bestScore,
        audioEnabled: state.audioEnabled,
        reducedMotion: state.reducedMotion,
        touchControls: state.touchControls,
      }),
    },
  ),
)

export const gameStore = useGameStore
export const getGameState = useGameStore.getState

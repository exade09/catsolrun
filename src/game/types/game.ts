import type { Lane } from '../config/gameConfig'

export type ObstacleType =
  | 'barrier'
  | 'speakers'
  | 'wall'
  | 'beam'
  | 'crate'
  | 'gate'
  | 'gap'
  | 'platform'
  | 'roller'
  | 'pulse'

export type Avoidance = 'jump' | 'slide' | 'lane'

export type PowerUpType = 'magnet' | 'shield' | 'rhythm' | 'slowTime' | 'doubleSol'

export interface TrackEntity {
  id: string
  kind: 'obstacle' | 'sol' | 'powerup'
  lane: Lane
  offset: number
  height?: number
  obstacleType?: ObstacleType
  avoidance?: Avoidance
  powerUpType?: PowerUpType
  moving?: boolean
}

export interface SegmentDefinition {
  id: number
  environment: 'plaza' | 'tunnel' | 'dataway'
  entities: TrackEntity[]
}

export interface PlayerRuntime {
  lane: Lane
  x: number
  y: number
  verticalVelocity: number
  grounded: boolean
  sliding: boolean
  landingPulse: number
  damagedAt: number
}

export interface ParticleBurstHandle {
  burst: (x: number, y: number, z: number, color?: string) => void
}

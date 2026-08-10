import type { Lane } from '../config/gameConfig'
import type { SegmentDefinition, TrackEntity } from '../types/game'

const sol = (id: string, lane: Lane, offset: number, height = 1.15): TrackEntity => ({
  id,
  kind: 'sol',
  lane,
  offset,
  height,
})

const obstacle = (
  id: string,
  lane: Lane,
  offset: number,
  obstacleType: NonNullable<TrackEntity['obstacleType']>,
  avoidance: NonNullable<TrackEntity['avoidance']>,
  moving = false,
): TrackEntity => ({ id, kind: 'obstacle', lane, offset, obstacleType, avoidance, moving })

const powerup = (
  id: string,
  lane: Lane,
  offset: number,
  powerUpType: NonNullable<TrackEntity['powerUpType']>,
): TrackEntity => ({ id, kind: 'powerup', lane, offset, height: 1.2, powerUpType })

export const SEGMENTS: SegmentDefinition[] = [
  { id: 0, environment: 'plaza', entities: [sol('reward-note-01-warmup', 0, 8)] },
  {
    id: 1,
    environment: 'plaza',
    entities: [obstacle('warmup-barrier', 0, 12, 'barrier', 'jump')],
  },
  {
    id: 2,
    environment: 'plaza',
    entities: [obstacle('single-crate', -1, 8, 'crate', 'lane')],
  },
  {
    id: 3,
    environment: 'dataway',
    entities: [
      sol('reward-note-02-side-route', 1, 4),
      obstacle('gate-center', 0, 9, 'gate', 'slide'),
      powerup('shield-one', 1, 15, 'shield'),
    ],
  },
  {
    id: 4,
    environment: 'dataway',
    entities: [
      obstacle('speaker-left', -1, 10, 'speakers', 'lane'),
      obstacle('speaker-right', 1, 10, 'speakers', 'lane'),
    ],
  },
  {
    id: 5,
    environment: 'plaza',
    entities: [obstacle('low-wall', 0, 9, 'wall', 'jump'), powerup('magnet-one', -1, 16, 'magnet')],
  },
  {
    id: 6,
    environment: 'tunnel',
    entities: [
      sol('reward-note-03-tunnel-line', -1, 3),
      obstacle('crate-right', 1, 17, 'crate', 'lane', true),
    ],
  },
  {
    id: 7,
    environment: 'tunnel',
    entities: [obstacle('beam-all', 0, 10, 'beam', 'jump'), powerup('rhythm-one', 1, 17, 'rhythm')],
  },
  {
    id: 8,
    environment: 'dataway',
    entities: [
      obstacle('pulse-left', -1, 9, 'pulse', 'lane'),
      obstacle('pulse-center', 0, 9, 'pulse', 'lane'),
      sol('reward-note-04-pulse-safe', 1, 12),
    ],
  },
  {
    id: 9,
    environment: 'plaza',
    entities: [
      obstacle('track-gap', 0, 10, 'gap', 'jump'),
      obstacle('track-gap-l', -1, 10, 'gap', 'jump'),
      obstacle('track-gap-r', 1, 10, 'gap', 'jump'),
    ],
  },
  {
    id: 10,
    environment: 'plaza',
    entities: [obstacle('roller-center', 0, 9, 'roller', 'lane', true), powerup('slow-one', -1, 17, 'slowTime')],
  },
  {
    id: 11,
    environment: 'tunnel',
    entities: [
      obstacle('speaker-center', 0, 7, 'speakers', 'lane'),
      obstacle('sliding-platform', -1, 12, 'platform', 'lane', true),
      obstacle('high-gate-left', -1, 16, 'gate', 'slide'),
    ],
  },
  {
    id: 12,
    environment: 'dataway',
    entities: [
      sol('reward-note-05-data-line', 0, 3),
      obstacle('moving-left', -1, 8, 'crate', 'lane', true),
      obstacle('wall-right', 1, 14, 'wall', 'jump'),
      powerup('double-one', 0, 18, 'doubleSol'),
    ],
  },
  {
    id: 13,
    environment: 'dataway',
    entities: [
      obstacle('final-pulse', 1, 8, 'pulse', 'lane'),
      obstacle('final-barrier', -1, 14, 'barrier', 'jump'),
    ],
  },
]

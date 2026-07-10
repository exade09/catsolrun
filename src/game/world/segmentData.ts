import type { Lane } from '../config/gameConfig'
import type { SegmentDefinition, TrackEntity } from '../types/game'

const lanes: Lane[] = [-1, 0, 1]

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

const line = (prefix: string, lane: Lane, from: number, count: number, step = 2.1): TrackEntity[] =>
  Array.from({ length: count }, (_, index) => sol(`${prefix}-${index}`, lane, from + index * step))

const arch = (prefix: string, lane: Lane, from: number): TrackEntity[] =>
  [0.95, 1.45, 1.95, 1.45, 0.95].map((height, index) =>
    sol(`${prefix}-${index}`, lane, from + index * 1.45, height),
  )

const zigzag = (prefix: string, from: number): TrackEntity[] =>
  Array.from({ length: 7 }, (_, index) =>
    sol(`${prefix}-${index}`, lanes[index % lanes.length] ?? 0, from + index * 1.9),
  )

export const SEGMENTS: SegmentDefinition[] = [
  { id: 0, environment: 'plaza', entities: [...line('warmup-a', 0, 4, 7, 2)] },
  {
    id: 1,
    environment: 'plaza',
    entities: [...line('warmup-b', -1, 3, 4), obstacle('warmup-barrier', 0, 12, 'barrier', 'jump'), ...line('warmup-c', 1, 12, 3)],
  },
  {
    id: 2,
    environment: 'plaza',
    entities: [obstacle('single-crate', -1, 8, 'crate', 'lane'), ...line('open-path', 1, 5, 6, 2.1)],
  },
  {
    id: 3,
    environment: 'dataway',
    entities: [obstacle('gate-center', 0, 9, 'gate', 'slide'), ...line('gate-lead', 0, 3, 3), powerup('shield-one', 1, 15, 'shield')],
  },
  {
    id: 4,
    environment: 'dataway',
    entities: [obstacle('speaker-left', -1, 10, 'speakers', 'lane'), obstacle('speaker-right', 1, 10, 'speakers', 'lane'), ...line('safe-middle', 0, 4, 7, 1.9)],
  },
  {
    id: 5,
    environment: 'plaza',
    entities: [obstacle('low-wall', 0, 9, 'wall', 'jump'), ...arch('wall-arch', 0, 5), powerup('magnet-one', -1, 16, 'magnet')],
  },
  {
    id: 6,
    environment: 'tunnel',
    entities: [...zigzag('zig', 3), obstacle('crate-right', 1, 17, 'crate', 'lane', true)],
  },
  {
    id: 7,
    environment: 'tunnel',
    entities: [obstacle('beam-all', 0, 10, 'beam', 'jump'), ...arch('beam-arch', 0, 5), powerup('rhythm-one', 1, 17, 'rhythm')],
  },
  {
    id: 8,
    environment: 'dataway',
    entities: [obstacle('pulse-left', -1, 9, 'pulse', 'lane'), obstacle('pulse-center', 0, 9, 'pulse', 'lane'), ...line('pulse-safe', 1, 4, 7, 2)],
  },
  {
    id: 9,
    environment: 'plaza',
    entities: [obstacle('track-gap', 0, 10, 'gap', 'jump'), obstacle('track-gap-l', -1, 10, 'gap', 'jump'), obstacle('track-gap-r', 1, 10, 'gap', 'jump'), ...arch('gap-arch', 0, 5)],
  },
  {
    id: 10,
    environment: 'plaza',
    entities: [obstacle('roller-center', 0, 9, 'roller', 'lane', true), ...line('roller-left', -1, 3, 7, 2), powerup('slow-one', -1, 17, 'slowTime')],
  },
  {
    id: 11,
    environment: 'tunnel',
    entities: [obstacle('speaker-center', 0, 7, 'speakers', 'lane'), obstacle('sliding-platform', -1, 12, 'platform', 'lane', true), obstacle('high-gate-left', -1, 16, 'gate', 'slide'), ...line('switch-path', 1, 3, 7, 2)],
  },
  {
    id: 12,
    environment: 'dataway',
    entities: [obstacle('moving-left', -1, 8, 'crate', 'lane', true), obstacle('wall-right', 1, 14, 'wall', 'jump'), ...zigzag('risk-zig', 3), powerup('double-one', 0, 18, 'doubleSol')],
  },
  {
    id: 13,
    environment: 'dataway',
    entities: [obstacle('final-pulse', 1, 8, 'pulse', 'lane'), obstacle('final-barrier', -1, 14, 'barrier', 'jump'), ...line('combo-finish', 0, 3, 8, 1.8)],
  },
]

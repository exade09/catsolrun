export const GAME_CONFIG = {
  laneWidth: 2.55,
  lanes: [-1, 0, 1] as const,
  playerZ: 2.2,
  baseSpeed: 10.5,
  maxSpeed: 24,
  speedRampPerSecond: 0.085,
  jumpVelocity: 8.2,
  gravity: 20.5,
  slideDuration: 0.72,
  laneLerp: 13,
  segmentLength: 20,
  segmentCount: 14,
  collisionGrace: 1.15,
  comboWindow: 3.25,
  powerUpDuration: 8,
} as const

export type Lane = (typeof GAME_CONFIG.lanes)[number]

export const COLORS = {
  orange: '#c9823f',
  orangeLight: '#e3a663',
  cream: '#f4ead8',
  white: '#fffaf0',
  charcoal: '#24272d',
  graphite: '#4f555d',
  concrete: '#777d82',
  concreteDark: '#343a40',
  purple: '#9945ff',
  cyan: '#14f1d9',
  green: '#7dff86',
  warning: '#ffb84d',
  danger: '#ff5470',
} as const

export const POWER_UP_LABELS = {
  magnet: 'SOL Magnet',
  shield: 'Signal Shield',
  rhythm: 'Rhythm Boost',
  slowTime: 'Slow Time',
  doubleSol: 'Double SOL',
} as const

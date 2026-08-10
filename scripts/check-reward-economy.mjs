import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(scriptDirectory, '..')
const segmentSource = readFileSync(join(projectRoot, 'src/game/world/segmentData.ts'), 'utf8')
const rewardRulesSource = readFileSync(join(projectRoot, 'src/rewards/rewardRules.ts'), 'utf8')
const gameConfigSource = readFileSync(join(projectRoot, 'src/game/config/gameConfig.ts'), 'utf8')
const whitepaper = readFileSync(join(projectRoot, 'public/MEOWAVE-REWARD-WHITEPAPER.md'), 'utf8')

const readExportedInteger = (name) => {
  const match = rewardRulesSource.match(new RegExp(`export const ${name} = ([0-9_]+)`))
  if (!match) throw new Error(`Reward economy check failed: missing ${name} in rewardRules.ts`)
  return Number(match[1].replaceAll('_', ''))
}

const readGameNumber = (name) => {
  const match = gameConfigSource.match(new RegExp(`${name}:\\s*([0-9_.]+)`))
  if (!match) throw new Error(`Reward economy check failed: missing ${name} in gameConfig.ts`)
  return Number(match[1].replaceAll('_', ''))
}

const baseSpeed = readGameNumber('baseSpeed')
const maxSpeed = readGameNumber('maxSpeed')
const speedRampPerSecond = readGameNumber('speedRampPerSecond')
const typicalRunSeconds = 4 * 60
const secondsToSpeedCap = (maxSpeed - baseSpeed) / speedRampPerSecond
const accelerationSeconds = Math.min(typicalRunSeconds, secondsToSpeedCap)
const typicalRunDistance =
  baseSpeed * accelerationSeconds
  + 0.5 * speedRampPerSecond * accelerationSeconds ** 2
  + Math.max(0, typicalRunSeconds - secondsToSpeedCap) * maxSpeed
const rawModeledDistancePerHour = typicalRunDistance * 3_600 / typicalRunSeconds
const modeledDistanceMetersPerHour = Math.round(rawModeledDistancePerHour / 1_000) * 1_000
const simulatedLamportsPerDemoSol = readExportedInteger('SIMULATED_LAMPORTS_PER_SOL')

const MODEL = Object.freeze({
  segmentCount: readGameNumber('segmentCount'),
  segmentLengthMeters: readGameNumber('segmentLength'),
  rewardNotesPerCycle: 5,
  modeledDistanceMetersPerHour,
  collectionRate: 2 / 3,
  simulatedLamportsPerNote: readExportedInteger('PICKUP_REWARD_LAMPORTS'),
  simulatedLamportsPerDemoSol,
  minimumWithdrawalDemoSol: readExportedInteger('MIN_WITHDRAWAL_LAMPORTS') / simulatedLamportsPerDemoSol,
  minimumActiveHours: readExportedInteger('WITHDRAWAL_ACTIVE_GATE_SECONDS') / 3_600,
  typicalActiveHours: 3,
  hourlyCapDemoSol: readExportedInteger('HOURLY_REWARD_CAP_LAMPORTS') / simulatedLamportsPerDemoSol,
  dailyCapDemoSol: readExportedInteger('DAILY_REWARD_CAP_LAMPORTS') / simulatedLamportsPerDemoSol,
  meaningfulActionIntervalSeconds: readExportedInteger('MEANINGFUL_ACTION_INTERVAL_SECONDS'),
})

const fail = (message) => {
  throw new Error(`Reward economy check failed: ${message}`)
}

const assert = (condition, message) => {
  if (!condition) fail(message)
}

const approximatelyEqual = (left, right, tolerance = 1e-10) =>
  Math.abs(left - right) <= tolerance

const rewardNoteCalls = [...segmentSource.matchAll(/\bsol\(\s*(['"])([^'"]+)\1/g)].map(
  (match) => match[2],
)
const uniqueRewardNoteIds = new Set(rewardNoteCalls)
const segmentIds = [...segmentSource.matchAll(/\{\s*id:\s*(\d+),\s*environment:/g)].map(
  (match) => Number(match[1]),
)

assert(
  rewardNoteCalls.length === MODEL.rewardNotesPerCycle,
  `expected exactly ${MODEL.rewardNotesPerCycle} direct sol(...) entries, found ${rewardNoteCalls.length}`,
)
assert(
  rewardNoteCalls.every((id) => id.startsWith('reward-note-')),
  'every physical SOL collectible must use a reward-note-* id',
)
assert(
  uniqueRewardNoteIds.size === MODEL.rewardNotesPerCycle,
  'reward-note ids must be unique within the track cycle',
)
assert(segmentIds.length === MODEL.segmentCount, `expected ${MODEL.segmentCount} track segments`)
assert(
  segmentIds.every((id, index) => id === index),
  'track segment ids must form the complete ordered range 0-13',
)

const cycleDistance = MODEL.segmentCount * MODEL.segmentLengthMeters
const noteOpportunitiesPerHour =
  (MODEL.modeledDistanceMetersPerHour / cycleDistance) * MODEL.rewardNotesPerCycle
const expectedNotesPerHour = noteOpportunitiesPerHour * MODEL.collectionRate
const expectedDemoSolPerHour =
  (expectedNotesPerHour * MODEL.simulatedLamportsPerNote) /
  MODEL.simulatedLamportsPerDemoSol
const typicalThreeHourBalance = expectedDemoSolPerHour * MODEL.typicalActiveHours
const fastestEligibleBalance = MODEL.hourlyCapDemoSol * MODEL.minimumActiveHours

assert(cycleDistance === 280, `expected a 280 m cycle, calculated ${cycleDistance} m`)
assert(
  rawModeledDistancePerHour >= 69_000 && rawModeledDistancePerHour <= 71_000,
  `four-minute speed-ramp model drifted to ${rawModeledDistancePerHour.toFixed(1)} m/hour`,
)
assert(noteOpportunitiesPerHour === 1_250, 'modeled note opportunities must equal 1,250 per hour')
assert(
  approximatelyEqual(expectedNotesPerHour, 833.3333333333333),
  `expected about 833 notes per hour, calculated ${expectedNotesPerHour}`,
)
assert(
  approximatelyEqual(expectedDemoSolPerHour, 1 / 12),
  `expected about 0.0833 Demo SOL per hour, calculated ${expectedDemoSolPerHour}`,
)
assert(
  approximatelyEqual(typicalThreeHourBalance, MODEL.minimumWithdrawalDemoSol),
  'three typical active hours must reach the 0.25 Demo SOL minimum',
)
assert(
  fastestEligibleBalance === MODEL.minimumWithdrawalDemoSol,
  'the hourly cap and two-hour gate must make 0.25 the earliest possible threshold',
)
assert(
  MODEL.dailyCapDemoSol >= MODEL.minimumWithdrawalDemoSol,
  'the daily cap must allow one minimum simulated withdrawal',
)
assert(MODEL.meaningfulActionIntervalSeconds === 30, 'meaningful play must require input every 30 seconds on average')

const requiredWhitepaperPatterns = [
  /not real cryptocurrency/i,
  /no on-chain balance verification/i,
  /no blockchain transaction/i,
  /no guaranteed (?:monetary )?value/i,
  /100,000 simulated lamports/i,
  /0\.0833 Demo SOL/i,
  /0\.125 Demo SOL/i,
  /0\.30 Demo SOL/i,
  /minimum[^\n]*0\.25 Demo SOL/i,
  /2 active hours/i,
  /3 active hours/i,
  /Double SOL[^\n]*does not multiply/i,
  /not retroactive/i,
  /four-minute/i,
  /client-reported/i,
  /optional[^\n]*server/i,
]

for (const pattern of requiredWhitepaperPatterns) {
  assert(pattern.test(whitepaper), `whitepaper is missing required disclosure or value: ${pattern}`)
}

console.log('Reward economy check passed.')
console.log(`Track: ${MODEL.rewardNotesPerCycle} reward notes / ${cycleDistance} m cycle`)
console.log(`Model: ${noteOpportunitiesPerHour.toLocaleString('en-US')} opportunities/hour`)
console.log(`Speed curve: ${rawModeledDistancePerHour.toFixed(0)} m/hour across repeated four-minute runs`)
console.log(`Expected collection: ${expectedNotesPerHour.toFixed(1)} notes/hour`)
console.log(`Expected credit rate: ${expectedDemoSolPerHour.toFixed(4)} Demo SOL/hour`)
console.log(`Typical threshold: ${typicalThreeHourBalance.toFixed(2)} Demo SOL in ${MODEL.typicalActiveHours} active hours`)

import { neon } from '@neondatabase/serverless'
import {
  DAILY_REWARD_CAP_LAMPORTS,
  HOURLY_REWARD_CAP_LAMPORTS,
  MAX_CREDIT_RUN_SECONDS,
  MAX_ACTIONS_PER_RUN,
  MAX_ACTIONS_PER_SECOND,
  MAX_RAW_PICKUPS_PER_RUN,
  MEANINGFUL_ACTION_INTERVAL_SECONDS,
  MIN_MEANINGFUL_RUN_ACTIONS,
  MIN_MEANINGFUL_RUN_SECONDS,
  MIN_WITHDRAWAL_LAMPORTS,
  PICKUP_REWARD_LAMPORTS,
  REWARD_RULES,
  SIMULATED_ELIGIBILITY_THRESHOLD_USD_CENTS,
  SIMULATED_REWARD_CURRENCY,
  SIMULATED_REWARD_DISCLAIMER,
  WITHDRAWAL_ACTIVE_GATE_SECONDS,
  calculateRunCredit,
  isMeaningfulRun,
} from '../src/rewards/rewardRules.js'
import type {
  CreditRunRequest,
  RegisterRewardRequest,
  RewardCreditResponse,
  RewardHistoryEntry,
  RewardMutationRequest,
  RewardSnapshot,
  RewardSnapshotResponse,
  RewardWithdrawalResponse,
  RunCreditResult,
  SimulateEligibilityRequest,
  SimulatedWithdrawalHistoryEntry,
  SimulatedWithdrawalResult,
  WithdrawRewardRequest,
} from '../src/rewards/types.js'

type Sql = ReturnType<typeof neon>
type DatabaseInteger = number | string | bigint
type DatabaseTimestamp = string | Date

interface RewardAccountRow {
  player_id: string
  wallet_address: string
  eligibility_mode: 'simulation'
  eligibility_passed: boolean
  balance_lamports: DatabaseInteger
  lifetime_earned_lamports: DatabaseInteger
  lifetime_withdrawn_lamports: DatabaseInteger
  verified_active_seconds: DatabaseInteger
  current_daily_earned_lamports: DatabaseInteger
}

interface RewardHistoryRow {
  event_key: string
  kind: 'run_credit' | 'simulated_withdrawal'
  delta_lamports: DatabaseInteger
  balance_after_lamports: DatabaseInteger
  run_id: string | null
  withdrawal_request_id: string | null
  created_at: DatabaseTimestamp
}

interface WithdrawalHistoryRow {
  request_id: string
  amount_lamports: DatabaseInteger
  status: 'simulated_complete' | 'rejected'
  reason: string | null
  created_at: DatabaseTimestamp
}

interface RewardRunRow {
  run_id: string
  player_id: string
  wallet_address: string
  active_seconds: number | string
  raw_pickups: number | string
  actions: number | string
  meaningful_run: boolean
  credited_active_seconds: number | string
  pickup_credit_lamports: DatabaseInteger
  prorated_hourly_cap_lamports: DatabaseInteger
  calculated_credit_lamports: DatabaseInteger
  credited_lamports: DatabaseInteger
  created_at: DatabaseTimestamp
  idempotent_replay?: boolean
}

interface WithdrawalRow {
  request_id: string
  player_id: string
  wallet_address: string
  amount_lamports: DatabaseInteger
  status: 'simulated_complete' | 'rejected'
  reason: string | null
  created_at: DatabaseTimestamp
  idempotent_replay?: boolean
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE58_VALUES = new Map(Array.from(BASE58_ALPHABET, (character, index) => [character, BigInt(index)]))
const DEFAULT_HISTORY_LIMIT = 20
const MAX_HISTORY_LIMIT = 50
let schemaPromise: Promise<void> | null = null

function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      ...headers,
    },
  })
}

function getDatabase(): Sql | null {
  const databaseUrl = process.env.DATABASE_URL
  return databaseUrl ? neon(databaseUrl) : null
}

async function ensureSchema(sql: Sql): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS meowave_reward_accounts (
          player_id UUID NOT NULL,
          wallet_address VARCHAR(44) NOT NULL CHECK (CHAR_LENGTH(wallet_address) BETWEEN 32 AND 44),
          eligibility_mode VARCHAR(16) NOT NULL DEFAULT 'simulation' CHECK (eligibility_mode = 'simulation'),
          eligibility_passed BOOLEAN NOT NULL DEFAULT FALSE,
          eligibility_checked_at TIMESTAMPTZ,
          balance_lamports BIGINT NOT NULL DEFAULT 0 CHECK (balance_lamports >= 0),
          lifetime_earned_lamports BIGINT NOT NULL DEFAULT 0 CHECK (lifetime_earned_lamports >= 0),
          lifetime_withdrawn_lamports BIGINT NOT NULL DEFAULT 0 CHECK (lifetime_withdrawn_lamports >= 0),
          verified_active_seconds BIGINT NOT NULL DEFAULT 0 CHECK (verified_active_seconds >= 0),
          daily_earned_on DATE NOT NULL DEFAULT CURRENT_DATE,
          daily_earned_lamports BIGINT NOT NULL DEFAULT 0 CHECK (daily_earned_lamports >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (player_id, wallet_address)
        )
      `
      await sql`
        CREATE TABLE IF NOT EXISTS meowave_reward_runs (
          run_id UUID PRIMARY KEY,
          player_id UUID NOT NULL,
          wallet_address VARCHAR(44) NOT NULL,
          active_seconds INTEGER NOT NULL CHECK (active_seconds BETWEEN 1 AND 3600),
          raw_pickups INTEGER NOT NULL CHECK (raw_pickups BETWEEN 0 AND 100000),
          actions INTEGER NOT NULL CHECK (actions BETWEEN 0 AND 43200),
          meaningful_run BOOLEAN NOT NULL,
          credited_active_seconds INTEGER NOT NULL CHECK (credited_active_seconds BETWEEN 0 AND active_seconds),
          pickup_credit_lamports BIGINT NOT NULL CHECK (pickup_credit_lamports >= 0),
          prorated_hourly_cap_lamports BIGINT NOT NULL CHECK (prorated_hourly_cap_lamports >= 0),
          calculated_credit_lamports BIGINT NOT NULL CHECK (calculated_credit_lamports >= 0),
          credited_lamports BIGINT NOT NULL CHECK (credited_lamports >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          FOREIGN KEY (player_id, wallet_address)
            REFERENCES meowave_reward_accounts (player_id, wallet_address)
            ON DELETE CASCADE
        )
      `
      await sql`
        ALTER TABLE meowave_reward_runs
          ADD COLUMN IF NOT EXISTS actions INTEGER NOT NULL DEFAULT 0 CHECK (actions BETWEEN 0 AND 43200),
          ADD COLUMN IF NOT EXISTS meaningful_run BOOLEAN NOT NULL DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS credited_active_seconds INTEGER NOT NULL DEFAULT 0
            CHECK (credited_active_seconds BETWEEN 0 AND active_seconds)
      `
      await sql`
        CREATE INDEX IF NOT EXISTS meowave_reward_runs_account_history_idx
        ON meowave_reward_runs (player_id, wallet_address, created_at DESC)
      `
      await sql`
        CREATE TABLE IF NOT EXISTS meowave_reward_withdrawals (
          request_id UUID PRIMARY KEY,
          player_id UUID NOT NULL,
          wallet_address VARCHAR(44) NOT NULL,
          amount_lamports BIGINT NOT NULL CHECK (amount_lamports > 0),
          status VARCHAR(24) NOT NULL CHECK (status IN ('simulated_complete', 'rejected')),
          reason VARCHAR(160),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          FOREIGN KEY (player_id, wallet_address)
            REFERENCES meowave_reward_accounts (player_id, wallet_address)
            ON DELETE CASCADE
        )
      `
      await sql`
        CREATE INDEX IF NOT EXISTS meowave_reward_withdrawals_account_history_idx
        ON meowave_reward_withdrawals (player_id, wallet_address, created_at DESC)
      `
      await sql`
        CREATE TABLE IF NOT EXISTS meowave_reward_ledger (
          event_key VARCHAR(96) PRIMARY KEY,
          player_id UUID NOT NULL,
          wallet_address VARCHAR(44) NOT NULL,
          kind VARCHAR(32) NOT NULL CHECK (kind IN ('run_credit', 'simulated_withdrawal')),
          delta_lamports BIGINT NOT NULL,
          balance_after_lamports BIGINT NOT NULL CHECK (balance_after_lamports >= 0),
          run_id UUID UNIQUE REFERENCES meowave_reward_runs (run_id) ON DELETE CASCADE,
          withdrawal_request_id UUID UNIQUE REFERENCES meowave_reward_withdrawals (request_id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CHECK (
            (kind = 'run_credit' AND run_id IS NOT NULL AND withdrawal_request_id IS NULL AND delta_lamports >= 0)
            OR
            (kind = 'simulated_withdrawal' AND run_id IS NULL AND withdrawal_request_id IS NOT NULL AND delta_lamports < 0)
          ),
          FOREIGN KEY (player_id, wallet_address)
            REFERENCES meowave_reward_accounts (player_id, wallet_address)
            ON DELETE CASCADE
        )
      `
      await sql`
        CREATE INDEX IF NOT EXISTS meowave_reward_ledger_account_history_idx
        ON meowave_reward_ledger (player_id, wallet_address, created_at DESC)
      `
    })().catch((error: unknown) => {
      schemaPromise = null
      throw error
    })
  }
  await schemaPromise
}

function toIntegerString(value: DatabaseInteger): string {
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'number') return Math.trunc(value).toString()
  return value
}

function toSafeInteger(value: DatabaseInteger): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isSafeInteger(parsed) ? parsed : 0
}

function toIsoString(value: DatabaseTimestamp): string {
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
}

function normalizeWalletAddress(value: string): string {
  return value.trim()
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function isSolanaPublicKey(value: string): boolean {
  if (value.length < 32 || value.length > 44) return false

  let numericValue = 0n
  let leadingZeroBytes = 0
  let readingLeadingZeros = true

  for (const character of value) {
    const digit = BASE58_VALUES.get(character)
    if (digit === undefined) return false
    if (readingLeadingZeros && character === '1') leadingZeroBytes += 1
    else readingLeadingZeros = false
    numericValue = numericValue * 58n + digit
  }

  let encodedBytes = 0
  while (numericValue > 0n) {
    encodedBytes += 1
    numericValue >>= 8n
  }

  return leadingZeroBytes + encodedBytes === 32
}

function parseHistoryLimit(url: URL): number {
  const requested = Number(url.searchParams.get('limit') ?? DEFAULT_HISTORY_LIMIT)
  if (!Number.isInteger(requested)) return DEFAULT_HISTORY_LIMIT
  return Math.min(MAX_HISTORY_LIMIT, Math.max(1, requested))
}

function parseIdentity(value: unknown): { playerId?: string; walletAddress?: string; error?: string } {
  if (!value || typeof value !== 'object') return { error: 'Invalid reward profile' }
  const candidate = value as { playerId?: unknown; walletAddress?: unknown }
  if (typeof candidate.playerId !== 'string' || !isUuid(candidate.playerId)) {
    return { error: 'Invalid player profile' }
  }
  if (typeof candidate.walletAddress !== 'string') return { error: 'A Solana wallet address is required' }
  const walletAddress = normalizeWalletAddress(candidate.walletAddress)
  if (!isSolanaPublicKey(walletAddress)) return { error: 'Enter a valid Solana public address' }
  return { playerId: candidate.playerId, walletAddress }
}

function parseMutation(value: unknown): { request?: RewardMutationRequest; error?: string } {
  if (!value || typeof value !== 'object') return { error: 'Invalid reward request' }
  const body = value as Record<string, unknown>
  const identity = parseIdentity(body)
  if (!identity.playerId || !identity.walletAddress) return { error: identity.error }

  if (body.action === 'register') {
    return {
      request: {
        action: 'register',
        playerId: identity.playerId,
        walletAddress: identity.walletAddress,
      } satisfies RegisterRewardRequest,
    }
  }

  if (body.action === 'simulateEligibility') {
    return {
      request: {
        action: 'simulateEligibility',
        playerId: identity.playerId,
        walletAddress: identity.walletAddress,
      } satisfies SimulateEligibilityRequest,
    }
  }

  if (body.action === 'creditRun') {
    if (typeof body.runId !== 'string' || !isUuid(body.runId)) return { error: 'Invalid run identifier' }
    if (!Number.isInteger(body.activeSeconds) || (body.activeSeconds as number) < 1 || (body.activeSeconds as number) > MAX_CREDIT_RUN_SECONDS) {
      return { error: `Active run time must be between 1 and ${MAX_CREDIT_RUN_SECONDS} seconds` }
    }
    if (!Number.isInteger(body.rawPickups) || (body.rawPickups as number) < 0 || (body.rawPickups as number) > MAX_RAW_PICKUPS_PER_RUN) {
      return { error: `Raw pickup count must be between 0 and ${MAX_RAW_PICKUPS_PER_RUN}` }
    }
    const maximumActionsForDuration = Math.min(
      MAX_ACTIONS_PER_RUN,
      (body.activeSeconds as number) * MAX_ACTIONS_PER_SECOND + 4,
    )
    if (!Number.isInteger(body.actions) || (body.actions as number) < 0 || (body.actions as number) > maximumActionsForDuration) {
      return { error: `Action count must be between 0 and ${maximumActionsForDuration} for this run` }
    }
    return {
      request: {
        action: 'creditRun',
        playerId: identity.playerId,
        walletAddress: identity.walletAddress,
        runId: body.runId,
        activeSeconds: body.activeSeconds as number,
        rawPickups: body.rawPickups as number,
        actions: body.actions as number,
      } satisfies CreditRunRequest,
    }
  }

  if (body.action === 'withdraw') {
    if (typeof body.requestId !== 'string' || !isUuid(body.requestId)) return { error: 'Invalid withdrawal request identifier' }
    if (!Number.isSafeInteger(body.amountLamports) || (body.amountLamports as number) < MIN_WITHDRAWAL_LAMPORTS) {
      return { error: `The minimum simulated withdrawal is ${MIN_WITHDRAWAL_LAMPORTS} lamports` }
    }
    return {
      request: {
        action: 'withdraw',
        playerId: identity.playerId,
        walletAddress: identity.walletAddress,
        requestId: body.requestId,
        amountLamports: body.amountLamports as number,
      } satisfies WithdrawRewardRequest,
    }
  }

  return { error: 'Unknown reward action' }
}

function toSnapshot(row: RewardAccountRow): RewardSnapshot {
  const balanceLamports = toIntegerString(row.balance_lamports)
  const eligibleActiveSeconds = toSafeInteger(row.verified_active_seconds)
  const canWithdraw = row.eligibility_passed
    && BigInt(balanceLamports) >= BigInt(MIN_WITHDRAWAL_LAMPORTS)
    && eligibleActiveSeconds >= WITHDRAWAL_ACTIVE_GATE_SECONDS

  return {
    simulation: true,
    currency: SIMULATED_REWARD_CURRENCY,
    playerId: row.player_id,
    walletAddress: row.wallet_address,
    eligibilityMode: 'simulation',
    eligibilityPassed: row.eligibility_passed,
    balanceLamports,
    lifetimeEarnedLamports: toIntegerString(row.lifetime_earned_lamports),
    lifetimeWithdrawnLamports: toIntegerString(row.lifetime_withdrawn_lamports),
    eligibleActiveSeconds,
    dailyEarnedLamports: toIntegerString(row.current_daily_earned_lamports),
    canWithdraw,
    rules: {
      eligibilityThresholdUsdCents: SIMULATED_ELIGIBILITY_THRESHOLD_USD_CENTS,
      minimumWithdrawalLamports: MIN_WITHDRAWAL_LAMPORTS.toString(),
      withdrawalActiveGateSeconds: WITHDRAWAL_ACTIVE_GATE_SECONDS,
      pickupRewardLamports: PICKUP_REWARD_LAMPORTS.toString(),
      hourlyCapLamports: HOURLY_REWARD_CAP_LAMPORTS.toString(),
      dailyCapLamports: DAILY_REWARD_CAP_LAMPORTS.toString(),
      minimumMeaningfulRunSeconds: MIN_MEANINGFUL_RUN_SECONDS,
      minimumMeaningfulRunActions: MIN_MEANINGFUL_RUN_ACTIONS,
      meaningfulActionIntervalSeconds: MEANINGFUL_ACTION_INTERVAL_SECONDS,
    },
    disclaimer: SIMULATED_REWARD_DISCLAIMER,
  }
}

function toHistoryEntry(row: RewardHistoryRow): RewardHistoryEntry {
  return {
    eventKey: row.event_key,
    kind: row.kind,
    deltaLamports: toIntegerString(row.delta_lamports),
    balanceAfterLamports: toIntegerString(row.balance_after_lamports),
    runId: row.run_id,
    withdrawalRequestId: row.withdrawal_request_id,
    createdAt: toIsoString(row.created_at),
  }
}

function toWithdrawalHistoryEntry(row: WithdrawalHistoryRow): SimulatedWithdrawalHistoryEntry {
  return {
    requestId: row.request_id,
    amountLamports: toIntegerString(row.amount_lamports),
    status: row.status,
    reason: row.reason,
    transactionSignature: null,
    createdAt: toIsoString(row.created_at),
  }
}

async function readSnapshot(
  sql: Sql,
  playerId: string,
  walletAddress: string,
  historyLimit = DEFAULT_HISTORY_LIMIT,
): Promise<RewardSnapshotResponse | null> {
  const accountRows = await sql`
    SELECT
      player_id,
      wallet_address,
      eligibility_mode,
      eligibility_passed,
      balance_lamports,
      lifetime_earned_lamports,
      lifetime_withdrawn_lamports,
      verified_active_seconds,
      CASE WHEN daily_earned_on = CURRENT_DATE THEN daily_earned_lamports ELSE 0 END AS current_daily_earned_lamports
    FROM meowave_reward_accounts
    WHERE player_id = ${playerId}::uuid AND wallet_address = ${walletAddress}
    LIMIT 1
  ` as RewardAccountRow[]
  const account = accountRows[0]
  if (!account) return null

  const historyRows = await sql`
    SELECT event_key, kind, delta_lamports, balance_after_lamports, run_id, withdrawal_request_id, created_at
    FROM meowave_reward_ledger
    WHERE player_id = ${playerId}::uuid AND wallet_address = ${walletAddress}
    ORDER BY created_at DESC
    LIMIT ${historyLimit}
  ` as RewardHistoryRow[]
  const withdrawalRows = await sql`
    SELECT request_id, amount_lamports, status, reason, created_at
    FROM meowave_reward_withdrawals
    WHERE player_id = ${playerId}::uuid AND wallet_address = ${walletAddress}
    ORDER BY created_at DESC
    LIMIT ${historyLimit}
  ` as WithdrawalHistoryRow[]

  return {
    snapshot: toSnapshot(account),
    history: historyRows.map(toHistoryEntry),
    withdrawals: withdrawalRows.map(toWithdrawalHistoryEntry),
  }
}

async function requireSnapshot(sql: Sql, playerId: string, walletAddress: string): Promise<RewardSnapshotResponse> {
  const snapshot = await readSnapshot(sql, playerId, walletAddress)
  if (!snapshot) throw new Error('REWARD_PROFILE_NOT_FOUND')
  return snapshot
}

async function registerAccount(sql: Sql, request: RegisterRewardRequest): Promise<Response> {
  const inserted = await sql`
    INSERT INTO meowave_reward_accounts (player_id, wallet_address)
    VALUES (${request.playerId}::uuid, ${request.walletAddress})
    ON CONFLICT (player_id, wallet_address) DO NOTHING
    RETURNING player_id
  ` as Array<{ player_id: string }>
  const result = await requireSnapshot(sql, request.playerId, request.walletAddress)
  return json({ ...result, created: inserted.length > 0 }, inserted.length > 0 ? 201 : 200)
}

async function simulateEligibility(sql: Sql, request: SimulateEligibilityRequest): Promise<Response> {
  const updated = await sql`
    UPDATE meowave_reward_accounts
    SET eligibility_passed = TRUE, eligibility_checked_at = NOW(), updated_at = NOW()
    WHERE player_id = ${request.playerId}::uuid AND wallet_address = ${request.walletAddress}
    RETURNING player_id
  ` as Array<{ player_id: string }>
  if (updated.length === 0) return json({ error: 'Register the simulated reward profile first' }, 404)
  return json(await requireSnapshot(sql, request.playerId, request.walletAddress))
}

async function findRun(sql: Sql, runId: string): Promise<RewardRunRow | null> {
  const rows = await sql`
    SELECT
      run_id,
      player_id,
      wallet_address,
      active_seconds,
      raw_pickups,
      actions,
      meaningful_run,
      credited_active_seconds,
      pickup_credit_lamports,
      prorated_hourly_cap_lamports,
      calculated_credit_lamports,
      credited_lamports,
      created_at
    FROM meowave_reward_runs
    WHERE run_id = ${runId}::uuid
    LIMIT 1
  ` as RewardRunRow[]
  return rows[0] ?? null
}

async function creditRun(sql: Sql, request: CreditRunRequest): Promise<Response> {
  const account = await readSnapshot(sql, request.playerId, request.walletAddress, 1)
  if (!account) return json({ error: 'Register the simulated reward profile first' }, 404)

  const calculation = calculateRunCredit(request.activeSeconds, request.rawPickups)
  const meaningfulRun = isMeaningfulRun(request.activeSeconds, request.actions)
  const rows = await sql`
    WITH existing_run AS (
      SELECT
        run_id,
        player_id,
        wallet_address,
        active_seconds,
        raw_pickups,
        actions,
        meaningful_run,
        credited_active_seconds,
        pickup_credit_lamports,
        prorated_hourly_cap_lamports,
        calculated_credit_lamports,
        credited_lamports,
        created_at
      FROM meowave_reward_runs
      WHERE run_id = ${request.runId}::uuid
    ),
    locked_account AS (
      SELECT *
      FROM meowave_reward_accounts
      WHERE player_id = ${request.playerId}::uuid AND wallet_address = ${request.walletAddress}
      FOR UPDATE
    ),
    new_run AS (
      INSERT INTO meowave_reward_runs (
        run_id,
        player_id,
        wallet_address,
        active_seconds,
        raw_pickups,
        actions,
        meaningful_run,
        credited_active_seconds,
        pickup_credit_lamports,
        prorated_hourly_cap_lamports,
        calculated_credit_lamports,
        credited_lamports
      )
      SELECT
        ${request.runId}::uuid,
        account.player_id,
        account.wallet_address,
        ${calculation.activeSeconds},
        ${calculation.rawPickups},
        ${request.actions},
        ${meaningfulRun},
        CASE WHEN account.eligibility_passed = TRUE AND ${meaningfulRun}
          THEN ${calculation.activeSeconds}
          ELSE 0
        END,
        ${calculation.pickupCreditLamports},
        ${calculation.proratedHourlyCapLamports},
        ${calculation.calculatedCreditLamports},
        CASE
          WHEN account.eligibility_passed = TRUE AND ${meaningfulRun} THEN LEAST(
            ${calculation.calculatedCreditLamports}::bigint,
            GREATEST(
              0::bigint,
              ${DAILY_REWARD_CAP_LAMPORTS}::bigint - CASE
                WHEN account.daily_earned_on = CURRENT_DATE THEN account.daily_earned_lamports
                ELSE 0::bigint
              END
            )
          )
          ELSE 0::bigint
        END
      FROM locked_account AS account
      WHERE NOT EXISTS (SELECT 1 FROM existing_run)
      ON CONFLICT (run_id) DO NOTHING
      RETURNING
        run_id,
        player_id,
        wallet_address,
        active_seconds,
        raw_pickups,
        actions,
        meaningful_run,
        credited_active_seconds,
        pickup_credit_lamports,
        prorated_hourly_cap_lamports,
        calculated_credit_lamports,
        credited_lamports,
        created_at
    ),
    account_updated AS (
      UPDATE meowave_reward_accounts AS account
      SET
        balance_lamports = account.balance_lamports + run.credited_lamports,
        lifetime_earned_lamports = account.lifetime_earned_lamports + run.credited_lamports,
        verified_active_seconds = account.verified_active_seconds + run.credited_active_seconds,
        daily_earned_on = CURRENT_DATE,
        daily_earned_lamports = (
          CASE WHEN account.daily_earned_on = CURRENT_DATE THEN account.daily_earned_lamports ELSE 0::bigint END
        ) + run.credited_lamports,
        updated_at = NOW()
      FROM new_run AS run
      WHERE account.player_id = run.player_id AND account.wallet_address = run.wallet_address
      RETURNING
        account.player_id,
        account.wallet_address,
        account.balance_lamports,
        run.run_id,
        run.credited_lamports
    ),
    ledger_inserted AS (
      INSERT INTO meowave_reward_ledger (
        event_key,
        player_id,
        wallet_address,
        kind,
        delta_lamports,
        balance_after_lamports,
        run_id
      )
      SELECT
        'run:' || updated.run_id::text,
        updated.player_id,
        updated.wallet_address,
        'run_credit',
        updated.credited_lamports,
        updated.balance_lamports,
        updated.run_id
      FROM account_updated AS updated
      ON CONFLICT (event_key) DO NOTHING
      RETURNING event_key
    )
    SELECT run.*, FALSE AS idempotent_replay, (SELECT COUNT(*) FROM ledger_inserted) AS ledger_writes
    FROM new_run AS run
    UNION ALL
    SELECT run.*, TRUE AS idempotent_replay, 0::bigint AS ledger_writes
    FROM existing_run AS run
    LIMIT 1
  ` as RewardRunRow[]

  const run = rows[0] ?? await findRun(sql, request.runId)
  if (!run) return json({ error: 'The simulated run could not be credited' }, 409)
  if (run.player_id !== request.playerId || run.wallet_address !== request.walletAddress) {
    return json({ error: 'This run identifier belongs to another simulated reward profile' }, 409)
  }
  if (
    Number(run.active_seconds) !== request.activeSeconds
    || Number(run.raw_pickups) !== request.rawPickups
    || Number(run.actions) !== request.actions
  ) {
    return json({ error: 'This run identifier was already used with different metrics' }, 409)
  }

  const result = await requireSnapshot(sql, request.playerId, request.walletAddress)
  const credit: RunCreditResult = {
    runId: run.run_id,
    activeSeconds: Number(run.active_seconds),
    rawPickups: Number(run.raw_pickups),
    actions: Number(run.actions),
    meaningfulRun: run.meaningful_run,
    creditedActiveSeconds: Number(run.credited_active_seconds),
    pickupCreditLamports: toIntegerString(run.pickup_credit_lamports),
    proratedHourlyCapLamports: toIntegerString(run.prorated_hourly_cap_lamports),
    calculatedCreditLamports: toIntegerString(run.calculated_credit_lamports),
    creditedLamports: toIntegerString(run.credited_lamports),
    hourlyCapApplied: BigInt(toIntegerString(run.pickup_credit_lamports)) > BigInt(toIntegerString(run.prorated_hourly_cap_lamports)),
    dailyCapApplied: Number(run.credited_active_seconds) > 0
      && BigInt(toIntegerString(run.credited_lamports)) < BigInt(toIntegerString(run.calculated_credit_lamports)),
    idempotentReplay: run.idempotent_replay ?? rows.length === 0,
    createdAt: toIsoString(run.created_at),
  }
  const response: RewardCreditResponse = { ...result, credit }
  return json(response, credit.idempotentReplay ? 200 : 201)
}

async function findWithdrawal(sql: Sql, requestId: string): Promise<WithdrawalRow | null> {
  const rows = await sql`
    SELECT request_id, player_id, wallet_address, amount_lamports, status, reason, created_at
    FROM meowave_reward_withdrawals
    WHERE request_id = ${requestId}::uuid
    LIMIT 1
  ` as WithdrawalRow[]
  return rows[0] ?? null
}

async function withdraw(sql: Sql, request: WithdrawRewardRequest): Promise<Response> {
  const account = await readSnapshot(sql, request.playerId, request.walletAddress, 1)
  if (!account) return json({ error: 'Register the simulated reward profile first' }, 404)

  const rows = await sql`
    WITH existing_withdrawal AS (
      SELECT request_id, player_id, wallet_address, amount_lamports, status, reason, created_at
      FROM meowave_reward_withdrawals
      WHERE request_id = ${request.requestId}::uuid
    ),
    locked_account AS (
      SELECT *
      FROM meowave_reward_accounts
      WHERE player_id = ${request.playerId}::uuid AND wallet_address = ${request.walletAddress}
      FOR UPDATE
    ),
    new_withdrawal AS (
      INSERT INTO meowave_reward_withdrawals (
        request_id,
        player_id,
        wallet_address,
        amount_lamports,
        status,
        reason
      )
      SELECT
        ${request.requestId}::uuid,
        account.player_id,
        account.wallet_address,
        ${request.amountLamports}::bigint,
        CASE
          WHEN account.eligibility_passed = FALSE THEN 'rejected'
          WHEN account.verified_active_seconds < ${WITHDRAWAL_ACTIVE_GATE_SECONDS}::bigint THEN 'rejected'
          WHEN account.balance_lamports < ${request.amountLamports}::bigint THEN 'rejected'
          ELSE 'simulated_complete'
        END,
        CASE
          WHEN account.eligibility_passed = FALSE THEN 'Complete the simulated eligibility check first'
          WHEN account.verified_active_seconds < ${WITHDRAWAL_ACTIVE_GATE_SECONDS}::bigint THEN 'More eligible active play time is required'
          WHEN account.balance_lamports < ${request.amountLamports}::bigint THEN 'Insufficient Demo SOL balance'
          ELSE NULL
        END
      FROM locked_account AS account
      WHERE NOT EXISTS (SELECT 1 FROM existing_withdrawal)
      ON CONFLICT (request_id) DO NOTHING
      RETURNING request_id, player_id, wallet_address, amount_lamports, status, reason, created_at
    ),
    account_updated AS (
      UPDATE meowave_reward_accounts AS account
      SET
        balance_lamports = account.balance_lamports - withdrawal.amount_lamports,
        lifetime_withdrawn_lamports = account.lifetime_withdrawn_lamports + withdrawal.amount_lamports,
        updated_at = NOW()
      FROM new_withdrawal AS withdrawal
      WHERE account.player_id = withdrawal.player_id
        AND account.wallet_address = withdrawal.wallet_address
        AND withdrawal.status = 'simulated_complete'
      RETURNING
        account.player_id,
        account.wallet_address,
        account.balance_lamports,
        withdrawal.request_id,
        withdrawal.amount_lamports
    ),
    ledger_inserted AS (
      INSERT INTO meowave_reward_ledger (
        event_key,
        player_id,
        wallet_address,
        kind,
        delta_lamports,
        balance_after_lamports,
        withdrawal_request_id
      )
      SELECT
        'withdrawal:' || updated.request_id::text,
        updated.player_id,
        updated.wallet_address,
        'simulated_withdrawal',
        -updated.amount_lamports,
        updated.balance_lamports,
        updated.request_id
      FROM account_updated AS updated
      ON CONFLICT (event_key) DO NOTHING
      RETURNING event_key
    )
    SELECT withdrawal.*, FALSE AS idempotent_replay, (SELECT COUNT(*) FROM ledger_inserted) AS ledger_writes
    FROM new_withdrawal AS withdrawal
    UNION ALL
    SELECT withdrawal.*, TRUE AS idempotent_replay, 0::bigint AS ledger_writes
    FROM existing_withdrawal AS withdrawal
    LIMIT 1
  ` as WithdrawalRow[]

  const withdrawalRow = rows[0] ?? await findWithdrawal(sql, request.requestId)
  if (!withdrawalRow) return json({ error: 'The simulated withdrawal could not be created' }, 409)
  if (withdrawalRow.player_id !== request.playerId || withdrawalRow.wallet_address !== request.walletAddress) {
    return json({ error: 'This withdrawal identifier belongs to another simulated reward profile' }, 409)
  }
  if (toIntegerString(withdrawalRow.amount_lamports) !== request.amountLamports.toString()) {
    return json({ error: 'This withdrawal identifier was already used with a different amount' }, 409)
  }

  const result = await requireSnapshot(sql, request.playerId, request.walletAddress)
  const withdrawalResult: SimulatedWithdrawalResult = {
    requestId: withdrawalRow.request_id,
    amountLamports: toIntegerString(withdrawalRow.amount_lamports),
    status: withdrawalRow.status,
    reason: withdrawalRow.reason,
    transactionSignature: null,
    idempotentReplay: withdrawalRow.idempotent_replay ?? rows.length === 0,
    createdAt: toIsoString(withdrawalRow.created_at),
  }
  const response: RewardWithdrawalResponse = { ...result, withdrawal: withdrawalResult }
  const status = withdrawalResult.status === 'rejected'
    ? 409
    : withdrawalResult.idempotentReplay ? 200 : 201
  return json(response, status)
}

async function handleGet(sql: Sql, request: Request): Promise<Response> {
  const url = new URL(request.url)
  const identity = parseIdentity({
    playerId: url.searchParams.get('playerId'),
    walletAddress: url.searchParams.get('walletAddress'),
  })
  if (!identity.playerId || !identity.walletAddress) return json({ error: identity.error }, 400)
  const result = await readSnapshot(sql, identity.playerId, identity.walletAddress, parseHistoryLimit(url))
  if (!result) return json({ error: 'Simulated reward profile not found' }, 404)
  return json(result)
}

async function handlePost(sql: Sql, request: Request): Promise<Response> {
  const parsed = parseMutation(await request.json().catch(() => null))
  if (!parsed.request) return json({ error: parsed.error ?? 'Invalid reward request' }, 400)

  switch (parsed.request.action) {
    case 'register':
      return registerAccount(sql, parsed.request)
    case 'simulateEligibility':
      return simulateEligibility(sql, parsed.request)
    case 'creditRun':
      return creditRun(sql, parsed.request)
    case 'withdraw':
      return withdraw(sql, parsed.request)
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    const sql = getDatabase()
    if (!sql) return json({ error: 'The simulated reward database is not connected yet' }, 503)

    try {
      await ensureSchema(sql)
      if (request.method === 'GET') return handleGet(sql, request)
      if (request.method === 'POST') return handlePost(sql, request)
      return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' })
    } catch (error) {
      if (error instanceof Error && error.message === 'REWARD_PROFILE_NOT_FOUND') {
        return json({ error: 'Simulated reward profile not found' }, 404)
      }
      console.error('Simulated reward request failed.', error)
      return json({ error: 'The simulated reward service is temporarily unavailable' }, 500)
    }
  },
}

export { REWARD_RULES }

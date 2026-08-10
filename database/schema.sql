CREATE TABLE IF NOT EXISTS meowave_leaderboard (
  player_id UUID PRIMARY KEY,
  nickname VARCHAR(16) NOT NULL,
  best_distance INTEGER NOT NULL DEFAULT 0 CHECK (best_distance >= 0),
  best_sol INTEGER NOT NULL DEFAULT 0 CHECK (best_sol >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meowave_leaderboard_rank_idx
ON meowave_leaderboard (best_distance DESC, best_sol DESC, created_at ASC);

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
);

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
);

ALTER TABLE meowave_reward_runs
  ADD COLUMN IF NOT EXISTS actions INTEGER NOT NULL DEFAULT 0 CHECK (actions BETWEEN 0 AND 43200),
  ADD COLUMN IF NOT EXISTS meaningful_run BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS credited_active_seconds INTEGER NOT NULL DEFAULT 0
    CHECK (credited_active_seconds BETWEEN 0 AND active_seconds);

CREATE INDEX IF NOT EXISTS meowave_reward_runs_account_history_idx
ON meowave_reward_runs (player_id, wallet_address, created_at DESC);

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
);

CREATE INDEX IF NOT EXISTS meowave_reward_withdrawals_account_history_idx
ON meowave_reward_withdrawals (player_id, wallet_address, created_at DESC);

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
);

CREATE INDEX IF NOT EXISTS meowave_reward_ledger_account_history_idx
ON meowave_reward_ledger (player_id, wallet_address, created_at DESC);

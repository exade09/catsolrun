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

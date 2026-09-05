CREATE TABLE IF NOT EXISTS sandbox_payment_attempts (
  idempotency_key TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  application_id TEXT NOT NULL,
  attempt_id TEXT NOT NULL,
  method TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  status TEXT NOT NULL,
  reference TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT,
  UNIQUE(session_id, application_id, attempt_id),
  FOREIGN KEY (session_id) REFERENCES reliability_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS sandbox_payment_attempts_session_idx
  ON sandbox_payment_attempts (session_id, updated_at DESC);

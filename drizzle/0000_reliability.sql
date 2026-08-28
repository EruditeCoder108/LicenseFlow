CREATE TABLE IF NOT EXISTS reliability_sessions (
  session_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reliability_checkpoints (
  checkpoint_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  readiness_status TEXT NOT NULL,
  rehearsal_status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  tutorial_status TEXT NOT NULL,
  exam_status TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  answered_count INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  score INTEGER,
  interruption_recovered INTEGER NOT NULL,
  integrity_status TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES reliability_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS reliability_checkpoints_session_time_idx
  ON reliability_checkpoints (session_id, client_updated_at DESC);

CREATE TABLE IF NOT EXISTS payment_confirmations (
  idempotency_key TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  application_id TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  reference TEXT NOT NULL,
  received_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES reliability_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS payment_confirmations_session_idx
  ON payment_confirmations (session_id);


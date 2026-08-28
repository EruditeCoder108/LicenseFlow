const MAX_BODY_BYTES = 8_000
const SESSION_TTL_DAYS = 7
const APPLICATION_ID = /^MP-LL-[A-Z0-9-]{4,24}$/i
const OPAQUE_ID = /^[a-zA-Z0-9-]{8,80}$/
const IDEMPOTENCY_KEY = /^MP-LL-[A-Z0-9-]{4,80}$/i

const allowed = {
  stage: new Set(['application', 'uploads', 'readiness', 'rehearsal', 'payment', 'tutorial', 'exam-intro', 'exam', 'interruption', 'result']),
  readiness: new Set(['not-started', 'passed']),
  rehearsal: new Set(['not-started', 'completed']),
  payment: new Set(['not-started', 'redirecting', 'pending', 'unknown', 'timed-out', 'confirmed', 'declined', 'cancelled']),
  tutorial: new Set(['not-started', 'in-progress', 'completed']),
  exam: new Set(['not-started', 'active', 'paused', 'completed']),
  integrity: new Set(['clear', 'technical-event-recovered', 'observation-recorded']),
}

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  },
})

const sameOrigin = (request) => {
  const origin = request.headers.get('Origin')
  return !origin || origin === new URL(request.url).origin
}

const readJson = async (request) => {
  if (!(request.headers.get('Content-Type') || '').toLowerCase().includes('application/json')) {
    return { response: json({ error: 'Send a JSON request.', code: 'invalid_content_type' }, 415) }
  }
  const declared = Number(request.headers.get('Content-Length') || '0')
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return { response: json({ error: 'Request is too large.', code: 'request_too_large' }, 413) }
  }
  try {
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return { response: json({ error: 'Request is too large.', code: 'request_too_large' }, 413) }
    }
    return { body: JSON.parse(raw) }
  } catch {
    return { response: json({ error: 'The request could not be read.', code: 'invalid_json' }, 400) }
  }
}

const cleanInteger = (value, min, max, fallback = 0) => Number.isInteger(value) && value >= min && value <= max ? value : fallback
const cleanEnum = (value, values, fallback) => typeof value === 'string' && values.has(value) ? value : fallback
const cleanIso = (value, fallback) => {
  if (typeof value !== 'string' || value.length > 35 || Number.isNaN(Date.parse(value))) return fallback
  return new Date(value).toISOString()
}

const validateIdentity = (body) => {
  if (!OPAQUE_ID.test(body?.sessionId || '') || !APPLICATION_ID.test(body?.applicationId || '')) return null
  return { sessionId: body.sessionId, applicationId: body.applicationId.toUpperCase() }
}

const sanitizeCheckpoint = (body, now) => {
  const identity = validateIdentity(body)
  if (!identity || !OPAQUE_ID.test(body?.checkpointId || '')) return null
  const checkpoint = body?.checkpoint
  if (!checkpoint || typeof checkpoint !== 'object') return null
  const questionCount = cleanInteger(checkpoint.questionCount, 0, 100)
  const answeredCount = cleanInteger(checkpoint.answeredCount, 0, questionCount)
  const score = checkpoint.score == null ? null : cleanInteger(checkpoint.score, 0, questionCount)
  return {
    ...identity,
    checkpointId: body.checkpointId,
    stage: cleanEnum(checkpoint.stage, allowed.stage, 'application'),
    readinessStatus: cleanEnum(checkpoint.readinessStatus, allowed.readiness, 'not-started'),
    rehearsalStatus: cleanEnum(checkpoint.rehearsalStatus, allowed.rehearsal, 'not-started'),
    paymentStatus: cleanEnum(checkpoint.paymentStatus, allowed.payment, 'not-started'),
    tutorialStatus: cleanEnum(checkpoint.tutorialStatus, allowed.tutorial, 'not-started'),
    examStatus: cleanEnum(checkpoint.examStatus, allowed.exam, 'not-started'),
    attemptNumber: cleanInteger(checkpoint.attemptNumber, 0, 25),
    answeredCount,
    questionCount,
    score,
    interruptionRecovered: checkpoint.interruptionRecovered === true,
    integrityStatus: cleanEnum(checkpoint.integrityStatus, allowed.integrity, 'clear'),
    clientUpdatedAt: cleanIso(body.clientUpdatedAt, now),
  }
}

export function createD1ReliabilityStore(db) {
  const initialize = async () => {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS reliability_sessions (
        session_id TEXT PRIMARY KEY, application_id TEXT NOT NULL, created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL, expires_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS reliability_checkpoints (
        checkpoint_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, stage TEXT NOT NULL,
        readiness_status TEXT NOT NULL, rehearsal_status TEXT NOT NULL, payment_status TEXT NOT NULL,
        tutorial_status TEXT NOT NULL, exam_status TEXT NOT NULL, attempt_number INTEGER NOT NULL,
        answered_count INTEGER NOT NULL, question_count INTEGER NOT NULL, score INTEGER,
        interruption_recovered INTEGER NOT NULL, integrity_status TEXT NOT NULL,
        client_updated_at TEXT NOT NULL, received_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES reliability_sessions(session_id)
      )`),
      db.prepare('CREATE INDEX IF NOT EXISTS reliability_checkpoints_session_time_idx ON reliability_checkpoints (session_id, client_updated_at DESC)'),
      db.prepare(`CREATE TABLE IF NOT EXISTS payment_confirmations (
        idempotency_key TEXT PRIMARY KEY, session_id TEXT NOT NULL, application_id TEXT NOT NULL,
        status TEXT NOT NULL, amount_paise INTEGER NOT NULL, reference TEXT NOT NULL,
        received_at TEXT NOT NULL, FOREIGN KEY (session_id) REFERENCES reliability_sessions(session_id)
      )`),
      db.prepare('CREATE INDEX IF NOT EXISTS payment_confirmations_session_idx ON payment_confirmations (session_id)'),
    ])
  }

  const ensureSession = async ({ sessionId, applicationId, now, expiresAt }) => {
    await db.prepare(`INSERT INTO reliability_sessions (session_id, application_id, created_at, updated_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET updated_at = excluded.updated_at, expires_at = excluded.expires_at
      WHERE reliability_sessions.application_id = excluded.application_id`)
      .bind(sessionId, applicationId, now, now, expiresAt).run()
    return db.prepare('SELECT session_id, application_id FROM reliability_sessions WHERE session_id = ?').bind(sessionId).first()
  }

  return {
    initialize,
    async pruneExpired(now) {
      await db.batch([
        db.prepare('DELETE FROM reliability_checkpoints WHERE session_id IN (SELECT session_id FROM reliability_sessions WHERE expires_at < ?)').bind(now),
        db.prepare('DELETE FROM payment_confirmations WHERE session_id IN (SELECT session_id FROM reliability_sessions WHERE expires_at < ?)').bind(now),
        db.prepare('DELETE FROM reliability_sessions WHERE expires_at < ?').bind(now),
      ])
    },
    async appendCheckpoint(input) {
      const session = await ensureSession(input)
      if (!session || session.application_id !== input.applicationId) return { conflict: true }
      const result = await db.prepare(`INSERT OR IGNORE INTO reliability_checkpoints (
        checkpoint_id, session_id, stage, readiness_status, rehearsal_status, payment_status,
        tutorial_status, exam_status, attempt_number, answered_count, question_count, score,
        interruption_recovered, integrity_status, client_updated_at, received_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(input.checkpointId, input.sessionId, input.stage, input.readinessStatus, input.rehearsalStatus,
          input.paymentStatus, input.tutorialStatus, input.examStatus, input.attemptNumber, input.answeredCount,
          input.questionCount, input.score, input.interruptionRecovered ? 1 : 0, input.integrityStatus,
          input.clientUpdatedAt, input.now).run()
      return { conflict: false, inserted: Boolean(result?.meta?.changes) }
    },
    async confirmPayment(input) {
      const session = await ensureSession(input)
      if (!session || session.application_id !== input.applicationId) return { conflict: true }
      await db.prepare(`INSERT OR IGNORE INTO payment_confirmations (
        idempotency_key, session_id, application_id, status, amount_paise, reference, received_at
      ) VALUES (?, ?, ?, 'confirmed', ?, ?, ?)`)
        .bind(input.idempotencyKey, input.sessionId, input.applicationId, input.amountPaise, input.reference, input.now).run()
      const record = await db.prepare(`SELECT idempotency_key, session_id, application_id, status, amount_paise, reference, received_at
        FROM payment_confirmations WHERE idempotency_key = ?`).bind(input.idempotencyKey).first()
      if (!record || record.session_id !== input.sessionId || record.application_id !== input.applicationId) return { conflict: true }
      return { conflict: false, record }
    },
    async getReceipt(sessionId) {
      const session = await db.prepare(`SELECT session_id, application_id, created_at, updated_at, expires_at
        FROM reliability_sessions WHERE session_id = ?`).bind(sessionId).first()
      if (!session) return null
      const checkpoint = await db.prepare(`SELECT checkpoint_id, stage, readiness_status, rehearsal_status,
        payment_status, tutorial_status, exam_status, attempt_number, answered_count, question_count, score,
        interruption_recovered, integrity_status, client_updated_at, received_at
        FROM reliability_checkpoints WHERE session_id = ? ORDER BY client_updated_at DESC LIMIT 1`)
        .bind(sessionId).first()
      const payment = await db.prepare(`SELECT idempotency_key, status, amount_paise, reference, received_at
        FROM payment_confirmations WHERE session_id = ? ORDER BY received_at DESC LIMIT 1`).bind(sessionId).first()
      const count = await db.prepare('SELECT COUNT(*) AS total FROM reliability_checkpoints WHERE session_id = ?').bind(sessionId).first()
      return { session, checkpoint, payment, checkpointCount: Number(count?.total || 0) }
    },
  }
}

export async function handleReliabilityRequest(request, env, dependencies = {}) {
  if (!sameOrigin(request)) return json({ error: 'Request origin is not allowed.', code: 'origin_not_allowed' }, 403)
  if (!env?.DB && !dependencies.store) return json({ error: 'Durable checkpoints are not configured.', code: 'reliability_not_configured' }, 503)

  const store = dependencies.store || createD1ReliabilityStore(env.DB)
  await store.initialize()
  const url = new URL(request.url)
  const now = (dependencies.now || (() => new Date()))().toISOString()
  const expiresAt = new Date(Date.parse(now) + SESSION_TTL_DAYS * 86_400_000).toISOString()
  if (typeof store.pruneExpired === 'function') await store.pruneExpired(now)

  if (request.method === 'GET' && url.pathname.startsWith('/api/reliability/sessions/')) {
    const sessionId = decodeURIComponent(url.pathname.slice('/api/reliability/sessions/'.length))
    if (!OPAQUE_ID.test(sessionId)) return json({ error: 'Invalid session.', code: 'invalid_session' }, 400)
    const receipt = await store.getReceipt(sessionId)
    return receipt
      ? json({ synthetic: true, durable: true, ...receipt })
      : json({ error: 'Session was not found.', code: 'session_not_found' }, 404)
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed.', code: 'method_not_allowed' }, 405, { Allow: 'GET, POST' })
  const parsed = await readJson(request)
  if (parsed.response) return parsed.response

  if (url.pathname === '/api/reliability/checkpoints') {
    const input = sanitizeCheckpoint(parsed.body, now)
    if (!input) return json({ error: 'Checkpoint fields are invalid.', code: 'invalid_checkpoint' }, 400)
    const result = await store.appendCheckpoint({ ...input, now, expiresAt })
    if (result.conflict) return json({ error: 'Session does not match this application.', code: 'session_conflict' }, 409)
    return json({ synthetic: true, durable: true, checkpointId: input.checkpointId, duplicate: !result.inserted }, result.inserted ? 201 : 200)
  }

  if (url.pathname === '/api/reliability/payments/confirm') {
    const identity = validateIdentity(parsed.body)
    const { idempotencyKey, reference } = parsed.body || {}
    if (!identity || !IDEMPOTENCY_KEY.test(idempotencyKey || '') || !OPAQUE_ID.test(reference || '')) {
      return json({ error: 'Payment confirmation fields are invalid.', code: 'invalid_payment_confirmation' }, 400)
    }
    const amountPaise = cleanInteger(parsed.body.amountPaise, 1, 1_000_000, 0)
    if (!amountPaise) return json({ error: 'Payment amount is invalid.', code: 'invalid_payment_confirmation' }, 400)
    const result = await store.confirmPayment({ ...identity, idempotencyKey, reference, amountPaise, now, expiresAt })
    if (result.conflict) return json({ error: 'Payment key or session conflicts with an existing record.', code: 'payment_conflict' }, 409)
    return json({ synthetic: true, durable: true, payment: result.record })
  }

  return json({ error: 'Reliability route was not found.', code: 'not_found' }, 404)
}

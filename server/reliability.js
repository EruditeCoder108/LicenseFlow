const MAX_BODY_BYTES = 8_000
const SESSION_TTL_DAYS = 7
const APPLICATION_ID = /^MP-LL-[A-Z0-9-]{4,24}$/i
const OPAQUE_ID = /^[a-zA-Z0-9-]{8,80}$/
const IDEMPOTENCY_KEY = /^MP-LL-[A-Z0-9-]{4,80}$/i
const PAYMENT_ATTEMPT_ID = /^[a-zA-Z0-9-]{8,80}$/

const allowed = {
  stage: new Set(['application', 'uploads', 'readiness', 'rehearsal', 'payment', 'tutorial', 'exam-intro', 'exam', 'interruption', 'result']),
  readiness: new Set(['not-started', 'passed']),
  rehearsal: new Set(['not-started', 'completed']),
  payment: new Set(['not-started', 'redirecting', 'pending', 'unknown', 'timed-out', 'confirmed', 'declined', 'cancelled']),
  tutorial: new Set(['not-started', 'in-progress', 'completed']),
  exam: new Set(['not-started', 'active', 'paused', 'completed']),
  integrity: new Set(['clear', 'technical-event-recovered', 'observation-recorded']),
  paymentMethod: new Set(['upi', 'card', 'net-banking']),
  paymentOutcome: new Set(['pending', 'confirmed', 'declined', 'cancelled', 'timed-out', 'unknown']),
  reconciliationOutcome: new Set(['confirmed', 'declined']),
}

const uncertainPaymentStatuses = new Set(['pending', 'timed-out', 'unknown'])
const terminalPaymentStatuses = new Set(['confirmed', 'declined', 'cancelled'])

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

const paymentReferenceFor = (idempotencyKey) => {
  let hash = 2166136261
  for (const character of idempotencyKey) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  const suffix = idempotencyKey.replace(/[^a-zA-Z0-9]/g, '').slice(-12).toUpperCase()
  return `LFSBX-${suffix}${(hash >>> 0).toString(36).toUpperCase()}`.slice(0, 38)
}

const sanitizePaymentAttempt = (body) => {
  const identity = validateIdentity(body)
  if (!identity || !PAYMENT_ATTEMPT_ID.test(body?.attemptId || '') || !IDEMPOTENCY_KEY.test(body?.idempotencyKey || '')) return null
  const amountPaise = cleanInteger(body.amountPaise, 1, 1_000_000, 0)
  const method = cleanEnum(body.method, allowed.paymentMethod, '')
  if (!amountPaise || !method) return null
  return { ...identity, attemptId: body.attemptId, idempotencyKey: body.idempotencyKey, amountPaise, method }
}

const publicPaymentAttempt = (record) => record && ({
  attemptId: record.attempt_id,
  idempotencyKey: record.idempotency_key,
  applicationId: record.application_id,
  amountPaise: Number(record.amount_paise),
  method: record.method,
  status: record.status,
  reference: record.reference,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
  resolvedAt: record.resolved_at || undefined,
  canRetry: record.status === 'declined' || record.status === 'cancelled',
  needsReconciliation: uncertainPaymentStatuses.has(record.status),
})

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
      db.prepare(`CREATE TABLE IF NOT EXISTS sandbox_payment_attempts (
        idempotency_key TEXT PRIMARY KEY, session_id TEXT NOT NULL, application_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL, method TEXT NOT NULL, amount_paise INTEGER NOT NULL,
        status TEXT NOT NULL, reference TEXT NOT NULL, created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL, resolved_at TEXT,
        UNIQUE(session_id, application_id, attempt_id),
        FOREIGN KEY (session_id) REFERENCES reliability_sessions(session_id)
      )`),
      db.prepare('CREATE INDEX IF NOT EXISTS sandbox_payment_attempts_session_idx ON sandbox_payment_attempts (session_id, updated_at DESC)'),
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
        db.prepare('DELETE FROM sandbox_payment_attempts WHERE session_id IN (SELECT session_id FROM reliability_sessions WHERE expires_at < ?)').bind(now),
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
    async createPaymentAttempt(input) {
      const session = await ensureSession(input)
      if (!session || session.application_id !== input.applicationId) return { conflict: true }
      const insert = await db.prepare(`INSERT OR IGNORE INTO sandbox_payment_attempts (
        idempotency_key, session_id, application_id, attempt_id, method, amount_paise,
        status, reference, created_at, updated_at, resolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'redirecting', ?, ?, ?, NULL)`)
        .bind(input.idempotencyKey, input.sessionId, input.applicationId, input.attemptId,
          input.method, input.amountPaise, input.reference, input.now, input.now).run()
      const record = await db.prepare(`SELECT * FROM sandbox_payment_attempts WHERE idempotency_key = ?`)
        .bind(input.idempotencyKey).first()
      const mismatch = !record
        || record.session_id !== input.sessionId
        || record.application_id !== input.applicationId
        || record.attempt_id !== input.attemptId
        || record.method !== input.method
        || Number(record.amount_paise) !== input.amountPaise
      return mismatch ? { conflict: true } : { conflict: false, record, duplicate: !Boolean(insert?.meta?.changes) }
    },
    async getPaymentAttempt({ sessionId, applicationId, idempotencyKey }) {
      const record = await db.prepare('SELECT * FROM sandbox_payment_attempts WHERE idempotency_key = ?')
        .bind(idempotencyKey).first()
      if (!record) return null
      if (record.session_id !== sessionId || record.application_id !== applicationId) return { conflict: true }
      return { conflict: false, record }
    },
    async resolvePaymentAttempt(input) {
      const current = await this.getPaymentAttempt(input)
      if (!current || current.conflict) return current
      if (terminalPaymentStatuses.has(current.record.status)) return current
      await db.prepare(`UPDATE sandbox_payment_attempts
        SET status = ?, updated_at = ?, resolved_at = ?
        WHERE idempotency_key = ? AND session_id = ? AND application_id = ?
          AND status NOT IN ('confirmed', 'declined', 'cancelled')`)
        .bind(input.outcome, input.now, terminalPaymentStatuses.has(input.outcome) ? input.now : null,
          input.idempotencyKey, input.sessionId, input.applicationId).run()
      return this.getPaymentAttempt(input)
    },
    async reconcilePaymentAttempt(input) {
      const current = await this.getPaymentAttempt(input)
      if (!current || current.conflict) return current
      if (terminalPaymentStatuses.has(current.record.status)) return current
      if (!uncertainPaymentStatuses.has(current.record.status)) return { invalidState: true, record: current.record }
      await db.prepare(`UPDATE sandbox_payment_attempts
        SET status = ?, updated_at = ?, resolved_at = ?
        WHERE idempotency_key = ? AND session_id = ? AND application_id = ?
          AND status IN ('pending', 'timed-out', 'unknown')`)
        .bind(input.outcome, input.now, input.now, input.idempotencyKey, input.sessionId, input.applicationId).run()
      return this.getPaymentAttempt(input)
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
      const sandboxPayment = await db.prepare(`SELECT idempotency_key, status, amount_paise, reference, updated_at AS received_at
        FROM sandbox_payment_attempts WHERE session_id = ? ORDER BY updated_at DESC LIMIT 1`).bind(sessionId).first()
      const legacyPayment = sandboxPayment ? null : await db.prepare(`SELECT idempotency_key, status, amount_paise, reference, received_at
        FROM payment_confirmations WHERE session_id = ? ORDER BY received_at DESC LIMIT 1`).bind(sessionId).first()
      const count = await db.prepare('SELECT COUNT(*) AS total FROM reliability_checkpoints WHERE session_id = ?').bind(sessionId).first()
      return { session, checkpoint, payment: sandboxPayment || legacyPayment, checkpointCount: Number(count?.total || 0) }
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

  if (request.method === 'GET' && url.pathname.startsWith('/api/reliability/payments/attempts/')) {
    const idempotencyKey = decodeURIComponent(url.pathname.slice('/api/reliability/payments/attempts/'.length))
    const sessionId = url.searchParams.get('sessionId') || ''
    const applicationId = (url.searchParams.get('applicationId') || '').toUpperCase()
    if (!IDEMPOTENCY_KEY.test(idempotencyKey) || !OPAQUE_ID.test(sessionId) || !APPLICATION_ID.test(applicationId)) {
      return json({ error: 'Payment lookup fields are invalid.', code: 'invalid_payment_lookup' }, 400)
    }
    const result = await store.getPaymentAttempt({ sessionId, applicationId, idempotencyKey })
    if (!result) return json({ error: 'Payment attempt was not found.', code: 'payment_not_found' }, 404)
    if (result.conflict) return json({ error: 'Payment attempt does not belong to this session.', code: 'payment_conflict' }, 409)
    return json({ synthetic: true, durable: true, authority: 'sandbox-payment-service', payment: publicPaymentAttempt(result.record) })
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


  if (url.pathname === '/api/reliability/payments/attempts') {
    const input = sanitizePaymentAttempt(parsed.body)
    if (!input) return json({ error: 'Payment attempt fields are invalid.', code: 'invalid_payment_attempt' }, 400)
    const result = await store.createPaymentAttempt({ ...input, reference: paymentReferenceFor(input.idempotencyKey), now, expiresAt })
    if (result.conflict) return json({ error: 'This payment key conflicts with an existing attempt.', code: 'payment_conflict' }, 409)
    return json({
      synthetic: true,
      durable: true,
      authority: 'sandbox-payment-service',
      duplicate: result.duplicate,
      payment: publicPaymentAttempt(result.record),
    }, result.duplicate ? 200 : 201)
  }

  const paymentAction = url.pathname.match(/^\/api\/reliability\/payments\/attempts\/([^/]+)\/(resolve|reconcile)$/)
  if (paymentAction) {
    const idempotencyKey = decodeURIComponent(paymentAction[1])
    const identity = validateIdentity(parsed.body)
    if (!identity || !IDEMPOTENCY_KEY.test(idempotencyKey)) {
      return json({ error: 'Payment action fields are invalid.', code: 'invalid_payment_action' }, 400)
    }
    const action = paymentAction[2]
    const validOutcomes = action === 'reconcile' ? allowed.reconciliationOutcome : allowed.paymentOutcome
    const outcome = cleanEnum(parsed.body?.outcome, validOutcomes, '')
    if (!outcome) return json({ error: 'Payment outcome is invalid.', code: 'invalid_payment_outcome' }, 400)
    const operation = action === 'reconcile' ? 'reconcilePaymentAttempt' : 'resolvePaymentAttempt'
    const result = await store[operation]({ ...identity, idempotencyKey, outcome, now })
    if (!result) return json({ error: 'Payment attempt was not found.', code: 'payment_not_found' }, 404)
    if (result.conflict) return json({ error: 'Payment attempt does not belong to this session.', code: 'payment_conflict' }, 409)
    if (result.invalidState) return json({ error: 'This payment is not waiting for reconciliation.', code: 'invalid_payment_state' }, 409)
    return json({ synthetic: true, durable: true, authority: 'sandbox-payment-service', payment: publicPaymentAttempt(result.record) })
  }

  return json({ error: 'Reliability route was not found.', code: 'not_found' }, 404)
}

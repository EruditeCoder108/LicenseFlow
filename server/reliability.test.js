import { describe, expect, it } from 'vitest'
import { handleReliabilityRequest } from './reliability.js'

const fixedNow = () => new Date('2026-08-28T10:00:00.000Z')

const request = (path, body, method = 'POST', origin = 'https://licenceflow.example') => new Request(`https://licenceflow.example${path}`, {
  method,
  headers: body === undefined
    ? { Origin: origin }
    : { Origin: origin, 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
})

function memoryStore() {
  const sessions = new Map()
  const checkpoints = new Map()
  const payments = new Map()
  const attempts = new Map()
  return {
    async initialize() {},
    async appendCheckpoint(input) {
      const existing = sessions.get(input.sessionId)
      if (existing && existing.applicationId !== input.applicationId) return { conflict: true }
      sessions.set(input.sessionId, { applicationId: input.applicationId, input })
      if (checkpoints.has(input.checkpointId)) return { conflict: false, inserted: false }
      checkpoints.set(input.checkpointId, input)
      return { conflict: false, inserted: true }
    },
    async confirmPayment(input) {
      const existingSession = sessions.get(input.sessionId)
      if (existingSession && existingSession.applicationId !== input.applicationId) return { conflict: true }
      sessions.set(input.sessionId, { applicationId: input.applicationId, input })
      const existing = payments.get(input.idempotencyKey)
      if (existing && (existing.sessionId !== input.sessionId || existing.applicationId !== input.applicationId)) return { conflict: true }
      const record = existing || {
        sessionId: input.sessionId,
        applicationId: input.applicationId,
        idempotency_key: input.idempotencyKey,
        status: 'confirmed',
        amount_paise: input.amountPaise,
        reference: input.reference,
        received_at: input.now,
      }
      payments.set(input.idempotencyKey, record)
      return { conflict: false, record }
    },
    async createPaymentAttempt(input) {
      const existingSession = sessions.get(input.sessionId)
      if (existingSession && existingSession.applicationId !== input.applicationId) return { conflict: true }
      sessions.set(input.sessionId, { applicationId: input.applicationId, input })
      const existing = attempts.get(input.idempotencyKey)
      if (existing) {
        const mismatch = existing.session_id !== input.sessionId
          || existing.application_id !== input.applicationId
          || existing.attempt_id !== input.attemptId
          || existing.method !== input.method
          || existing.amount_paise !== input.amountPaise
        return mismatch ? { conflict: true } : { conflict: false, duplicate: true, record: existing }
      }
      const record = {
        idempotency_key: input.idempotencyKey, session_id: input.sessionId, application_id: input.applicationId,
        attempt_id: input.attemptId, method: input.method, amount_paise: input.amountPaise,
        status: 'redirecting', reference: input.reference, created_at: input.now, updated_at: input.now, resolved_at: null,
      }
      attempts.set(input.idempotencyKey, record)
      return { conflict: false, duplicate: false, record }
    },
    async getPaymentAttempt({ sessionId, applicationId, idempotencyKey }) {
      const record = attempts.get(idempotencyKey)
      if (!record) return null
      if (record.session_id !== sessionId || record.application_id !== applicationId) return { conflict: true }
      return { conflict: false, record }
    },
    async resolvePaymentAttempt(input) {
      const current = await this.getPaymentAttempt(input)
      if (!current || current.conflict) return current
      if (['confirmed', 'declined', 'cancelled'].includes(current.record.status)) return current
      current.record.status = input.outcome
      current.record.updated_at = input.now
      current.record.resolved_at = ['confirmed', 'declined', 'cancelled'].includes(input.outcome) ? input.now : null
      return current
    },
    async reconcilePaymentAttempt(input) {
      const current = await this.getPaymentAttempt(input)
      if (!current || current.conflict) return current
      if (['confirmed', 'declined', 'cancelled'].includes(current.record.status)) return current
      if (!['pending', 'timed-out', 'unknown'].includes(current.record.status)) return { invalidState: true, record: current.record }
      current.record.status = input.outcome
      current.record.updated_at = input.now
      current.record.resolved_at = input.now
      return current
    },
    async getReceipt(sessionId) {
      const session = sessions.get(sessionId)
      if (!session) return null
      const records = [...checkpoints.values()].filter((item) => item.sessionId === sessionId)
      const payment = [...payments.values()].find((item) => item.sessionId === sessionId) || null
      return { session, checkpoint: records.at(-1) || null, payment, checkpointCount: records.length }
    },
  }
}

const validCheckpoint = {
  sessionId: 'session-demo-1234',
  applicationId: 'MP-LL-DEMO-2408',
  checkpointId: 'checkpoint-demo-1234',
  clientUpdatedAt: '2026-08-28T09:59:00.000Z',
  checkpoint: {
    stage: 'exam', readinessStatus: 'passed', rehearsalStatus: 'completed', paymentStatus: 'confirmed',
    tutorialStatus: 'completed', examStatus: 'active', attemptNumber: 1, answeredCount: 4,
    questionCount: 15, score: null, interruptionRecovered: false, integrityStatus: 'clear',
  },
}

describe('durable synthetic reliability boundary', () => {
  it('falls back explicitly when no D1 binding is configured', async () => {
    const response = await handleReliabilityRequest(request('/api/reliability/checkpoints', validCheckpoint), {})
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ code: 'reliability_not_configured' })
  })

  it('stores append-only checkpoints idempotently', async () => {
    const store = memoryStore()
    const first = await handleReliabilityRequest(request('/api/reliability/checkpoints', validCheckpoint), {}, { store, now: fixedNow })
    const duplicate = await handleReliabilityRequest(request('/api/reliability/checkpoints', validCheckpoint), {}, { store, now: fixedNow })
    expect(first.status).toBe(201)
    await expect(first.json()).resolves.toMatchObject({ synthetic: true, durable: true, duplicate: false })
    expect(duplicate.status).toBe(200)
    await expect(duplicate.json()).resolves.toMatchObject({ duplicate: true })

    const receipt = await handleReliabilityRequest(request('/api/reliability/sessions/session-demo-1234', undefined, 'GET'), {}, { store, now: fixedNow })
    await expect(receipt.json()).resolves.toMatchObject({ synthetic: true, durable: true, checkpointCount: 1 })
  })

  it('returns the same confirmation for a repeated payment key', async () => {
    const store = memoryStore()
    const payload = {
      sessionId: 'session-demo-1234', applicationId: 'MP-LL-DEMO-2408',
      idempotencyKey: 'MP-LL-MP-LL-DEMO-2408-ATTEMPT-1', amountPaise: 25000, reference: 'MP-SBX-ATTEMPT1',
    }
    const first = await handleReliabilityRequest(request('/api/reliability/payments/confirm', payload), {}, { store, now: fixedNow })
    const second = await handleReliabilityRequest(request('/api/reliability/payments/confirm', payload), {}, { store, now: fixedNow })
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual(await second.json())
  })

  it('rejects cross-origin writes and malformed identifiers', async () => {
    const store = memoryStore()
    const crossOrigin = await handleReliabilityRequest(
      request('/api/reliability/checkpoints', validCheckpoint, 'POST', 'https://attacker.example'), {}, { store, now: fixedNow },
    )
    expect(crossOrigin.status).toBe(403)

    const malformed = await handleReliabilityRequest(
      request('/api/reliability/checkpoints', { ...validCheckpoint, applicationId: 'Aarav Verma' }), {}, { store, now: fixedNow },
    )
    expect(malformed.status).toBe(400)
  })

  it('creates one server-owned sandbox attempt for repeated requests', async () => {
    const store = memoryStore()
    const payload = {
      sessionId: 'session-demo-1234', applicationId: 'MP-LL-DEMO-2408', attemptId: 'attempt-demo-1234',
      idempotencyKey: 'MP-LL-MP-LL-DEMO-2408-attempt-demo-1234', method: 'upi', amountPaise: 25000,
    }
    const first = await handleReliabilityRequest(request('/api/reliability/payments/attempts', payload), {}, { store, now: fixedNow })
    const duplicate = await handleReliabilityRequest(request('/api/reliability/payments/attempts', payload), {}, { store, now: fixedNow })
    expect(first.status).toBe(201)
    expect(duplicate.status).toBe(200)
    const firstBody = await first.json()
    const duplicateBody = await duplicate.json()
    expect(firstBody.payment.reference).toMatch(/^LFSBX-/)
    expect(firstBody.payment).toEqual(duplicateBody.payment)
    expect(duplicateBody.duplicate).toBe(true)
  })

  it('rejects reuse of a payment key with different payment facts', async () => {
    const store = memoryStore()
    const payload = {
      sessionId: 'session-demo-1234', applicationId: 'MP-LL-DEMO-2408', attemptId: 'attempt-demo-1234',
      idempotencyKey: 'MP-LL-MP-LL-DEMO-2408-attempt-demo-1234', method: 'upi', amountPaise: 25000,
    }
    await handleReliabilityRequest(request('/api/reliability/payments/attempts', payload), {}, { store, now: fixedNow })
    const conflict = await handleReliabilityRequest(request('/api/reliability/payments/attempts', { ...payload, amountPaise: 25100 }), {}, { store, now: fixedNow })
    expect(conflict.status).toBe(409)
    await expect(conflict.json()).resolves.toMatchObject({ code: 'payment_conflict' })
  })

  it('keeps a confirmed attempt terminal and idempotent', async () => {
    const store = memoryStore()
    const payload = {
      sessionId: 'session-demo-1234', applicationId: 'MP-LL-DEMO-2408', attemptId: 'attempt-demo-1234',
      idempotencyKey: 'MP-LL-MP-LL-DEMO-2408-attempt-demo-1234', method: 'card', amountPaise: 25000,
    }
    await handleReliabilityRequest(request('/api/reliability/payments/attempts', payload), {}, { store, now: fixedNow })
    const actionPath = `/api/reliability/payments/attempts/${payload.idempotencyKey}/resolve`
    const confirmed = await handleReliabilityRequest(request(actionPath, { sessionId: payload.sessionId, applicationId: payload.applicationId, outcome: 'confirmed' }), {}, { store, now: fixedNow })
    const changed = await handleReliabilityRequest(request(actionPath, { sessionId: payload.sessionId, applicationId: payload.applicationId, outcome: 'declined' }), {}, { store, now: fixedNow })
    expect((await confirmed.json()).payment.status).toBe('confirmed')
    expect((await changed.json()).payment.status).toBe('confirmed')
  })

  it('requires uncertain attempts to be reconciled before retry', async () => {
    const store = memoryStore()
    const payload = {
      sessionId: 'session-demo-1234', applicationId: 'MP-LL-DEMO-2408', attemptId: 'attempt-demo-1234',
      idempotencyKey: 'MP-LL-MP-LL-DEMO-2408-attempt-demo-1234', method: 'net-banking', amountPaise: 25000,
    }
    await handleReliabilityRequest(request('/api/reliability/payments/attempts', payload), {}, { store, now: fixedNow })
    const base = `/api/reliability/payments/attempts/${payload.idempotencyKey}`
    await handleReliabilityRequest(request(`${base}/resolve`, { sessionId: payload.sessionId, applicationId: payload.applicationId, outcome: 'unknown' }), {}, { store, now: fixedNow })
    const lookup = await handleReliabilityRequest(request(`${base}?sessionId=${payload.sessionId}&applicationId=${payload.applicationId}`, undefined, 'GET'), {}, { store, now: fixedNow })
    await expect(lookup.json()).resolves.toMatchObject({ payment: { status: 'unknown', canRetry: false, needsReconciliation: true } })
    const reconciled = await handleReliabilityRequest(request(`${base}/reconcile`, { sessionId: payload.sessionId, applicationId: payload.applicationId, outcome: 'declined' }), {}, { store, now: fixedNow })
    await expect(reconciled.json()).resolves.toMatchObject({ payment: { status: 'declined', canRetry: true, needsReconciliation: false } })
  })
})

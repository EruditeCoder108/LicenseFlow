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
})


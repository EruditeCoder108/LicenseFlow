import type { PaymentMethod, PaymentOutcome, PaymentStatus } from './payment'
import type { LLJourneyProgress } from './progress'
import { reliabilitySessionIdFor } from './reliability'

export interface SandboxPaymentAttempt {
  attemptId: string
  idempotencyKey: string
  applicationId: string
  amountPaise: number
  method: PaymentMethod
  status: PaymentStatus
  reference: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  canRetry: boolean
  needsReconciliation: boolean
}

type PaymentResponse = {
  synthetic: true
  durable: true
  authority: 'sandbox-payment-service'
  duplicate?: boolean
  payment: SandboxPaymentAttempt
}

export class SandboxPaymentError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message)
    this.name = 'SandboxPaymentError'
  }
}

async function requestPayment(path: string, init?: RequestInit): Promise<PaymentResponse> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
    ...init,
  })
  const payload = await response.json().catch(() => ({})) as Partial<PaymentResponse> & { error?: string; code?: string }
  if (!response.ok || !payload.payment) {
    throw new SandboxPaymentError(payload.error || 'The sandbox payment service could not be reached.', response.status, payload.code)
  }
  return payload as PaymentResponse
}

const identityFor = (progress: LLJourneyProgress) => ({
  sessionId: reliabilitySessionIdFor(progress.applicationId),
  applicationId: progress.applicationId,
})

export async function createSandboxPaymentAttempt(progress: LLJourneyProgress): Promise<SandboxPaymentAttempt> {
  const payment = progress.payment
  if (!payment.attemptId || !payment.idempotencyKey || !payment.method) throw new Error('Payment attempt has not been prepared.')
  const response = await requestPayment('/api/reliability/payments/attempts', {
    method: 'POST',
    body: JSON.stringify({
      ...identityFor(progress),
      attemptId: payment.attemptId,
      idempotencyKey: payment.idempotencyKey,
      method: payment.method,
      amountPaise: payment.amountPaise,
    }),
  })
  return response.payment
}

export async function resolveSandboxPaymentAttempt(progress: LLJourneyProgress, outcome: PaymentOutcome): Promise<SandboxPaymentAttempt> {
  if (!progress.payment.idempotencyKey) throw new Error('Payment attempt has no idempotency key.')
  const resolve = () => requestPayment(`/api/reliability/payments/attempts/${encodeURIComponent(progress.payment.idempotencyKey!)}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ ...identityFor(progress), outcome }),
    })
  try {
    return (await resolve()).payment
  } catch (error) {
    // A redirecting attempt saved by an older LicenceFlow build may predate
    // this server boundary. Register that same key once, then resolve it.
    if (!(error instanceof SandboxPaymentError) || error.code !== 'payment_not_found' || progress.payment.status !== 'redirecting') throw error
    await createSandboxPaymentAttempt(progress)
    return (await resolve()).payment
  }
}

export async function reconcileSandboxPaymentAttempt(progress: LLJourneyProgress, outcome: 'confirmed' | 'declined'): Promise<SandboxPaymentAttempt> {
  if (!progress.payment.idempotencyKey) throw new Error('Payment attempt has no idempotency key.')
  const response = await requestPayment(`/api/reliability/payments/attempts/${encodeURIComponent(progress.payment.idempotencyKey)}/reconcile`, {
    method: 'POST',
    body: JSON.stringify({ ...identityFor(progress), outcome }),
  })
  return response.payment
}

export async function getSandboxPaymentAttempt(progress: LLJourneyProgress): Promise<SandboxPaymentAttempt> {
  if (!progress.payment.idempotencyKey) throw new Error('Payment attempt has no idempotency key.')
  const params = new URLSearchParams(identityFor(progress))
  const response = await requestPayment(`/api/reliability/payments/attempts/${encodeURIComponent(progress.payment.idempotencyKey)}?${params}`)
  return response.payment
}

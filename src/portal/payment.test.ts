import { describe, expect, it } from 'vitest'
import {
  beginPayment,
  createPaymentState,
  markGatewayRedirected,
  paymentBlocksNewAttempt,
  reconcilePayment,
  resetPaymentForRetry,
  resolvePayment,
} from './payment'

const start = () => beginPayment(createPaymentState(), {
  applicationId: 'MP-LL-DEMO-1',
  method: 'upi',
  attemptId: 'ATTEMPT-1',
  now: '2026-08-23T10:00:00.000Z',
})

describe('payment transaction model', () => {
  it('creates one stable redirecting attempt', () => {
    const payment = start()
    expect(payment.status).toBe('redirecting')
    expect(payment.method).toBe('upi')
    expect(payment.idempotencyKey).toContain('ATTEMPT-1')
    expect(beginPayment(payment, {
      applicationId: 'MP-LL-DEMO-1', method: 'card', attemptId: 'ATTEMPT-2', now: '2026-08-23T10:01:00.000Z',
    })).toBe(payment)
    const redirected = markGatewayRedirected(payment, '2026-08-23T10:00:30.000Z')
    expect(markGatewayRedirected(redirected, '2026-08-23T10:00:40.000Z')).toBe(redirected)
  })

  it('suppresses another attempt while confirmation is unknown', () => {
    const unknown = resolvePayment(start(), 'unknown', '2026-08-23T10:01:00.000Z')
    expect(paymentBlocksNewAttempt(unknown)).toBe(true)
    expect(beginPayment(unknown, {
      applicationId: 'MP-LL-DEMO-1', method: 'card', attemptId: 'ATTEMPT-2', now: '2026-08-23T10:02:00.000Z',
    })).toBe(unknown)
  })

  it('reconciles an uncertain attempt without creating a duplicate receipt', () => {
    const unknown = resolvePayment(start(), 'unknown', '2026-08-23T10:01:00.000Z')
    const confirmed = reconcilePayment(unknown, 'confirmed', '2026-08-23T10:02:00.000Z')
    expect(confirmed.status).toBe('confirmed')
    expect(confirmed.reference).toContain('ATTEMPT1')
    expect(resolvePayment(confirmed, 'confirmed', '2026-08-23T10:03:00.000Z')).toBe(confirmed)
  })

  it('permits a fresh attempt only after a definitive non-charge outcome', () => {
    const declined = resolvePayment(start(), 'declined', '2026-08-23T10:01:00.000Z')
    expect(paymentBlocksNewAttempt(declined)).toBe(false)
    const reset = resetPaymentForRetry(declined)
    expect(reset.status).toBe('not-started')
    expect(reset.activity.length).toBeGreaterThan(0)
  })
})

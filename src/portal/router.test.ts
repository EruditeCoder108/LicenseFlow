import { describe, expect, it } from 'vitest'
import { normalizePath, parsePortalRoute } from './router'

describe('portal routes', () => {
  it('keeps the national homepage separate from Madhya Pradesh services', () => {
    expect(parsePortalRoute('/')).toEqual({ name: 'home' })
    expect(parsePortalRoute('/login')).toEqual({ name: 'login' })
    expect(parsePortalRoute('/mp')).toEqual({ name: 'services' })
    expect(parsePortalRoute('/mp/services')).toEqual({ name: 'services' })
  })

  it('parses the LL start and saved application routes', () => {
    expect(parsePortalRoute('/mp/ll/start/')).toEqual({ name: 'll-start' })
    expect(parsePortalRoute('/mp/application/DEMO-01')).toEqual({ name: 'application', applicationId: 'DEMO-01' })
  })

  it('parses every detailed application route and upload destination', () => {
    expect(parsePortalRoute('/mp/ll/application/category')).toEqual({ name: 'll-application', step: 'category' })
    expect(parsePortalRoute('/mp/ll/application/review')).toEqual({ name: 'll-application', step: 'review' })
    expect(parsePortalRoute('/mp/ll/submitted')).toEqual({ name: 'll-submitted' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/uploads')).toEqual({ name: 'uploads', applicationId: 'MP-LL-01' })
  })

  it('parses device readiness, rehearsal and payment destinations', () => {
    expect(parsePortalRoute('/mp/application/MP-LL-01/readiness')).toEqual({ name: 'readiness', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/rehearsal')).toEqual({ name: 'rehearsal', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/payment')).toEqual({ name: 'payment', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/payment/redirect')).toEqual({ name: 'payment-redirect', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/sandbox-gateway/MP-LL-01')).toEqual({ name: 'gateway', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/payment/return')).toEqual({ name: 'payment-return', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/payment-status')).toEqual({ name: 'payment-status', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/receipt')).toEqual({ name: 'receipt', applicationId: 'MP-LL-01' })
  })

  it('parses tutorial, test, interruption and result destinations', () => {
    expect(parsePortalRoute('/mp/application/MP-LL-01/tutorial')).toEqual({ name: 'tutorial', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/test-entry')).toEqual({ name: 'test-entry', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/test')).toEqual({ name: 'test', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/test-interruption')).toEqual({ name: 'test-interruption', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/result')).toEqual({ name: 'result', applicationId: 'MP-LL-01' })
    expect(parsePortalRoute('/mp/application/MP-LL-01/result/review')).toEqual({ name: 'result-review', applicationId: 'MP-LL-01' })
  })

  it('parses reusable service destinations and rejects other states', () => {
    expect(parsePortalRoute('/mp/service/application-status')).toEqual({ name: 'service', serviceId: 'application-status' })
    expect(parsePortalRoute('/dl/services')).toEqual({ name: 'not-found' })
  })

  it('normalizes query strings and trailing slashes', () => {
    expect(normalizePath('/mp/services/?source=demo')).toBe('/mp/services')
  })
})

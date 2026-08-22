import { describe, expect, it } from 'vitest'
import { normalizePath, parsePortalRoute } from './router'

describe('MP-only portal routes', () => {
  it('routes the root directly to Madhya Pradesh services', () => {
    expect(parsePortalRoute('/')).toEqual({ name: 'services' })
    expect(parsePortalRoute('/mp/services')).toEqual({ name: 'services' })
  })

  it('parses the LL start and saved application routes', () => {
    expect(parsePortalRoute('/mp/ll/start/')).toEqual({ name: 'll-start' })
    expect(parsePortalRoute('/mp/application/DEMO-01')).toEqual({ name: 'application', applicationId: 'DEMO-01' })
  })

  it('parses reusable service destinations and rejects other states', () => {
    expect(parsePortalRoute('/mp/service/application-status')).toEqual({ name: 'service', serviceId: 'application-status' })
    expect(parsePortalRoute('/dl/services')).toEqual({ name: 'not-found' })
  })

  it('normalizes query strings and trailing slashes', () => {
    expect(normalizePath('/mp/services/?source=demo')).toBe('/mp/services')
  })
})

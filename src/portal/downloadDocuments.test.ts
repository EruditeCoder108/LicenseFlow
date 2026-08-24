import { describe, expect, it } from 'vitest'
import { ageOnDate, createSingleImagePdf, demonstrationLicenceNumber, isDemonstrationLicenceEligible, verificationCode } from './downloadDocuments'

describe('completion document logic', () => {
  it('issues a demonstration licence only after every required outcome is complete', () => {
    expect(isDemonstrationLicenceEligible({ paymentConfirmed: true, tutorialCompleted: true, examCompleted: true, knowledgePassed: true })).toBe(true)
    expect(isDemonstrationLicenceEligible({ paymentConfirmed: false, tutorialCompleted: true, examCompleted: true, knowledgePassed: true })).toBe(false)
    expect(isDemonstrationLicenceEligible({ paymentConfirmed: true, tutorialCompleted: true, examCompleted: true, knowledgePassed: false })).toBe(false)
  })

  it('uses stable, visibly synthetic document identifiers', () => {
    expect(demonstrationLicenceNumber('MP-LL-DEMO-2408')).toMatch(/^LF-DEMO-LL-\d{10}$/)
    expect(demonstrationLicenceNumber('MP-LL-DEMO-2408')).toBe(demonstrationLicenceNumber('MP-LL-DEMO-2408'))
    expect(verificationCode('MP-LL-DEMO-2408')).toMatch(/^DEMO-\d{8}$/)
  })

  it('calculates age from the date of birth instead of printing a stale value', () => {
    expect(ageOnDate('2002-08-14', '2026-08-13T12:00:00.000Z')).toBe(23)
    expect(ageOnDate('2002-08-14', '2026-08-14T12:00:00.000Z')).toBe(24)
    expect(ageOnDate('not-a-date', '2026-08-14T12:00:00.000Z')).toBeNull()
  })

  it('creates a structurally complete one-page PDF around a JPEG stream', () => {
    const result = createSingleImagePdf(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), 2, 2)
    const text = new TextDecoder().decode(result)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text).toContain('/Subtype /Image')
    expect(text).toContain('xref')
    expect(text).toContain('%%EOF')
  })
})

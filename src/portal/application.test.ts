import { afterEach, describe, expect, it, vi } from 'vitest'
import { applicationSteps, completedStepCount, createEmptyDraft, createPreparedDraft, fillDraftWithDemoData, saveApplicationDraft, validateApplicationStep } from './application'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('MP LL application validation', () => {
  it('requires a category and a licence number only for an existing-licence route', () => {
    const empty = createEmptyDraft('TEST')
    expect(validateApplicationStep(empty, 'category')).toEqual({
      applicantCategory: 'Choose the option that describes the applicant.',
    })
    const existing = { ...empty, applicantCategory: 'holds-learner-licence' as const }
    expect(validateApplicationStep(existing, 'category')).toHaveProperty('existingLicenceNumber')
    expect(validateApplicationStep({ ...empty, applicantCategory: 'no-licence' }, 'category')).toEqual({})
  })

  it('requires every Form 1 answer without treating a yes answer as invalid', () => {
    const empty = createEmptyDraft('TEST')
    expect(Object.keys(validateApplicationStep(empty, 'fitness'))).toHaveLength(6)
    const prepared = createPreparedDraft()
    prepared.fitnessAnswers.consciousness = 'yes'
    expect(validateApplicationStep(prepared, 'fitness')).toEqual({})
  })

  it('requires OTP verification only for the prepared Aadhaar route', () => {
    const base = createEmptyDraft('TEST')
    const aadhaar = { ...base, identityRoute: 'aadhaar-ekyc' as const, identityConsent: true }
    expect(validateApplicationStep(aadhaar, 'identity')).toHaveProperty('identityVerified')
    expect(validateApplicationStep({ ...aadhaar, identityVerified: true }, 'identity')).toEqual({})
    expect(validateApplicationStep({ ...base, identityRoute: 'documents', identityConsent: true }, 'identity')).toEqual({})
  })

  it('validates permanent address only when it differs from the present address', () => {
    const prepared = createPreparedDraft()
    expect(validateApplicationStep(prepared, 'address')).toEqual({})
    const different = { ...prepared, samePermanentAddress: false }
    expect(validateApplicationStep(different, 'address')).toHaveProperty('permanentAddress.house')
  })

  it('marks a complete prepared application ready for all seven steps', () => {
    expect(applicationSteps).toHaveLength(7)
    expect(completedStepCount(createPreparedDraft())).toBe(7)
  })

  it('quick-fills a complete profile with non-routable synthetic contacts', () => {
    const filled = fillDraftWithDemoData(createEmptyDraft('TEST'))
    expect(filled.email).toBe('aarav.verma@licenceflow.invalid')
    expect(filled.mobile).toBe('0000000000')
    expect(filled.middleName).toBe('Kumar')
    expect(completedStepCount(filled)).toBe(7)
  })

  it('keeps the form usable when browser storage rejects an autosave', () => {
    vi.stubGlobal('localStorage', {
      setItem: vi.fn(() => { throw new DOMException('Storage blocked', 'QuotaExceededError') }),
    })

    expect(saveApplicationDraft(createEmptyDraft('TEST'))).toBe(false)
  })
})

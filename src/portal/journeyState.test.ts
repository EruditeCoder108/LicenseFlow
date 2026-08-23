import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEmptyDraft,
  createPreparedDraft,
  loadApplicationDraft,
  saveApplicationDraft,
} from './application'
import {
  completeReadiness,
  completeRehearsal,
  completeTutorial,
  createJourneyProgress,
  finishSyntheticPayment,
  startSyntheticPayment,
} from './progress'
import { createExamSession } from './examSession'
import { deriveJourneyState, getRouteAccess } from './journeyState'

describe('deriveJourneyState canonical engine', () => {
  let memoryStore: Record<string, string> = {}

  beforeEach(() => {
    memoryStore = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memoryStore[key] ?? null,
      setItem: (key: string, value: string) => { memoryStore[key] = value },
      removeItem: (key: string) => { delete memoryStore[key] },
      clear: () => { memoryStore = {} },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('regression: refresh during first form screen when category is empty', () => {
    const draft = createEmptyDraft('MP-LL-1001')
    const progress = createJourneyProgress('MP-LL-1001')
    const examSession = createExamSession('MP-LL-1001', progress)

    const state = deriveJourneyState({
      applicationId: 'MP-LL-1001',
      draft,
      progress,
      examSession,
    })

    expect(state.mode).toBe('citizen-journey')
    expect(state.currentStage).toBe('application')
    expect(state.completedStageCount).toBe(0)
    expect(state.resumeHref).toBe('/mp/ll/application/category')
    expect(state.stages[0]!.status).toBe('not_started')
    expect(state.stages[0]!.completedSubsteps).toBe(0)
    expect(state.stages[0]!.totalSubsteps).toBe(7)
  })

  it('regression: refresh after category only has 1/7 form sections and 0 canonical stages complete', () => {
    const draft = { ...createEmptyDraft('MP-LL-1002'), applicantCategory: 'no-licence' as const }
    const progress = createJourneyProgress('MP-LL-1002')
    const examSession = createExamSession('MP-LL-1002', progress)

    const state = deriveJourneyState({
      applicationId: 'MP-LL-1002',
      draft,
      progress,
      examSession,
    })

    expect(state.currentStage).toBe('application')
    expect(state.completedStageCount).toBe(0)
    expect(state.resumeHref).toBe('/mp/ll/application/identity')
    expect(state.stages[0]!.status).toBe('in_progress')
    expect(state.stages[0]!.completedSubsteps).toBe(1)
    expect(state.stages[1]!.status).toBe('blocked')
  })

  it('regression: prepared demo does not overwrite citizen application', () => {
    const citizenDraft = {
      ...createEmptyDraft('MP-LL-CITIZEN-99'),
      applicantCategory: 'no-licence' as const,
      firstName: 'Pooja',
      lastName: 'Sharma',
    }
    saveApplicationDraft(citizenDraft)

    const preparedDemo = createPreparedDraft()
    saveApplicationDraft(preparedDemo)

    // Loading citizen draft specifically should yield untouched citizen data
    const reloadedCitizen = loadApplicationDraft('MP-LL-CITIZEN-99')
    expect(reloadedCitizen).not.toBeNull()
    expect(reloadedCitizen?.applicationId).toBe('MP-LL-CITIZEN-99')
    expect(reloadedCitizen?.firstName).toBe('Pooja')
    expect(reloadedCitizen?.mode).toBe('citizen-journey')

    // Loading prepared demo should yield prepared demo
    const reloadedDemo = loadApplicationDraft('MP-LL-DEMO-2408')
    expect(reloadedDemo).not.toBeNull()
    expect(reloadedDemo?.firstName).toBe('Aarav')
    expect(reloadedDemo?.mode).toBe('prepared-demo')
  })

  it('regression: wrong application ID cannot read another draft', () => {
    const draft = createEmptyDraft('MP-LL-REAL-1')
    saveApplicationDraft(draft)

    expect(loadApplicationDraft('MP-LL-UNKNOWN-99')).toBeNull()
  })

  it('correctly tracks form submission to Stage 2 (Uploads)', () => {
    const prepared = createPreparedDraft()
    // un-complete uploads to simulate submitted form waiting for uploads
    const draft = {
      ...prepared,
      applicationId: 'MP-LL-SUBMITTED-1',
      mode: 'citizen-journey' as const,
      documentsUploaded: false,
      photoUploaded: false,
      signatureUploaded: false,
    }
    const progress = createJourneyProgress('MP-LL-SUBMITTED-1')
    const examSession = createExamSession('MP-LL-SUBMITTED-1', progress)

    const state = deriveJourneyState({
      applicationId: 'MP-LL-SUBMITTED-1',
      draft,
      progress,
      examSession,
    })

    expect(state.stages[0]!.status).toBe('completed')
    expect(state.stages[1]!.status).toBe('needs_action')
    expect(state.stages[2]!.status).toBe('blocked')
    expect(state.completedStageCount).toBe(1)
    expect(state.resumeHref).toBe('/mp/application/MP-LL-SUBMITTED-1/uploads')
    expect(state.currentStage).toBe('uploads')
  })

  it('correctly advances through readiness and rehearsal in Stage 3', () => {
    const draft = createPreparedDraft() // has uploads complete & submitted
    let progress = createJourneyProgress('MP-LL-DEMO-2408')
    let examSession = createExamSession('MP-LL-DEMO-2408', progress)

    // Initial prepared demo state: Stage 1 & 2 complete, Stage 3 needs readiness check
    let state = deriveJourneyState({
      applicationId: 'MP-LL-DEMO-2408',
      draft,
      progress,
      examSession,
    })
    expect(state.completedStageCount).toBe(2)
    expect(state.currentStage).toBe('readiness')
    expect(state.resumeHref).toBe('/mp/application/MP-LL-DEMO-2408/readiness')

    // After readiness passes, rehearsal is next
    progress = completeReadiness(progress, 'real-browser-checks')
    state = deriveJourneyState({
      applicationId: 'MP-LL-DEMO-2408',
      draft,
      progress,
      examSession,
    })
    expect(state.completedStageCount).toBe(2)
    expect(state.resumeHref).toBe('/mp/application/MP-LL-DEMO-2408/rehearsal')

    // After rehearsal completes, Stage 3 is complete and Stage 4 (Payment) is next
    progress = completeRehearsal(progress, 0)
    state = deriveJourneyState({
      applicationId: 'MP-LL-DEMO-2408',
      draft,
      progress,
      examSession,
    })
    expect(state.completedStageCount).toBe(3)
    expect(state.stages[2]!.status).toBe('completed')
    expect(state.stages[3]!.status).toBe('needs_action')
    expect(state.resumeHref).toBe('/mp/application/MP-LL-DEMO-2408/payment')
  })

  it('correctly advances through payment, tutorial, test and result', () => {
    const draft = createPreparedDraft()
    let progress = createJourneyProgress('MP-LL-DEMO-2408')
    progress = completeReadiness(progress, 'real-browser-checks')
    progress = completeRehearsal(progress, 0)

    // Complete payment
    const started = startSyntheticPayment(progress, 'upi', 'ATT-1')
    progress = finishSyntheticPayment(started, 'confirmed')

    let examSession = createExamSession('MP-LL-DEMO-2408', progress)
    let state = deriveJourneyState({
      applicationId: 'MP-LL-DEMO-2408',
      draft,
      progress,
      examSession,
    })
    expect(state.completedStageCount).toBe(4)
    expect(state.stages[3]!.status).toBe('completed')
    expect(state.stages[4]!.status).toBe('needs_action')
    expect(state.resumeHref).toBe('/mp/application/MP-LL-DEMO-2408/tutorial')

    // Complete tutorial
    progress = completeTutorial(progress)
    state = deriveJourneyState({
      applicationId: 'MP-LL-DEMO-2408',
      draft,
      progress,
      examSession,
    })
    expect(state.completedStageCount).toBe(5)
    expect(state.stages[4]!.status).toBe('completed')
    expect(state.stages[5]!.status).toBe('needs_action')
    expect(state.resumeHref).toBe('/mp/application/MP-LL-DEMO-2408/test-entry')

    // Exam finished
    examSession = { ...examSession, stage: 'result' }
    state = deriveJourneyState({
      applicationId: 'MP-LL-DEMO-2408',
      draft,
      progress,
      examSession,
    })
    expect(state.completedStageCount).toBe(7)
    expect(state.stages[5]!.status).toBe('completed')
    expect(state.stages[6]!.status).toBe('completed')
    expect(state.resumeHref).toBe('/mp/application/MP-LL-DEMO-2408/result')
  })

  it('validates route access rules correctly with getRouteAccess', () => {
    const draft = createEmptyDraft('MP-LL-1003')
    const progress = createJourneyProgress('MP-LL-1003')
    const examSession = createExamSession('MP-LL-1003', progress)

    const journey = deriveJourneyState({
      applicationId: 'MP-LL-1003',
      draft,
      progress,
      examSession,
    })

    // Public routes allowed
    expect(getRouteAccess({ route: { name: 'home' }, journey }).allowed).toBe(true)
    expect(getRouteAccess({ route: { name: 'application', applicationId: 'MP-LL-1003' }, journey }).allowed).toBe(true)

    // Downstream routes blocked without prerequisites redirect immediately to the exact missing step (resumeHref)
    const paymentCheck = getRouteAccess({ route: { name: 'payment', applicationId: 'MP-LL-1003' }, journey })
    expect(paymentCheck.allowed).toBe(false)
    expect(paymentCheck.redirectHref).toBe('/mp/ll/application/category')

    const testCheck = getRouteAccess({ route: { name: 'test', applicationId: 'MP-LL-1003' }, journey })
    expect(testCheck.allowed).toBe(false)
    expect(testCheck.redirectHref).toBe('/mp/ll/application/category')
  })

  it('regression: active citizen application pointer is not clobbered when prepared demo is saved', () => {
    const citizenDraft = createEmptyDraft('MP-LL-CITIZEN-101')
    citizenDraft.firstName = 'Ravi'
    saveApplicationDraft(citizenDraft)

    // Initially, loadApplicationDraft() without args loads the active citizen draft
    expect(loadApplicationDraft()?.applicationId).toBe('MP-LL-CITIZEN-101')

    // Save prepared demo
    const demoDraft = createPreparedDraft()
    saveApplicationDraft(demoDraft)

    // loadApplicationDraft() without args still loads the citizen draft because citizen takes precedence
    expect(loadApplicationDraft()?.applicationId).toBe('MP-LL-CITIZEN-101')
    expect(loadApplicationDraft()?.mode).toBe('citizen-journey')

    // Specific loading still retrieves exact drafts
    expect(loadApplicationDraft('MP-LL-DEMO-2408')?.mode).toBe('prepared-demo')
  })
})

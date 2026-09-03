import { afterEach, describe, expect, it, vi } from 'vitest'
import { createJourneyProgress, completeReadiness, completeRehearsal, startSyntheticPayment, finishSyntheticPayment, completeTutorial, startTutorial, updateTutorialWatch } from './progress'
import { journeyReducer } from '../domain/journey'
import { createExamSession, createPassingJudgeExamSession, loadExamSession } from './examSession'

describe('portal exam session', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('archives a retired judge paper without attaching its score to new questions', () => {
    const progress = createJourneyProgress('MP-LL-LEGACY-1000')
    const previous = createExamSession(progress.applicationId, progress)
    previous.stage = 'result'
    previous.exam.status = 'completed'
    previous.exam.paperQuestionIds = ['retired-private-bank-id']
    previous.exam.correctAnswers = 15
    previous.exam.knowledgeResult = 'passed'
    const key = `mp-ll-exam-session-v1:${progress.applicationId}`
    const entries = new Map([[key, JSON.stringify(previous)], ['mp-ll-application-draft-v1', 'unchanged-draft']])
    vi.stubGlobal('localStorage', { getItem: (name: string) => entries.get(name) ?? null, setItem: (name: string, value: string) => entries.set(name, value) })
    const next = loadExamSession(progress.applicationId, progress)
    expect(next.stage).toBe('exam-intro')
    expect(next.exam.status).toBe('not-started')
    expect(next.exam.correctAnswers).toBe(0)
    expect(JSON.parse(entries.get(`${key}:archived`)!)).toEqual(previous)
    expect(entries.get('mp-ll-application-draft-v1')).toBe('unchanged-draft')
    expect(next.events.some((event) => event.title === 'Judge sample paper refreshed')).toBe(true)
  })
  it('starts only after the completed pre-test journey and carries its evidence', () => {
    let progress = createJourneyProgress('MP-LL-DEMO-1')
    progress = completeReadiness(progress, 'guided-signals')
    progress = completeRehearsal(progress, 0)
    progress = startSyntheticPayment(progress, 'upi', 'ATTEMPT-1')
    progress = finishSyntheticPayment(progress, 'confirmed')
    progress = startTutorial(progress, 'test-video', 60)
    progress = updateTutorialWatch(progress, { revision: 'test-video', position: 60, maxWatched: 60, duration: 60 })
    progress = completeTutorial(progress, 'test-video', 60)
    const session = createExamSession(progress.applicationId, progress)
    expect(session.stage).toBe('exam-intro')
    expect(session.paymentStatus).toBe('paid')
    expect(session.readiness.usedGuidedSignals).toBe(true)
    expect(session.events.map((event) => event.kind)).toEqual(['READINESS_PASSED', 'REHEARSAL_COMPLETED', 'PAYMENT_SUCCESS', 'PREPARATION_COMPLETED'])
  })

  it('creates a transparent passing judge preview through the normal scoring reducer', () => {
    let progress = createJourneyProgress('MP-LL-JUDGE-PASS')
    progress = completeReadiness(progress, 'guided-signals')
    progress = completeRehearsal(progress, 0)
    progress = startSyntheticPayment(progress, 'upi', 'ATTEMPT-JUDGE')
    progress = finishSyntheticPayment(progress, 'confirmed')
    progress = startTutorial(progress, 'test-video', 60)
    progress = updateTutorialWatch(progress, { revision: 'test-video', position: 60, maxWatched: 60, duration: 60 })
    progress = completeTutorial(progress, 'test-video', 60)

    const session = createPassingJudgeExamSession(progress.applicationId, progress)

    expect(session.stage).toBe('result')
    expect(session.exam.knowledgeResult).toBe('passed')
    expect(session.exam.correctAnswers).toBe(15)
    expect(Object.keys(session.exam.answers)).toHaveLength(15)
    expect(session.events.some((event) => event.title === 'Judge review shortcut used' && event.synthetic)).toBe(true)
  })

  it('keeps safe-recovery evidence in the judge result preview', () => {
    let progress = createJourneyProgress('MP-LL-JUDGE-RECOVERY')
    progress = completeReadiness(progress, 'guided-signals')
    progress = completeRehearsal(progress, 0)
    progress = startSyntheticPayment(progress, 'upi', 'ATTEMPT-RECOVERY')
    progress = finishSyntheticPayment(progress, 'confirmed')
    progress = startTutorial(progress, 'test-video', 60)
    progress = updateTutorialWatch(progress, { revision: 'test-video', position: 60, maxWatched: 60, duration: 60 })
    progress = completeTutorial(progress, 'test-video', 60)

    let interrupted = journeyReducer(createExamSession(progress.applicationId, progress), { type: 'START_EXAM' })
    interrupted = journeyReducer(interrupted, {
      type: 'PAUSE_EXAM',
      kind: 'network-demo',
      detail: 'Prepared network interruption; saved answer retained',
      synthetic: true,
    })
    interrupted = journeyReducer(interrupted, { type: 'RESUME_EXAM' })
    const result = createPassingJudgeExamSession(progress.applicationId, progress, interrupted)
    expect(result.exam.interruptionSeen).toBe(true)
    expect(result.exam.integrityStatus).toBe('technical-event-recovered')
    expect(result.events.some((event) => event.kind === 'TEST_PAUSED')).toBe(true)
    expect(result.events.some((event) => event.kind === 'TEST_RESUMED')).toBe(true)
  })
})

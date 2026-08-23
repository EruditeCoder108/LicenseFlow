import { describe, expect, it } from 'vitest'
import { createJourneyProgress, completeReadiness, completeRehearsal, startSyntheticPayment, finishSyntheticPayment, completeTutorial } from './progress'
import { createExamSession } from './examSession'

describe('portal exam session', () => {
  it('starts only after the completed pre-test journey and carries its evidence', () => {
    let progress = createJourneyProgress('MP-LL-DEMO-1')
    progress = completeReadiness(progress, 'guided-signals')
    progress = completeRehearsal(progress, 0)
    progress = startSyntheticPayment(progress, 'upi', 'ATTEMPT-1')
    progress = finishSyntheticPayment(progress, 'confirmed')
    progress = completeTutorial(progress)
    const session = createExamSession(progress.applicationId, progress)
    expect(session.stage).toBe('exam-intro')
    expect(session.paymentStatus).toBe('paid')
    expect(session.readiness.usedGuidedSignals).toBe(true)
    expect(session.events.map((event) => event.kind)).toEqual(['READINESS_PASSED', 'REHEARSAL_COMPLETED', 'PAYMENT_SUCCESS', 'PREPARATION_COMPLETED'])
  })
})

import { describe, expect, it } from 'vitest'
import {
  completeReadiness,
  completeRehearsal,
  completeTutorial,
  completedProgressItemsCount,
  createJourneyProgress,
  finishSyntheticPayment,
  startSyntheticPayment,
  startTutorial,
  updateTutorialWatch,
} from './progress'

describe('MP LL journey progress', () => {
  it('does not allow rehearsal before readiness', () => {
    const initial = createJourneyProgress('MP-LL-DEMO-1')
    expect(completeRehearsal(initial, 0)).toBe(initial)
  })

  it('does not allow payment before readiness and rehearsal', () => {
    const initial = createJourneyProgress('MP-LL-DEMO-1')
    expect(startSyntheticPayment(initial, 'upi', 'ATTEMPT-1')).toBe(initial)
    const ready = completeReadiness(initial, 'guided-signals')
    expect(startSyntheticPayment(ready, 'upi', 'ATTEMPT-1')).toBe(ready)
  })

  it('records one idempotent synthetic payment after prerequisites', () => {
    let progress = createJourneyProgress('MP-LL-DEMO-1')
    progress = completeReadiness(progress, 'real-browser-checks')
    progress = completeRehearsal(progress, 0)
    const started = startSyntheticPayment(progress, 'upi', 'ATTEMPT-1', '2026-08-23T10:00:00.000Z')
    const paid = finishSyntheticPayment(started, 'confirmed', '2026-08-23T10:01:00.000Z')
    expect(paid.payment.status).toBe('confirmed')
    expect(paid.payment.reference).toContain('SBX')
    expect(startSyntheticPayment(paid, 'upi', 'ATTEMPT-2')).toBe(paid)
    expect(completedProgressItemsCount(paid)).toBe(3)
  })

  it('does not complete learning before payment', () => {
    const initial = createJourneyProgress('MP-LL-DEMO-1')
    expect(completeTutorial(initial, 'video-v1', 120)).toBe(initial)
  })

  it('requires the current video to be watched before completing learning', () => {
    let progress = createJourneyProgress('MP-LL-DEMO-1')
    progress = completeReadiness(progress, 'guided-signals')
    progress = completeRehearsal(progress, 0)
    progress = finishSyntheticPayment(startSyntheticPayment(progress, 'upi', 'ATTEMPT-1'), 'confirmed')
    progress = startTutorial(progress, 'video-v1', 120)
    const partial = updateTutorialWatch(progress, { revision: 'video-v1', position: 70, maxWatched: 70, duration: 120 })
    expect(completeTutorial(partial, 'video-v1', 120)).toBe(partial)
    const watched = updateTutorialWatch(partial, { revision: 'video-v1', position: 120, maxWatched: 120, duration: 120 })
    expect(completeTutorial(watched, 'video-v1', 120).tutorial.status).toBe('completed')
  })
})

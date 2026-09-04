import { describe, expect, it } from 'vitest'
import { decideMonitoringAction } from './monitoringDecision'

const quiet = { noFaceMs: 0, multipleFacesMs: 0, phoneMs: 0, framingIssueMs: 0, lightingIssueMs: 0 }

describe('deterministic monitoring decisions', () => {
  it('ignores brief camera noise', () => {
    expect(decideMonitoringAction({ ...quiet, noFaceMs: 900 })).toEqual({ coachingReason: null, blockingReason: null })
  })

  it('coaches before it pauses', () => {
    expect(decideMonitoringAction({ ...quiet, noFaceMs: 2_000 })).toEqual({ coachingReason: 'no-face', blockingReason: null })
    expect(decideMonitoringAction({ ...quiet, noFaceMs: 4_100 })).toEqual({ coachingReason: 'no-face', blockingReason: 'no-face' })
  })

  it('prioritises multiple faces over softer framing or light guidance', () => {
    expect(decideMonitoringAction({ noFaceMs: 0, multipleFacesMs: 2_600, phoneMs: 0, framingIssueMs: 9_000, lightingIssueMs: 9_000 })).toEqual({
      coachingReason: 'multiple-faces',
      blockingReason: 'multiple-faces',
    })
  })

  it('never turns framing or lighting alone into an automatic pause', () => {
    expect(decideMonitoringAction({ noFaceMs: 0, multipleFacesMs: 0, phoneMs: 0, framingIssueMs: 10_000, lightingIssueMs: 10_000 })).toEqual({
      coachingReason: 'framing',
      blockingReason: null,
    })
  })

  it('requires a sustained phone observation and then gives it priority', () => {
    expect(decideMonitoringAction({ ...quiet, phoneMs: 900 })).toEqual({ coachingReason: null, blockingReason: null })
    expect(decideMonitoringAction({ ...quiet, phoneMs: 1_500 })).toEqual({ coachingReason: 'phone', blockingReason: null })
    expect(decideMonitoringAction({ ...quiet, phoneMs: 3_100, multipleFacesMs: 4_000 })).toEqual({ coachingReason: 'phone', blockingReason: 'phone' })
  })
})

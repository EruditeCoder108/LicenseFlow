import { describe, expect, it } from 'vitest'
import { classifyPauseReason, normalizeIntegritySummary, pauseEventDetail, recordIntegrityEvent } from './integrityPolicy'

describe('protected exam integrity policy', () => {
  it('keeps technical failure separate from attention and integrity observations', () => {
    expect(classifyPauseReason('network')).toBe('technical')
    expect(classifyPauseReason('camera-stopped')).toBe('technical')
    expect(classifyPauseReason('visibility')).toBe('attention')
    expect(classifyPauseReason('no-face')).toBe('attention')
    expect(classifyPauseReason('fullscreen-exit')).toBe('attention')
    expect(classifyPauseReason('multiple-faces')).toBe('integrity')
    expect(classifyPauseReason('phone')).toBe('integrity')
    expect(classifyPauseReason('exit')).toBe('manual')
  })

  it('keeps judge simulations out of real review evidence', () => {
    const summary = recordIntegrityEvent(null, 'phone', 'judge-simulation')
    expect(summary).toMatchObject({
      simulatedEvents: 1,
      integrityObservations: 0,
      status: 'clear',
      lastReason: 'phone',
      lastSource: 'judge-simulation',
    })
    expect(pauseEventDetail('phone', 'judge-simulation')).toContain('stored this separately')
  })

  it('builds an explainable summary without converting an event into a verdict', () => {
    let summary = recordIntegrityEvent(null, 'network')
    expect(summary).toMatchObject({ technicalInterruptions: 1, status: 'clear' })
    summary = recordIntegrityEvent(summary, 'visibility')
    expect(summary).toMatchObject({ attentionEvents: 1, status: 'observations-recorded' })
    summary = recordIntegrityEvent(summary, 'multiple-faces')
    expect(summary).toMatchObject({ integrityObservations: 1, status: 'review-recommended', lastReason: 'multiple-faces' })
    expect(pauseEventDetail('multiple-faces')).toContain('not an automatic cheating verdict')
  })

  it('normalizes attempts created before the summary existed', () => {
    expect(normalizeIntegritySummary()).toEqual({
      technicalInterruptions: 0,
      attentionEvents: 0,
      integrityObservations: 0,
      manualPauses: 0,
      simulatedEvents: 0,
      status: 'clear',
      lastReason: null,
      lastSource: null,
    })
  })
})

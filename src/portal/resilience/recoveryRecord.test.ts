import { describe, expect, it } from 'vitest'
import type { ProtectedExamEvent, ProtectedExamSnapshot } from '../protectedExamTypes'
import { recoveryRecordEvent, recoveryRecordEvents } from './recoveryRecord'

const event: ProtectedExamEvent = {
  id: 'event-1',
  kind: 'ANSWER_LOCKED',
  at: 1_725_000_000_000,
  detail: 'Question 4 answer committed before navigation. Selected option 2.',
}

describe('citizen recovery record', () => {
  it('turns server audit language into a plain-language status', () => {
    expect(recoveryRecordEvent(event, 'en')).toEqual({
      id: 'event-1',
      at: event.at,
      title: 'Answer saved',
      detail: 'The answer was confirmed before the test moved forward.',
    })
  })

  it('never copies raw audit detail that could include question or answer information', () => {
    const attempt = { events: [event] } as ProtectedExamSnapshot
    const serialized = JSON.stringify(recoveryRecordEvents(attempt, 'en'))
    expect(serialized).not.toContain('Question 4')
    expect(serialized).not.toContain('option 2')
  })

  it('provides Hindi citizen-facing labels', () => {
    expect(recoveryRecordEvent({ ...event, kind: 'PAUSED' }, 'hi').title).toBe('टेस्ट सुरक्षित रूप से रुका')
  })
})

import { describe, expect, it } from 'vitest'
import { initialJourneyState } from '../domain/journey'
import { createJourneyProgress } from './progress'
import { buildReliabilityCheckpoint } from './reliability'

describe('reliability checkpoint privacy boundary', () => {
  it('derives only broad recovery facts from the full browser state', () => {
    const progress = createJourneyProgress('MP-LL-DEMO-2408')
    const exam = {
      ...initialJourneyState,
      application: {
        ...initialJourneyState.application,
        fullName: 'Aarav Verma',
        phone: '9876543210',
      },
      exam: {
        ...initialJourneyState.exam,
        status: 'active' as const,
        paperQuestionIds: ['q-private-1', 'q-private-2'],
        answers: { 0: 2 },
      },
    }

    const checkpoint = buildReliabilityCheckpoint(progress, exam)
    const serialized = JSON.stringify(checkpoint)

    expect(checkpoint).toMatchObject({ examStatus: 'active', answeredCount: 1, questionCount: 2 })
    expect(serialized).not.toContain('Aarav')
    expect(serialized).not.toContain('9876543210')
    expect(serialized).not.toContain('q-private-1')
    expect(serialized).not.toContain('"answers"')
  })
})


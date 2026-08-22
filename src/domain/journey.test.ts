import { describe, expect, it } from 'vitest'
import {
  initialJourneyState,
  journeyReducer,
  type JourneyAction,
  type JourneyState,
} from './journey'

function freshState(): JourneyState {
  return structuredClone(initialJourneyState)
}

function reduce(state: JourneyState, ...actions: JourneyAction[]): JourneyState {
  return actions.reduce(journeyReducer, state)
}

function reachPayment(): JourneyState {
  return reduce(
    freshState(),
    { type: 'START', mode: 'guided-demo' },
    { type: 'NEXT_APPLICATION_STEP' },
    { type: 'NEXT_APPLICATION_STEP' },
    { type: 'UPDATE_APPLICATION', patch: { declarationAccepted: true } },
    { type: 'COMPLETE_APPLICATION' },
    { type: 'COMPLETE_PREPARATION' },
    { type: 'COMPLETE_READINESS', usedGuidedSignals: true },
    { type: 'COMPLETE_REHEARSAL' },
  )
}

function reachExam(): JourneyState {
  return reduce(
    reachPayment(),
    { type: 'PAY' },
    { type: 'OPEN_EXAM_INTRO' },
    { type: 'START_EXAM' },
  )
}

describe('journeyReducer safety invariants', () => {
  it('does not allow payment before readiness and rehearsal', () => {
    const started = journeyReducer(freshState(), { type: 'START', mode: 'guided-demo' })
    const attemptedPayment = journeyReducer(started, { type: 'PAY' })

    expect(attemptedPayment).toBe(started)
    expect(attemptedPayment.paymentStatus).toBe('not-started')
    expect(attemptedPayment.events.some((event) => event.kind === 'PAYMENT_SUCCESS')).toBe(false)
  })

  it('requires the prototype declaration before completing the application', () => {
    const review = reduce(
      freshState(),
      { type: 'START', mode: 'guided-demo' },
      { type: 'NEXT_APPLICATION_STEP' },
      { type: 'NEXT_APPLICATION_STEP' },
    )

    const blocked = journeyReducer(review, { type: 'COMPLETE_APPLICATION' })
    expect(blocked).toBe(review)

    const accepted = reduce(
      review,
      { type: 'UPDATE_APPLICATION', patch: { declarationAccepted: true } },
      { type: 'COMPLETE_APPLICATION' },
    )
    expect(accepted.stage).toBe('preparation')
  })

  it('checkpoints an answer before advancing', () => {
    const exam = reachExam()
    const advanced = journeyReducer(exam, {
      type: 'ANSWER',
      answer: 2,
      correct: true,
      isLast: false,
      passThreshold: 3,
      triggerDemoInterruption: false,
    })

    expect(advanced.exam.answers[0]).toBe(2)
    expect(advanced.exam.currentQuestion).toBe(1)
    expect(advanced.events.at(-1)?.kind).toBe('ANSWER_SAVED')
  })

  it('preserves answers and payment through the guided interruption', () => {
    let state = reachExam()
    for (let question = 0; question < 3; question += 1) {
      state = journeyReducer(state, {
        type: 'ANSWER',
        answer: question,
        correct: true,
        isLast: false,
        passThreshold: 3,
        triggerDemoInterruption: question === 2,
      })
    }

    expect(state.stage).toBe('interruption')
    expect(state.exam.status).toBe('paused')
    expect(state.exam.answers).toEqual({ 0: 0, 1: 1, 2: 2 })
    expect(state.exam.currentQuestion).toBe(3)
    expect(state.paymentStatus).toBe('paid')

    const paymentEventsBeforeResume = state.events.filter((event) => event.kind === 'PAYMENT_SUCCESS').length
    const resumed = journeyReducer(state, { type: 'RESUME_EXAM' })

    expect(resumed.stage).toBe('exam')
    expect(resumed.exam.currentQuestion).toBe(3)
    expect(resumed.exam.answers).toEqual(state.exam.answers)
    expect(resumed.events.filter((event) => event.kind === 'PAYMENT_SUCCESS')).toHaveLength(paymentEventsBeforeResume)
    expect(resumed.events.at(-1)?.detail).toContain('no repeat payment')
  })

  it('keeps a technical recovery separate from the knowledge result', () => {
    const paused = journeyReducer(reachExam(), {
      type: 'PAUSE_EXAM',
      kind: 'network-real',
      detail: 'Browser reported offline',
      synthetic: false,
    })
    const resumed = journeyReducer(paused, { type: 'RESUME_EXAM' })
    const completed = journeyReducer(resumed, {
      type: 'ANSWER',
      answer: 0,
      correct: true,
      isLast: true,
      passThreshold: 1,
      triggerDemoInterruption: false,
    })

    expect(completed.stage).toBe('result')
    expect(completed.exam.knowledgeResult).toBe('passed')
    expect(completed.exam.integrityStatus).toBe('technical-event-recovered')
    expect(completed.exam.interruptionSeen).toBe(true)
  })
})

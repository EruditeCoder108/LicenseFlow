import { fullQuestions } from '../content/questions'
import { LL_TEST_CONFIG } from '../content/testConfig'
import { initialJourneyState, journeyReducer, type JourneyEvent, type JourneyState } from '../domain/journey'
import type { LLJourneyProgress } from './progress'

const STORAGE_PREFIX = 'mp-ll-exam-session-v1:'

function seedEvent(id: string, kind: JourneyEvent['kind'], title: string, detail: string, at: string, synthetic: boolean): JourneyEvent {
  return { id: `${id}-${kind}`, kind, title, detail, at, synthetic }
}

export function createExamSession(applicationId: string, progress: LLJourneyProgress): JourneyState {
  const now = new Date().toISOString()
  const events: JourneyEvent[] = [
    seedEvent(applicationId, 'READINESS_PASSED', 'Device readiness passed', progress.readiness.mode === 'guided-signals' ? 'Guided camera-derived signals; browser storage, connection and secure-context checks remained real' : 'Real browser camera, microphone and device checks passed', progress.readiness.completedAt ?? now, progress.readiness.mode === 'guided-signals'),
    seedEvent(applicationId, 'REHEARSAL_COMPLETED', 'Secure-test rehearsal completed', 'Sample answer checkpoint and recovery behavior completed', progress.rehearsal.completedAt ?? now, true),
    seedEvent(applicationId, 'PAYMENT_SUCCESS', 'Synthetic payment recorded', `${progress.payment.reference ?? 'Sandbox reference'} · no bank or treasury connected`, progress.payment.confirmedAt ?? now, true),
    seedEvent(applicationId, 'PREPARATION_COMPLETED', 'Road-safety tutorial completed', `Required learning video completed · revision ${progress.tutorial.revision || 'legacy'}`, progress.tutorial.completedAt ?? now, true),
  ]
  return {
    ...initialJourneyState,
    stage: 'exam-intro',
    mode: 'guided-demo',
    applicationStep: 2,
    application: {
      ...initialJourneyState.application,
      fullName: 'Synthetic MP applicant',
      state: 'Madhya Pradesh',
      declarationAccepted: true,
    },
    readiness: {
      status: 'passed',
      usedGuidedSignals: progress.readiness.mode === 'guided-signals',
      completedAt: progress.readiness.completedAt,
    },
    paymentStatus: 'paid',
    paymentReference: progress.payment.reference,
    events,
  }
}

export function loadExamSession(applicationId: string, progress: LLJourneyProgress): JourneyState {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${applicationId}`)
    if (!raw) return createExamSession(applicationId, progress)
    const parsed = JSON.parse(raw) as JourneyState
    return parsed.version === 2 ? parsed : createExamSession(applicationId, progress)
  } catch {
    return createExamSession(applicationId, progress)
  }
}

export function saveExamSession(applicationId: string, state: JourneyState): boolean {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${applicationId}`, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function resetExamSession(applicationId: string, progress: LLJourneyProgress): JourneyState {
  const state = createExamSession(applicationId, progress)
  saveExamSession(applicationId, state)
  return state
}

export function createPassingJudgeExamSession(applicationId: string, progress: LLJourneyProgress): JourneyState {
  let state = journeyReducer(createExamSession(applicationId, progress), { type: 'START_EXAM' })
  const now = new Date().toISOString()
  state = {
    ...state,
    events: [
      ...state.events,
      seedEvent(
        `${applicationId}-judge-pass-${Date.now()}`,
        'EXAM_STARTED',
        'Judge review shortcut used',
        'Synthetic correct answers were processed through the normal scoring reducer to preview the passing result journey',
        now,
        true,
      ),
    ],
  }

  fullQuestions.forEach((question, index) => {
    state = journeyReducer(state, {
      type: 'ANSWER',
      answer: question.correct,
      correct: true,
      isLast: index === fullQuestions.length - 1,
      passThreshold: LL_TEST_CONFIG.passMark,
      triggerDemoInterruption: false,
    })
  })
  saveExamSession(applicationId, state)
  return state
}

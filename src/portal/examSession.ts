import { buildQuestionPaper, isValidQuestionPaper, resolveQuestionPaper } from '../content/questionPaper'
import { LL_TEST_CONFIG } from '../content/testConfig'
import { initialJourneyState, journeyReducer, type JourneyEvent, type JourneyState } from '../domain/journey'
import type { LLJourneyProgress } from './progress'
import { queueExamReliabilityCheckpoint } from './reliability'

const STORAGE_PREFIX = 'mp-ll-exam-session-v1:'

function seedEvent(id: string, kind: JourneyEvent['kind'], title: string, detail: string, at: string, synthetic: boolean): JourneyEvent {
  return { id: `${id}-${kind}`, kind, title, detail, at, synthetic }
}

export function createExamSession(applicationId: string, progress: LLJourneyProgress, attemptNumber = 1, previousQuestionIds: string[] = []): JourneyState {
  const now = new Date().toISOString()
  const paperSeed = `${applicationId}:attempt:${attemptNumber}`
  const paperQuestionIds = buildQuestionPaper(paperSeed, previousQuestionIds).map((question) => question.id)
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
    exam: {
      ...initialJourneyState.exam,
      attemptNumber,
      paperSeed,
      paperQuestionIds,
      previousPaperQuestionIds: previousQuestionIds,
    },
    events,
  }
}

export function loadExamSession(applicationId: string, progress: LLJourneyProgress): JourneyState {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${applicationId}`)
    if (!raw) return createExamSession(applicationId, progress)
    const parsed = JSON.parse(raw) as JourneyState
    if (parsed.version !== 2) return createExamSession(applicationId, progress)
    const attemptNumber = parsed.exam.attemptNumber || 1
    if (!isValidQuestionPaper(parsed.exam.paperQuestionIds ?? [])) {
      const replacement = createExamSession(applicationId, progress, attemptNumber, parsed.exam.previousPaperQuestionIds ?? [])
      const migrated = { ...parsed, exam: { ...parsed.exam, ...replacement.exam } }
      saveExamSession(applicationId, migrated)
      return migrated
    }
    return parsed
  } catch {
    return createExamSession(applicationId, progress)
  }
}

export function saveExamSession(applicationId: string, state: JourneyState): boolean {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${applicationId}`, JSON.stringify(state))
    queueExamReliabilityCheckpoint(applicationId, state)
    return true
  } catch {
    return false
  }
}

export function resetExamSession(applicationId: string, progress: LLJourneyProgress): JourneyState {
  const current = loadExamSession(applicationId, progress)
  const state = createExamSession(
    applicationId,
    progress,
    (current.exam.attemptNumber || 1) + 1,
    current.exam.paperQuestionIds,
  )
  saveExamSession(applicationId, state)
  return state
}

export function createPassingJudgeExamSession(
  applicationId: string,
  progress: LLJourneyProgress,
  currentSession?: JourneyState,
): JourneyState {
  const current = currentSession ?? loadExamSession(applicationId, progress)
  const freshBase = createExamSession(
    applicationId,
    progress,
    current.stage === 'result' ? (current.exam.attemptNumber || 1) + 1 : current.exam.attemptNumber || 1,
    current.stage === 'result' ? current.exam.paperQuestionIds : current.exam.previousPaperQuestionIds,
  )
  // When the judge first previews safe recovery, carry that evidence into the
  // generated passing result instead of erasing the strongest proof point.
  const recoveryEvents = current.exam.interruptionSeen
    ? current.events.filter((event) => event.kind === 'TEST_PAUSED' || event.kind === 'TEST_RESUMED')
    : []
  const base = current.exam.interruptionSeen
    ? {
        ...freshBase,
        exam: {
          ...freshBase.exam,
          interruptionSeen: true,
          integrityStatus: current.exam.integrityStatus,
        },
        events: [...freshBase.events, ...recoveryEvents],
      }
    : freshBase
  let state = journeyReducer(base, { type: 'START_EXAM' })
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

  const paper = resolveQuestionPaper(state.exam.paperQuestionIds)
  paper.forEach((question, index) => {
    state = journeyReducer(state, {
      type: 'ANSWER',
      answer: question.correct,
      correct: true,
      isLast: index === paper.length - 1,
      passThreshold: LL_TEST_CONFIG.passMark,
      triggerDemoInterruption: false,
    })
  })
  saveExamSession(applicationId, state)
  return state
}

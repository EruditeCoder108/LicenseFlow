import { LL_TEST_CONFIG } from '../content/testConfig'

export type JourneyStage =
  | 'welcome'
  | 'application'
  | 'preparation'
  | 'readiness'
  | 'rehearsal'
  | 'payment'
  | 'exam-intro'
  | 'exam'
  | 'interruption'
  | 'result'

export type JourneyMode = 'guided-demo' | 'full-simulation'
export type InterfaceLanguage = 'en' | 'hi'
export type IdentityRoute = 'aadhaar-demo' | 'document-demo'
export type PaymentStatus = 'not-started' | 'paid'
export type ExamStatus = 'not-started' | 'active' | 'paused' | 'completed'
export type InterruptionKind =
  | 'network-demo'
  | 'network-real'
  | 'visibility'
  | 'camera'
  | 'multiple-faces'
  | 'phone'

export type EventKind =
  | 'JOURNEY_STARTED'
  | 'APPLICATION_STEP_SAVED'
  | 'APPLICATION_COMPLETED'
  | 'PREPARATION_COMPLETED'
  | 'READINESS_PASSED'
  | 'REHEARSAL_COMPLETED'
  | 'PAYMENT_SUCCESS'
  | 'EXAM_STARTED'
  | 'ANSWER_SAVED'
  | 'TEST_PAUSED'
  | 'TEST_RESUMED'
  | 'EXAM_COMPLETED'
  | 'DEMO_LL_CREATED'

export interface JourneyEvent {
  id: string
  kind: EventKind
  title: string
  detail: string
  at: string
  synthetic: boolean
}

export interface ApplicationData {
  identityRoute: IdentityRoute
  fullName: string
  phone: string
  state: string
  rto: string
  vehicleClass: string
  preferredLanguage: InterfaceLanguage
  declarationAccepted: boolean
}

export interface ReadinessSummary {
  status: 'not-started' | 'passed'
  usedGuidedSignals: boolean
  completedAt?: string
}

export interface ExamState {
  status: ExamStatus
  attemptNumber: number
  paperSeed: string
  paperQuestionIds: string[]
  previousPaperQuestionIds: string[]
  currentQuestion: number
  answers: Record<number, number>
  correctAnswers: number
  interruptionSeen: boolean
  interruptionKind?: InterruptionKind
  interruptionDetail?: string
  knowledgeResult?: 'passed' | 'not-passed'
  integrityStatus: 'clear' | 'technical-event-recovered' | 'observation-recorded'
  questionStartedAt?: string
  questionDeadlineAt?: string
  secondsRemaining?: number
}

export interface JourneyState {
  version: 2
  stage: JourneyStage
  mode: JourneyMode
  interfaceLanguage: InterfaceLanguage
  applicationStep: 0 | 1 | 2
  application: ApplicationData
  readiness: ReadinessSummary
  paymentStatus: PaymentStatus
  paymentReference?: string
  exam: ExamState
  events: JourneyEvent[]
}

export type JourneyAction =
  | { type: 'START'; mode: JourneyMode }
  | { type: 'SET_INTERFACE_LANGUAGE'; language: InterfaceLanguage }
  | { type: 'UPDATE_APPLICATION'; patch: Partial<ApplicationData> }
  | { type: 'NEXT_APPLICATION_STEP' }
  | { type: 'PREVIOUS_APPLICATION_STEP' }
  | { type: 'COMPLETE_APPLICATION' }
  | { type: 'COMPLETE_PREPARATION' }
  | { type: 'COMPLETE_READINESS'; usedGuidedSignals: boolean }
  | { type: 'COMPLETE_REHEARSAL' }
  | { type: 'PAY' }
  | { type: 'OPEN_EXAM_INTRO' }
  | { type: 'START_EXAM' }
  | {
      type: 'ANSWER'
      answer: number
      correct: boolean
      isLast: boolean
      passThreshold: number
      triggerDemoInterruption: boolean
    }
  | { type: 'PAUSE_EXAM'; kind: InterruptionKind; detail: string; synthetic: boolean }
  | { type: 'RESUME_EXAM' }
  | { type: 'RESET' }

export const STORAGE_KEY = 'licenceflow.journey.v2'

const defaultApplication: ApplicationData = {
  identityRoute: 'aadhaar-demo',
  fullName: 'Aarav Sharma',
  phone: '98765 43210',
  state: 'Madhya Pradesh',
  rto: 'Bhopal (MP-04)',
  vehicleClass: 'LMV + MCWG',
  preferredLanguage: 'en',
  declarationAccepted: false,
}

export const initialJourneyState: JourneyState = {
  version: 2,
  stage: 'welcome',
  mode: 'guided-demo',
  interfaceLanguage: 'en',
  applicationStep: 0,
  application: defaultApplication,
  readiness: {
    status: 'not-started',
    usedGuidedSignals: false,
  },
  paymentStatus: 'not-started',
  exam: {
    status: 'not-started',
    attemptNumber: 1,
    paperSeed: '',
    paperQuestionIds: [],
    previousPaperQuestionIds: [],
    currentQuestion: 0,
    answers: {},
    correctAnswers: 0,
    interruptionSeen: false,
    integrityStatus: 'clear',
  },
  events: [],
}

function createEvent(
  kind: EventKind,
  title: string,
  detail: string,
  synthetic: boolean,
): JourneyEvent {
  const now = new Date()
  return {
    id: `${now.getTime()}-${kind}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    title,
    detail,
    at: now.toISOString(),
    synthetic,
  }
}

function appendEvent(
  state: JourneyState,
  kind: EventKind,
  title: string,
  detail: string,
  synthetic = false,
): JourneyEvent[] {
  return [...state.events, createEvent(kind, title, detail, synthetic)]
}

function nextApplicationStep(step: 0 | 1 | 2): 0 | 1 | 2 {
  if (step === 0) return 1
  return 2
}

function previousApplicationStep(step: 0 | 1 | 2): 0 | 1 | 2 {
  if (step === 2) return 1
  return 0
}

export function journeyReducer(
  state: JourneyState,
  action: JourneyAction,
): JourneyState {
  switch (action.type) {
    case 'START':
      if (state.stage !== 'welcome') return state
      return {
        ...state,
        mode: action.mode,
        stage: 'application',
        events: appendEvent(
          state,
          'JOURNEY_STARTED',
          'Demo journey started',
          action.mode === 'guided-demo'
            ? '90-second guided scenario selected'
            : 'Full 15-question simulation selected',
          true,
        ),
      }

    case 'SET_INTERFACE_LANGUAGE':
      return {
        ...state,
        interfaceLanguage: action.language,
        application: {
          ...state.application,
          preferredLanguage: action.language,
        },
      }

    case 'UPDATE_APPLICATION':
      if (state.stage !== 'application') return state
      return {
        ...state,
        application: { ...state.application, ...action.patch },
      }

    case 'NEXT_APPLICATION_STEP':
      if (state.stage !== 'application' || state.applicationStep === 2) return state
      return {
        ...state,
        applicationStep: nextApplicationStep(state.applicationStep),
        events: appendEvent(
          state,
          'APPLICATION_STEP_SAVED',
          'Application section saved',
          `Section ${state.applicationStep + 1} saved on this device`,
          true,
        ),
      }

    case 'PREVIOUS_APPLICATION_STEP':
      if (state.stage !== 'application' || state.applicationStep === 0) return state
      return {
        ...state,
        applicationStep: previousApplicationStep(state.applicationStep),
      }

    case 'COMPLETE_APPLICATION':
      if (
        state.stage !== 'application' ||
        state.applicationStep !== 2 ||
        !state.application.declarationAccepted
      ) {
        return state
      }
      return {
        ...state,
        stage: 'preparation',
        events: appendEvent(
          state,
          'APPLICATION_COMPLETED',
          'Synthetic application completed',
          `${state.application.identityRoute === 'aadhaar-demo' ? 'Demo e-KYC' : 'Demo document'} route · MP-LL-DEMO-260822`,
          true,
        ),
      }

    case 'COMPLETE_PREPARATION':
      if (state.stage !== 'preparation') return state
      return {
        ...state,
        stage: 'readiness',
        events: appendEvent(
          state,
          'PREPARATION_COMPLETED',
          'Test preparation completed',
          'Learning pack and practice interaction completed',
          true,
        ),
      }

    case 'COMPLETE_READINESS':
      if (state.stage !== 'readiness') return state
      return {
        ...state,
        stage: 'rehearsal',
        readiness: {
          status: 'passed',
          usedGuidedSignals: action.usedGuidedSignals,
          completedAt: new Date().toISOString(),
        },
        events: appendEvent(
          state,
          'READINESS_PASSED',
          action.usedGuidedSignals ? 'Guided readiness scenario passed' : 'Real device readiness passed',
          action.usedGuidedSignals
            ? 'Camera conditions were transparently simulated for the guided tour'
            : 'Camera, microphone, face, framing, lighting, storage, and connection checks passed',
          action.usedGuidedSignals,
        ),
      }

    case 'COMPLETE_REHEARSAL':
      if (state.stage !== 'rehearsal') return state
      return {
        ...state,
        stage: 'payment',
        events: appendEvent(
          state,
          'REHEARSAL_COMPLETED',
          'Secure-test rehearsal completed',
          'Sample answer checkpoint and interruption guidance completed',
          true,
        ),
      }

    case 'PAY':
      if (state.stage !== 'payment' || state.readiness.status !== 'passed') return state
      return {
        ...state,
        paymentStatus: 'paid',
        paymentReference: 'LF-DEMO-PAY-0826',
        events: appendEvent(
          state,
          'PAYMENT_SUCCESS',
          'Synthetic payment completed',
          '₹250 demo amount · no bank or government payment service connected',
          true,
        ),
      }

    case 'OPEN_EXAM_INTRO':
      if (state.stage !== 'payment' || state.paymentStatus !== 'paid') return state
      return { ...state, stage: 'exam-intro' }

    case 'START_EXAM':
      if (state.stage !== 'exam-intro' || state.paymentStatus !== 'paid') return state
      return {
        ...state,
        stage: 'exam',
        exam: {
          ...state.exam,
          status: 'active',
          questionStartedAt: new Date().toISOString(),
          questionDeadlineAt: new Date(Date.now() + LL_TEST_CONFIG.secondsPerQuestion * 1000).toISOString(),
          secondsRemaining: LL_TEST_CONFIG.secondsPerQuestion,
        },
        events: appendEvent(
          state,
          'EXAM_STARTED',
          'Synthetic learner test started',
          `${LL_TEST_CONFIG.questionCount}-question LicenceFlow simulation · not an official MP configuration`,
          true,
        ),
      }

    case 'ANSWER': {
      if (state.stage !== 'exam' || state.exam.status !== 'active') return state

      const questionIndex = state.exam.currentQuestion
      const answers = { ...state.exam.answers, [questionIndex]: action.answer }
      const correctAnswers = state.exam.correctAnswers + (action.correct ? 1 : 0)
      const withAnswer: JourneyState = {
        ...state,
        exam: {
          ...state.exam,
          answers,
          correctAnswers,
        },
        events: appendEvent(
          state,
          'ANSWER_SAVED',
          `Question ${questionIndex + 1} saved`,
          'Answer checkpoint preserved before navigation',
          false,
        ),
      }

      if (action.isLast) {
        const passed = correctAnswers >= action.passThreshold
        const completed: JourneyState = {
          ...withAnswer,
          stage: 'result',
          exam: {
            ...withAnswer.exam,
            status: 'completed',
            knowledgeResult: passed ? 'passed' : 'not-passed',
            questionDeadlineAt: undefined,
            secondsRemaining: undefined,
          },
        }
        const completedEvents = appendEvent(
          completed,
          'EXAM_COMPLETED',
          passed ? 'Knowledge simulation passed' : 'Knowledge simulation not passed',
          `${correctAnswers} correct · LicenceFlow simulation threshold ${action.passThreshold}`,
          true,
        )
        return {
          ...completed,
          events: passed
            ? [
                ...completedEvents,
                createEvent(
                  'DEMO_LL_CREATED',
                  'Demonstration LL created',
                  'Not a government licence and not valid for driving',
                  true,
                ),
              ]
            : completedEvents,
        }
      }

      const advanced: JourneyState = {
        ...withAnswer,
        exam: {
          ...withAnswer.exam,
          currentQuestion: questionIndex + 1,
          questionStartedAt: new Date().toISOString(),
          questionDeadlineAt: new Date(Date.now() + LL_TEST_CONFIG.secondsPerQuestion * 1000).toISOString(),
          secondsRemaining: LL_TEST_CONFIG.secondsPerQuestion,
        },
      }

      if (action.triggerDemoInterruption && !state.exam.interruptionSeen) {
        return journeyReducer(advanced, {
          type: 'PAUSE_EXAM',
          kind: 'network-demo',
          detail: `Demo network interruption after Question ${questionIndex + 1}; saved answer retained`,
          synthetic: true,
        })
      }

      return advanced
    }

    case 'PAUSE_EXAM':
      if (state.stage !== 'exam' || state.exam.status !== 'active') return state
      {
        const secondsRemaining = state.exam.questionDeadlineAt
          ? Math.max(1, Math.ceil((new Date(state.exam.questionDeadlineAt).getTime() - Date.now()) / 1000))
          : LL_TEST_CONFIG.secondsPerQuestion
      return {
        ...state,
        stage: 'interruption',
        exam: {
          ...state.exam,
          status: 'paused',
          interruptionSeen: true,
          interruptionKind: action.kind,
          interruptionDetail: action.detail,
          secondsRemaining,
          questionDeadlineAt: undefined,
          integrityStatus:
            action.kind === 'multiple-faces' || action.kind === 'phone'
              ? 'observation-recorded'
              : 'technical-event-recovered',
        },
        events: appendEvent(
          state,
          'TEST_PAUSED',
          action.kind === 'multiple-faces' || action.kind === 'phone' ? 'Integrity observation paused the test' : 'Technical interruption paused the test',
          action.detail,
          action.synthetic,
        ),
      }
      }

    case 'RESUME_EXAM':
      if (state.stage !== 'interruption' || state.exam.status !== 'paused') return state
      {
        const secondsRemaining = state.exam.secondsRemaining ?? LL_TEST_CONFIG.secondsPerQuestion
      return {
        ...state,
        stage: 'exam',
        exam: {
          ...state.exam,
          status: 'active',
          interruptionKind: undefined,
          interruptionDetail: undefined,
          questionStartedAt: new Date().toISOString(),
          questionDeadlineAt: new Date(Date.now() + secondsRemaining * 1000).toISOString(),
        },
        events: appendEvent(
          state,
          'TEST_RESUMED',
          'Test resumed from saved checkpoint',
          `${Object.keys(state.exam.answers).length} answer(s) preserved · no repeat payment`,
          false,
        ),
      }
      }

    case 'RESET':
      return initialJourneyState
  }
}

export function loadJourney(): JourneyState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialJourneyState
    const parsed = JSON.parse(raw) as JourneyState
    if (parsed.version !== 2) return initialJourneyState
    return {
      ...initialJourneyState,
      ...parsed,
      application: { ...defaultApplication, ...parsed.application },
      readiness: { ...initialJourneyState.readiness, ...parsed.readiness },
      exam: { ...initialJourneyState.exam, ...parsed.exam },
      events: Array.isArray(parsed.events) ? parsed.events : [],
    }
  } catch {
    return initialJourneyState
  }
}

export function saveJourney(state: JourneyState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearJourney(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // The reset still succeeds in memory if storage is unavailable.
  }
}

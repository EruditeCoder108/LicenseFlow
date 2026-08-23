import {
  beginPayment,
  createPaymentState,
  isPaymentConfirmed,
  markGatewayRedirected,
  reconcilePayment,
  resetPaymentForRetry,
  resolvePayment,
  type PaymentMethod,
  type PaymentOutcome,
  type PaymentState,
} from './payment'

export type ReadinessMode = 'real-browser-checks' | 'guided-signals'

export interface TutorialProgress {
  status: 'not-started' | 'in-progress' | 'completed'
  revision: string
  lastPosition: number
  maxWatched: number
  duration: number
  completedAt?: string
}

export interface LLJourneyProgress {
  version: 3
  applicationId: string
  readiness: {
    status: 'not-started' | 'passed'
    mode?: ReadinessMode
    completedAt?: string
  }
  rehearsal: {
    status: 'not-started' | 'completed'
    answer?: number
    completedAt?: string
  }
  payment: PaymentState
  tutorial: TutorialProgress
  updatedAt: string
}

const STORAGE_PREFIX = 'mp-ll-journey-progress-v1:'

export function createJourneyProgress(applicationId: string): LLJourneyProgress {
  return {
    version: 3,
    applicationId,
    readiness: { status: 'not-started' },
    rehearsal: { status: 'not-started' },
    payment: createPaymentState(),
    tutorial: { status: 'not-started', revision: '', lastPosition: 0, maxWatched: 0, duration: 0 },
    updatedAt: new Date().toISOString(),
  }
}

export function loadJourneyProgress(applicationId: string): LLJourneyProgress {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${applicationId}`)
    if (!saved) return createJourneyProgress(applicationId)
    const parsed = JSON.parse(saved) as LLJourneyProgress | (Omit<LLJourneyProgress, 'version' | 'payment' | 'tutorial'> & {
      version: 1
      payment: { status: 'not-started' | 'paid'; reference?: string; paidAt?: string }
      tutorial?: { status: 'not-started' | 'completed'; completedAt?: string }
    }) | (Omit<LLJourneyProgress, 'version' | 'tutorial'> & {
      version: 2
      tutorial?: { status: 'not-started' | 'completed'; completedAt?: string }
    })
    if (parsed.applicationId !== applicationId) return createJourneyProgress(applicationId)
    if (parsed.version === 1) {
      const migrated = createJourneyProgress(applicationId)
      const payment = parsed.payment.status === 'paid'
        ? {
            ...createPaymentState(),
            status: 'confirmed' as const,
            reference: parsed.payment.reference,
            confirmedAt: parsed.payment.paidAt,
            updatedAt: parsed.payment.paidAt,
          }
        : createPaymentState()
      return {
        ...migrated,
        ...parsed,
        version: 3,
        payment,
        tutorial: migrateTutorial(parsed.tutorial),
      }
    }
    if (parsed.version === 2) {
      return {
        ...parsed,
        version: 3,
        payment: { ...createPaymentState(), ...parsed.payment, activity: parsed.payment.activity ?? [] },
        tutorial: migrateTutorial(parsed.tutorial),
      }
    }
    if (parsed.version !== 3) return createJourneyProgress(applicationId)
    return {
      ...parsed,
      payment: { ...createPaymentState(), ...parsed.payment, activity: parsed.payment.activity ?? [] },
      tutorial: { ...createJourneyProgress(applicationId).tutorial, ...parsed.tutorial },
    }
  } catch {
    return createJourneyProgress(applicationId)
  }
}

function migrateTutorial(tutorial?: { status: 'not-started' | 'completed'; completedAt?: string }): TutorialProgress {
  return {
    status: tutorial?.status ?? 'not-started',
    revision: tutorial?.status === 'completed' ? 'legacy-v2' : '',
    lastPosition: 0,
    maxWatched: 0,
    duration: 0,
    completedAt: tutorial?.completedAt,
  }
}

export function saveJourneyProgress(progress: LLJourneyProgress): boolean {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${progress.applicationId}`, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

export function completeReadiness(progress: LLJourneyProgress, mode: ReadinessMode): LLJourneyProgress {
  const now = new Date().toISOString()
  return {
    ...progress,
    readiness: { status: 'passed', mode, completedAt: now },
    updatedAt: now,
  }
}

export function completeRehearsal(progress: LLJourneyProgress, answer: number): LLJourneyProgress {
  if (progress.readiness.status !== 'passed') return progress
  const now = new Date().toISOString()
  return {
    ...progress,
    rehearsal: { status: 'completed', answer, completedAt: now },
    updatedAt: now,
  }
}

export function startSyntheticPayment(
  progress: LLJourneyProgress,
  method: PaymentMethod,
  attemptId: string,
  now = new Date().toISOString(),
): LLJourneyProgress {
  if (progress.readiness.status !== 'passed' || progress.rehearsal.status !== 'completed') return progress
  const payment = beginPayment(progress.payment, { applicationId: progress.applicationId, method, attemptId, now })
  if (payment === progress.payment) return progress
  return {
    ...progress,
    payment,
    updatedAt: now,
  }
}

export function finishSyntheticPayment(
  progress: LLJourneyProgress,
  outcome: PaymentOutcome,
  now = new Date().toISOString(),
): LLJourneyProgress {
  const payment = resolvePayment(progress.payment, outcome, now)
  if (payment === progress.payment) return progress
  return { ...progress, payment, updatedAt: now }
}

export function recordGatewayRedirect(progress: LLJourneyProgress, now = new Date().toISOString()): LLJourneyProgress {
  const payment = markGatewayRedirected(progress.payment, now)
  if (payment === progress.payment) return progress
  return { ...progress, payment, updatedAt: now }
}

export function reconcileSyntheticPayment(
  progress: LLJourneyProgress,
  outcome: 'confirmed' | 'declined',
  now = new Date().toISOString(),
): LLJourneyProgress {
  const payment = reconcilePayment(progress.payment, outcome, now)
  if (payment === progress.payment) return progress
  return { ...progress, payment, updatedAt: now }
}

export function preparePaymentRetry(progress: LLJourneyProgress): LLJourneyProgress {
  const payment = resetPaymentForRetry(progress.payment)
  if (payment === progress.payment) return progress
  return { ...progress, payment, updatedAt: new Date().toISOString() }
}

export function startTutorial(progress: LLJourneyProgress, revision: string, duration = 0): LLJourneyProgress {
  if (!isPaymentConfirmed(progress.payment)) return progress
  if (progress.tutorial.status === 'completed' && progress.tutorial.revision === revision) return progress
  const now = new Date().toISOString()
  return {
    ...progress,
    tutorial: progress.tutorial.revision === revision
      ? { ...progress.tutorial, status: 'in-progress', duration: Math.max(progress.tutorial.duration, duration) }
      : { status: 'in-progress', revision, lastPosition: 0, maxWatched: 0, duration, completedAt: undefined },
    updatedAt: now,
  }
}

export function updateTutorialWatch(
  progress: LLJourneyProgress,
  input: { revision: string; position: number; maxWatched: number; duration: number },
): LLJourneyProgress {
  if (!isPaymentConfirmed(progress.payment) || progress.tutorial.status === 'completed') return progress
  const base = progress.tutorial.revision === input.revision
    ? progress.tutorial
    : { status: 'in-progress' as const, revision: input.revision, lastPosition: 0, maxWatched: 0, duration: 0 }
  const now = new Date().toISOString()
  const duration = Math.max(0, input.duration)
  return {
    ...progress,
    tutorial: {
      ...base,
      status: 'in-progress',
      duration,
      lastPosition: Math.min(Math.max(0, input.position), duration || input.position),
      maxWatched: Math.min(Math.max(base.maxWatched, input.maxWatched), duration || input.maxWatched),
    },
    updatedAt: now,
  }
}

export function completeTutorial(progress: LLJourneyProgress, revision: string, duration: number): LLJourneyProgress {
  if (!isPaymentConfirmed(progress.payment) || duration <= 0) return progress
  if (progress.tutorial.revision !== revision || progress.tutorial.maxWatched < Math.max(0, duration - 1.5)) return progress
  const now = new Date().toISOString()
  return {
    ...progress,
    tutorial: { ...progress.tutorial, status: 'completed', duration, lastPosition: duration, maxWatched: duration, completedAt: now },
    updatedAt: now,
  }
}

export function completedProgressItemsCount(progress: LLJourneyProgress): number {
  return (progress.readiness.status === 'passed' ? 1 : 0)
    + (progress.rehearsal.status === 'completed' ? 1 : 0)
    + (isPaymentConfirmed(progress.payment) ? 1 : 0)
    + (progress.tutorial.status === 'completed' ? 1 : 0)
}

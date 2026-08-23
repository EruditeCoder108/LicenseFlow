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

export interface LLJourneyProgress {
  version: 2
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
  tutorial: {
    status: 'not-started' | 'completed'
    completedAt?: string
  }
  updatedAt: string
}

const STORAGE_PREFIX = 'mp-ll-journey-progress-v1:'

export function createJourneyProgress(applicationId: string): LLJourneyProgress {
  return {
    version: 2,
    applicationId,
    readiness: { status: 'not-started' },
    rehearsal: { status: 'not-started' },
    payment: createPaymentState(),
    tutorial: { status: 'not-started' },
    updatedAt: new Date().toISOString(),
  }
}

export function loadJourneyProgress(applicationId: string): LLJourneyProgress {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${applicationId}`)
    if (!saved) return createJourneyProgress(applicationId)
    const parsed = JSON.parse(saved) as LLJourneyProgress | (Omit<LLJourneyProgress, 'version' | 'payment'> & {
      version: 1
      payment: { status: 'not-started' | 'paid'; reference?: string; paidAt?: string }
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
      return { ...migrated, ...parsed, version: 2, payment, tutorial: parsed.tutorial ?? { status: 'not-started' } }
    }
    if (parsed.version !== 2) return createJourneyProgress(applicationId)
    return { ...parsed, payment: { ...createPaymentState(), ...parsed.payment, activity: parsed.payment.activity ?? [] }, tutorial: parsed.tutorial ?? { status: 'not-started' } }
  } catch {
    return createJourneyProgress(applicationId)
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

export function completeTutorial(progress: LLJourneyProgress): LLJourneyProgress {
  if (!isPaymentConfirmed(progress.payment)) return progress
  const now = new Date().toISOString()
  return {
    ...progress,
    tutorial: { status: 'completed', completedAt: now },
    updatedAt: now,
  }
}

export function completedJourneyStageCount(progress: LLJourneyProgress): number {
  return 3
    + (progress.readiness.status === 'passed' ? 1 : 0)
    + (progress.rehearsal.status === 'completed' ? 1 : 0)
    + (isPaymentConfirmed(progress.payment) ? 1 : 0)
    + (progress.tutorial.status === 'completed' ? 1 : 0)
}

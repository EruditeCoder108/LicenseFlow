import type { JourneyState } from '../domain/journey'
import type { LLJourneyProgress } from './progress'

export type ReliabilitySyncState = 'pending' | 'server-confirmed' | 'browser-only'

export interface ReliabilityStatus {
  state: ReliabilitySyncState
  checkpointCount: number
  updatedAt: string
}

type Snapshot = {
  progress?: LLJourneyProgress
  exam?: JourneyState
  timer?: ReturnType<typeof setTimeout>
}

const SESSION_PREFIX = 'mp-ll-reliability-session-v1:'
const STATUS_PREFIX = 'mp-ll-reliability-status-v1:'
const JOURNEY_PREFIX = 'mp-ll-journey-progress-v1:'
const STATUS_EVENT = 'licenceflow:reliability-status'
const snapshots = new Map<string, Snapshot>()

const storageAvailable = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined'

const randomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `lf-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export const reliabilitySessionIdFor = (applicationId: string) => {
  const key = `${SESSION_PREFIX}${applicationId}`
  const existing = storageAvailable() ? localStorage.getItem(key) : null
  if (existing && /^[a-zA-Z0-9-]{8,80}$/.test(existing)) return existing
  const created = randomId()
  if (storageAvailable()) localStorage.setItem(key, created)
  return created
}

const recordStatus = (applicationId: string, state: ReliabilitySyncState, checkpointCount = 0) => {
  if (!storageAvailable()) return
  const status: ReliabilityStatus = { state, checkpointCount, updatedAt: new Date().toISOString() }
  localStorage.setItem(`${STATUS_PREFIX}${applicationId}`, JSON.stringify(status))
  window.dispatchEvent(new CustomEvent(STATUS_EVENT, { detail: { applicationId, status } }))
}

export function loadReliabilityStatus(applicationId: string): ReliabilityStatus {
  if (storageAvailable()) {
    try {
      const parsed = JSON.parse(localStorage.getItem(`${STATUS_PREFIX}${applicationId}`) || '') as ReliabilityStatus
      if (['pending', 'server-confirmed', 'browser-only'].includes(parsed.state)) return parsed
    } catch {
      // A missing or old status is simply a browser-only prototype session.
    }
  }
  return { state: 'browser-only', checkpointCount: 0, updatedAt: '' }
}

export function subscribeReliabilityStatus(applicationId: string, listener: (status: ReliabilityStatus) => void) {
  if (typeof window === 'undefined') return () => undefined
  const handle = (event: Event) => {
    const detail = (event as CustomEvent).detail
    if (detail?.applicationId === applicationId) listener(detail.status)
  }
  window.addEventListener(STATUS_EVENT, handle)
  return () => window.removeEventListener(STATUS_EVENT, handle)
}

const stageFor = (progress?: LLJourneyProgress, exam?: JourneyState) => {
  if (exam?.stage === 'result' || exam?.exam.status === 'completed') return 'result'
  if (exam?.stage === 'interruption' || exam?.exam.status === 'paused') return 'interruption'
  if (exam?.exam.status === 'active') return 'exam'
  if (progress?.tutorial.status === 'completed') return 'exam-intro'
  if (progress?.payment.status === 'confirmed') return 'tutorial'
  if (progress?.rehearsal.status === 'completed') return 'payment'
  if (progress?.readiness.status === 'passed') return 'rehearsal'
  return 'readiness'
}

const cachedProgressFor = (applicationId: string): LLJourneyProgress | undefined => {
  if (!storageAvailable()) return undefined
  try {
    const parsed = JSON.parse(localStorage.getItem(`${JOURNEY_PREFIX}${applicationId}`) || '') as LLJourneyProgress
    return parsed?.version === 3 && parsed.applicationId === applicationId ? parsed : undefined
  } catch {
    return undefined
  }
}

export function buildReliabilityCheckpoint(progress: LLJourneyProgress, exam?: JourneyState) {
  return {
    stage: stageFor(progress, exam),
    readinessStatus: progress.readiness.status,
    rehearsalStatus: progress.rehearsal.status,
    paymentStatus: progress.payment.status,
    tutorialStatus: progress.tutorial.status,
    examStatus: exam?.exam.status ?? 'not-started',
    attemptNumber: exam?.exam.attemptNumber ?? 0,
    answeredCount: exam ? Object.keys(exam.exam.answers).length : 0,
    questionCount: exam?.exam.paperQuestionIds.length ?? 0,
    score: exam?.exam.status === 'completed' ? exam.exam.correctAnswers : null,
    interruptionRecovered: exam?.exam.interruptionSeen === true,
    integrityStatus: exam?.exam.integrityStatus ?? 'clear',
  }
}

const postJson = async (path: string, body: unknown) => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error(`Reliability API returned ${response.status}`)
  return response.json()
}

async function syncSnapshot(applicationId: string, snapshot: Snapshot) {
  if (!import.meta.env.PROD || !snapshot.progress) {
    recordStatus(applicationId, 'browser-only')
    return
  }

  const progress = snapshot.progress
  const exam = snapshot.exam
  const sessionId = reliabilitySessionIdFor(applicationId)
  const checkpointId = randomId()
  recordStatus(applicationId, 'pending')

  try {
    // Older browser-only journeys used the legacy confirmation mirror. New
    // LFSBX references are created and resolved by the authoritative sandbox
    // payment service and must never be re-declared by the client.
    if (progress.payment.status === 'confirmed' && progress.payment.idempotencyKey && progress.payment.reference?.startsWith('MP-SBX-')) {
      await postJson('/api/reliability/payments/confirm', {
        sessionId,
        applicationId,
        idempotencyKey: progress.payment.idempotencyKey,
        amountPaise: progress.payment.amountPaise,
        reference: progress.payment.reference,
      })
    }

    const response = await postJson('/api/reliability/checkpoints', {
      sessionId,
      applicationId,
      checkpointId,
      clientUpdatedAt: new Date().toISOString(),
      checkpoint: buildReliabilityCheckpoint(progress, exam),
    })
    const previous = loadReliabilityStatus(applicationId)
    recordStatus(applicationId, 'server-confirmed', previous.checkpointCount + (response.duplicate ? 0 : 1))
  } catch {
    // The prototype remains recoverable from its browser cache when Sites/D1 is
    // unavailable. This is an explicit fallback, not a false server claim.
    recordStatus(applicationId, 'browser-only')
  }
}

const schedule = (applicationId: string, patch: Partial<Snapshot>) => {
  const current = snapshots.get(applicationId) || {}
  if (current.timer) clearTimeout(current.timer)
  const next = { ...current, ...patch }
  if (!import.meta.env.PROD) {
    snapshots.set(applicationId, next)
    recordStatus(applicationId, 'browser-only')
    return
  }
  next.timer = setTimeout(() => void syncSnapshot(applicationId, next), 700)
  snapshots.set(applicationId, next)
}

export function queueJourneyReliabilityCheckpoint(progress: LLJourneyProgress) {
  schedule(progress.applicationId, { progress })
}

export function queueExamReliabilityCheckpoint(applicationId: string, exam: JourneyState) {
  const progress = snapshots.get(applicationId)?.progress ?? cachedProgressFor(applicationId)
  schedule(applicationId, { exam, progress })
}

export async function refreshReliabilityReceipt(applicationId: string): Promise<ReliabilityStatus> {
  if (!import.meta.env.PROD) return loadReliabilityStatus(applicationId)
  try {
    const response = await fetch(`/api/reliability/sessions/${encodeURIComponent(reliabilitySessionIdFor(applicationId))}`, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error('No durable receipt')
    const receipt = await response.json()
    recordStatus(applicationId, 'server-confirmed', Number(receipt.checkpointCount || 0))
  } catch {
    if (loadReliabilityStatus(applicationId).state !== 'server-confirmed') recordStatus(applicationId, 'browser-only')
  }
  return loadReliabilityStatus(applicationId)
}

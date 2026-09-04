import type { ProtectedExamEvent, ProtectedExamSnapshot, ProtectedPauseReason, ProtectedPhase } from '../../src/portal/protectedExamTypes'
import { EMPTY_INTEGRITY_SUMMARY, normalizeIntegritySummary } from '../../src/domain/integrityPolicy'
import { createPaper, EXAM_RULES, sha256, type FrozenQuestion } from './paper'

export interface StoredAnswer { index: number; selected: number; correct: boolean; timedOut: boolean; at: number }
export interface ExamState {
  rules: typeof EXAM_RULES
  phase: ProtectedPhase
  paper: FrozenQuestion[]
  fingerprint: string
  index: number
  answers: StoredAnswer[]
  deadlineAt: number | null
  remainingMs: number | null
  pauseStartedAt: number | null
  pauseUsedMs: number
  pauseReason: ProtectedPauseReason | null
  integritySummary: ReturnType<typeof normalizeIntegritySummary>
  startedAt: number | null
  completedAt: number | null
  completionReason: 'answered' | 'expired'
  lastClock: number
}
export interface AttemptRow {
  id: string
  owner_hash: string
  application_id: string
  attempt_number: number
  retake_of: string | null
  status: ProtectedPhase
  revision: number
  lease_client: string | null
  lease_until: number | null
  state_json: string
  mutation_id: string
  created_at: number
  expires_at: number
}
export class ExamError extends Error {
  constructor(public code: string, message: string, public status = 409, public retryAfter?: number) { super(message) }
}
export async function newState(now: number, previous: FrozenQuestion[] = []): Promise<ExamState> {
  const paper = createPaper(previous)
  return {
    rules: EXAM_RULES, phase: 'ready', paper,
    fingerprint: `LF-S-${(await sha256(JSON.stringify(paper))).slice(0, 16).toUpperCase()}`,
    index: 0, answers: [], deadlineAt: null, remainingMs: null, pauseStartedAt: null,
    pauseUsedMs: 0, pauseReason: null, integritySummary: { ...EMPTY_INTEGRITY_SUMMARY }, startedAt: null, completedAt: null,
    completionReason: 'answered', lastClock: now,
  }
}
export function clock(state: ExamState, now: number): number { return Math.max(now, state.lastClock) }
export function recordAnswer(state: ExamState, selected: number, now: number, timedOut: boolean): void {
  const question = state.paper[state.index]!
  state.answers.push({ index: state.index, selected, correct: !timedOut && selected === question.correct, timedOut, at: now })
  state.index++
  state.deadlineAt = null
  state.remainingMs = null
  state.pauseStartedAt = null
  state.pauseReason = null
  if (state.index === state.paper.length) {
    state.phase = 'completed'
    state.completedAt = now
  } else {
    // Do not start an unseen next question when a save response may have been lost.
    state.phase = 'waiting'
  }
}
export function settleTime(state: ExamState, expiresAt: number, now: number): void {
  state.lastClock = clock(state, now)
  if (state.phase === 'completed') return
  if (state.lastClock >= expiresAt) {
    state.completionReason = 'expired'
    while (state.index < state.paper.length) recordAnswer(state, -1, state.lastClock, true)
    return
  }
  if (state.phase === 'active' && state.deadlineAt !== null && state.lastClock >= state.deadlineAt) {
    recordAnswer(state, -1, state.lastClock, true)
  } else if (state.phase === 'paused' && state.pauseStartedAt !== null) {
    const budget = Math.max(0, state.rules.pauseBudgetMs - state.pauseUsedMs)
    const overrun = Math.max(0, state.lastClock - state.pauseStartedAt - budget)
    if (overrun >= (state.remainingMs ?? 0)) {
      state.pauseUsedMs = state.rules.pauseBudgetMs
      recordAnswer(state, -1, state.lastClock, true)
    }
  }
}
export function requireLease(row: AttemptRow, clientId: string, now: number): void {
  if (row.lease_client !== clientId || (row.lease_until ?? 0) <= now) {
    throw new ExamError('lease_required', 'Reconnect this exam tab before continuing.')
  }
}
export function publicSnapshot(row: AttemptRow, state: ExamState, clientId: string | null, now: number, events: ProtectedExamEvent[]): ProtectedExamSnapshot {
  const ownsLease = clientId !== null && row.lease_client === clientId && (row.lease_until ?? 0) > now
  const current = ownsLease && state.phase === 'active' ? state.paper[state.index] : null
  return {
    authority: 'server', synthetic: true, attemptId: row.id, applicationId: row.application_id,
    attemptNumber: row.attempt_number, revision: row.revision, phase: state.phase,
    currentIndex: state.index, totalQuestions: state.paper.length, passMark: state.rules.passMark,
    answers: Object.fromEntries(state.answers.map((answer) => [answer.index, answer.selected])),
    fingerprint: state.fingerprint, bankRevision: state.rules.revision, serverNow: now, expiresAt: row.expires_at,
    deadlineAt: state.deadlineAt,
    remainingMs: state.phase === 'paused' && state.pauseStartedAt !== null
      ? Math.max(0, (state.remainingMs ?? 0) - Math.max(0, now - state.pauseStartedAt - Math.max(0, state.rules.pauseBudgetMs - state.pauseUsedMs)))
      : state.remainingMs,
    pauseBudgetRemainingMs: Math.max(0, state.rules.pauseBudgetMs - state.pauseUsedMs - (state.pauseStartedAt === null ? 0 : now - state.pauseStartedAt)),
    pauseReason: state.pauseReason, integritySummary: normalizeIntegritySummary(state.integritySummary), leaseExpiresAt: row.lease_until, ownsLease,
    // Explicit allowlist: never spread a private question into an API response.
    question: current ? { token: current.token, index: state.index, prompt: current.prompt, promptHi: current.promptHi, options: current.options, optionsHi: current.optionsHi } : null,
    result: state.phase === 'completed' ? {
      score: state.answers.filter((answer) => answer.correct).length,
      passed: state.answers.filter((answer) => answer.correct).length >= state.rules.passMark,
      completedAt: state.completedAt!, reason: state.completionReason,
    } : null,
    events,
  }
}

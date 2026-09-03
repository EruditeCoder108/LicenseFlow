import type { ProtectedExamReview, ProtectedExamSnapshot, ProtectedPauseReason } from './protectedExamTypes'

type AnswerCommand = { attemptId: string; requestId: string; questionToken: string; optionIndex: number }
type Envelope = { attempt: ProtectedExamSnapshot | null }
export type ExamTransport = <T>(path: string, body?: Record<string, unknown>, keepalive?: boolean) => Promise<T>
export class ExamServiceError extends Error {
  constructor(public code: string, message: string, public retryAfter = 0) { super(message) }
}
export const requestExam: ExamTransport = async <T>(path: string, body?: Record<string, unknown>, keepalive = false) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(`/api/exam${path}`, {
      method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
      ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
      signal: controller.signal, keepalive,
    })
    const data = await response.json()
    if (!response.ok) throw new ExamServiceError(data.code ?? 'exam_unavailable', data.error ?? 'The exam service could not confirm this action.', Number(response.headers.get('Retry-After') ?? 0))
    return data as T
  } catch (error) {
    if (error instanceof ExamServiceError) throw error
    throw new ExamServiceError('connection_lost', 'Connection lost. Reconnect to check what the server saved before continuing.')
  } finally { clearTimeout(timeout) }
}

// Only an unacknowledged answer command is cached, never credentials, a score,
// marking keys or an authoritative exam snapshot. Storage failure is non-fatal.
export class ProtectedExamClient {
  readonly clientId = crypto.randomUUID()
  private pending: AnswerCommand | null = null
  private key: string
  constructor(readonly applicationId: string, private transport: ExamTransport = requestExam, private storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
    this.key = `lf-protected-pending:${applicationId}`
    try {
      const candidate = JSON.parse(storage?.getItem(this.key) ?? 'null') as AnswerCommand | null
      const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
      if (candidate && [candidate.attemptId, candidate.requestId, candidate.questionToken].every((value) => typeof value === 'string' && uuid.test(value)) && Number.isInteger(candidate.optionIndex) && candidate.optionIndex >= -1 && candidate.optionIndex <= 3) this.pending = candidate
    } catch { /* The server checkpoint remains the recovery source. */ }
  }
  get hasPendingAnswer() { return this.pending !== null }
  private savePending(answer: AnswerCommand | null) {
    this.pending = answer
    try { if (answer) this.storage?.setItem(this.key, JSON.stringify(answer)); else this.storage?.removeItem(this.key) } catch { /* memory-only retry */ }
  }
  async status() { return (await this.transport<Envelope>(`/status?applicationId=${encodeURIComponent(this.applicationId)}`)).attempt }
  async create(retakeOf?: string) {
    await this.transport('/session', {})
    const response = await this.transport<Envelope>('/attempts', { applicationId: this.applicationId, ...(retakeOf ? { retakeOf } : {}) })
    if (!response.attempt) throw new ExamServiceError('invalid_response', 'The server did not return an attempt.')
    return response.attempt
  }
  async action(attempt: ProtectedExamSnapshot, action: string, extra: Record<string, unknown> = {}, keepalive = false) {
    const response = await this.transport<Envelope>(`/attempts/${attempt.attemptId}/${action}`, {
      clientId: this.clientId, ...(action === 'heartbeat' ? {} : { requestId: crypto.randomUUID() }), ...extra,
    }, keepalive)
    if (!response.attempt) throw new ExamServiceError('invalid_response', 'Reconnect to the saved attempt.')
    return response.attempt
  }
  async connect(attempt: ProtectedExamSnapshot) {
    let current = await this.action(attempt, 'claim')
    if (this.pending && this.pending.attemptId !== current.attemptId) this.savePending(null)
    if (this.pending) {
      try { current = await this.sendPending(current) } catch (error) {
        if (!(error instanceof ExamServiceError) || error.code !== 'question_closed') throw error
        this.savePending(null)
        current = await this.action(current, 'claim')
      }
    }
    return current
  }
  async answer(attempt: ProtectedExamSnapshot, optionIndex: number) {
    if (!attempt.question || !attempt.ownsLease) throw new ExamServiceError('lease_required', 'Reconnect this tab before answering.')
    if (!this.pending) this.savePending({ attemptId: attempt.attemptId, requestId: crypto.randomUUID(), questionToken: attempt.question.token, optionIndex })
    return this.sendPending(attempt)
  }
  async answerAndContinue(attempt: ProtectedExamSnapshot, optionIndex: number, onSaved: (saved: ProtectedExamSnapshot) => void, canOpen: () => boolean) {
    const saved = await this.answer(attempt, optionIndex)
    onSaved(saved)
    // Never start an unseen question while the previous save is unconfirmed.
    return saved.phase === 'waiting' && canOpen() ? this.open(saved) : saved
  }
  async prepareResultPreview(attempt: ProtectedExamSnapshot | null) {
    // Preview uses local fixtures, never a pass endpoint or synthetic submissions.
    // Release this tab's lease and confirm its pause before leaving a timed test.
    return attempt?.ownsLease && attempt.phase !== 'completed' ? this.pause(attempt, 'exit') : attempt
  }
  private async sendPending(attempt: ProtectedExamSnapshot) {
    const pending = this.pending!
    const result = await this.action(attempt, 'answers', { requestId: pending.requestId, questionToken: pending.questionToken, optionIndex: pending.optionIndex })
    this.savePending(null)
    return result
  }
  open(attempt: ProtectedExamSnapshot) { return this.action(attempt, 'question') }
  resume(attempt: ProtectedExamSnapshot) { return this.action(attempt, 'resume') }
  pause(attempt: ProtectedExamSnapshot, reason: ProtectedPauseReason, keepalive = false) { return this.action(attempt, 'pause', { reason }, keepalive) }
  review(attempt: ProtectedExamSnapshot) { return this.transport<ProtectedExamReview>(`/attempts/${attempt.attemptId}/result`) }
}

// Ignore responses from an earlier revision (for example a late heartbeat).
export function acceptExamSnapshot(current: ProtectedExamSnapshot | null, incoming: ProtectedExamSnapshot) {
  return current?.attemptId === incoming.attemptId && current.revision > incoming.revision ? current : incoming
}
export function displayedSeconds(attempt: ProtectedExamSnapshot | null, elapsedMs: number) {
  if (!attempt?.deadlineAt) return undefined
  return Math.max(0, Math.ceil((attempt.deadlineAt - attempt.serverNow - Math.max(0, elapsedMs)) / 1000))
}

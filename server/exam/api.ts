import { EXAM_RULES, sha256 } from './paper'
import { clock, ExamError, newState, publicSnapshot, recordAnswer, requireLease, settleTime, type AttemptRow, type ExamState } from './state'
import { createExamStore, type CommandReceipt, type ExamDatabase, type ExamStore } from './store'
import type { ProtectedExamEvent, ProtectedObservationSource, ProtectedPauseReason } from '../../src/portal/protectedExamTypes'
import { pauseEventDetail, recordIntegrityEvent } from '../../src/domain/integrityPolicy'

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
const APPLICATION = /^MP-LL-[A-Z0-9-]{4,32}$/
const REASONS = new Set<ProtectedPauseReason>(['network', 'visibility', 'camera', 'camera-stopped', 'no-face', 'multiple-faces', 'phone', 'fullscreen-exit', 'exit'])
type Body = Record<string, unknown>
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', ...headers },
})
const event = (kind: string, now: number, detail: string): ProtectedExamEvent => ({ id: crypto.randomUUID(), kind, at: now, detail })
function fields(body: Body, permitted: string[]) {
  if (Object.keys(body).some((key) => !permitted.includes(key))) throw new ExamError('invalid_fields', 'This request contains fields the exam does not accept.', 400)
}
function id(value: unknown, label: string): string {
  if (typeof value !== 'string' || !UUID.test(value)) throw new ExamError('invalid_id', `${label} is invalid.`, 400)
  return value
}
function application(value: unknown): string {
  if (typeof value !== 'string' || !APPLICATION.test(value)) throw new ExamError('invalid_application', 'Application reference is invalid.', 400)
  return value
}
async function readBody(request: Request): Promise<Body> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') ?? '')) throw new ExamError('invalid_content_type', 'Send a JSON request.', 415)
  if (Number(request.headers.get('Content-Length')) > 4096) throw new ExamError('body_too_large', 'Request is too large.', 413)
  const reader = request.body?.getReader()
  let raw = '', size = 0
  const decoder = new TextDecoder()
  if (reader) while (true) {
    const chunk = await reader.read()
    if (chunk.done) break
    size += chunk.value.byteLength
    if (size > 4096) { await reader.cancel(); throw new ExamError('body_too_large', 'Request is too large.', 413) }
    raw += decoder.decode(chunk.value, { stream: true })
  }
  raw += decoder.decode()
  try {
    const body: unknown = JSON.parse(raw)
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error()
    return body as Body
  } catch { throw new ExamError('invalid_json', 'Request could not be read.', 400) }
}
function cookieName(url: URL) { return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ? 'lf_exam_local' : '__Host-lf_exam' }
function tokenFrom(request: Request, name: string): string | null {
  const values = (request.headers.get('Cookie') ?? '').split(';').map((part) => part.trim()).filter((part) => part.startsWith(`${name}=`))
  if (values.length !== 1) return null
  const value = values[0]!.slice(name.length + 1)
  return /^[a-f0-9]{64}$/.test(value) ? value : null
}
async function snapshot(store: ExamStore, row: AttemptRow, clientId: string | null, now: number) {
  // Keep the full audit in D1; only the completed result displays the history.
  // Re-reading it after every answer/heartbeat adds an unnecessary round trip.
  return publicSnapshot(row, JSON.parse(row.state_json) as ExamState, clientId, now, row.status === 'completed' ? await store.events(row.id) : [])
}

// Expiry is a server transition even on read/recovery; client timestamps are never used.
async function settled(store: ExamStore, row: AttemptRow, now: number): Promise<AttemptRow> {
  for (let tries = 0; tries < 5; tries++) {
    const state = JSON.parse(row.state_json) as ExamState
    const count = state.answers.length
    settleTime(state, row.expires_at, now)
    if (state.answers.length === count) return row
    const next = { ...row, status: state.phase, revision: row.revision + 1, state_json: JSON.stringify(state), mutation_id: crypto.randomUUID() }
    if (state.phase === 'completed') { next.lease_client = null; next.lease_until = null }
    if (await store.commit(row, next, state, state.answers.slice(count), event('TIME_EXPIRED', now, `${state.answers.length - count} unanswered question(s) timed out; confirmed answers retained.`))) return next
    const fresh = await store.find(row.id, row.owner_hash)
    if (!fresh) throw new ExamError('not_found', 'Attempt was not found.', 404)
    row = fresh
  }
  throw new ExamError('busy', 'The attempt is being updated. Reconnect to continue.', 409)
}

async function mutate(store: ExamStore, original: AttemptRow, action: string, body: Body, now: number, initialReceipt: CommandReceipt | null) {
  const clientId = id(body.clientId, 'Exam tab')
  const requestId = action === 'heartbeat' ? null : id(body.requestId, 'Request identifier')
  // An answer may be retried by a replacement tab after reload. The semantic
  // command is unchanged; the new tab still needs a lease for any first write.
  const signature = requestId ? await sha256(JSON.stringify([action, action === 'answers' ? null : clientId, body.questionToken ?? null, body.optionIndex ?? null, body.reason ?? null, body.source ?? null])) : ''
  let row = original
  for (let tries = 0; tries < 6; tries++) {
    if (requestId) {
      const old = tries === 0 ? initialReceipt : await store.command(row.id, requestId)
      if (old) {
        if (old.signature !== signature) throw new ExamError('idempotency_conflict', 'This request identifier was already used for a different action.')
        const current = await store.find(row.id, row.owner_hash)
        if (!current) throw new ExamError('not_found', 'Attempt was not found.', 404)
        return json({ attempt: await snapshot(store, await settled(store, current, now), clientId, now), duplicate: true })
      }
    }
    row = await settled(store, row, now)
    const state = JSON.parse(row.state_json) as ExamState
    const at = clock(state, now)
    const count = state.answers.length
    let audit: ProtectedExamEvent | null = null
    const next = { ...row, revision: row.revision + 1, mutation_id: crypto.randomUUID() }
    if (action === 'claim') {
      if (row.lease_client && row.lease_client !== clientId && (row.lease_until ?? 0) > at && state.phase !== 'completed') {
        throw new ExamError('lease_conflict', 'This test is open in another tab. Close that tab, then reconnect here.', 409, Math.ceil(((row.lease_until ?? at) - at) / 1000))
      }
      next.lease_client = state.phase === 'completed' ? null : clientId
      next.lease_until = state.phase === 'completed' ? null : at + state.rules.leaseMs
      // Reclaiming a tab never grants a fresh question deadline.
      audit = event('TAB_CONNECTED', at, 'An exam tab connected to the existing server attempt.')
    } else {
      if (state.phase === 'completed') return json({ attempt: await snapshot(store, row, null, at) })
      requireLease(row, clientId, at)
      next.lease_until = at + state.rules.leaseMs
      if (action === 'question') {
        if (state.phase === 'paused') throw new ExamError('paused', 'Resume the paused test first.')
        if (state.phase === 'ready' || state.phase === 'waiting') {
          state.phase = 'active'
          state.startedAt ??= at
          state.deadlineAt = at + state.rules.questionMs
          audit = event('QUESTION_OPENED', at, `Question ${state.index + 1} opened. Server timer started.`)
        }
      } else if (action === 'answers') {
        const token = id(body.questionToken, 'Question token')
        // An expired or already answered question cannot write into the next one.
        if (state.phase !== 'active' || state.paper[state.index]?.token !== token) throw new ExamError('question_closed', 'This question is already locked or its time has ended. Reconnect to see the saved checkpoint.')
        const selected = body.optionIndex
        if (!Number.isInteger(selected) || (selected as number) < -1 || (selected as number) >= state.paper[state.index]!.options.length) throw new ExamError('invalid_answer', 'Choose one of the supplied answers.', 400)
        recordAnswer(state, selected as number, at, false)
        audit = event('ANSWER_LOCKED', at, `Question ${state.index} answer committed before navigation.`)
      } else if (action === 'pause') {
        const reason = body.reason as ProtectedPauseReason
        const source = (body.source ?? 'live') as ProtectedObservationSource
        if (!REASONS.has(reason)) throw new ExamError('invalid_reason', 'Pause reason is invalid.', 400)
        if (!['live', 'judge-simulation'].includes(source) || (source === 'judge-simulation' && reason !== 'phone')) {
          throw new ExamError('invalid_source', 'Observation source is invalid.', 400)
        }
        if (state.phase === 'active') {
          state.remainingMs = Math.max(0, state.deadlineAt! - at)
          state.deadlineAt = null
          state.phase = 'paused'
          state.pauseStartedAt = at
          state.pauseReason = reason
          state.integritySummary = recordIntegrityEvent(state.integritySummary, reason, source)
          audit = event('PAUSED', at, pauseEventDetail(reason, source))
        }
        // Closing a tab leaves a recoverable attempt, not a lease that traps its owner.
        next.lease_client = null
        next.lease_until = null
      } else if (action === 'resume') {
        if (state.phase === 'paused') {
          const elapsed = Math.max(0, at - state.pauseStartedAt!)
          const free = Math.max(0, state.rules.pauseBudgetMs - state.pauseUsedMs)
          const remaining = Math.max(0, (state.remainingMs ?? 0) - Math.max(0, elapsed - free))
          state.pauseUsedMs = Math.min(state.rules.pauseBudgetMs, state.pauseUsedMs + elapsed)
          state.phase = 'active'
          state.deadlineAt = at + remaining
          state.remainingMs = null
          state.pauseStartedAt = null
          state.pauseReason = null
          audit = event('RESUMED', at, 'Resumed with server-calculated remaining time; no new question allowance.')
        }
      } else if (action !== 'heartbeat') throw new ExamError('not_found', 'Exam action was not found.', 404)
    }
    state.lastClock = at
    next.status = state.phase
    next.state_json = JSON.stringify(state)
    if (state.phase === 'completed') { next.lease_client = null; next.lease_until = null }
    if (await store.commit(row, next, state, state.answers.slice(count), audit, requestId ? { id: requestId, signature } : undefined)) {
      return json({ attempt: await snapshot(store, next, clientId, at) })
    }
    const fresh = await store.find(row.id, row.owner_hash)
    if (!fresh) throw new ExamError('not_found', 'Attempt was not found.', 404)
    row = fresh
  }
  throw new ExamError('busy', 'The attempt is being updated. Reconnect to continue.')
}

export async function handleExamRequest(request: Request, env: { DB?: ExamDatabase }, dependencies: { now?: () => number } = {}): Promise<Response> {
  try {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    if ((origin && origin !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site'
      || (request.method === 'POST' && origin !== url.origin && request.headers.get('Sec-Fetch-Site') !== 'same-origin')) {
      throw new ExamError('origin_not_allowed', 'Open the test on the LicenceFlow website.', 403)
    }
    if (!['GET', 'POST'].includes(request.method)) return json({ code: 'method_not_allowed', error: 'Method not allowed.' }, 405, { Allow: 'GET, POST' })
    if (!env.DB) throw new ExamError('exam_unavailable', 'The protected exam service is not available. Your demo journey is unchanged.', 503)
    const store = createExamStore(env.DB)
    const now = (dependencies.now ?? Date.now)()
    const name = cookieName(url)
    const token = tokenFrom(request, name)
    const owner = token ? await sha256(token) : null
    const body = request.method === 'POST' ? await readBody(request) : {}
    const match = url.pathname.match(/^\/api\/exam\/attempts\/([a-f0-9-]+)\/(claim|question|answers|heartbeat|pause|resume|result)$/i)
    const access = owner && match ? await store.access(owner, now, match[1]!, typeof body.requestId === 'string' ? body.requestId : null) : null
    const validSession = match ? access : owner && await store.session(owner, now)

    if (url.pathname === '/api/exam/session' && request.method === 'POST') {
      fields(body, [])
      if (validSession) return json({ ready: true, identity: 'anonymous-browser-session', synthetic: true })
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')
      await store.createSession(await sha256(secret), now, now + EXAM_RULES.sessionTtlMs)
      return json({ ready: true, identity: 'anonymous-browser-session', synthetic: true }, 201, {
        'Set-Cookie': `${name}=${secret}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${EXAM_RULES.sessionTtlMs / 1000}${name.startsWith('__Host-') ? '; Secure' : ''}`,
      })
    }
    if (!validSession || !owner) {
      if (url.pathname === '/api/exam/status' && request.method === 'GET') return json({ attempt: null })
      throw new ExamError('session_required', 'Reconnect to the protected exam service in this browser.', 401)
    }
    if (url.pathname === '/api/exam/status' && request.method === 'GET') {
      const row = await store.latest(owner, application(url.searchParams.get('applicationId')))
      return json({ attempt: row ? await snapshot(store, await settled(store, row, now), null, now) : null })
    }
    if (url.pathname === '/api/exam/attempts' && request.method === 'POST') {
      fields(body, ['applicationId', 'retakeOf'])
      const app = application(body.applicationId)
      const retakeOf = body.retakeOf === undefined ? null : id(body.retakeOf, 'Previous attempt')
      if (retakeOf) {
        const successor = await store.successor(owner, retakeOf)
        if (successor && successor.application_id === app) return json({ attempt: await snapshot(store, await settled(store, successor, now), null, now) })
      }
      let latest = await store.latest(owner, app)
      if (latest) latest = await settled(store, latest, now)
      if (!retakeOf && latest) return json({ attempt: await snapshot(store, latest, null, now) })
      if (retakeOf && (!latest || latest.id !== retakeOf || latest.status !== 'completed')) {
        throw new ExamError('retake_not_ready', 'Finish the current attempt before starting a fresh paper.')
      }
      let open = await store.open(owner)
      if (open) open = await settled(store, open, now)
      if (open && open.status !== 'completed') throw new ExamError('active_attempt_exists', `Finish the open test for ${open.application_id} before starting another.`)
      if (await store.count(owner) >= EXAM_RULES.maxAttempts) throw new ExamError('attempt_limit', 'This prototype session has reached its five-attempt limit.', 429)
      const previous = latest ? (JSON.parse(latest.state_json) as ExamState).paper : []
      const state = await newState(now, previous)
      const row: AttemptRow = {
        id: crypto.randomUUID(), owner_hash: owner, application_id: app, attempt_number: (latest?.attempt_number ?? 0) + 1, retake_of: retakeOf,
        status: 'ready', revision: 0, lease_client: null, lease_until: null, state_json: JSON.stringify(state), mutation_id: crypto.randomUUID(), created_at: now, expires_at: now + EXAM_RULES.attemptTtlMs,
      }
      const inserted = await store.insert(row, event('ATTEMPT_CREATED', now, 'Server-owned practice assessment created. Application and payment remain mock services.'))
      if (!inserted) {
        const existing = await store.latest(owner, app)
        if (!existing) throw new ExamError('active_attempt_exists', 'Another protected attempt is already open.')
        return json({ attempt: await snapshot(store, existing, null, now) })
      }
      return json({ attempt: await snapshot(store, row, null, now) }, 201)
    }
    if (!match) throw new ExamError('not_found', 'Exam route was not found.', 404)
    id(match[1], 'Attempt')
    let row: AttemptRow = access!
    if (!row?.id) throw new ExamError('not_found', 'Attempt was not found in this browser session.', 404)
    if (match[2] === 'result' && request.method === 'GET') {
      row = await settled(store, row, now)
      const state = JSON.parse(row.state_json) as ExamState
      if (state.phase !== 'completed') throw new ExamError('result_locked', 'Answers and explanations are available after this attempt finishes.', 403)
      return json({ attempt: await snapshot(store, row, null, now), review: state.paper.map((q, index) => ({
        index, prompt: q.prompt, promptHi: q.promptHi, options: q.options, optionsHi: q.optionsHi,
        selected: state.answers[index]!.selected, correct: q.correct, explanation: q.explanation, explanationHi: q.explanationHi,
        timedOut: state.answers[index]!.timedOut,
      })) })
    }
    if (request.method !== 'POST' || match[2] === 'result') return json({ code: 'method_not_allowed', error: 'Method not allowed.' }, 405)
    fields(body, match[2] === 'answers' ? ['clientId', 'requestId', 'questionToken', 'optionIndex'] : match[2] === 'pause' ? ['clientId', 'requestId', 'reason', 'source'] : match[2] === 'heartbeat' ? ['clientId'] : ['clientId', 'requestId'])
    return await mutate(store, row, match[2]!, body, now, access?.command_signature ? { signature: access.command_signature } : null)
  } catch (error) {
    if (error instanceof ExamError) return json({ code: error.code, error: error.message }, error.status, error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {})
    // SQL details and private question snapshots must not leak in error responses.
    return json({ code: 'exam_unavailable', error: 'The exam service could not confirm this action. Reconnect before continuing; confirmed answers are retained.' }, 503)
  }
}

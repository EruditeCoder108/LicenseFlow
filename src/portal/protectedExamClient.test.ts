import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { openLocalDatabase } from '../../server/dev/database'
import { handleExamRequest } from '../../server/exam/api'
import { ProtectedExamClient, ExamServiceError, acceptExamSnapshot, displayedSeconds, type ExamTransport } from './protectedExamClient'
import { EXAM_RULES } from '../../server/exam/paper'

const APP = 'MP-LL-CLIENT-1000'
let database: ReturnType<typeof openLocalDatabase>
let now: number
let cookie: string
let loseNextAnswerResponse: boolean
let storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const calls: Array<{ path: string; body?: Record<string, unknown> }> = []
const transport: ExamTransport = async <T>(path: string, body?: Record<string, unknown>) => {
  calls.push({ path, body })
  const response = await handleExamRequest(new Request(`https://example.test/api/exam${path}`, {
    method: body ? 'POST' : 'GET', headers: { Cookie: cookie, Origin: 'https://example.test', 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), { DB: database.db }, { now: () => now })
  cookie = response.headers.get('Set-Cookie')?.split(';')[0] ?? cookie
  const data = await response.json() as { code: string; error: string }
  if (loseNextAnswerResponse && path.endsWith('/answers')) { loseNextAnswerResponse = false; throw new ExamServiceError('connection_lost', 'Response lost in transit') }
  if (!response.ok) throw new ExamServiceError(data.code, data.error, Number(response.headers.get('Retry-After') ?? 0))
  return data as T
}
beforeEach(() => {
  database = openLocalDatabase(); now = Date.UTC(2026, 8, 2); cookie = ''; loseNextAnswerResponse = false; calls.length = 0
  const items = new Map<string, string>()
  storage = { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => { items.set(key, value) }, removeItem: (key) => { items.delete(key) } }
})
afterEach(() => database.close())

describe('protected exam browser adapter against real SQL transitions', () => {
  it('keeps answers queued until the server response, then retries exactly once after a reload', async () => {
    const first = new ProtectedExamClient(APP, transport, storage)
    const attempt = await first.open(await first.connect(await first.create()))
    loseNextAnswerResponse = true
    await expect(first.answer(attempt, 1)).rejects.toMatchObject({ code: 'connection_lost' })
    expect(first.hasPendingAnswer).toBe(true)
    const command = calls.find((call) => call.path.endsWith('/answers'))!.body
    now += EXAM_RULES.leaseMs + 1
    const reloaded = new ProtectedExamClient(APP, transport, storage)
    expect(reloaded.clientId).not.toBe(first.clientId)
    const resumed = await reloaded.connect((await reloaded.status())!)
    expect(resumed.currentIndex).toBe(1)
    expect(resumed.phase).toBe('waiting')
    expect(resumed.deadlineAt).toBeNull()
    expect(reloaded.hasPendingAnswer).toBe(false)
    const retried = calls.filter((call) => call.path.endsWith('/answers')).at(-1)!.body!
    expect(retried.requestId).toBe(command!.requestId)
    expect(retried.questionToken).toBe(command!.questionToken)
    expect(database.sqlite.prepare('SELECT COUNT(*) AS n FROM exam_answers').get()!.n).toBe(1)
  })

  it('cannot convert queued local answer tampering into server authority', async () => {
    storage.setItem(`lf-protected-pending:${APP}`, JSON.stringify({ score: 15, passed: true, correct: true }))
    const client = new ProtectedExamClient(APP, transport, storage)
    expect(client.hasPendingAnswer).toBe(false)
    const attempt = await client.create()
    expect(attempt.result).toBeNull()
    expect(attempt.answers).toEqual({})
  })

  it('does not start an attempt simply by checking its status', async () => {
    const client = new ProtectedExamClient(APP, transport, storage)
    expect(await client.status()).toBeNull()
    expect(cookie).toBe('')
    expect(database.sqlite.prepare('SELECT COUNT(*) AS n FROM exam_attempts').get()!.n).toBe(0)
  })

  it('enforces the one-tab lease even when a second client knows the same attempt', async () => {
    const first = new ProtectedExamClient(APP, transport, storage)
    const attempt = await first.connect(await first.create())
    const second = new ProtectedExamClient(APP, transport, storage)
    await expect(second.connect(attempt)).rejects.toMatchObject({ code: 'lease_conflict' })
    expect((await first.open(attempt)).question).not.toBeNull()
  })

  it('calculates the display timer from server time and monotonic elapsed time, not the wall clock', async () => {
    const client = new ProtectedExamClient(APP, transport, storage)
    const attempt = await client.open(await client.connect(await client.create()))
    expect(displayedSeconds(attempt, 0)).toBe(30)
    expect(displayedSeconds(attempt, 12_200)).toBe(18)
    expect(displayedSeconds(attempt, 30_500)).toBe(0)
    expect(displayedSeconds({ ...attempt, deadlineAt: null }, 50_000)).toBeUndefined()
  })

  it('ignores a stale heartbeat response instead of resurrecting a previous question', async () => {
    const client = new ProtectedExamClient(APP, transport, storage)
    const initial = await client.open(await client.connect(await client.create()))
    const saved = await client.answer(initial, 0)
    expect(acceptExamSnapshot(saved, initial)).toBe(saved)
    expect(acceptExamSnapshot(initial, saved)).toBe(saved)
  })

  it('supports an in-memory retry if browser storage is unavailable', async () => {
    const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => { throw new Error('blocked') } }
    const client = new ProtectedExamClient(APP, transport, blocked)
    const attempt = await client.open(await client.connect(await client.create()))
    loseNextAnswerResponse = true
    await expect(client.answer(attempt, 0)).rejects.toBeInstanceOf(ExamServiceError)
    expect(client.hasPendingAnswer).toBe(true)
    const result = await client.connect((await client.status())!)
    expect(result.currentIndex).toBe(1)
    expect(client.hasPendingAnswer).toBe(false)
  })
})

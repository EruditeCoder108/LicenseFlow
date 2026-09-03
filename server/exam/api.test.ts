import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openLocalDatabase } from '../dev/database'
import { handleExamRequest } from './api'
import { EXAM_RULES, PROTECTED_QUOTAS, createPaper } from './paper'
import { fullQuestions } from './questionBank'
import type { ExamState } from './state'
import type { ProtectedExamSnapshot, ProtectedReviewItem } from '../../src/portal/protectedExamTypes'

const ORIGIN = 'https://exam.example'
const APP = 'MP-LL-DEMO-2408'
let database: ReturnType<typeof openLocalDatabase>
let now: number
type Reply = { attempt: ProtectedExamSnapshot; review: ProtectedReviewItem[]; code?: string; duplicate?: boolean }
function client() {
  let cookie = ''
  const tab = crypto.randomUUID()
  const send = async (path: string, body?: Record<string, unknown>, extra: Record<string, string> = {}) => {
    const request = new Request(`${ORIGIN}/api/exam${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Origin: ORIGIN, Cookie: cookie, 'Content-Type': 'application/json', ...extra },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const response = await handleExamRequest(request, { DB: database.db }, { now: () => now })
    cookie = response.headers.get('Set-Cookie')?.split(';')[0] ?? cookie
    return { response, data: await response.json() as Reply }
  }
  const action = (attempt: ProtectedExamSnapshot, name: string, rest: Record<string, unknown> = {}) => send(`/attempts/${attempt.attemptId}/${name}`, { clientId: tab, ...(name === 'heartbeat' ? {} : { requestId: crypto.randomUUID() }), ...rest })
  const start = async () => {
    expect((await send('/session', {})).response.status).toBe(201)
    const { data, response } = await send('/attempts', { applicationId: APP })
    expect(response.status).toBe(201)
    await action(data.attempt, 'claim')
    const opened = await action(data.attempt, 'question')
    expect(opened.response.status).toBe(200)
    return opened.data.attempt
  }
  return { send, action, start, tab, cookie: () => cookie }
}
function state(attempt: ProtectedExamSnapshot) {
  const row = database.sqlite.prepare('SELECT state_json FROM exam_attempts WHERE id = ?').get(attempt.attemptId)!
  return JSON.parse(row.state_json as string) as ExamState
}
beforeEach(() => { database = openLocalDatabase(); now = Date.UTC(2026, 8, 2, 12) })
afterEach(() => { vi.restoreAllMocks(); database.close() })

describe('server-owned exam boundary', () => {
  it('sets an opaque HttpOnly secure session without putting credentials in JSON', async () => {
    const judge = client()
    const { response, data } = await judge.send('/session', {})
    expect(response.headers.get('Set-Cookie')).toMatch(/^__Host-lf_exam=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Strict; Max-Age=604800; Secure$/)
    expect(JSON.stringify(data)).not.toContain(judge.cookie().split('=')[1])
    expect(response.headers.get('Cache-Control')).toContain('no-store')
  })

  it('only presents the current question and does not disclose keys, future paper or score', async () => {
    const user = client()
    const attempt = await user.start()
    expect(attempt.question).toMatchObject({ index: 0, token: expect.any(String), prompt: expect.any(String), options: expect.any(Array) })
    expect(Object.keys(attempt.question!).every((key) => ['index', 'options', 'optionsHi', 'prompt', 'promptHi', 'token'].includes(key))).toBe(true)
    expect(attempt.result).toBeNull()
    expect(attempt.answers).toEqual({})
    for (const secret of ['correct', 'explanation', 'paper', 'questionId', 'owner_hash', 'state_json']) expect(attempt).not.toHaveProperty(secret)
    const hidden = await user.send(`/status?applicationId=${APP}`)
    expect(hidden.data.attempt.question).toBeNull() // no tab lease in a bare status read
    expect((await user.send(`/attempts/${attempt.attemptId}/result`)).response.status).toBe(403)
  })

  it('rejects client scores, answer keys, time fields and judge bypass flags', async () => {
    const user = client()
    const attempt = await user.start()
    for (const field of ['score', 'correct', 'passed', 'deadlineAt', 'judgeMode', 'timeRemaining']) {
      const result = await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: 0, [field]: 15 })
      expect(result.response.status).toBe(400)
      expect(result.data.code).toBe('invalid_fields')
    }
    expect(state(attempt).answers).toHaveLength(0)
  })

  it('does not share attempts across anonymous owners or accept cross-origin writes', async () => {
    const owner = client(), stranger = client()
    const attempt = await owner.start()
    await stranger.send('/session', {})
    expect((await stranger.action(attempt, 'claim')).response.status).toBe(404)
    expect((await stranger.send(`/attempts/${attempt.attemptId}/result`)).response.status).toBe(404)
    expect((await owner.send('/attempts', { applicationId: APP }, { Origin: 'https://untrusted.example' })).response.status).toBe(403)
    expect((await owner.send('/attempts', { applicationId: APP }, { Origin: '' })).response.status).toBe(403)
  })

  it('has no private-bank or demo-pass API and fails closed without a database', async () => {
    const user = client()
    await user.send('/session', {})
    expect((await user.send('/bank')).response.status).toBe(404)
    expect((await user.send('/judge-pass', {})).response.status).toBe(404)
    const response = await handleExamRequest(new Request(`${ORIGIN}/api/exam/status?applicationId=${APP}`), {})
    expect(response.status).toBe(503)
  })
})

describe('atomic answers and recovery', () => {
  it('uses two database round trips per ordinary answer, next question and heartbeat without dropping the audit', async () => {
    const user = client(), attempt = await user.start()
    // Count database calls, not local elapsed time: one read plus one transaction.
    const prototype = Object.getPrototypeOf(database.db.prepare('SELECT 1'))
    const first = vi.spyOn(prototype, 'first')
    const all = vi.spyOn(prototype, 'all')
    const run = vi.spyOn(prototype, 'run')
    const batch = vi.spyOn(database.db, 'batch')
    const expectBudget = () => {
      expect(first).toHaveBeenCalledTimes(1)
      expect(batch).toHaveBeenCalledTimes(1)
      expect(all).not.toHaveBeenCalled()
      expect(run).not.toHaveBeenCalled()
      vi.clearAllMocks()
    }
    const saved = await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: 0 })
    expect(saved.response.status).toBe(200)
    expect(saved.data.attempt.events).toEqual([])
    expectBudget()
    const next = await user.action(saved.data.attempt, 'question')
    expect(next.response.status).toBe(200)
    expectBudget()
    expect((await user.action(next.data.attempt, 'heartbeat')).response.status).toBe(200)
    expectBudget()
    expect(database.sqlite.prepare("SELECT COUNT(*) AS n FROM exam_events WHERE kind = 'ANSWER_LOCKED'").get()!.n).toBe(1)
    now += EXAM_RULES.attemptTtlMs + 1
    const completed = await user.send(`/attempts/${attempt.attemptId}/result`)
    expect(completed.response.status).toBe(200)
    expect(completed.data.attempt.events.some((event) => event.kind === 'ANSWER_LOCKED')).toBe(true)
  })

  it('rejects expired and missing sessions on the combined access lookup', async () => {
    const user = client(), attempt = await user.start()
    const outsider = client()
    expect((await outsider.action(attempt, 'claim')).response.status).toBe(401)
    now += EXAM_RULES.sessionTtlMs + 1
    expect((await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: 0 })).response.status).toBe(401)
    expect((await user.send(`/attempts/${attempt.attemptId}/result`)).response.status).toBe(401)
    expect(state(attempt).answers).toHaveLength(0)
  })

  it('commits a duplicated answer once and waits before opening an unseen next question', async () => {
    const user = client(), attempt = await user.start()
    const request = { requestId: crypto.randomUUID(), questionToken: attempt.question!.token, optionIndex: 0 }
    const first = await user.action(attempt, 'answers', request)
    expect(first.data.attempt.phase).toBe('waiting')
    expect(first.data.attempt.question).toBeNull()
    expect(first.data.attempt.deadlineAt).toBeNull()
    now += 60_000 // simulate a lost response followed by a late retry
    const duplicate = await user.action(attempt, 'answers', request)
    expect(duplicate.data.duplicate).toBe(true)
    expect(duplicate.data.attempt.currentIndex).toBe(1)
    expect(state(attempt).answers).toHaveLength(1)
    expect(database.sqlite.prepare('SELECT COUNT(*) AS n FROM exam_answers').get()!.n).toBe(1)
    expect((await user.action(attempt, 'answers', { ...request, optionIndex: 1 })).data.code).toBe('idempotency_conflict')
    await user.action(attempt, 'claim')
    const next = await user.action(attempt, 'question')
    expect(next.data.attempt.deadlineAt).toBe(now + EXAM_RULES.questionMs)
  })

  it('serialises conflicting simultaneous answers so only one wins', async () => {
    const user = client(), attempt = await user.start()
    const results = await Promise.all([0, 1].map((optionIndex) => user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex })))
    expect(results.map((r) => r.response.status).sort()).toEqual([200, 409])
    expect(state(attempt).answers).toHaveLength(1)
    expect(database.sqlite.prepare('SELECT COUNT(*) AS n FROM exam_commands').get()!.n).toBe(3) // claim, open, winning answer
  })

  it('serialises simultaneous duplicates with a single command receipt', async () => {
    const user = client(), attempt = await user.start()
    const request = { requestId: crypto.randomUUID(), questionToken: attempt.question!.token, optionIndex: 0 }
    const results = await Promise.all([user.action(attempt, 'answers', request), user.action(attempt, 'answers', request)])
    expect(results.every((r) => r.response.status === 200)).toBe(true)
    expect(results.every((r) => r.data.attempt.currentIndex === 1)).toBe(true)
    expect(state(attempt).answers).toHaveLength(1)
  })

  it('rolls back answer, attempt and receipt together when a database write fails', async () => {
    const user = client(), attempt = await user.start()
    database.sqlite.exec("CREATE TRIGGER fail_answer BEFORE INSERT ON exam_answers BEGIN SELECT RAISE(ABORT, 'test failure'); END")
    const result = await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: 0 })
    expect(result.response.status).toBe(503)
    expect(state(attempt).answers).toHaveLength(0)
    expect(state(attempt).phase).toBe('active')
    expect(JSON.stringify(result.data)).not.toContain('test failure')
  })

  it('will not apply an old question token to the next question', async () => {
    const user = client(), attempt = await user.start()
    await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: 0 })
    await user.action(attempt, 'question')
    expect((await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: 1 })).data.code).toBe('question_closed')
    expect(state(attempt).answers).toHaveLength(1)
  })
})

describe('server clocks and a single active tab', () => {
  it('keeps a deadline through refresh and competing tab claims', async () => {
    const user = client(), attempt = await user.start()
    const newTab = crypto.randomUUID()
    const conflict = await user.action(attempt, 'claim', { clientId: newTab })
    expect(conflict.data.code).toBe('lease_conflict')
    now += EXAM_RULES.leaseMs + 1
    const recovered = await user.action(attempt, 'claim', { clientId: newTab })
    expect(recovered.data.attempt.deadlineAt).toBe(attempt.deadlineAt)
    expect((await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: 0 })).data.code).toBe('lease_required')
  })

  it('times out the current question on the server but does not consume unseen questions', async () => {
    const user = client(), attempt = await user.start()
    now += EXAM_RULES.questionMs
    expect((await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: 0 })).data.code).toBe('lease_required')
    const recovered = await user.action(attempt, 'claim')
    expect(recovered.data.attempt.phase).toBe('waiting')
    expect(recovered.data.attempt.currentIndex).toBe(1)
    expect(state(attempt).answers[0]).toMatchObject({ selected: -1, timedOut: true, correct: false })
    expect(recovered.data.attempt.question).toBeNull()
  })

  it('preserves remaining time for a confirmed pause without replenishing the pause budget', async () => {
    const user = client(), attempt = await user.start()
    now += 7000
    await user.action(attempt, 'pause', { reason: 'visibility' })
    now += 60_000
    await user.action(attempt, 'claim')
    const resumed = await user.action(attempt, 'resume')
    expect(resumed.data.attempt.deadlineAt).toBe(now + 23_000)
    expect(resumed.data.attempt.pauseBudgetRemainingMs).toBe(60_000)
    await user.action(attempt, 'pause', { reason: 'visibility' })
    now += 70_000
    await user.action(attempt, 'claim')
    const second = await user.action(attempt, 'resume')
    expect(second.data.attempt.deadlineAt).toBe(now + 13_000)
    expect(second.data.attempt.pauseBudgetRemainingMs).toBe(0)
  })

  it('expires an abandoned pause and eventually closes the attempt, preserving existing answers', async () => {
    const user = client(), attempt = await user.start()
    await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: 0 })
    const second = (await user.action(attempt, 'question')).data.attempt
    await user.action(second, 'pause', { reason: 'exit' })
    now += EXAM_RULES.pauseBudgetMs + EXAM_RULES.questionMs
    const snapshot = (await user.send(`/status?applicationId=${APP}`)).data.attempt
    expect(snapshot.currentIndex).toBe(2)
    now += EXAM_RULES.attemptTtlMs
    const result = (await user.send(`/attempts/${attempt.attemptId}/result`)).data
    expect(result.attempt.phase).toBe('completed')
    expect(result.review).toHaveLength(15)
    expect(result.review[0]!.selected).toBe(0)
    expect(result.attempt.result!.reason).toBe('expired')
  })

  it('allows only one open attempt per session even for simultaneous creation', async () => {
    const user = client()
    await user.send('/session', {})
    const replies = await Promise.all([APP, 'MP-LL-OTHER-1000'].map((applicationId) => user.send('/attempts', { applicationId })))
    expect(replies.filter((r) => r.response.status === 201)).toHaveLength(1)
    expect(database.sqlite.prepare("SELECT COUNT(*) AS n FROM exam_attempts WHERE status != 'completed'").get()!.n).toBe(1)
  })
})

describe('grading and fresh balanced retests', () => {
  it('grades only from stored keys, reveals explanations after completion, and creates an idempotent retest', async () => {
    const user = client()
    let attempt = await user.start()
    const originalPaper = state(attempt).paper
    for (let index = 0; index < 15; index++) {
      const correct = state(attempt).paper[index]!.correct // test-only database access, not a browser endpoint
      attempt = (await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: correct })).data.attempt
      if (index < 14) attempt = (await user.action(attempt, 'question')).data.attempt
    }
    expect(attempt.result).toMatchObject({ score: 15, passed: true })
    const result = (await user.send(`/attempts/${attempt.attemptId}/result`)).data
    expect(result.review.every((q) => q.explanation.length > 0 && q.correct === q.selected)).toBe(true)
    const retakeBody = { applicationId: APP, retakeOf: attempt.attemptId }
    const next = (await user.send('/attempts', retakeBody)).data.attempt
    const duplicate = (await user.send('/attempts', retakeBody)).data.attempt
    expect(next.attemptId).not.toBe(attempt.attemptId)
    expect(duplicate.attemptId).toBe(next.attemptId)
    expect(next.attemptNumber).toBe(2)
    expect(state(next).paper.some((q) => originalPaper.some((old) => old.family === q.family))).toBe(false)
  })

  it('preserves exact difficulty quotas, question uniqueness and bilingual option alignment', () => {
    let previous = createPaper()
    for (let attempt = 0; attempt < 100; attempt++) {
      const paper = createPaper(previous)
      expect(new Set(paper.map((q) => q.id)).size).toBe(15)
      expect(new Set(paper.map((q) => q.token)).size).toBe(15)
      for (const [difficulty, count] of Object.entries(PROTECTED_QUOTAS)) expect(paper.filter((q) => q.difficulty === difficulty)).toHaveLength(count)
      for (const question of paper) {
        const source = fullQuestions.find((q) => q.id === question.id)!
        expect(question.options[question.correct]).toBe(source.options[source.correct])
        if (source.optionsHi) question.options.forEach((option, index) => expect(question.optionsHi![index]).toBe(source.optionsHi![source.options.indexOf(option)]))
      }
      expect(paper.some((q) => previous.some((old) => old.family === q.family))).toBe(false)
      previous = paper
    }
  })

  it('expires sessions and prunes their answers, commands, events and attempts together', async () => {
    const user = client(), attempt = await user.start()
    await user.action(attempt, 'answers', { questionToken: attempt.question!.token, optionIndex: 0 })
    now += EXAM_RULES.sessionTtlMs + 1
    expect((await user.action(attempt, 'claim')).response.status).toBe(401)
    await client().send('/session', {})
    for (const table of ['exam_attempts', 'exam_answers', 'exam_commands', 'exam_events']) expect(database.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()!.n).toBe(0)
  })
})

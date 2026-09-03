import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fullQuestions } from '../server/exam/questionBank.ts'
import { openLocalDatabase } from '../server/dev/database.ts'
import worker from '../dist/server/index.js'

const publicFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = resolve(directory, entry.name)
  return entry.isDirectory() ? publicFiles(path) : /\.(js|json|map|html)$/.test(entry.name) ? [path] : []
})
const browserCode = publicFiles('dist/client').map((path) => readFileSync(path, 'utf8')).join('\n')
for (const question of fullQuestions) {
  assert(!['"', "'", '`'].some((quote) => browserCode.includes(`${quote}${question.id}${quote}`)), `Protected question ID leaked into static output: ${question.id}`)
  assert(!browserCode.includes(question.prompt), `Protected question text leaked into static output: ${question.id}`)
}
const workerCode = readFileSync('dist/server/index.js', 'utf8')
assert(workerCode.includes(fullQuestions[0].id), 'Worker is missing the private question bank')
assert(!workerCode.includes('node:sqlite'), 'Local database adapter entered the production Worker')
assert.equal(typeof worker.fetch, 'function')
for (const file of readdirSync('drizzle').filter((file) => file.endsWith('.sql'))) {
  assert(existsSync(`dist/.openai/drizzle/${file}`), `Deployment is missing migration: ${file}`)
}

const database = openLocalDatabase()
const origin = 'https://built-worker.example'
let cookie = ''
const call = async (path, body) => {
  const response = await worker.fetch(new Request(`${origin}/api/exam${path}`, {
    method: body ? 'POST' : 'GET', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), { DB: database.db })
  cookie = response.headers.get('Set-Cookie')?.split(';')[0] ?? cookie
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
  return { status: response.status, data: await response.json() }
}
try {
  assert.equal((await call('/session', {})).status, 201)
  const created = await call('/attempts', { applicationId: 'MP-LL-BUILD-1000' })
  assert.equal(created.status, 201)
  const id = created.data.attempt.attemptId
  const clientId = crypto.randomUUID()
  const command = () => ({ clientId, requestId: crypto.randomUUID() })
  assert.equal((await call(`/attempts/${id}/claim`, command())).status, 200)
  const opened = await call(`/attempts/${id}/question`, command())
  assert.equal(opened.status, 200)
  assert(opened.data.attempt.question.prompt)
  assert(!('correct' in opened.data.attempt.question))
  assert(!('explanation' in opened.data.attempt.question))
  assert.equal(opened.data.attempt.result, null)
  const answer = await call(`/attempts/${id}/answers`, { ...command(), questionToken: opened.data.attempt.question.token, optionIndex: 0 })
  assert.equal(answer.status, 200)
  assert.equal(answer.data.attempt.currentIndex, 1)
  assert.equal(answer.data.attempt.deadlineAt, null)
  assert.equal((await call(`/attempts/${id}/result`)).status, 403)
  console.log('Built Worker verified: private bank excluded from static assets; migrations packaged; session, question and durable answer APIs work; early review locked.')
} finally { database.close() }

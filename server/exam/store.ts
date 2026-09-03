import type { ProtectedExamEvent } from '../../src/portal/protectedExamTypes'
import type { AttemptRow, ExamState, StoredAnswer } from './state'

export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
  run(): Promise<{ meta: { changes: number } }>
}
export interface ExamDatabase {
  prepare(sql: string): D1Statement
  batch(statements: D1Statement[]): Promise<{ meta: { changes: number } }[]>
}
export interface CommandReceipt { signature: string }

export function createExamStore(db: ExamDatabase) {
  return {
    async createSession(hash: string, now: number, expires: number) {
      await db.batch([
        // Expired anonymous sessions are inaccessible immediately, and removed
        // in bounded batches on subsequent session creation (including children).
        db.prepare('DELETE FROM exam_sessions WHERE token_hash IN (SELECT token_hash FROM exam_sessions WHERE expires_at <= ? LIMIT 100)').bind(now),
        db.prepare('INSERT INTO exam_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)').bind(hash, now, expires),
      ])
    },
    session(hash: string, now: number) {
      return db.prepare('SELECT token_hash FROM exam_sessions WHERE token_hash = ? AND expires_at > ?').bind(hash, now).first<{ token_hash: string }>()
    },
    find(id: string, owner: string) {
      return db.prepare('SELECT * FROM exam_attempts WHERE id = ? AND owner_hash = ?').bind(id, owner).first<AttemptRow>()
    },
    latest(owner: string, applicationId: string) {
      return db.prepare('SELECT * FROM exam_attempts WHERE owner_hash = ? AND application_id = ? ORDER BY attempt_number DESC LIMIT 1').bind(owner, applicationId).first<AttemptRow>()
    },
    successor(owner: string, parent: string) {
      return db.prepare('SELECT * FROM exam_attempts WHERE owner_hash = ? AND retake_of = ?').bind(owner, parent).first<AttemptRow>()
    },
    open(owner: string) {
      return db.prepare("SELECT * FROM exam_attempts WHERE owner_hash = ? AND status != 'completed' LIMIT 1").bind(owner).first<AttemptRow>()
    },
    async count(owner: string) {
      const row = await db.prepare('SELECT COUNT(*) AS total FROM exam_attempts WHERE owner_hash = ?').bind(owner).first<{ total: number }>()
      return row?.total ?? 0
    },
    async insert(row: AttemptRow, event: ProtectedExamEvent) {
      const result = await db.batch([
        db.prepare(`INSERT OR IGNORE INTO exam_attempts
          (id, owner_hash, application_id, attempt_number, retake_of, status, revision, lease_client, lease_until, state_json, mutation_id, created_at, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(row.id, row.owner_hash, row.application_id, row.attempt_number, row.retake_of, row.status, row.revision, row.lease_client, row.lease_until, row.state_json, row.mutation_id, row.created_at, row.expires_at),
        db.prepare(`INSERT INTO exam_events (id, attempt_id, kind, at, detail)
          SELECT ?, id, ?, ?, ? FROM exam_attempts WHERE id = ? AND mutation_id = ?`)
          .bind(event.id, event.kind, event.at, event.detail, row.id, row.mutation_id),
      ])
      return (result[0]?.meta.changes ?? 0) === 1
    },
    async events(id: string) {
      const rows = await db.prepare('SELECT id, kind, at, detail FROM exam_events WHERE attempt_id = ? ORDER BY at, rowid LIMIT 256').bind(id).all<ProtectedExamEvent>()
      return rows.results
    },
    command(id: string, requestId: string) {
      return db.prepare('SELECT signature FROM exam_commands WHERE attempt_id = ? AND request_id = ?').bind(id, requestId).first<CommandReceipt>()
    },
    async commit(previous: AttemptRow, next: AttemptRow, state: ExamState, additions: StoredAnswer[], event: ProtectedExamEvent | null, receipt?: { id: string; signature: string }) {
      const statements = [db.prepare(`UPDATE exam_attempts SET status = ?, revision = ?, lease_client = ?, lease_until = ?, state_json = ?, mutation_id = ?
        WHERE id = ? AND owner_hash = ? AND revision = ?`)
        .bind(state.phase, next.revision, next.lease_client, next.lease_until, JSON.stringify(state), next.mutation_id, previous.id, previous.owner_hash, previous.revision)]
      // All writes are in one D1 transaction. The mutation-id predicate prevents a
      // losing compare-and-swap from appending an answer, event or command receipt.
      for (const answer of additions) {
        statements.push(db.prepare(`INSERT INTO exam_answers (attempt_id, position, question_id, selected, is_correct, timed_out, received_at)
          SELECT id, ?, ?, ?, ?, ?, ? FROM exam_attempts WHERE id = ? AND mutation_id = ?`)
          .bind(answer.index, state.paper[answer.index]!.id, answer.selected, Number(answer.correct), Number(answer.timedOut), answer.at, next.id, next.mutation_id))
      }
      if (event) statements.push(db.prepare(`INSERT INTO exam_events (id, attempt_id, kind, at, detail)
        SELECT ?, id, ?, ?, ? FROM exam_attempts WHERE id = ? AND mutation_id = ?`)
        .bind(event.id, event.kind, event.at, event.detail, next.id, next.mutation_id))
      if (receipt) statements.push(db.prepare(`INSERT INTO exam_commands (attempt_id, request_id, signature, received_at)
        SELECT id, ?, ?, ? FROM exam_attempts WHERE id = ? AND mutation_id = ?`)
        .bind(receipt.id, receipt.signature, state.lastClock, next.id, next.mutation_id))
      const result = await db.batch(statements)
      return (result[0]?.meta.changes ?? 0) === 1
    },
  }
}
export type ExamStore = ReturnType<typeof createExamStore>

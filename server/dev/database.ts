// Local development and test adapter only. Never included in the Worker bundle.
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { D1Statement, ExamDatabase } from '../exam/store'

export function openLocalDatabase(path = ':memory:') {
  const sqlite = new DatabaseSync(path)
  sqlite.exec('PRAGMA foreign_keys = ON')
  sqlite.exec('CREATE TABLE IF NOT EXISTS __lf_local_migrations (name TEXT PRIMARY KEY)')
  for (const name of readdirSync(resolve('drizzle')).filter((name) => name.endsWith('.sql')).sort()) {
    if (sqlite.prepare('SELECT name FROM __lf_local_migrations WHERE name = ?').get(name)) continue
    sqlite.exec('BEGIN')
    try {
      sqlite.exec(readFileSync(resolve('drizzle', name), 'utf8'))
      sqlite.prepare('INSERT INTO __lf_local_migrations (name) VALUES (?)').run(name)
      sqlite.exec('COMMIT')
    } catch (error) { sqlite.exec('ROLLBACK'); throw error }
  }
  class Statement implements D1Statement {
    readonly sql: string
    readonly values: SQLInputValue[]
    constructor(sql: string, values: SQLInputValue[] = []) { this.sql = sql; this.values = values }
    bind(...values: unknown[]) { return new Statement(this.sql, values as SQLInputValue[]) }
    async first<T>() { return (sqlite.prepare(this.sql).get(...this.values) as T | undefined) ?? null }
    async all<T>() { return { results: sqlite.prepare(this.sql).all(...this.values) as T[] } }
    execute() { return { meta: { changes: Number(sqlite.prepare(this.sql).run(...this.values).changes) } } }
    async run() { return this.execute() }
  }
  const db: ExamDatabase = {
    prepare(sql) { return new Statement(sql) },
    async batch(statements) {
      sqlite.exec('BEGIN')
      try {
        const results = statements.map((statement) => (statement as Statement).execute())
        sqlite.exec('COMMIT')
        return results
      } catch (error) { sqlite.exec('ROLLBACK'); throw error }
    },
  }
  return { db, sqlite, close: () => sqlite.close() }
}

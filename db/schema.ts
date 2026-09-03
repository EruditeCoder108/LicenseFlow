/**
 * LicenceFlow's durable prototype schema.
 *
 * Legacy reliability tables retain only synthetic journey milestones.
 * The separate exam tables below hold authoritative assessment state. Neither
 * subsystem stores identity documents, contact details, camera frames or audio.
 */
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core'

// Already deployed by 0000_reliability.sql; intentionally outside Drizzle's new
// exam snapshot. Do not regenerate or replace that legacy migration.
export const reliabilitySchema = {
  sessions: 'reliability_sessions',
  checkpoints: 'reliability_checkpoints',
  paymentConfirmations: 'payment_confirmations',
} as const

export const examSessions = sqliteTable('exam_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, (table) => [index('exam_sessions_expiry_idx').on(table.expiresAt)])

export const examAttempts = sqliteTable('exam_attempts', {
  id: text('id').primaryKey(),
  ownerHash: text('owner_hash').notNull().references(() => examSessions.tokenHash, { onDelete: 'cascade' }),
  applicationId: text('application_id').notNull(),
  attemptNumber: integer('attempt_number').notNull(),
  retakeOf: text('retake_of'),
  status: text('status').notNull(),
  revision: integer('revision').notNull(),
  leaseClient: text('lease_client'),
  leaseUntil: integer('lease_until'),
  stateJson: text('state_json').notNull(),
  mutationId: text('mutation_id').notNull(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, (table) => [
  uniqueIndex('exam_one_open_attempt_idx').on(table.ownerHash).where(sql`${table.status} != 'completed'`),
  uniqueIndex('exam_attempt_number_idx').on(table.ownerHash, table.applicationId, table.attemptNumber),
  uniqueIndex('exam_one_retake_idx').on(table.ownerHash, table.retakeOf),
])

export const examAnswers = sqliteTable('exam_answers', {
  attemptId: text('attempt_id').notNull().references(() => examAttempts.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  questionId: text('question_id').notNull(),
  selected: integer('selected').notNull(),
  isCorrect: integer('is_correct').notNull(),
  timedOut: integer('timed_out').notNull(),
  receivedAt: integer('received_at').notNull(),
}, (table) => [primaryKey({ columns: [table.attemptId, table.position] })])

export const examCommands = sqliteTable('exam_commands', {
  attemptId: text('attempt_id').notNull().references(() => examAttempts.id, { onDelete: 'cascade' }),
  requestId: text('request_id').notNull(),
  signature: text('signature').notNull(),
  receivedAt: integer('received_at').notNull(),
}, (table) => [primaryKey({ columns: [table.attemptId, table.requestId] })])

export const examEvents = sqliteTable('exam_events', {
  id: text('id').primaryKey(),
  attemptId: text('attempt_id').notNull().references(() => examAttempts.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  at: integer('at').notNull(),
  detail: text('detail').notNull(),
}, (table) => [index('exam_events_attempt_idx').on(table.attemptId, table.at)])

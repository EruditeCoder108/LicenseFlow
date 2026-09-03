import { fullQuestions } from './questionBank'
import type { Question, QuestionDifficulty } from '../../src/content/questions'

export const EXAM_RULES = Object.freeze({
  revision: 'protected-mp-2026-09-v1',
  questionCount: 15,
  passMark: 9,
  questionMs: 30_000,
  leaseMs: 15_000,
  pauseBudgetMs: 120_000,
  attemptTtlMs: 30 * 60_000,
  sessionTtlMs: 7 * 86_400_000,
  maxAttempts: 5,
})
export const PROTECTED_QUOTAS: Record<QuestionDifficulty, number> = { easy: 6, medium: 7, applied: 2 }

// Fisher-Yates with rejection-sampled cryptographic indices, not a client-supplied seed.
export function shuffle<T>(source: readonly T[]): T[] {
  const result = [...source]
  for (let i = result.length - 1; i > 0; i--) {
    const size = i + 1
    const limit = Math.floor(0x100000000 / size) * size
    let value: number
    do { value = crypto.getRandomValues(new Uint32Array(1))[0]! } while (value >= limit)
    const j = value % size
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

export interface FrozenQuestion extends Question { token: string }
export function createPaper(previous: readonly Question[] = []): FrozenQuestion[] {
  const excluded = new Set(previous.map((q) => q.family))
  const selected = (Object.entries(PROTECTED_QUOTAS) as [QuestionDifficulty, number][]).flatMap(([difficulty, count]) => {
    const pool = fullQuestions.filter((q) => q.difficulty === difficulty)
    const preferred = shuffle(pool.filter((q) => !excluded.has(q.family)))
    return [...preferred, ...shuffle(pool.filter((q) => excluded.has(q.family)))].slice(0, count)
  })
  return shuffle(selected).map((question) => {
    const order = shuffle(question.options.map((_, index) => index))
    return {
      ...question,
      token: crypto.randomUUID(),
      options: order.map((index) => question.options[index]!),
      optionsHi: question.optionsHi ? order.map((index) => question.optionsHi![index]!) : undefined,
      correct: order.indexOf(question.correct),
    }
  })
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

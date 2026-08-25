import { fullQuestions, questionById, type Question, type QuestionDifficulty } from './questions'
import { LL_TEST_CONFIG } from './testConfig'

export const PAPER_DIFFICULTY_QUOTAS: Record<QuestionDifficulty, number> = {
  easy: 6,
  medium: 7,
  applied: 2,
}

function hashSeed(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0 || 1
}

function seededRandom(seed: string): () => number {
  let state = hashSeed(seed)
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], seed: string): T[] {
  const random = seededRandom(seed)
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other]!, result[index]!]
  }
  return result
}

function selectDifficulty(difficulty: QuestionDifficulty, count: number, seed: string, excludedFamilies: Set<string>): Question[] {
  const all = fullQuestions.filter((question) => question.difficulty === difficulty)
  const preferred = all.filter((question) => !excludedFamilies.has(question.family))
  const selected = shuffle(preferred, `${seed}:${difficulty}:preferred`).slice(0, count)
  if (selected.length === count) return selected
  const used = new Set(selected.map((question) => question.id))
  const fallback = shuffle(all.filter((question) => !used.has(question.id)), `${seed}:${difficulty}:fallback`)
  return [...selected, ...fallback.slice(0, count - selected.length)]
}

export function buildQuestionPaper(seed: string, previousQuestionIds: string[] = []): Question[] {
  const excludedFamilies = new Set(
    previousQuestionIds
      .map((id) => questionById.get(id)?.family)
      .filter((family): family is string => Boolean(family)),
  )
  const selected = (Object.entries(PAPER_DIFFICULTY_QUOTAS) as Array<[QuestionDifficulty, number]>)
    .flatMap(([difficulty, count]) => selectDifficulty(difficulty, count, seed, excludedFamilies))
  return shuffle(selected, `${seed}:paper-order`)
}

export function resolveQuestionPaper(questionIds: string[]): Question[] {
  return questionIds.map((id) => questionById.get(id)).filter((question): question is Question => Boolean(question))
}

export function isValidQuestionPaper(questionIds: string[]): boolean {
  if (questionIds.length !== LL_TEST_CONFIG.questionCount || new Set(questionIds).size !== questionIds.length) return false
  const questions = resolveQuestionPaper(questionIds)
  if (questions.length !== LL_TEST_CONFIG.questionCount) return false
  return (Object.entries(PAPER_DIFFICULTY_QUOTAS) as Array<[QuestionDifficulty, number]>).every(
    ([difficulty, count]) => questions.filter((question) => question.difficulty === difficulty).length === count,
  )
}

export function paperFingerprint(questionIds: string[]): string {
  return `LF-${hashSeed([...questionIds].sort().join('|')).toString(36).toUpperCase().padStart(7, '0').slice(-7)}`
}

import { describe, expect, it } from 'vitest'
import { fullQuestions } from './questions'
import { LL_TEST_CONFIG } from './testConfig'

describe('prototype LL question configuration', () => {
  it('keeps the configured question count and pass mark internally consistent', () => {
    expect(fullQuestions).toHaveLength(LL_TEST_CONFIG.questionCount)
    expect(LL_TEST_CONFIG.passMark).toBeGreaterThan(0)
    expect(LL_TEST_CONFIG.passMark).toBeLessThanOrEqual(fullQuestions.length)
  })

  it('uses unique questions with valid answer indices and explanations', () => {
    expect(new Set(fullQuestions.map((question) => question.id)).size).toBe(fullQuestions.length)
    for (const question of fullQuestions) {
      expect(question.options.length).toBeGreaterThanOrEqual(3)
      expect(question.correct).toBeGreaterThanOrEqual(0)
      expect(question.correct).toBeLessThan(question.options.length)
      expect(question.explanation.trim().length).toBeGreaterThan(10)
    }
  })
})

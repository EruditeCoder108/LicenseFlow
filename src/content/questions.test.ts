import { describe, expect, it } from 'vitest'
import { fullQuestions } from '../../server/exam/questionBank'
import { LL_TEST_CONFIG } from './testConfig'

describe('prototype LL question configuration', () => {
  it('keeps a 50-question bank and a valid 15-question pass mark', () => {
    expect(fullQuestions).toHaveLength(50)
    expect(LL_TEST_CONFIG.passMark).toBeGreaterThan(0)
    expect(LL_TEST_CONFIG.passMark).toBeLessThanOrEqual(LL_TEST_CONFIG.questionCount)
  })

  it('uses unique questions with valid answer indices and explanations', () => {
    expect(new Set(fullQuestions.map((question) => question.id)).size).toBe(fullQuestions.length)
    for (const question of fullQuestions) {
      expect(question.options.length).toBeGreaterThanOrEqual(3)
      expect(question.correct).toBeGreaterThanOrEqual(0)
      expect(question.correct).toBeLessThan(question.options.length)
      expect(question.explanation.trim().length).toBeGreaterThan(10)
      expect(['easy', 'medium', 'applied']).toContain(question.difficulty)
      expect(question.family.trim().length).toBeGreaterThan(3)
    }
  })

  it('contains the reviewed difficulty inventory', () => {
    expect(fullQuestions.filter((question) => question.difficulty === 'easy')).toHaveLength(22)
    expect(fullQuestions.filter((question) => question.difficulty === 'medium')).toHaveLength(22)
    expect(fullQuestions.filter((question) => question.difficulty === 'applied')).toHaveLength(6)
  })
})

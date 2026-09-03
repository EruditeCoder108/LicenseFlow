import { describe, expect, it } from 'vitest'
import { buildQuestionPaper, isValidQuestionPaper, paperFingerprint, PAPER_DIFFICULTY_QUOTAS } from './questionPaper'

describe('balanced seeded question papers', () => {
  it('creates the same valid paper for the same seed', () => {
    const first = buildQuestionPaper('MP-LL-DEMO:1')
    const second = buildQuestionPaper('MP-LL-DEMO:1')
    expect(second.map((question) => question.id)).toEqual(first.map((question) => question.id))
    expect(isValidQuestionPaper(first.map((question) => question.id))).toBe(true)
  })

  it('keeps the exact difficulty mix across many attempts', () => {
    for (let attempt = 1; attempt <= 100; attempt += 1) {
      const paper = buildQuestionPaper(`application:${attempt}`)
      expect(paper).toHaveLength(15)
      for (const [difficulty, count] of Object.entries(PAPER_DIFFICULTY_QUOTAS)) {
        expect(paper.filter((question) => question.difficulty === difficulty)).toHaveLength(count)
      }
    }
  })

  it('reorders the public judge fixtures without changing difficulty', () => {
    const first = buildQuestionPaper('application:1')
    const second = buildQuestionPaper('application:2', first.map((question) => question.id))
    // Full-bank retest family exclusion is tested against the private server
    // sampler in server/exam/api.test.ts. The judge tour is a small sample set.
    expect(second.map((question) => question.id).sort()).toEqual(first.map((question) => question.id).sort())
    expect(isValidQuestionPaper(second.map((question) => question.id))).toBe(true)
    expect(second.map((question) => question.id)).not.toEqual(first.map((question) => question.id))
    // This fingerprint describes the question set, which is fixed in the tour.
    expect(paperFingerprint(second.map((question) => question.id))).toBe(paperFingerprint(first.map((question) => question.id)))
  })
})

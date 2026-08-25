import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QuestionStatusMap } from './FocusedAssessmentShell'
import { getRouteAccess, deriveJourneyState } from './journeyState'
import { parsePortalRoute } from './router'
import { createPreparedDraft } from './application'
import { createJourneyProgress } from './progress'
import { createExamSession } from './examSession'
import { journeyReducer } from '../domain/journey'

describe('Focused Test Experience - QuestionStatusMap', () => {
  it('renders 15 question cells with accessible states during active exam without revealing correctness', () => {
    const html = renderToStaticMarkup(
      <QuestionStatusMap
        total={15}
        mode="exam"
        currentIndex={2} // Question 3 is current
        answers={{ 0: 1, 1: 0 }} // Questions 1 and 2 answered
        language="en"
      />
    )

    // Question 1: Answered and locked
    expect(html).toContain('aria-label="Question 1, answered and locked"')
    expect(html).toContain('focused-status-cell--answered')

    // Question 2: Answered and locked
    expect(html).toContain('aria-label="Question 2, answered and locked"')

    // Question 3: Current
    expect(html).toContain('aria-label="Question 3, current"')
    expect(html).toContain('focused-status-cell--current')

    // Question 4: Remaining
    expect(html).toContain('aria-label="Question 4, remaining"')
    expect(html).toContain('focused-status-cell--remaining')

    // Confirm no correctness classes exist in active exam mode
    expect(html).not.toContain('focused-status-cell--correct')
    expect(html).not.toContain('focused-status-cell--incorrect')
  })

  it('renders Hindi accessible labels during active exam', () => {
    const html = renderToStaticMarkup(
      <QuestionStatusMap
        total={15}
        mode="exam"
        currentIndex={0}
        answers={{}}
        language="hi"
      />
    )

    expect(html).toContain('aria-label="प्रश्न 1, वर्तमान प्रश्न"')
    expect(html).toContain('aria-label="प्रश्न 2, शेष प्रश्न"')
  })

  it('renders correctness states and interactive buttons in review mode', () => {
    const html = renderToStaticMarkup(
      <QuestionStatusMap
        total={5}
        mode="review"
        answers={{ 0: 2, 1: 0, 2: -1, 3: 1, 4: 3 }}
        correctAnswers={{ 0: 2, 1: 1, 2: 0, 3: 1, 4: 2 }}
        activeIndex={1}
        onSelectQuestion={() => {}}
        language="en"
      />
    )

    // Q1: Correct (2 == 2)
    expect(html).toContain('aria-label="Question 1, correct answer"')
    expect(html).toContain('focused-status-cell--correct')

    // Q2: Incorrect (0 != 1)
    expect(html).toContain('aria-label="Question 2, incorrect answer"')
    expect(html).toContain('focused-status-cell--incorrect')
    expect(html).toContain('focused-status-cell--active')

    // Q3: Unanswered (-1)
    expect(html).toContain('aria-label="Question 3, unanswered"')
    expect(html).toContain('focused-status-cell--unanswered')
  })
})

describe('Route Access Protection for Result and Review', () => {
  it('blocks result-review route when exam is not yet completed', () => {
    const progress = createJourneyProgress('MP-LL-2026-TEST')
    const examSession = createExamSession('MP-LL-2026-TEST', progress)
    const derived = deriveJourneyState({
      applicationId: 'MP-LL-2026-TEST',
      draft: null,
      progress,
      examSession,
    })

    const route = parsePortalRoute('/mp/application/MP-LL-2026-TEST/result/review')
    const access = getRouteAccess({ route, journey: derived })

    expect(access.allowed).toBe(false)
    expect(access.redirectHref).toBe(derived.resumeHref)
  })

  it('allows result and result-review routes once exam stage is result', () => {
    const progress = createJourneyProgress('MP-LL-2026-TEST')
    progress.readiness.status = 'passed'
    progress.rehearsal.status = 'completed'
    progress.payment.status = 'confirmed'
    progress.tutorial.status = 'completed'

    let examSession = createExamSession('MP-LL-2026-TEST', progress)
    examSession = journeyReducer(examSession, { type: 'START_EXAM' })
    // Simulate finishing all questions
    examSession = {
      ...examSession,
      stage: 'result',
      exam: {
        ...examSession.exam,
        status: 'completed',
        knowledgeResult: 'passed',
        correctAnswers: 12,
      },
    }

    const derived = deriveJourneyState({
      applicationId: 'MP-LL-2026-TEST',
      draft: { ...createPreparedDraft(), applicationId: 'MP-LL-2026-TEST' },
      progress,
      examSession,
    })

    const resultRoute = parsePortalRoute('/mp/application/MP-LL-2026-TEST/result')
    const reviewRoute = parsePortalRoute('/mp/application/MP-LL-2026-TEST/result/review')

    expect(getRouteAccess({ route: resultRoute, journey: derived }).allowed).toBe(true)
    expect(getRouteAccess({ route: reviewRoute, journey: derived }).allowed).toBe(true)
  })
})

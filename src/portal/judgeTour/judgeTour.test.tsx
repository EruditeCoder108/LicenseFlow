import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { JUDGE_TOUR_PHASES, JUDGE_TOUR_STEPS, RAAHI_ASSETS } from './tourSteps'
import { JudgeTourHeroCard, JudgeTourFloatingPill } from './JudgeTourPrompt'
import { JudgeTourCoachmark } from './JudgeTourCoachmark'

describe('JudgeTour Step Definitions & Assets', () => {
  it('covers the complete six-phase citizen journey without route jumps', () => {
    expect(JUDGE_TOUR_STEPS.length).toBeGreaterThan(40)
    expect(new Set(JUDGE_TOUR_STEPS.map((tourStep) => tourStep.phase))).toEqual(
      new Set(JUDGE_TOUR_PHASES.map((phase) => phase.id)),
    )

    const stepIds = JUDGE_TOUR_STEPS.map((tourStep) => tourStep.id)
    expect(stepIds).toContain('application-showcase-identity')
    expect(stepIds).toContain('uploads-overview')
    expect(stepIds).toContain('rehearsal-overview')
    expect(stepIds).toContain('gateway-overview')
    expect(stepIds).toContain('tutorial-overview')
    expect(stepIds).toContain('test-overview')
    expect(stepIds).toContain('result-review-overview')

    JUDGE_TOUR_STEPS.forEach((step, idx) => {
      expect(step.stepNumber).toBe(idx + 1)
      expect(step.title.en).toBeTruthy()
      expect(step.title.hi).toBeTruthy()
      expect(step.dialogue.en).toBeTruthy()
      expect(step.dialogue.hi).toBeTruthy()
      expect(step.actionLabel.en).toBeTruthy()
      expect(step.actionLabel.hi).toBeTruthy()
      expect(['advance', 'click', 'smart-start', 'autoplay-forms', 'finish']).toContain(step.action)
      expect(['top', 'target']).toContain(step.scrollMode)
      expect(RAAHI_ASSETS[step.pose]).toBeDefined()
    })
  })

  it('uses quick fill only to remove typing, while retaining each application screen', () => {
    const applicationRoutes = JUDGE_TOUR_STEPS
      .filter((tourStep) => tourStep.id.startsWith('application-showcase-'))
      .map((tourStep) => tourStep.routePattern)
    expect(applicationRoutes).toEqual([
      '/mp/ll/application/category',
      '/mp/ll/application/identity',
      '/mp/ll/application/personal',
      '/mp/ll/application/address',
      '/mp/ll/application/vehicles',
      '/mp/ll/application/fitness',
      '/mp/ll/application/review',
    ])
    expect(JUDGE_TOUR_STEPS.find((tourStep) => tourStep.id === 'application-category-overview')?.action).toBe('autoplay-forms')
  })
})

describe('JudgeTour UI Components Rendering', () => {
  const mockTour = {
    isActive: true,
    stepIndex: 0,
    isDismissed: false,
    isFormShowcasePlaying: false,
    isUserExploring: false,
    currentStep: JUDGE_TOUR_STEPS[0] as typeof JUDGE_TOUR_STEPS[number],
    totalSteps: JUDGE_TOUR_STEPS.length,
    targetRect: { top: 100, left: 100, width: 200, height: 50, bottom: 150, right: 300 },
    targetFound: true,
    shouldShowReplayPill: true,
    shouldShowHeroPrompt: true,
    startTour: () => {},
    dismissPrompt: () => {},
    skipTour: () => {},
    replayTour: () => {},
    nextStep: () => {},
    prevStep: () => {},
    performStepAction: () => {},
  }

  it('renders JudgeTourHeroCard with welcome avatar and action buttons', () => {
    const htmlEn = renderToStaticMarkup(
      <JudgeTourHeroCard tour={mockTour} language="en" />
    )
    expect(htmlEn).toContain('Meet Raahi — Full Guided Walkthrough')
    expect(htmlEn).toContain('Take the full guided walkthrough')
    expect(htmlEn).toContain('Explore myself')
    expect(htmlEn).toContain('/assets/raahi/raahi-welcome.webp')

    const htmlHi = renderToStaticMarkup(
      <JudgeTourHeroCard tour={mockTour} language="hi" />
    )
    expect(htmlHi).toContain('राही से मिलें — पूर्ण निर्देशित वॉकथ्रू')
    expect(htmlHi).toContain('पूर्ण निर्देशित वॉकथ्रू लें')
    expect(htmlHi).toContain('स्वयं देखें')
  })

  it('renders JudgeTourFloatingPill with confident avatar', () => {
    const html = renderToStaticMarkup(
      <JudgeTourFloatingPill tour={mockTour} language="en" />
    )
    expect(html).toContain('Full Judge Walkthrough')
    expect(html).toContain('Every screen · 2–3 min')
    expect(html).toContain('/assets/raahi/raahi-confident.webp')
  })

  it('renders JudgeTourCoachmark with active step dialogue and action button', () => {
    const html = renderToStaticMarkup(
      <JudgeTourCoachmark tour={mockTour} language="en" />
    )
    expect(html).toContain(`Raahi · 1 of ${JUDGE_TOUR_STEPS.length}`)
    expect(html).toContain('Meet LicenceFlow')
    expect(html).toContain('guide you through the complete demo')
    expect(html).toContain('Show the first service')
    expect(html).toContain('judge-tour-spotlight')
  })
})

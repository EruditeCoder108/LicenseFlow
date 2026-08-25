import { useMemo, type CSSProperties } from 'react'
import { ArrowRight, Check, LoaderCircle, Sparkles, X } from 'lucide-react'
import type { Language } from './types'
import { JUDGE_TOUR_PHASES, RAAHI_ASSETS } from './tourSteps'
import { useJudgeTour } from './useJudgeTour'

interface JudgeTourCoachmarkProps {
  tour: ReturnType<typeof useJudgeTour>
  language: Language
}

export function JudgeTourCoachmark({ tour, language }: JudgeTourCoachmarkProps) {
  const {
    isActive,
    stepIndex,
    currentStep,
    totalSteps,
    targetRect,
    targetFound,
    isFormShowcasePlaying,
    isUserExploring,
    skipTour,
    performStepAction,
  } = tour

  const asset = RAAHI_ASSETS[currentStep.pose] ?? RAAHI_ASSETS.welcome
  const currentPhaseIndex = JUDGE_TOUR_PHASES.findIndex((phase) => phase.id === currentStep.phase)

  const dockSide = useMemo(() => {
    if (!targetRect || typeof window === 'undefined') return 'right'
    const targetCenter = targetRect.left + targetRect.width / 2
    return targetCenter > window.innerWidth / 2 ? 'left' : 'right'
  }, [targetRect])

  // Compute spotlight cutout style
  const spotlightStyle = useMemo<CSSProperties>(() => {
    if (!targetRect) return { display: 'none' }

    const pad = 8
    return {
      top: `${Math.max(0, targetRect.top - pad)}px`,
      left: `${Math.max(0, targetRect.left - pad)}px`,
      width: `${targetRect.width + pad * 2}px`,
      height: `${targetRect.height + pad * 2}px`,
    }
  }, [targetRect])

  if (!isActive) return null

  const isLastStep = stepIndex === totalSteps - 1

  return (
    <aside
      className={`judge-tour-root ${isUserExploring ? 'judge-tour-root--exploring' : ''}`}
      aria-label={language === 'en' ? 'Full Judge Walkthrough' : 'पूर्ण जज वॉकथ्रू'}
      aria-hidden={isUserExploring || undefined}
      inert={isUserExploring || undefined}
    >
      {/* A quiet visual veil. It never captures clicks or scrolling. */}
      <div className="judge-tour-scrim" aria-hidden="true" />

      {targetFound && (
        <div
          className="judge-tour-spotlight"
          style={spotlightStyle}
          aria-hidden="true"
        />
      )}

      {/* Screen Reader Live Region */}
      <div className="visually-hidden" aria-live="polite">
        {language === 'en'
          ? `Guide Step ${stepIndex + 1} of ${totalSteps}: ${currentStep.title.en}. ${currentStep.dialogue.en}`
          : `मार्गदर्शिका चरण ${stepIndex + 1} / ${totalSteps}: ${currentStep.title.hi}। ${currentStep.dialogue.hi}`}
      </div>

      <section
        className={`judge-tour-card judge-tour-card--dock-${dockSide} judge-tour-card--mobile-${currentStep.scrollMode === 'top' ? 'bottom' : 'top'} ${targetFound ? '' : 'judge-tour-card--fallback'}`}
        role="region"
        aria-labelledby="raahi-card-title"
        aria-busy={isFormShowcasePlaying}
      >
        <div className="judge-tour-card__character" aria-hidden="true">
          <img
            src={asset.src}
            alt=""
            width={asset.width}
            height={asset.height}
            loading={currentStep.pose === 'welcome' ? 'eager' : 'lazy'}
            decoding="async"
            className="raahi-avatar-img"
          />
        </div>

        <div className="judge-tour-card__panel">
          <div className="judge-tour-card__header">
            <div className="judge-tour-card__tag">
              <Sparkles size={14} aria-hidden="true" />
              <span>
                {language === 'en'
                  ? `Raahi · ${stepIndex + 1} of ${totalSteps}`
                  : `राही · ${stepIndex + 1} / ${totalSteps}`}
              </span>
            </div>
            <ol className="judge-tour-card__progress" aria-label={language === 'en' ? 'Walkthrough phases' : 'वॉकथ्रू चरण'}>
              {JUDGE_TOUR_PHASES.map((phase, index) => (
                <li key={phase.id} className={index === currentPhaseIndex ? 'is-current' : index < currentPhaseIndex ? 'is-complete' : ''}>
                  <span>{language === 'en' ? phase.en : phase.hi}</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="judge-tour-card__close-btn"
              onClick={skipTour}
              aria-label={language === 'en' ? 'Close tour (Escape)' : 'टूर बंद करें (Escape)'}
              title={language === 'en' ? 'Close tour (Escape)' : 'टूर बंद करें (Escape)'}
            >
              <X size={18} />
            </button>
          </div>

          <div className="judge-tour-card__speech" key={currentStep.id}>
            <strong id="raahi-card-title" className="judge-tour-card__title">
              {language === 'en' ? currentStep.title.en : currentStep.title.hi}
            </strong>
            <p className="judge-tour-card__dialogue">
              {language === 'en' ? currentStep.dialogue.en : currentStep.dialogue.hi}
            </p>
            {!targetFound && (
              <small className="judge-tour-card__notice">
                {language === 'en' ? currentStep.fallbackNotice.en : currentStep.fallbackNotice.hi}
              </small>
            )}
          </div>
          <div className="judge-tour-card__actions">
            <button
              type="button"
              className="judge-tour-link-btn"
              onClick={skipTour}
            >
              {language === 'en' ? 'Skip' : 'छोड़ें'}
            </button>
            <button
              type="button"
              className="button button--primary button--compact judge-tour-btn judge-tour-btn--action"
              onClick={performStepAction}
              disabled={isFormShowcasePlaying}
            >
              <span>{language === 'en' ? currentStep.actionLabel.en : currentStep.actionLabel.hi}</span>
              {isFormShowcasePlaying ? <LoaderCircle className="judge-tour-btn__spinner" size={16} /> : isLastStep ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </section>
    </aside>
  )
}

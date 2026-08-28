import { useMemo, type CSSProperties } from 'react'
import { ArrowRight, Check, LoaderCircle, Sparkles, X } from 'lucide-react'
import type { Language } from './types'
import { JUDGE_TOUR_PHASES, RAAHI_ASSETS } from './tourSteps'
import { useJudgeTour } from './useJudgeTour'
import { translate as copy, translatedText } from '../i18n'

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
      aria-label={copy(language, 'Full Judge Walkthrough', 'पूर्ण जज वॉकथ्रू')}
      aria-hidden={isUserExploring || undefined}
      inert={isUserExploring || undefined}
    >
      <div className="judge-tour-scrim" aria-hidden="true" />

      {targetFound && (
        <div
          className="judge-tour-spotlight"
          style={spotlightStyle}
          aria-hidden="true"
        />
      )}

      <div className="visually-hidden" aria-live="polite">
        {copy(language, 'Guide step', 'मार्गदर्शिका चरण')} {stepIndex + 1} / {totalSteps}: {translatedText(language, currentStep.title)}. {translatedText(language, currentStep.dialogue)}
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
            srcSet={`${asset.smallSrc} 240w, ${asset.src} 400w`}
            sizes="(max-width: 760px) 88px, 120px"
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
                Raahi · {stepIndex + 1} {copy(language, 'of', '/')} {totalSteps}
              </span>
            </div>
            <ol className="judge-tour-card__progress" aria-label={copy(language, 'Walkthrough phases', 'वॉकथ्रू चरण')}>
              {JUDGE_TOUR_PHASES.map((phase, index) => (
                <li key={phase.id} className={index === currentPhaseIndex ? 'is-current' : index < currentPhaseIndex ? 'is-complete' : ''}>
                  <span>{translatedText(language, phase)}</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="judge-tour-card__close-btn"
              onClick={skipTour}
              aria-label={copy(language, 'Close tour (Escape)', 'टूर बंद करें (Escape)')}
              title={copy(language, 'Close tour (Escape)', 'टूर बंद करें (Escape)')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="judge-tour-card__speech" key={currentStep.id}>
            <strong id="raahi-card-title" className="judge-tour-card__title">
              {translatedText(language, currentStep.title)}
            </strong>
            <p className="judge-tour-card__dialogue">
              {translatedText(language, currentStep.dialogue)}
            </p>
            {!targetFound && (
              <small className="judge-tour-card__notice">
                {translatedText(language, currentStep.fallbackNotice)}
              </small>
            )}
          </div>
          <div className="judge-tour-card__actions">
            <button
              type="button"
              className="judge-tour-link-btn"
              onClick={skipTour}
            >
              {copy(language, 'Skip', 'छोड़ें')}
            </button>
            <button
              type="button"
              className="button button--primary button--compact judge-tour-btn judge-tour-btn--action"
              onClick={performStepAction}
              disabled={isFormShowcasePlaying}
            >
              <span>{translatedText(language, currentStep.actionLabel)}</span>
              {isFormShowcasePlaying ? <LoaderCircle className="judge-tour-btn__spinner" size={16} /> : isLastStep ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </section>
    </aside>
  )
}

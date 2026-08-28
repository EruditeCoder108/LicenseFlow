import { ArrowRight, Sparkles, X } from 'lucide-react'
import type { Language } from './types'
import { useJudgeTour } from './useJudgeTour'
import { RAAHI_ASSETS } from './tourSteps'
import { translate as copy } from '../i18n'

interface JudgeTourPromptProps {
  tour: ReturnType<typeof useJudgeTour>
  language: Language
}

export function JudgeTourFloatingPill({ tour, language }: JudgeTourPromptProps) {
  const { shouldShowReplayPill, replayTour, isResumable } = tour

  if (!shouldShowReplayPill) return null

  return (
    <aside className="judge-tour-floating-dock" aria-label={copy(language, 'Judge Onboarding Guide', 'जज गाइड')}>
      <button
        type="button"
        className="judge-tour-pill-btn"
        onClick={replayTour}
        aria-label={isResumable ? copy(language, 'Resume the Judge Walkthrough with Raahi', 'राही के साथ जज वॉकथ्रू जारी रखें') : copy(language, 'Start the full Judge Walkthrough with Raahi', 'राही के साथ पूर्ण जज वॉकथ्रू शुरू करें')}
      >
        <span className="judge-tour-pill__avatar" aria-hidden="true">
          <img
            src={RAAHI_ASSETS.confident.src}
            srcSet={`${RAAHI_ASSETS.confident.smallSrc} 240w, ${RAAHI_ASSETS.confident.src} 400w`}
            sizes="48px"
            alt=""
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
          />
        </span>
        <span className="judge-tour-pill__label">
          <strong>{isResumable ? copy(language, 'Resume Judge Walkthrough', 'जज वॉकथ्रू जारी रखें') : copy(language, 'Full Judge Walkthrough', 'पूर्ण जज वॉकथ्रू')}</strong>
        </span>
      </button>
    </aside>
  )
}

export function JudgeTourHeroCard({ tour, language }: JudgeTourPromptProps) {
  const { shouldShowHeroPrompt, startTour, dismissPrompt } = tour

  if (!shouldShowHeroPrompt) return null

  return (
    <section
      className="judge-onboarding-hero-card"
      aria-labelledby="judge-onboarding-title"
    >
      <div className="judge-onboarding-hero-card__character" aria-hidden="true">
        <img
          src={RAAHI_ASSETS.welcome.src}
          srcSet={`${RAAHI_ASSETS.welcome.smallSrc} 240w, /assets/raahi/raahi-welcome-320.webp 320w, ${RAAHI_ASSETS.welcome.src} 400w`}
          sizes="110px"
          alt=""
          width={110}
          height={147}
          fetchPriority="high"
          decoding="async"
          className="judge-onboarding-hero-img"
        />
      </div>
      <div className="judge-onboarding-hero-card__content">
        <div className="judge-onboarding-hero-card__tag">
          <Sparkles size={14} aria-hidden="true" />
          <span>{copy(language, 'Judge walkthrough', 'जज वॉकथ्रू')}</span>
        </div>
        <h2 id="judge-onboarding-title">
          {copy(language, 'Meet Raahi — Full Guided Walkthrough', 'राही से मिलें — पूर्ण निर्देशित वॉकथ्रू')}
        </h2>
        <p>
          {copy(language, 'See every application screen, demo interaction, readiness check, payment handoff, tutorial, test and result in about 2–3 minutes.', 'लगभग 2–3 मिनट में हर आवेदन स्क्रीन, डेमो क्रिया, डिवाइस जाँच, भुगतान, ट्यूटोरियल, टेस्ट और परिणाम देखें।')}
        </p>
        <div className="judge-onboarding-hero-card__actions">
          <button
            type="button"
            className="button button--primary judge-onboarding-cta"
            onClick={startTour}
          >
            <span>{copy(language, 'Take the full guided walkthrough', 'पूर्ण निर्देशित वॉकथ्रू लें')}</span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="button button--secondary judge-onboarding-dismiss"
            onClick={dismissPrompt}
          >
            <span>{copy(language, 'Explore myself', 'स्वयं देखें')}</span>
          </button>
        </div>
      </div>
      <button
        type="button"
        className="judge-onboarding-close-btn"
        onClick={dismissPrompt}
        aria-label={copy(language, 'Dismiss onboarding prompt', 'प्रॉम्प्ट हटाएँ')}
        title={copy(language, 'Dismiss onboarding prompt', 'प्रॉम्प्ट हटाएँ')}
      >
        <X size={18} />
      </button>
    </section>
  )
}

export function JudgeTourPrompt({ tour, language }: JudgeTourPromptProps) {
  return (
    <>
      <JudgeTourFloatingPill tour={tour} language={language} />
      <JudgeTourHeroCard tour={tour} language={language} />
    </>
  )
}

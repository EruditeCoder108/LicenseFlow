import { ArrowRight, Play, Sparkles, X } from 'lucide-react'
import type { Language } from './types'
import { useJudgeTour } from './useJudgeTour'
import { RAAHI_ASSETS } from './tourSteps'

interface JudgeTourPromptProps {
  tour: ReturnType<typeof useJudgeTour>
  language: Language
}

export function JudgeTourFloatingPill({ tour, language }: JudgeTourPromptProps) {
  const { shouldShowReplayPill, replayTour, isResumable } = tour

  if (!shouldShowReplayPill) return null

  return (
    <aside className="judge-tour-floating-dock" aria-label={language === 'en' ? 'Judge Onboarding Guide' : 'जज गाइड'}>
      <button
        type="button"
        className="judge-tour-pill-btn"
        onClick={replayTour}
        aria-label={language === 'en'
          ? isResumable ? 'Resume the Judge Walkthrough with Raahi' : 'Start the full Judge Walkthrough with Raahi'
          : isResumable ? 'राही के साथ जज वॉकथ्रू जारी रखें' : 'राही के साथ पूर्ण जज वॉकथ्रू शुरू करें'}
      >
        <span className="judge-tour-pill__avatar" aria-hidden="true">
          <img
            src={RAAHI_ASSETS.confident.src}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
          />
        </span>
        <span className="judge-tour-pill__label">
          <strong>{language === 'en'
            ? isResumable ? 'Resume Judge Walkthrough' : 'Full Judge Walkthrough'
            : isResumable ? 'जज वॉकथ्रू जारी रखें' : 'पूर्ण जज वॉकथ्रू'}</strong>
        </span>
      </button>
    </aside>
  )
}

export function JudgeTourHeroCard({ tour, language }: JudgeTourPromptProps) {
  const { shouldShowHeroPrompt, startTour, startCinematicTour, dismissPrompt } = tour

  if (!shouldShowHeroPrompt) return null

  return (
    <section
      className="judge-onboarding-hero-card"
      aria-labelledby="judge-onboarding-title"
    >
      <div className="judge-onboarding-hero-card__character" aria-hidden="true">
        <img
          src={RAAHI_ASSETS.welcome.src}
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
          <span>{language === 'en' ? 'Judge walkthrough' : 'जज वॉकथ्रू'}</span>
        </div>
        <h2 id="judge-onboarding-title">
          {language === 'en'
            ? 'Meet Raahi — Your guide through LicenceFlow'
            : 'राही से मिलें — LicenceFlow में आपका मार्गदर्शक'}
        </h2>
        <p>
          {language === 'en'
            ? 'Watch Raahi complete the entire journey automatically in about 45 seconds, or take the detailed walkthrough at your own pace.'
            : 'राही को लगभग 45 सेकंड में पूरी यात्रा अपने-आप पूरी करते देखें, या विस्तृत वॉकथ्रू अपनी गति से लें।'}
        </p>
        <div className="judge-onboarding-hero-card__actions">
          <button
            type="button"
            className="button button--primary judge-onboarding-cta"
            onClick={startCinematicTour}
          >
            <Play size={16} fill="currentColor" aria-hidden="true" />
            <span>{language === 'en' ? 'Play automatic tour' : 'स्वचालित टूर चलाएँ'}</span>
          </button>
          <button
            type="button"
            className="button button--secondary judge-onboarding-detailed"
            onClick={startTour}
          >
            <span>{language === 'en' ? 'Take the detailed tour' : 'विस्तृत टूर लें'}</span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="button button--secondary judge-onboarding-dismiss"
            onClick={dismissPrompt}
          >
            <span>{language === 'en' ? 'Explore myself' : 'स्वयं देखें'}</span>
          </button>
        </div>
      </div>
      <button
        type="button"
        className="judge-onboarding-close-btn"
        onClick={dismissPrompt}
        aria-label={language === 'en' ? 'Dismiss onboarding prompt' : 'प्रॉम्प्ट हटाएँ'}
        title={language === 'en' ? 'Dismiss onboarding prompt' : 'प्रॉम्प्ट हटाएँ'}
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

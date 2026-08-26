import { useMemo, type CSSProperties } from 'react'
import { ArrowRight, Check, LoaderCircle, Sparkles, X } from 'lucide-react'
import type { JudgeTourPhase, Language, RaahiPose } from './types'
import { JUDGE_TOUR_PHASES, RAAHI_ASSETS } from './tourSteps'
import { useJudgeTour } from './useJudgeTour'

interface JudgeTourCoachmarkProps {
  tour: ReturnType<typeof useJudgeTour>
  language: Language
}

const CINEMATIC_PHASE_COPY: Record<JudgeTourPhase, {
  title: { en: string; hi: string }
  dialogue: { en: string; hi: string }
  pose: RaahiPose
}> = {
  discover: {
    title: { en: 'One clear place to begin', hi: 'शुरू करने के लिए एक स्पष्ट जगह' },
    dialogue: { en: 'From transport services to the right Learner’s Licence path—without hunting through the portal.', hi: 'परिवहन सेवाओं से सही लर्नर लाइसेंस मार्ग तक—पोर्टल में भटके बिना।' },
    pose: 'welcome',
  },
  apply: {
    title: { en: 'Seven steps. One continuous application.', hi: 'सात चरण। एक निरंतर आवेदन।' },
    dialogue: { en: 'Raahi fills the synthetic application, reveals every section, and keeps the journey moving.', hi: 'राही सिंथेटिक आवेदन भरता है, हर भाग दिखाता है और यात्रा आगे बढ़ाता है।' },
    pose: 'working',
  },
  verify: {
    title: { en: 'Check the device before the attempt', hi: 'प्रयास से पहले डिवाइस की जाँच' },
    dialogue: { en: 'Readiness and a practice question catch technical problems before they can cost an applicant.', hi: 'डिवाइस जाँच और अभ्यास प्रश्न तकनीकी समस्या को प्रयास से पहले पकड़ते हैं।' },
    pose: 'thinking',
  },
  pay: {
    title: { en: 'Transparent from fee to confirmation', hi: 'शुल्क से पुष्टि तक पारदर्शी' },
    dialogue: { en: 'The amount stays visible, the payment is clearly simulated, and duplicate charging is blocked.', hi: 'राशि दिखाई देती है, भुगतान स्पष्ट रूप से डेमो है और दोहरा शुल्क रोका जाता है।' },
    pose: 'pointing',
  },
  'learn-test': {
    title: { en: 'Learn first. Test with focus.', hi: 'पहले सीखें। फिर ध्यान से टेस्ट दें।' },
    dialogue: { en: 'Saved learning, device-aware recovery and a calm test interface protect a fair attempt.', hi: 'सहेजी गई सीख, रिकवरी और शांत टेस्ट इंटरफ़ेस निष्पक्ष प्रयास की रक्षा करते हैं।' },
    pose: 'confident',
  },
  result: {
    title: { en: 'A result that explains itself', hi: 'ऐसा परिणाम जो खुद समझाए' },
    dialogue: { en: 'Score, integrity notes and answer explanations turn the result into something useful.', hi: 'स्कोर, इंटीग्रिटी नोट्स और उत्तरों की व्याख्या परिणाम को उपयोगी बनाते हैं।' },
    pose: 'celebrate',
  },
}

const CINEMATIC_STEP_COPY: Partial<Record<string, (typeof CINEMATIC_PHASE_COPY)[JudgeTourPhase]>> = {
  'readiness-overview': {
    title: { en: 'Check before charging', hi: 'भुगतान से पहले जाँच' },
    dialogue: { en: 'Find camera, microphone or connection problems before an applicant risks an attempt or a rupee.', hi: 'आवेदक के प्रयास या रुपये के जोखिम से पहले कैमरा, माइक्रोफ़ोन या कनेक्शन समस्या पकड़ें।' },
    pose: 'thinking',
  },
  'payment-overview': {
    title: { en: 'Payment is never a black box', hi: 'भुगतान कभी रहस्य नहीं' },
    dialogue: { en: 'The applicant can see the amount, current state and safe next action—without risking a duplicate charge.', hi: 'आवेदक राशि, वर्तमान स्थिति और सुरक्षित अगला कदम देख सकता है—दोहरा शुल्क दिए बिना।' },
    pose: 'pointing',
  },
  'interruption-overview': {
    title: { en: 'Technical failure is not citizen failure', hi: 'तकनीकी विफलता नागरिक की विफलता नहीं' },
    dialogue: { en: 'The test pauses safely. The answer, application and payment remain protected.', hi: 'टेस्ट सुरक्षित रूप से रुकता है। उत्तर, आवेदन और भुगतान सुरक्षित रहते हैं।' },
    pose: 'thinking',
  },
  'test-resumed-overview': {
    title: { en: 'Resume, don’t restart', hi: 'फिर शुरू नहीं—वहीं से जारी' },
    dialogue: { en: 'Raahi returns to the exact next question, with the earlier answer still checkpointed.', hi: 'राही ठीक अगले प्रश्न पर लौटता है और पिछला उत्तर सुरक्षित रहता है।' },
    pose: 'confident',
  },
  'result-overview': {
    title: { en: 'A result that explains itself', hi: 'ऐसा परिणाम जो खुद समझाए' },
    dialogue: { en: 'What happened? What does it mean? What should I do next? The journey ends with all three answers.', hi: 'क्या हुआ? इसका क्या मतलब है? अब क्या करना है? यात्रा तीनों उत्तरों के साथ समाप्त होती है।' },
    pose: 'celebrate',
  },
}

const CINEMATIC_SPOTLIGHT_STEPS = new Set([
  'home-service-cards',
  'home-driving-services',
  'apply-ll-service',
  'application-category-overview',
  'application-showcase-personal',
  'application-showcase-vehicles',
  'application-showcase-review',
  'uploads-attach',
  'readiness-demo',
  'rehearsal-answer',
  'payment-consent',
  'gateway-complete',
  'tutorial-overview',
  'test-entry-start',
  'test-overview',
  'test-preview-recovery',
  'interruption-overview',
  'interruption-resume',
  'test-resumed-overview',
  'test-preview-result',
  'result-open-review',
  'result-review-overview',
])

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
    isCinematic,
    skipTour,
    performStepAction,
  } = tour

  const cinematicCopy = CINEMATIC_STEP_COPY[currentStep.id] ?? CINEMATIC_PHASE_COPY[currentStep.phase]
  const asset = RAAHI_ASSETS[isCinematic ? cinematicCopy.pose : currentStep.pose] ?? RAAHI_ASSETS.welcome
  const currentPhaseIndex = JUDGE_TOUR_PHASES.findIndex((phase) => phase.id === currentStep.phase)

  const dockSide = useMemo(() => {
    if (isCinematic) return 'right'
    if (!targetRect || typeof window === 'undefined') return 'right'
    const targetCenter = targetRect.left + targetRect.width / 2
    return targetCenter > window.innerWidth / 2 ? 'left' : 'right'
  }, [isCinematic, targetRect])

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
  const showSpotlight = targetFound && (!isCinematic || CINEMATIC_SPOTLIGHT_STEPS.has(currentStep.id))
  const displayTitle = language === 'en'
    ? isCinematic ? cinematicCopy.title.en : currentStep.title.en
    : isCinematic ? cinematicCopy.title.hi : currentStep.title.hi
  const displayDialogue = language === 'en'
    ? isCinematic ? cinematicCopy.dialogue.en : currentStep.dialogue.en
    : isCinematic ? cinematicCopy.dialogue.hi : currentStep.dialogue.hi
  const cinematicProgress = `${Math.max(4, Math.round(((stepIndex + 1) / totalSteps) * 100))}%`

  return (
    <aside
      className={`judge-tour-root ${isCinematic ? 'judge-tour-root--cinematic' : ''} ${isUserExploring ? 'judge-tour-root--exploring' : ''}`}
      aria-label={language === 'en' ? 'Full Judge Walkthrough' : 'पूर्ण जज वॉकथ्रू'}
      aria-hidden={isUserExploring || undefined}
      inert={isUserExploring || undefined}
    >
      {/* A quiet visual veil. It never captures clicks or scrolling. */}
      <div className="judge-tour-scrim" aria-hidden="true" />

      {showSpotlight && (
        <div
          className="judge-tour-spotlight"
          style={spotlightStyle}
          aria-hidden="true"
        />
      )}

      {/* Screen Reader Live Region */}
      <div className="visually-hidden" aria-live={isCinematic ? 'off' : 'polite'}>
        {isCinematic
          ? `${displayTitle}. ${displayDialogue}`
          : language === 'en'
            ? `Guide Step ${stepIndex + 1} of ${totalSteps}: ${currentStep.title.en}. ${currentStep.dialogue.en}`
            : `मार्गदर्शिका चरण ${stepIndex + 1} / ${totalSteps}: ${currentStep.title.hi}। ${currentStep.dialogue.hi}`}
      </div>

      <section
        className={`judge-tour-card ${isCinematic ? 'judge-tour-card--cinematic' : ''} judge-tour-card--dock-${dockSide} judge-tour-card--mobile-${currentStep.scrollMode === 'top' ? 'bottom' : 'top'} ${targetFound ? '' : 'judge-tour-card--fallback'}`}
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
                  ? isCinematic ? 'Raahi · Automatic journey' : `Raahi · ${stepIndex + 1} of ${totalSteps}`
                  : isCinematic ? 'राही · स्वचालित यात्रा' : `राही · ${stepIndex + 1} / ${totalSteps}`}
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

          <div className="judge-tour-card__speech" key={isCinematic ? currentStep.phase : currentStep.id}>
            <strong id="raahi-card-title" className="judge-tour-card__title">
              {displayTitle}
            </strong>
            <p className="judge-tour-card__dialogue">
              {displayDialogue}
            </p>
            {!targetFound && !isCinematic && (
              <small className="judge-tour-card__notice">
                {language === 'en' ? currentStep.fallbackNotice.en : currentStep.fallbackNotice.hi}
              </small>
            )}
          </div>
          {isCinematic ? (
            <div className="judge-tour-card__cinematic-status" aria-hidden="true">
              <span>{language === 'en' ? 'Raahi is completing the journey for you' : 'राही आपके लिए यात्रा पूरी कर रहा है'}</span>
              <div className="judge-tour-card__cinematic-track"><i style={{ width: cinematicProgress }} /></div>
            </div>
          ) : (
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
          )}
        </div>
      </section>
    </aside>
  )
}

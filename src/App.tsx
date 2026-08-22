import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  Circle,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  Database,
  EyeOff,
  FileCheck2,
  FileText,
  IndianRupee,
  Info,
  Languages,
  Lightbulb,
  LockKeyhole,
  Mic2,
  MonitorCheck,
  Network,
  RefreshCcw,
  RotateCw,
  ShieldCheck,
  Signal,
  Smartphone,
  SunMedium,
  TriangleAlert,
  UserRound,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { demoQuestions, fullQuestions, practiceQuestion, type Question } from './content/questions'
import {
  clearJourney,
  initialJourneyState,
  journeyReducer,
  loadJourney,
  saveJourney,
  type ApplicationData,
  type InterfaceLanguage,
  type InterruptionKind,
  type JourneyStage,
  type JourneyState,
} from './domain/journey'
import { useDeviceReadiness, type MediaBlockingReason } from './hooks/useDeviceReadiness'

type Chapter = 'apply' | 'prepare' | 'check' | 'pay' | 'test' | 'outcome'
type CheckTone = 'idle' | 'working' | 'pass' | 'attention'

const chapterOrder: Chapter[] = ['apply', 'prepare', 'check', 'pay', 'test', 'outcome']

const chapterLabels: Record<Chapter, string> = {
  apply: 'Apply',
  prepare: 'Prepare',
  check: 'Check device',
  pay: 'Demo payment',
  test: 'Take test',
  outcome: 'Outcome',
}

const stageChapter: Record<JourneyStage, Chapter> = {
  welcome: 'apply',
  application: 'apply',
  preparation: 'prepare',
  readiness: 'check',
  rehearsal: 'check',
  payment: 'pay',
  'exam-intro': 'test',
  exam: 'test',
  interruption: 'test',
  result: 'outcome',
}

const helpCopy: Record<
  Chapter,
  Record<InterfaceLanguage, { title: string; summary: string; bullets: string[] }>
> = {
  apply: {
    en: {
      title: 'Why is this information needed?',
      summary: 'The prototype uses fictional details to demonstrate the application structure without collecting real identity data.',
      bullets: ['Aadhaar and document routes are simulated.', 'Nothing is sent to Sarathi or UIDAI.', 'You can edit the fictional applicant.'],
    },
    hi: {
      title: 'यह जानकारी क्यों चाहिए?',
      summary: 'यह प्रोटोटाइप असली पहचान डेटा लिए बिना आवेदन की प्रक्रिया दिखाने के लिए काल्पनिक जानकारी उपयोग करता है।',
      bullets: ['आधार और दस्तावेज़ दोनों मार्ग केवल डेमो हैं।', 'कोई जानकारी सारथी या UIDAI को नहीं भेजी जाती।', 'आप काल्पनिक आवेदक की जानकारी बदल सकते हैं।'],
    },
  },
  prepare: {
    en: {
      title: 'What should I study?',
      summary: 'LicenceFlow groups preparation around signs, road safety, accident duties, and required documents.',
      bullets: ['Practice is not the official live test.', 'Explanations are available before the exam.', 'The exam assistant never reveals answers.'],
    },
    hi: {
      title: 'मुझे क्या पढ़ना चाहिए?',
      summary: 'LicenceFlow तैयारी को संकेत, सड़क सुरक्षा, दुर्घटना के कर्तव्य और आवश्यक दस्तावेज़ों में बाँटता है।',
      bullets: ['अभ्यास आधिकारिक लाइव परीक्षा नहीं है।', 'परीक्षा से पहले उत्तरों की व्याख्या मिलती है।', 'परीक्षा के दौरान सहायक सही उत्तर नहीं बताता।'],
    },
  },
  check: {
    en: {
      title: 'What happens to my camera?',
      summary: 'Camera and microphone signals are processed on this device for the readiness demonstration. LicenceFlow does not record them.',
      bullets: ['Face count, framing, light, and head movement are observations.', 'They do not prove identity or cheating.', 'You may use the clearly labelled guided scenario instead.'],
    },
    hi: {
      title: 'मेरे कैमरे के साथ क्या होता है?',
      summary: 'रेडिनेस डेमो के लिए कैमरा और माइक्रोफ़ोन संकेत इसी डिवाइस पर प्रोसेस होते हैं। LicenceFlow इन्हें रिकॉर्ड नहीं करता।',
      bullets: ['चेहरे की संख्या, फ्रेमिंग, रोशनी और सिर की गति केवल संकेत हैं।', 'ये पहचान या नकल का प्रमाण नहीं हैं।', 'आप स्पष्ट रूप से लेबल किया गया गाइडेड डेमो चुन सकते हैं।'],
    },
  },
  pay: {
    en: {
      title: 'Is this a real payment?',
      summary: 'No. The amount and receipt are synthetic and exist only to demonstrate that readiness comes before payment.',
      bullets: ['No UPI, card, bank, or treasury is connected.', 'The shown amount is not claimed as the current MP fee.', 'A technical stop never asks for another demo payment.'],
    },
    hi: {
      title: 'क्या यह असली भुगतान है?',
      summary: 'नहीं। राशि और रसीद केवल डेमो हैं ताकि दिखाया जा सके कि भुगतान से पहले डिवाइस जाँच होती है।',
      bullets: ['कोई UPI, कार्ड, बैंक या ट्रेज़री जुड़ी नहीं है।', 'दिखाई गई राशि को वर्तमान MP फीस नहीं कहा गया है।', 'तकनीकी रुकावट पर दोबारा डेमो भुगतान नहीं लिया जाता।'],
    },
  },
  test: {
    en: {
      title: 'Technical help only during the test',
      summary: 'I can explain camera, connection, saving, and recovery. I cannot reveal or suggest an answer to the current question.',
      bullets: ['Every chosen answer is saved before navigation.', 'A hidden page or lost camera may pause the test.', 'A technical pause is not a failed knowledge result.'],
    },
    hi: {
      title: 'परीक्षा में केवल तकनीकी सहायता',
      summary: 'मैं कैमरा, कनेक्शन, सेविंग और रिकवरी समझा सकता हूँ। वर्तमान प्रश्न का उत्तर नहीं बता सकता।',
      bullets: ['अगले प्रश्न से पहले उत्तर सेव होता है।', 'पेज छिपने या कैमरा रुकने पर परीक्षा रुक सकती है।', 'तकनीकी रुकावट ज्ञान परीक्षा में असफलता नहीं है।'],
    },
  },
  outcome: {
    en: {
      title: 'Why are there separate outcomes?',
      summary: 'Knowledge, technical events, and integrity observations answer different questions and should never be collapsed into one “fail.”',
      bullets: ['The licence shown is an invalid demonstration artifact.', 'Retest rules remain official configuration.', 'The Journey Receipt shows what was real and simulated.'],
    },
    hi: {
      title: 'अलग-अलग परिणाम क्यों हैं?',
      summary: 'ज्ञान, तकनीकी घटनाएँ और इंटीग्रिटी संकेत अलग बातें बताते हैं; इन्हें एक ही “फेल” में नहीं मिलाना चाहिए।',
      bullets: ['दिखाया गया लाइसेंस केवल अमान्य डेमो है।', 'रीटेस्ट नियम आधिकारिक कॉन्फ़िगरेशन पर निर्भर हैं।', 'Journey Receipt बताती है कि क्या असली था और क्या डेमो।'],
    },
  },
}

function ProductMark() {
  return (
    <div className="product-mark" aria-label="LicenceFlow">
      <span className="mark-icon" aria-hidden="true">
        <ShieldCheck size={21} strokeWidth={2.2} />
      </span>
      <span>LicenceFlow</span>
    </div>
  )
}

function AppHeader({
  state,
  onLanguage,
  onHelp,
  onReceipt,
  onReset,
}: {
  state: JourneyState
  onLanguage: () => void
  onHelp: () => void
  onReceipt: () => void
  onReset: () => void
}) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <ProductMark />
        <div className="header-actions">
          <span className="prototype-badge">Independent prototype</span>
          <button className="header-button" onClick={onLanguage} aria-label="Switch help language">
            <Languages size={18} aria-hidden="true" />
            <span>{state.interfaceLanguage === 'en' ? 'EN' : 'हिं'}</span>
          </button>
          {state.stage !== 'welcome' && (
            <button className="header-button header-button--text" onClick={onReceipt} aria-label="Open journey receipt">
              <ClipboardCheck size={18} aria-hidden="true" />
              <span>Receipt</span>
            </button>
          )}
          <button className="header-button header-button--text" onClick={onHelp} aria-label="Open contextual help">
            <CircleHelp size={18} aria-hidden="true" />
            <span>Help</span>
          </button>
          <button className="icon-button" onClick={onReset} aria-label="Restart demo">
            <RefreshCcw size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}

function PrototypeDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'disclosure disclosure--compact' : 'disclosure'}>
      <BadgeCheck size={18} aria-hidden="true" />
      <p>
        <strong>Prototype with synthetic data.</strong> Not connected to Aadhaar, Sarathi, SmartLock,
        payment systems, or a transport department.
      </p>
    </div>
  )
}

function ScreenHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <header className="screen-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1 tabIndex={-1}>{title}</h1>
      <p>{description}</p>
    </header>
  )
}

function chapterStatus(chapter: Chapter, current: Chapter): 'complete' | 'current' | 'upcoming' {
  const chapterIndex = chapterOrder.indexOf(chapter)
  const currentIndex = chapterOrder.indexOf(current)
  if (chapterIndex < currentIndex) return 'complete'
  if (chapterIndex === currentIndex) return 'current'
  return 'upcoming'
}

function JourneyRail({ state }: { state: JourneyState }) {
  const current = stageChapter[state.stage]
  return (
    <aside className="journey-rail" aria-label="Journey progress">
      <div className="rail-heading">
        <div>
          <p className="eyebrow">Saved journey</p>
          <h2>Your progress is protected</h2>
        </div>
        <LockKeyhole size={20} aria-hidden="true" />
      </div>
      <ol className="chapter-list">
        {chapterOrder.map((chapter) => {
          const status = chapterStatus(chapter, current)
          return (
            <li className={`chapter chapter--${status}`} key={chapter}>
              <span className="chapter-marker" aria-hidden="true">
                {status === 'complete' ? <Check size={15} /> : <Circle size={10} fill="currentColor" />}
              </span>
              <span>
                <strong>{chapterLabels[chapter]}</strong>
                <small>{status === 'complete' ? 'Completed' : status === 'current' ? 'In progress' : 'Not started'}</small>
              </span>
            </li>
          )
        })}
      </ol>
      <div className="rail-safe-state">
        <ShieldCheck size={19} aria-hidden="true" />
        <span>
          <strong>{state.paymentStatus === 'paid' ? 'Demo payment recorded' : 'No payment at risk'}</strong>
          <small>{Object.keys(state.exam.answers).length} exam answer(s) saved</small>
        </span>
      </div>
    </aside>
  )
}

function MobileProgress({ stage }: { stage: JourneyStage }) {
  const chapter = stageChapter[stage]
  const index = chapterOrder.indexOf(chapter) + 1
  return (
    <div className="mobile-progress" aria-label={`Step ${index} of ${chapterOrder.length}: ${chapterLabels[chapter]}`}>
      <div>
        <span>Step {index} of {chapterOrder.length}</span>
        <strong>{chapterLabels[chapter]}</strong>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${(index / chapterOrder.length) * 100}%` }} />
      </div>
    </div>
  )
}

function HelpPanel({
  chapter,
  language,
  onClose,
}: {
  chapter: Chapter
  language: InterfaceLanguage
  onClose: () => void
}) {
  const copy = helpCopy[chapter][language]
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={onClose}>
      <section className="side-sheet" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Contextual help · {language === 'en' ? 'English' : 'हिंदी'}</p>
            <h2 id="help-title">{copy.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close help" autoFocus>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="sheet-summary">{copy.summary}</p>
        <ul className="explain-list">
          {copy.bullets.map((item) => (
            <li key={item}><CheckCircle2 size={19} aria-hidden="true" /><span>{item}</span></li>
          ))}
        </ul>
        <div className="help-boundary">
          <Info size={19} aria-hidden="true" />
          <p>{chapter === 'test' ? 'Answer help is disabled during the active test.' : 'Answers are grounded in the LicenceFlow research set; unresolved government rules are labelled.'}</p>
        </div>
      </section>
    </div>
  )
}

function ReceiptPanel({ state, onClose }: { state: JourneyState; onClose: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={onClose}>
      <section className="side-sheet side-sheet--receipt" role="dialog" aria-modal="true" aria-labelledby="receipt-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Journey Receipt</p>
            <h2 id="receipt-title">What happened, in order</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close receipt" autoFocus>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="sheet-summary">This event history is stored only in this browser for the prototype.</p>
        {state.events.length === 0 ? (
          <div className="empty-state"><FileText size={24} /><p>Your receipt will begin when you start the journey.</p></div>
        ) : (
          <ol className="receipt-list">
            {state.events.map((event) => (
              <li key={event.id}>
                <span className="receipt-marker"><Check size={14} aria-hidden="true" /></span>
                <div>
                  <div className="receipt-title-row">
                    <strong>{event.title}</strong>
                    {event.synthetic && <em>Simulated</em>}
                  </div>
                  <p>{event.detail}</p>
                  <time dateTime={event.at}>{new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function WelcomeScreen({
  onStart,
}: {
  onStart: (mode: 'guided-demo' | 'full-simulation') => void
}) {
  return (
    <main id="main-content" className="welcome-screen">
      <section className="hero-copy" aria-labelledby="hero-title">
        <div className="hero-badge"><ShieldCheck size={16} />Learner's Licence · failure-safe by design</div>
        <h1 id="hero-title">Technology should protect your attempt—not consume it.</h1>
        <p className="hero-lede">LicenceFlow checks your device before payment, saves every answer, and separates a technical interruption from a failed test.</p>
        <div className="hero-actions">
          <button className="button button--primary button--large" onClick={() => onStart('guided-demo')}>
            Try the 90-second demo <ArrowRight size={20} aria-hidden="true" />
          </button>
          <button className="button button--quiet" onClick={() => onStart('full-simulation')}>
            Open full 15-question simulation
          </button>
        </div>
        <p className="microcopy">No real ID, payment, camera recording, or government connection.</p>
      </section>

      <section className="promise-card" aria-label="The safer LicenceFlow order">
        <div className="promise-card-top">
          <span className="promise-icon"><ShieldCheck size={31} /></span>
          <span className="real-pill"><Signal size={15} />Real browser checks</span>
        </div>
        <p className="eyebrow">The safer order</p>
        <ol className="promise-steps">
          <li><span>01</span><div><strong>Apply simply</strong><small>with synthetic identity</small></div></li>
          <li><span>02</span><div><strong>Check first</strong><small>camera, face, light, network</small></div></li>
          <li><span>03</span><div><strong>Pay second</strong><small>only after readiness passes</small></div></li>
          <li><span>04</span><div><strong>Recover safely</strong><small>answers and context preserved</small></div></li>
        </ol>
      </section>

      <PrototypeDisclosure />
    </main>
  )
}

function ApplicationScreen({
  state,
  onUpdate,
  onNext,
  onBack,
  onComplete,
  onHelp,
}: {
  state: JourneyState
  onUpdate: (patch: Partial<ApplicationData>) => void
  onNext: () => void
  onBack: () => void
  onComplete: () => void
  onHelp: () => void
}) {
  const step = state.applicationStep
  const application = state.application

  return (
    <main id="main-content" className="screen-content">
      <ScreenHeading
        eyebrow={`Application · section ${step + 1} of 3`}
        title={step === 0 ? 'Choose a synthetic identity route' : step === 1 ? 'Confirm the applicant details' : 'Review before device checks'}
        description={step === 0 ? 'Both routes are mocked safely—no real Aadhaar number, OTP, document, or government record is used.' : step === 1 ? 'The form is deliberately compressed so the citizen can reach the important readiness step quickly.' : 'Nothing is submitted to a government system. This creates only a local demonstration application.'}
      />

      {step === 0 && (
        <>
          <div className="choice-grid" role="radiogroup" aria-label="Synthetic identity route">
            <label className={application.identityRoute === 'aadhaar-demo' ? 'choice-card choice-card--selected' : 'choice-card'}>
              <input type="radio" name="identity-route" checked={application.identityRoute === 'aadhaar-demo'} onChange={() => onUpdate({ identityRoute: 'aadhaar-demo' })} />
              <span className="choice-icon"><UserRound size={24} /></span>
              <span><strong>Demo Aadhaar e-KYC</strong><small>Instant fictional identity confirmation</small></span>
              <span className="choice-check"><Check size={16} /></span>
            </label>
            <label className={application.identityRoute === 'document-demo' ? 'choice-card choice-card--selected' : 'choice-card'}>
              <input type="radio" name="identity-route" checked={application.identityRoute === 'document-demo'} onChange={() => onUpdate({ identityRoute: 'document-demo' })} />
              <span className="choice-icon"><FileCheck2 size={24} /></span>
              <span><strong>Demo document review</strong><small>Fictional photo, signature, and proof</small></span>
              <span className="choice-check"><Check size={16} /></span>
            </label>
          </div>
          <button className="inline-help" onClick={onHelp}><CircleHelp size={17} />Why are identity and exam face checks different?</button>
        </>
      )}

      {step === 1 && (
        <section className="form-card" aria-label="Synthetic applicant details">
          <div className="form-grid">
            <label className="field field--wide">
              <span>Full name <em>Fictional</em></span>
              <input value={application.fullName} onChange={(event) => onUpdate({ fullName: event.target.value })} autoComplete="name" />
            </label>
            <label className="field">
              <span>Mobile number <em>Fictional</em></span>
              <input value={application.phone} onChange={(event) => onUpdate({ phone: event.target.value })} inputMode="tel" autoComplete="tel" />
            </label>
            <label className="field">
              <span>State</span>
              <input value={application.state} readOnly aria-readonly="true" />
            </label>
            <label className="field">
              <span>RTO</span>
              <select value={application.rto} onChange={(event) => onUpdate({ rto: event.target.value })}>
                <option>Bhopal (MP-04)</option>
                <option>Indore (MP-09)</option>
                <option>Jabalpur (MP-20)</option>
              </select>
            </label>
            <label className="field">
              <span>Vehicle class</span>
              <select value={application.vehicleClass} onChange={(event) => onUpdate({ vehicleClass: event.target.value })}>
                <option>LMV + MCWG</option>
                <option>LMV</option>
                <option>MCWG</option>
              </select>
            </label>
          </div>
          <div className="saved-note"><Database size={17} />Draft saves in this browser as you continue.</div>
        </section>
      )}

      {step === 2 && (
        <>
          <section className="review-card">
            <div className="review-title"><span className="choice-icon"><FileCheck2 size={23} /></span><div><p className="eyebrow">Synthetic application</p><h2>{application.fullName}</h2></div><span className="verified-pill"><CheckCircle2 size={16} />Ready to save</span></div>
            <dl className="detail-grid">
              <div><dt>Reference</dt><dd>MP-LL-DEMO-260822</dd></div>
              <div><dt>Identity route</dt><dd>{application.identityRoute === 'aadhaar-demo' ? 'Demo e-KYC' : 'Demo document review'}</dd></div>
              <div><dt>RTO</dt><dd>{application.rto}</dd></div>
              <div><dt>Vehicle class</dt><dd>{application.vehicleClass}</dd></div>
            </dl>
          </section>
          <label className="declaration-card">
            <input type="checkbox" checked={application.declarationAccepted} onChange={(event) => onUpdate({ declarationAccepted: event.target.checked })} />
            <span className="checkbox-mark"><Check size={15} /></span>
            <span><strong>I understand this is a fictional application.</strong><small>No eligibility decision, licence application, or government submission is created.</small></span>
          </label>
        </>
      )}

      <div className="action-row action-row--between">
        {step > 0 ? <button className="button button--secondary" onClick={onBack}><ArrowLeft size={18} />Back</button> : <span />}
        {step < 2 ? (
          <button className="button button--primary" onClick={onNext} disabled={step === 1 && (!application.fullName.trim() || !application.phone.trim())}>Save and continue <ArrowRight size={19} /></button>
        ) : (
          <button className="button button--primary" onClick={onComplete} disabled={!application.declarationAccepted}>Create demo application <ArrowRight size={19} /></button>
        )}
      </div>
    </main>
  )
}

function QuestionCard({
  question,
  selected,
  onSelect,
  legend,
}: {
  question: Question
  selected: number | null
  onSelect: (answer: number) => void
  legend: string
}) {
  return (
    <fieldset className="question-card">
      <legend>{legend}</legend>
      <h2>{question.prompt}</h2>
      <div className="answer-list">
        {question.options.map((option, index) => (
          <label className={selected === index ? 'answer answer--selected' : 'answer'} key={option}>
            <input type="radio" name={legend} checked={selected === index} onChange={() => onSelect(index)} />
            <span className="radio-mark" aria-hidden="true" />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function PreparationScreen({ onComplete, onHelp }: { onComplete: () => void; onHelp: () => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const correct = selected === practiceQuestion.correct
  return (
    <main id="main-content" className="screen-content">
      <ScreenHeading eyebrow="Prepare · before the secure test" title="Know what the test is checking" description="A short, useful readiness pack replaces a passive video and unexplained rules." />
      <PrototypeDisclosure compact />
      <section className="learning-grid" aria-label="Learning topics">
        <article><span><Lightbulb size={22} /></span><h2>Signs and signals</h2><p>Recognise instructions before reacting.</p></article>
        <article><span><ShieldCheck size={22} /></span><h2>Safety and priority</h2><p>Protect pedestrians and emergency vehicles.</p></article>
        <article><span><FileText size={22} /></span><h2>Duties and documents</h2><p>Know what to carry and what to do after an accident.</p></article>
      </section>
      <QuestionCard question={practiceQuestion} selected={selected} onSelect={(answer) => { setSelected(answer); setChecked(false) }} legend="Practice question" />
      {checked && (
        <div className={correct ? 'answer-feedback answer-feedback--success' : 'answer-feedback answer-feedback--retry'} role="status">
          {correct ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}
          <div><strong>{correct ? 'Correct—practice complete.' : 'Not quite. Try once more.'}</strong><p>{practiceQuestion.explanation}</p></div>
        </div>
      )}
      <button className="inline-help" onClick={onHelp}><CircleHelp size={17} />What should I study before the test?</button>
      <div className="action-row">
        {!correct || !checked ? (
          <button className="button button--primary" onClick={() => setChecked(true)} disabled={selected === null}>Check practice answer <ArrowRight size={19} /></button>
        ) : (
          <button className="button button--primary" onClick={onComplete}>Check this device before payment <ArrowRight size={19} /></button>
        )}
      </div>
    </main>
  )
}

function CameraPreview({ stream, guided, label = 'Private camera check' }: { stream: MediaStream | null; guided: boolean; label?: string }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream
    return () => {
      if (ref.current) ref.current.srcObject = null
    }
  }, [stream])

  return (
    <div className={guided ? 'camera-preview camera-preview--guided' : 'camera-preview'}>
      {stream && !guided ? <video ref={ref} autoPlay muted playsInline aria-label={label} /> : <div className="camera-placeholder" aria-label={guided ? 'Guided camera signals simulated' : 'Camera preview waiting'}><UserRound size={58} /><span>{guided ? 'GUIDED SIGNALS' : 'CAMERA PREVIEW'}</span></div>}
      <div className="camera-frame" aria-hidden="true" />
      <div className="camera-label"><Camera size={15} />{guided ? 'Simulated camera conditions' : label}</div>
    </div>
  )
}

function statusFor(value: boolean | null, working = false): CheckTone {
  if (working) return 'working'
  if (value === null) return 'idle'
  return value ? 'pass' : 'attention'
}

function CheckRow({ icon, label, detail, tone }: { icon: ReactNode; label: string; detail: string; tone: CheckTone }) {
  return (
    <li className={`device-check device-check--${tone}`}>
      <span className="device-check-icon" aria-hidden="true">{icon}</span>
      <span><strong>{label}</strong><small>{detail}</small></span>
      <span className="device-check-result" aria-hidden="true">
        {tone === 'pass' ? <Check size={17} /> : tone === 'attention' ? <TriangleAlert size={17} /> : tone === 'working' ? <RotateCw size={17} /> : <Circle size={13} />}
      </span>
    </li>
  )
}

function ReadinessScreen({
  media,
  onComplete,
  onHelp,
}: {
  media: ReturnType<typeof useDeviceReadiness>
  onComplete: (guided: boolean) => void
  onHelp: () => void
}) {
  const { snapshot } = media
  const faceGood = snapshot.faceCount === 1
  return (
    <main id="main-content" className="screen-content">
      <ScreenHeading eyebrow="Device readiness · before payment" title="Prove the test can run here" description="These checks happen now—before a synthetic fee or test attempt is committed." />

      {!snapshot.started ? (
        <>
          <section className="permission-card">
            <div className="permission-intro"><span><ShieldCheck size={26} /></span><div><p className="eyebrow">Just-in-time permission</p><h2>Your camera and microphone stay private</h2><p>LicenceFlow measures face count, framing, light, head movement, and microphone stream activity on this device. It does not record or upload video or audio.</p></div></div>
            <div className="permission-grid">
              <div><Camera size={21} /><span><strong>Camera</strong><small>Face, framing, light, head turn</small></span></div>
              <div><Mic2 size={21} /><span><strong>Microphone</strong><small>Permission and stream health only</small></span></div>
              <div><Database size={21} /><span><strong>Browser storage</strong><small>Answer recovery on this device</small></span></div>
            </div>
          </section>
          <button className="inline-help" onClick={onHelp}><CircleHelp size={17} />Why do you need these permissions?</button>
          <div className="action-row action-row--stack">
            <button className="button button--primary" onClick={() => void media.start()}>Start private device checks <ArrowRight size={19} /></button>
            <button className="button button--quiet" onClick={media.useGuidedSignals}>Use clearly labelled guided camera signals</button>
          </div>
        </>
      ) : (
        <>
          {snapshot.guided && <div className="simulation-banner"><Info size={18} /><p><strong>Guided scenario:</strong> camera-derived signals below are simulated. Browser storage, HTTPS, and connection checks remain real.</p></div>}
          <section className="readiness-lab">
            <div className="camera-column">
              <CameraPreview stream={media.stream} guided={snapshot.guided} />
              <div className="head-turn-prompt">
                <span className={snapshot.headTurnComplete ? 'prompt-icon prompt-icon--complete' : 'prompt-icon'}><RotateCw size={22} /></span>
                <div><strong>{snapshot.guided ? 'Guided head-turn signal simulated' : snapshot.headTurnComplete ? 'Head-turn challenge completed' : 'Turn your face gently to either side'}</strong><small>{snapshot.guided ? 'No movement was measured in this guided scenario.' : snapshot.headTurnComplete ? 'Observed movement matched the challenge.' : 'This checks responsive movement—not identity or cheating.'}</small></div>
              </div>
              <div className="audio-meter" aria-label={`${snapshot.guided ? 'Guided microphone signal' : 'Microphone activity'} ${Math.round(snapshot.audioLevel * 100)} percent`}>
                <Mic2 size={17} /><span>{snapshot.guided ? 'Guided mic signal' : 'Mic stream'}</span><div><i style={{ width: `${Math.max(4, snapshot.audioLevel * 100)}%` }} /></div><strong>{snapshot.guided ? 'Simulated' : snapshot.microphone === 'ready' ? 'Ready' : 'Waiting'}</strong>
              </div>
            </div>
            <div className="checks-column">
              <div className="checks-heading"><div><p className="eyebrow">Live readiness report</p><h2>{media.ready ? 'Ready before payment' : snapshot.error ? 'A fix is needed' : 'Checking this device'}</h2></div><MonitorCheck size={24} /></div>
              <ul className="device-check-list" aria-live="polite">
                <CheckRow icon={<Wifi size={19} />} label="Connection" detail={snapshot.online ? 'Browser reports online' : 'Connection is offline'} tone={statusFor(snapshot.online)} />
                <CheckRow icon={<Database size={19} />} label="Saved progress" detail={snapshot.storage ? 'Local checkpoint write succeeded' : 'Browser storage unavailable'} tone={statusFor(snapshot.storage)} />
                <CheckRow icon={<LockKeyhole size={19} />} label="Secure page" detail={snapshot.secureContext ? 'HTTPS or trusted localhost context' : 'Open this prototype over HTTPS'} tone={statusFor(snapshot.secureContext)} />
                <CheckRow icon={<Camera size={19} />} label={snapshot.guided ? 'Camera condition' : 'Camera stream'} detail={snapshot.guided ? 'Simulated camera-ready signal' : snapshot.camera === 'ready' ? 'Permission and live stream ready' : snapshot.camera === 'denied' ? 'Permission was not allowed' : 'Waiting for permission'} tone={statusFor(snapshot.camera === 'ready', snapshot.camera === 'requesting')} />
                <CheckRow icon={<Mic2 size={19} />} label={snapshot.guided ? 'Microphone condition' : 'Microphone stream'} detail={snapshot.guided ? 'Simulated microphone-ready signal' : snapshot.microphone === 'ready' ? 'Permission and stream ready' : 'Waiting for permission'} tone={statusFor(snapshot.microphone === 'ready', snapshot.microphone === 'requesting')} />
                <CheckRow icon={<UserRound size={19} />} label={snapshot.guided ? 'Face condition' : 'Visible face'} detail={snapshot.guided ? 'Simulated single-face signal' : snapshot.faceCount === null ? 'Loading private face model' : snapshot.faceCount === 1 ? 'Exactly one face visible' : `${snapshot.faceCount} faces visible`} tone={statusFor(faceGood, snapshot.model === 'loading')} />
                <CheckRow icon={<Smartphone size={19} />} label="Framing" detail={snapshot.guided ? 'Simulated good-framing signal' : snapshot.framing === 'good' ? 'Distance and position look good' : 'Centre your face inside the guide'} tone={statusFor(snapshot.framing === 'good')} />
                <CheckRow icon={<SunMedium size={19} />} label="Lighting" detail={snapshot.guided ? 'Simulated usable-light signal' : snapshot.lighting === 'good' ? `Usable light · level ${snapshot.brightness}` : snapshot.lighting === 'dim' ? 'Move to a brighter place' : snapshot.lighting === 'bright' ? 'Reduce strong backlight' : 'Waiting for camera'} tone={statusFor(snapshot.lighting === 'good')} />
                <CheckRow icon={<RotateCw size={19} />} label="Head-turn challenge" detail={snapshot.guided ? 'Simulated movement signal' : snapshot.headTurnComplete ? 'Responsive movement observed' : 'Turn gently to either side'} tone={statusFor(snapshot.headTurnComplete)} />
              </ul>
            </div>
          </section>
          {snapshot.error && <div className="inline-alert" role="alert"><TriangleAlert size={20} /><div><strong>We could not finish every check.</strong><p>{snapshot.error}</p></div></div>}
          <div className="action-row action-row--stack">
            <button className="button button--primary" disabled={!media.ready} onClick={() => onComplete(snapshot.guided)}>Confirm readiness and rehearse <ArrowRight size={19} /></button>
            {!media.ready && <div className="button-pair"><button className="button button--secondary" onClick={() => void media.start()}><RefreshCcw size={18} />Retry real checks</button><button className="button button--quiet" onClick={media.useGuidedSignals}>Use guided signals instead</button></div>}
          </div>
        </>
      )}
    </main>
  )
}

function RehearsalScreen({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  return (
    <main id="main-content" className="screen-content">
      <ScreenHeading eyebrow="Secure-test rehearsal · no attempt used" title="Experience the save-before-next pattern" description="The same checkpoint behavior protects every answer in the synthetic test." />
      <div className="exam-status-bar"><span><Camera size={17} />Readiness passed</span><span><Signal size={17} />Connection observed</span><span><LockKeyhole size={17} />Rehearsal only</span></div>
      <QuestionCard question={practiceQuestion} selected={selected} onSelect={(answer) => { setSelected(answer); setSaved(false) }} legend="Rehearsal question" />
      {saved && <div className="checkpoint-success" role="status"><CheckCircle2 size={20} /><div><strong>Sample answer checkpointed.</strong><p>If the connection changes after this point, this answer remains available in the open app.</p></div></div>}
      <section className="rehearsal-notes"><div><WifiOff size={20} /><span><strong>Network drops</strong><small>Pause and preserve answers</small></span></div><div><EyeOff size={20} /><span><strong>Test view disappears</strong><small>Pause and re-check</small></span></div><div><Users size={20} /><span><strong>More than one face</strong><small>Name the condition; do not accuse</small></span></div></section>
      <div className="action-row">
        {!saved ? <button className="button button--primary" disabled={selected === null} onClick={() => setSaved(true)}>Save sample answer <LockKeyhole size={18} /></button> : <button className="button button--primary" onClick={onComplete}>Continue to demo payment <ArrowRight size={19} /></button>}
      </div>
    </main>
  )
}

function PaymentScreen({ state, onPay, onContinue, onHelp }: { state: JourneyState; onPay: () => void; onContinue: () => void; onHelp: () => void }) {
  const paid = state.paymentStatus === 'paid'
  return (
    <main id="main-content" className="screen-content">
      <ScreenHeading eyebrow="Payment · only after readiness" title={paid ? 'Synthetic payment recorded' : 'This device is ready before payment'} description={paid ? 'The local receipt now links the application, readiness, rehearsal, and payment state.' : 'The amount is a demo configuration—not a claim about the current Madhya Pradesh fee.'} />
      <PrototypeDisclosure compact />
      <section className={paid ? 'payment-card payment-card--paid' : 'payment-card'}>
        <div className="payment-topline"><span className="demo-stamp">DEMO AMOUNT</span>{paid && <span className="verified-pill"><CheckCircle2 size={16} />Recorded</span>}</div>
        <div className="fee-row"><span><IndianRupee size={26} /></span><strong>250</strong><small>Synthetic scenario amount</small></div>
        <dl className="payment-details">
          <div><dt>Application</dt><dd>MP-LL-DEMO-260822</dd></div>
          <div><dt>Device readiness</dt><dd>{state.readiness.usedGuidedSignals ? 'Passed · guided signals' : 'Passed · real checks'}</dd></div>
          <div><dt>Secure-test rehearsal</dt><dd>Completed</dd></div>
          <div><dt>Repeat demo payment after a technical pause</dt><dd>₹0</dd></div>
          {paid && <div><dt>Demo reference</dt><dd>{state.paymentReference}</dd></div>}
        </dl>
      </section>
      <button className="inline-help" onClick={onHelp}><CircleHelp size={17} />Is this a real payment or official fee?</button>
      <div className="action-row">
        {!paid ? <button className="button button--primary" onClick={onPay}>Make ₹250 demo payment <CreditCard size={19} /></button> : <button className="button button--primary" onClick={onContinue}>Continue to secure-test entry <ArrowRight size={19} /></button>}
      </div>
    </main>
  )
}

function ExamIntroScreen({ state, onStart }: { state: JourneyState; onStart: () => void }) {
  const count = state.mode === 'guided-demo' ? 5 : 15
  const threshold = state.mode === 'guided-demo' ? 3 : 9
  return (
    <main id="main-content" className="screen-content">
      <ScreenHeading eyebrow="Secure-test entry" title="Know the rules before starting" description="This is a LicenceFlow knowledge-test simulation, not the official Madhya Pradesh question or scoring configuration." />
      <section className="instruction-grid">
        <article><span><FileText size={21} /></span><div><strong>{count} questions</strong><small>{threshold} correct to pass this simulation</small></div></article>
        <article><span><LockKeyhole size={21} /></span><div><strong>Checkpoint before next</strong><small>Answers persist across refresh/reconnect</small></div></article>
        <article><span><Camera size={21} /></span><div><strong>{state.readiness.usedGuidedSignals ? 'Guided integrity signals' : 'Live camera observations'}</strong><small>Conditions are not cheating verdicts</small></div></article>
        <article><span><CircleHelp size={21} /></span><div><strong>Technical help only</strong><small>No answer assistance during the test</small></div></article>
      </section>
      <div className="exam-declaration"><Info size={20} /><p>I understand this is a synthetic simulation. A browser cannot provide SmartLock-equivalent lockdown, prevent app switching, or guarantee identity.</p></div>
      <div className="action-row"><button className="button button--primary" onClick={onStart}>Start {count}-question simulation <ArrowRight size={19} /></button></div>
    </main>
  )
}

function ExamScreen({
  state,
  media,
  onAnswer,
  onHelp,
}: {
  state: JourneyState
  media: ReturnType<typeof useDeviceReadiness>
  onAnswer: (answer: number, question: Question, isLast: boolean, threshold: number) => void
  onHelp: () => void
}) {
  const questions = state.mode === 'guided-demo' ? demoQuestions : fullQuestions
  const question = questions[state.exam.currentQuestion]
  const [selected, setSelected] = useState<number | null>(state.exam.answers[state.exam.currentQuestion] ?? null)

  useEffect(() => setSelected(state.exam.answers[state.exam.currentQuestion] ?? null), [state.exam.answers, state.exam.currentQuestion])
  if (!question) return null

  const threshold = state.mode === 'guided-demo' ? 3 : 9
  return (
    <main id="main-content" className="screen-content exam-screen">
      <div className="exam-topline"><div><p className="eyebrow">Synthetic learner test</p><strong>Question {state.exam.currentQuestion + 1} of {questions.length}</strong></div><button className="button button--compact button--secondary" onClick={onHelp}><CircleHelp size={17} />Technical help</button></div>
      <div className="exam-status-bar">
        <span className={media.snapshot.faceCount === 1 ? 'status-good' : ''}><Camera size={16} />{state.readiness.usedGuidedSignals ? 'Guided camera' : media.snapshot.faceCount === 1 ? 'One face visible' : 'Camera observed'}</span>
        <span className={media.snapshot.online ? 'status-good' : 'status-warning'}>{media.snapshot.online ? <Signal size={16} /> : <WifiOff size={16} />}{media.snapshot.online ? 'Connected' : 'Offline'}</span>
        <span className="status-good"><LockKeyhole size={16} />{Object.keys(state.exam.answers).length} saved</span>
      </div>
      <div className="question-progress" aria-label={`${state.exam.currentQuestion + 1} of ${questions.length} questions`}><span style={{ width: `${((state.exam.currentQuestion + 1) / questions.length) * 100}%` }} /></div>
      <div className="exam-layout">
        <div>
          <QuestionCard question={question} selected={selected} onSelect={setSelected} legend={`Question ${state.exam.currentQuestion + 1}`} />
          <div className="checkpoint-note"><LockKeyhole size={17} /><span>Your choice is written to this browser before the next question opens.</span></div>
        </div>
        <aside className="exam-camera-card"><CameraPreview stream={media.stream} guided={state.readiness.usedGuidedSignals} label="Live exam camera" /><p><ShieldCheck size={16} />No video or audio is recorded.</p></aside>
      </div>
      <div className="action-row"><button className="button button--primary" disabled={selected === null} onClick={() => selected !== null && onAnswer(selected, question, state.exam.currentQuestion === questions.length - 1, threshold)}>Save answer and {state.exam.currentQuestion === questions.length - 1 ? 'finish' : 'continue'} <ArrowRight size={19} /></button></div>
    </main>
  )
}

function interruptionCopy(kind?: InterruptionKind) {
  switch (kind) {
    case 'multiple-faces':
      return { icon: <Users size={28} />, eyebrow: 'VISIBLE CONDITION · NOT A CHEATING VERDICT', title: 'More than one face is visible.', body: 'The test paused because the camera field contains an additional face. Continue after only the applicant remains visible.' }
    case 'visibility':
      return { icon: <EyeOff size={28} />, eyebrow: 'BROWSER VISIBILITY EVENT', title: 'LicenceFlow lost the active test view.', body: 'The page became hidden. Your latest saved answer and payment state remain protected.' }
    case 'camera':
      return { icon: <Camera size={28} />, eyebrow: 'CAMERA TECHNICAL EVENT', title: 'The camera must be reconnected.', body: 'The secure-test view paused without changing the knowledge result or consuming another demo payment.' }
    case 'network-real':
      return { icon: <WifiOff size={28} />, eyebrow: 'REAL NETWORK EVENT', title: 'Connection lost. Test paused safely.', body: 'Your open application retains the saved checkpoint. Reconnect before continuing.' }
    default:
      return { icon: <WifiOff size={28} />, eyebrow: 'GUIDED DEMO · NETWORK INTERRUPTION', title: 'Connection lost. Test paused safely.', body: 'This deterministic scenario proves that the selected answer survives and no repeat payment is requested.' }
  }
}

function InterruptionScreen({
  state,
  media,
  onResume,
  onReconnectCamera,
}: {
  state: JourneyState
  media: ReturnType<typeof useDeviceReadiness>
  onResume: () => void
  onReconnectCamera: () => void
}) {
  const kind = state.exam.interruptionKind
  const copy = interruptionCopy(kind)
  const needsConnection = kind === 'network-real'
  const needsCamera = kind === 'camera'
  const needsOneFace = kind === 'multiple-faces'
  const canResume =
    (!needsConnection || media.snapshot.online) &&
    (!needsCamera || media.snapshot.camera === 'ready' || state.readiness.usedGuidedSignals) &&
    (!needsOneFace || media.snapshot.blockingReason !== 'multiple-faces' || state.readiness.usedGuidedSignals)

  return (
    <main id="main-content" className="screen-content interruption-screen">
      <section className="interruption-card" role="alert">
        <span className="interruption-icon">{copy.icon}</span>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 tabIndex={-1}>{copy.title}</h1>
        <p>{copy.body}</p>
        <div className="protection-grid">
          <div><span>Latest safe checkpoint</span><strong>Question {Object.keys(state.exam.answers).length}</strong></div>
          <div><span>Demo payment</span><strong>Still recorded</strong></div>
          <div><span>Knowledge result</span><strong>Not marked failed</strong></div>
        </div>
        {needsCamera && !canResume && <button className="button button--secondary" onClick={onReconnectCamera}><Camera size={18} />Reconnect camera</button>}
        {!canResume && <p className="recovery-wait"><RotateCw size={17} />Resolve the condition above to enable safe resume.</p>}
        <button className="button button--primary" onClick={onResume} disabled={!canResume}>Resume from saved checkpoint <ArrowRight size={19} /></button>
      </section>
    </main>
  )
}

function ResultScreen({ state, onReceipt, onReset }: { state: JourneyState; onReceipt: () => void; onReset: () => void }) {
  const total = state.mode === 'guided-demo' ? demoQuestions.length : fullQuestions.length
  const passed = state.exam.knowledgeResult === 'passed'
  return (
    <main id="main-content" className="screen-content">
      <ScreenHeading eyebrow="Outcome · results kept separate" title={passed ? 'Knowledge simulation passed' : 'Knowledge simulation not passed'} description="The score, technical recovery, and integrity observations are shown separately so technology cannot silently rewrite the result." />
      <section className="outcome-summary-grid">
        <article className={passed ? 'outcome-metric outcome-metric--success' : 'outcome-metric outcome-metric--attention'}><span>{passed ? <CheckCircle2 size={23} /> : <TriangleAlert size={23} />}</span><div><small>Knowledge result</small><strong>{state.exam.correctAnswers}/{total} · {passed ? 'Passed' : 'Retest path'}</strong><p>LicenceFlow simulation only</p></div></article>
        <article className="outcome-metric"><span><Network size={23} /></span><div><small>Technical status</small><strong>{state.exam.interruptionSeen ? 'Recovered safely' : 'No interruption'}</strong><p>{state.exam.interruptionSeen ? 'Saved answers restored' : 'Journey completed normally'}</p></div></article>
        <article className="outcome-metric"><span><ShieldCheck size={23} /></span><div><small>Integrity status</small><strong>{state.exam.integrityStatus === 'observation-recorded' ? 'Observation recorded' : 'No review required'}</strong><p>No automatic misconduct verdict</p></div></article>
      </section>

      <div className="result-grid">
        {passed ? (
          <section className="licence-card" aria-label="Invalid demonstration learner licence">
            <div className="licence-watermark">DEMO · NOT VALID</div>
            <div className="licence-header"><ProductMark /><span>LEARNER'S LICENCE DEMONSTRATION</span></div>
            <div className="licence-person"><span className="avatar">AS</span><span><small>Fictional holder</small><strong>{state.application.fullName}</strong></span></div>
            <dl><div><dt>Reference</dt><dd>MP-LL-DEMO-260822</dd></div><div><dt>Class</dt><dd>{state.application.vehicleClass}</dd></div><div><dt>Status</dt><dd>Not valid for driving</dd></div><div><dt>Source</dt><dd>LicenceFlow prototype</dd></div></dl>
          </section>
        ) : (
          <section className="retest-card"><span><RefreshCcw size={28} /></span><p className="eyebrow">Synthetic retest path</p><h2>Your technical event did not cause this result.</h2><p>A real retest may require an applicable fee and fresh availability check. LicenceFlow does not invent a waiting period or attempt limit.</p></section>
        )}
        <section className="receipt-preview">
          <div className="card-title-row"><div><p className="eyebrow">Journey Receipt</p><h2>{state.events.length} transparent events</h2></div><ClipboardCheck size={23} /></div>
          <ul>{state.events.slice(-5).map((event) => <li key={event.id}><Check size={15} /><span><strong>{event.title}</strong><small>{event.synthetic ? 'Simulated' : 'Real browser behavior'}</small></span></li>)}</ul>
          <button className="button button--secondary" onClick={onReceipt}>View complete receipt <ArrowRight size={18} /></button>
        </section>
      </div>

      <section className="next-step-card"><span><FileCheck2 size={24} /></span><div><p className="eyebrow">What happens after a real LL?</p><h2>The permanent licence is the next journey—not part of this issuance demo.</h2><p>LicenceFlow would explain eligibility timing, the practical driving test, required documents, and RTO steps using current official configuration.</p></div></section>
      <div className="action-row"><button className="button button--secondary" onClick={onReset}><RefreshCcw size={18} />Restart prototype</button></div>
    </main>
  )
}

function App() {
  const [state, dispatch] = useReducer(journeyReducer, initialJourneyState, loadJourney)
  const [helpOpen, setHelpOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [storageHealthy, setStorageHealthy] = useState(true)
  const media = useDeviceReadiness()
  const previousMediaBlockRef = useRef<MediaBlockingReason>(null)

  const chapter = stageChapter[state.stage]

  useEffect(() => {
    setStorageHealthy(saveJourney(state))
  }, [state])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.querySelector<HTMLElement>('.screen-heading h1, .interruption-card h1')?.focus({ preventScroll: true })
  }, [state.applicationStep, state.exam.currentQuestion, state.stage])

  useEffect(() => {
    if (state.readiness.status === 'passed' && state.readiness.usedGuidedSignals && !media.snapshot.started) {
      media.useGuidedSignals()
    }
  }, [media, state.readiness.status, state.readiness.usedGuidedSignals])

  useEffect(() => {
    const pauseForNetwork = () => {
      if (state.stage === 'exam') dispatch({ type: 'PAUSE_EXAM', kind: 'network-real', detail: 'The browser reported a real network loss; saved answers remain in the open application.', synthetic: false })
    }
    const pauseForVisibility = () => {
      if (document.hidden && state.stage === 'exam') dispatch({ type: 'PAUSE_EXAM', kind: 'visibility', detail: 'The document became hidden; LicenceFlow cannot know which app or tab was opened.', synthetic: false })
    }
    window.addEventListener('offline', pauseForNetwork)
    document.addEventListener('visibilitychange', pauseForVisibility)
    return () => {
      window.removeEventListener('offline', pauseForNetwork)
      document.removeEventListener('visibilitychange', pauseForVisibility)
    }
  }, [state.stage])

  useEffect(() => {
    const reason = media.snapshot.blockingReason
    if (reason === previousMediaBlockRef.current) return
    previousMediaBlockRef.current = reason
    if (!reason || state.stage !== 'exam' || state.readiness.usedGuidedSignals) return

    if (reason === 'multiple-faces') {
      dispatch({ type: 'PAUSE_EXAM', kind: 'multiple-faces', detail: 'More than one face remained visible in the camera field.', synthetic: false })
    } else {
      dispatch({ type: 'PAUSE_EXAM', kind: 'camera', detail: reason === 'camera-stopped' ? 'The live camera stream stopped.' : 'No face remained visible long enough to verify the test view.', synthetic: false })
    }
  }, [media.snapshot.blockingReason, state.readiness.usedGuidedSignals, state.stage])

  useEffect(() => {
    if (
      state.stage === 'exam' &&
      state.exam.status === 'active' &&
      state.readiness.status === 'passed' &&
      !state.readiness.usedGuidedSignals &&
      !media.snapshot.started
    ) {
      dispatch({ type: 'PAUSE_EXAM', kind: 'camera', detail: 'The page was reopened. Camera readiness must be restored before continuing.', synthetic: false })
    }
  }, [media.snapshot.started, state.exam.status, state.readiness.status, state.readiness.usedGuidedSignals, state.stage])

  useEffect(() => {
    if (state.stage === 'result') media.stop()
  }, [media, state.stage])

  function reset() {
    clearJourney()
    media.reset()
    setHelpOpen(false)
    setReceiptOpen(false)
    dispatch({ type: 'RESET' })
  }

  const content = useMemo(() => {
    switch (state.stage) {
      case 'welcome':
        return <WelcomeScreen onStart={(mode) => dispatch({ type: 'START', mode })} />
      case 'application':
        return <ApplicationScreen state={state} onUpdate={(patch) => dispatch({ type: 'UPDATE_APPLICATION', patch })} onNext={() => dispatch({ type: 'NEXT_APPLICATION_STEP' })} onBack={() => dispatch({ type: 'PREVIOUS_APPLICATION_STEP' })} onComplete={() => dispatch({ type: 'COMPLETE_APPLICATION' })} onHelp={() => setHelpOpen(true)} />
      case 'preparation':
        return <PreparationScreen onComplete={() => dispatch({ type: 'COMPLETE_PREPARATION' })} onHelp={() => setHelpOpen(true)} />
      case 'readiness':
        return <ReadinessScreen media={media} onComplete={(usedGuidedSignals) => dispatch({ type: 'COMPLETE_READINESS', usedGuidedSignals })} onHelp={() => setHelpOpen(true)} />
      case 'rehearsal':
        return <RehearsalScreen onComplete={() => dispatch({ type: 'COMPLETE_REHEARSAL' })} />
      case 'payment':
        return <PaymentScreen state={state} onPay={() => dispatch({ type: 'PAY' })} onContinue={() => dispatch({ type: 'OPEN_EXAM_INTRO' })} onHelp={() => setHelpOpen(true)} />
      case 'exam-intro':
        return <ExamIntroScreen state={state} onStart={() => dispatch({ type: 'START_EXAM' })} />
      case 'exam':
        return <ExamScreen state={state} media={media} onHelp={() => setHelpOpen(true)} onAnswer={(answer, question, isLast, threshold) => dispatch({ type: 'ANSWER', answer, correct: answer === question.correct, isLast, passThreshold: threshold, triggerDemoInterruption: state.mode === 'guided-demo' && state.exam.currentQuestion === 2 })} />
      case 'interruption':
        return <InterruptionScreen state={state} media={media} onResume={() => dispatch({ type: 'RESUME_EXAM' })} onReconnectCamera={() => void media.start()} />
      case 'result':
        return <ResultScreen state={state} onReceipt={() => setReceiptOpen(true)} onReset={reset} />
    }
  }, [media, state])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <AppHeader state={state} onLanguage={() => dispatch({ type: 'SET_INTERFACE_LANGUAGE', language: state.interfaceLanguage === 'en' ? 'hi' : 'en' })} onHelp={() => setHelpOpen(true)} onReceipt={() => setReceiptOpen(true)} onReset={reset} />
      {!storageHealthy && <div className="storage-warning" role="alert"><TriangleAlert size={17} />This browser could not save the latest checkpoint. Do not continue until storage is available.</div>}
      {state.stage === 'welcome' ? content : (
        <div className="journey-layout">
          <JourneyRail state={state} />
          <div className="journey-main"><MobileProgress stage={state.stage} />{content}</div>
        </div>
      )}
      <footer className="site-footer"><p>Independent hackathon prototype · Synthetic data only · No government endorsement or live integration</p></footer>
      {helpOpen && <HelpPanel chapter={chapter} language={state.interfaceLanguage} onClose={() => setHelpOpen(false)} />}
      {receiptOpen && <ReceiptPanel state={state} onClose={() => setReceiptOpen(false)} />}
    </div>
  )
}

export default App

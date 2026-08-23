import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpenCheck, Camera, Check, CheckCircle2, CircleHelp,
  ClipboardCheck, Download, Eraser, FileCheck2, FileText, Flag, Info, LockKeyhole, Network, Printer,
  RefreshCcw, RotateCcw, ShieldCheck, Signal, TriangleAlert, UserRound, WifiOff,
} from 'lucide-react'
import { demoQuestions, practiceQuestion, type Question } from '../content/questions'
import { journeyReducer, type InterruptionKind, type JourneyEvent, type JourneyState } from '../domain/journey'
import { useDeviceReadiness } from '../hooks/useDeviceReadiness'
import { clearLicenceFlowDeviceData } from './devicePrivacy'
import { loadApplicationDraft } from './application'
import { createDemonstrationLicencePdf, createJourneyReceiptPdf, downloadPdf, isDemonstrationLicenceEligible, type DemonstrationLicenceData, type JourneyReceiptData } from './downloadDocuments'
import { loadExamSession, resetExamSession, saveExamSession } from './examSession'
import { isPaymentConfirmed } from './payment'
import { completeTutorial, loadJourneyProgress, saveJourneyProgress } from './progress'
import { navigatePortal } from './router'

type Language = 'en' | 'hi'
type StageChange = (label: string) => void

const local = (language: Language, en: string, hi: string) => language === 'hi' ? hi : en
const questionPrompt = (question: Question, language: Language) => language === 'hi' ? question.promptHi ?? question.prompt : question.prompt
const questionOptions = (question: Question, language: Language) => language === 'hi' ? question.optionsHi ?? question.options : question.options
const questionExplanation = (question: Question, language: Language) => language === 'hi' ? question.explanationHi ?? question.explanation : question.explanation

function FlowLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigatePortal(href)
  }
  return <a href={href} className={className} onClick={open}>{children}</a>
}

function Breadcrumbs({ applicationId, current, language }: { applicationId: string; current: string; language: Language }) {
  return <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'पथ')}><ol><li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li><li><FlowLink href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></li><li><span aria-current="page">{current}</span></li></ol></nav>
}

function Guard({ applicationId, title, body, route, action, language }: { applicationId: string; title: string; body: string; route: string; action: string; language: Language }) {
  return <><Breadcrumbs applicationId={applicationId} current={title} language={language} /><section className="route-guard"><LockKeyhole size={30} /><p className="eyebrow">{local(language, 'Previous stage required', 'पिछला चरण आवश्यक')}</p><h1 tabIndex={-1}>{title}</h1><p>{body}</p><FlowLink className="button button--primary" href={route}>{action}</FlowLink></section></>
}

export function TutorialPage({ applicationId, onStageChange, language }: { applicationId: string; onStageChange: StageChange; language: Language }) {
  const [progress, setProgress] = useState(() => loadJourneyProgress(applicationId))
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const correct = selected === practiceQuestion.correct
  if (!isPaymentConfirmed(progress.payment)) return <Guard applicationId={applicationId} language={language} title={local(language, 'Complete payment first', 'पहले भुगतान पूरा करें')} body={local(language, 'The learning and secure-test stages unlock only after the saved sandbox payment is confirmed.', 'सीखने और सुरक्षित परीक्षा के चरण सैंडबॉक्स भुगतान पुष्ट होने के बाद ही खुलते हैं।')} route={`/mp/application/${applicationId}/payment`} action={local(language, 'Open fee payment', 'शुल्क भुगतान खोलें')} />

  const complete = () => {
    const updated = completeTutorial(progress)
    saveJourneyProgress(updated)
    setProgress(updated)
    onStageChange(local(language, 'LL test entry', 'एलएल परीक्षा प्रवेश'))
    navigatePortal(`/mp/application/${applicationId}/test-entry`)
  }
  const options = questionOptions(practiceQuestion, language)

  return (
    <>
      <Breadcrumbs applicationId={applicationId} current={local(language, 'Road safety learning', 'सड़क सुरक्षा सीख')} language={language} />
      <section className="page-title">
        <div>
          <p className="eyebrow">{local(language, 'Learn before the test', 'परीक्षा से पहले सीखें')}</p>
          <h1 tabIndex={-1}>{local(language, 'Road safety learning and preparation', 'सड़क सुरक्षा सीख और तैयारी')}</h1>
          <p>{local(language, 'A quick active learning module to prepare you for the test. These are educational sample examples.', 'परीक्षा की तैयारी के लिए छोटा सीखने का मॉड्यूल। ये केवल शैक्षिक उदाहरण हैं।')}</p>
        </div>
      </section>
      <section className="test-learning-grid" aria-label={local(language, 'Learning topics', 'सीखने के विषय')}>
        <article>
          <span><BookOpenCheck size={22} /></span>
          <h2>{local(language, 'Signs and signals', 'चिह्न और संकेत')}</h2>
          <p>{local(language, 'Understand road signs and what they mean.', 'सड़क के संकेतों और उनके अर्थ को समझें।')}</p>
        </article>
        <article>
          <span><ShieldCheck size={22} /></span>
          <h2>{local(language, 'Safety and priority', 'सुरक्षा और प्राथमिकता')}</h2>
          <p>{local(language, 'Give way to pedestrians and emergency vehicles.', 'पैदल यात्रियों और एम्बुलेंस को रास्ता दें।')}</p>
        </article>
        <article>
          <span><FileText size={22} /></span>
          <h2>{local(language, 'Rules and documents', 'नियम और दस्तावेज़')}</h2>
          <p>{local(language, 'Know driving rules and required documents.', 'ड्राइविंग के नियम और जरूरी दस्तावेज़ जानें।')}</p>
        </article>
      </section>
      <fieldset className="lf-question-card">
        <legend>{local(language, 'Learning question', 'सीखने का प्रश्न')}</legend>
        <h2>{questionPrompt(practiceQuestion, language)}</h2>
        <div className="lf-answer-options">
          {options.map((option, index) => (
            <label className={selected === index ? 'selected' : ''} key={option}>
              <input type="radio" name="tutorial-answer" checked={selected === index} onChange={() => { setSelected(index); setChecked(false) }} />
              <span>{String.fromCharCode(65 + index)}</span>
              <strong>{option}</strong>
            </label>
          ))}
        </div>
      </fieldset>
      {checked && (
        <div className={correct ? 'test-feedback test-feedback--success' : 'test-feedback test-feedback--retry'} role="status">
          {correct ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}
          <div>
            <strong>{correct ? local(language, 'Correct! Learning check complete.', 'सही जवाब! सीखने का चरण पूरा हुआ।') : local(language, 'Not quite. Read the explanation and try again.', 'उत्तर सही नहीं है। व्याख्या पढ़ें और दोबारा प्रयास करें।')}</strong>
            <p>{questionExplanation(practiceQuestion, language)}</p>
          </div>
        </div>
      )}
      <details className="context-help">
        <summary><CircleHelp size={18} /> {local(language, 'What should I study?', 'मुझे क्या पढ़ना चाहिए?')}</summary>
        <div>
          <p>{local(language, 'Use official transport handbook guidelines for complete preparation. This demo gives a quick overview.', 'पूरी तैयारी के लिए आधिकारिक पुस्तिका और नियमों का अध्ययन करें। यह डेमो एक त्वरित अवलोकन देता है।')}</p>
        </div>
      </details>
      <div className="lf-actions">
        {!checked || !correct ? (
          <button className="button button--primary" disabled={selected === null} onClick={() => setChecked(true)}>
            {local(language, 'Check answer', 'उत्तर जाँचें')} <ArrowRight size={18} />
          </button>
        ) : (
          <button className="button button--primary" onClick={complete}>
            {local(language, 'Continue to online test', 'ऑनलाइन टेस्ट पर जाएँ')} <ArrowRight size={18} />
          </button>
        )}
        <FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary">
          <ArrowLeft size={18} /> {local(language, 'Application status', 'आवेदन स्थिति')}
        </FlowLink>
      </div>
    </>
  )
}

function routeForSession(applicationId: string, state: JourneyState): string {
  if (state.stage === 'exam') return `/mp/application/${applicationId}/test`
  if (state.stage === 'interruption') return `/mp/application/${applicationId}/test-interruption`
  if (state.stage === 'result') return `/mp/application/${applicationId}/result`
  return `/mp/application/${applicationId}/test-entry`
}

export function TestEntryPage({ applicationId, onStageChange, language }: { applicationId: string; onStageChange: StageChange; language: Language }) {
  const progress = loadJourneyProgress(applicationId)
  const [accepted, setAccepted] = useState(false)
  const [session, setSession] = useState(() => loadExamSession(applicationId, progress))
  if (progress.tutorial.status !== 'completed') return <Guard applicationId={applicationId} language={language} title={local(language, 'Complete the tutorial first', 'पहले सीखने का भाग पूरा करें')} body={local(language, 'The test starts only after the learning check is completed.', 'सीखने की जाँच पूरी होने के बाद ही परीक्षा शुरू होती है।')} route={`/mp/application/${applicationId}/tutorial`} action={local(language, 'Open road-safety tutorial', 'सड़क सुरक्षा सीख खोलें')} />
  const fresh = session.stage === 'exam-intro'
  const start = () => {
    const base = session.stage === 'result' ? resetExamSession(applicationId, progress) : session
    const next = journeyReducer(base, { type: 'START_EXAM' })
    saveExamSession(applicationId, next)
    setSession(next)
    onStageChange(local(language, 'LL test in progress', 'एलएल परीक्षा जारी'))
    navigatePortal(`/mp/application/${applicationId}/test`)
  }
  return (
    <>
      <Breadcrumbs applicationId={applicationId} current={local(language, 'Online test instructions', 'ऑनलाइन टेस्ट निर्देश')} language={language} />
      <section className="page-title">
        <div>
          <p className="eyebrow">{local(language, 'Demo test', 'डेमो टेस्ट')}</p>
          <h1 tabIndex={-1}>{local(language, 'Instructions for the online test', 'ऑनलाइन टेस्ट के नियम और निर्देश')}</h1>
          <p>{local(language, 'This is a 5-question demo test to show how the online examination works.', 'यह 5 प्रश्नों का डेमो टेस्ट है जो दिखाता है कि ऑनलाइन परीक्षा कैसे होती है।')}</p>
        </div>
      </section>
      <section className="test-instruction-grid">
        <article>
          <span><FileText size={21} /></span>
          <div>
            <strong>{local(language, '5 questions', '5 प्रश्न')}</strong>
            <small>{local(language, 'Score 3 or more to pass', 'पास होने के लिए 3 या अधिक सही करें')}</small>
          </div>
        </article>
        <article>
          <span><LockKeyhole size={21} /></span>
          <div>
            <strong>{local(language, 'Answers saved automatically', 'उत्तर अपने-आप सहेजे जाते हैं')}</strong>
            <small>{local(language, 'Each answer is saved as you proceed', 'आगे बढ़ने पर हर उत्तर सुरक्षित रहता है')}</small>
          </div>
        </article>
        <article>
          <span><Camera size={21} /></span>
          <div>
            <strong>{progress.readiness.mode === 'guided-signals' ? local(language, 'Demo camera simulation', 'डेमो कैमरा सिमुलेशन') : local(language, 'Camera monitoring', 'कैमरा निगरानी')}</strong>
            <small>{local(language, 'Checks you are visible during the test', 'जाँचता है कि आप परीक्षा के दौरान सामने हैं')}</small>
          </div>
        </article>
        <article>
          <span><CircleHelp size={21} /></span>
          <div>
            <strong>{local(language, 'Technical support', 'तकनीकी मदद')}</strong>
            <small>{local(language, 'Help is available for camera or connection issues', 'कैमरा या कनेक्शन समस्या में मदद मिलेगी')}</small>
          </div>
        </article>
      </section>
      <div className="test-declaration">
        <Info size={20} />
        <p>{local(language, 'This prototype demonstrates a clean test flow with honest recovery. It does not provide full proctoring lockdown.', 'यह प्रोटोटाइप स्पष्ट टेस्ट और रिकवरी दिखाता है। इसमें पूरा प्रॉक्टरिंग लॉकडाउन नहीं है।')}</p>
      </div>
      {fresh ? (
        <label className="consent-box">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
          <span>
            <strong>{local(language, 'I understand this is a demo test.', 'मैं समझता/समझती हूँ कि यह एक डेमो टेस्ट है।')}</strong>
            <small>{local(language, 'No official licence or government record is created.', 'इससे कोई सरकारी रिकॉर्ड या आधिकारिक लाइसेंस नहीं बनता।')}</small>
          </span>
        </label>
      ) : (
        <div className="lf-success-note">
          <RefreshCcw size={20} />
          <div>
            <strong>{local(language, 'A saved test session exists.', 'एक सहेजा गया टेस्ट सत्र मौजूद है।')}</strong>
            <p>{local(language, 'You can resume from where you left off.', 'आप वहीं से शुरू कर सकते हैं जहाँ आपने छोड़ा था।')}</p>
          </div>
        </div>
      )}
      <div className="lf-actions">
        {fresh ? (
          <button className="button button--primary" disabled={!accepted} onClick={start}>
            {local(language, 'Start 5-question demo test', '5 प्रश्नों का डेमो टेस्ट शुरू करें')} <ArrowRight size={18} />
          </button>
        ) : (
          <FlowLink className="button button--primary" href={routeForSession(applicationId, session)}>
            {local(language, 'Resume saved test', 'सहेजा गया टेस्ट जारी रखें')} <ArrowRight size={18} />
          </FlowLink>
        )}
        <FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary">
          <ArrowLeft size={18} /> {local(language, 'Application status', 'आवेदन स्थिति')}
        </FlowLink>
      </div>
    </>
  )
}

function MiniCamera({ guided, stream, language }: { guided: boolean; stream: MediaStream | null; language: Language }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; return () => { if (ref.current) ref.current.srcObject = null } }, [stream])
  return (
    <div className="test-mini-camera">
      {stream && !guided ? (
        <video ref={ref} autoPlay muted playsInline aria-label={local(language, 'Live test camera', 'लाइव परीक्षा कैमरा')} />
      ) : (
        <div>
          <UserRound size={42} />
          <span>{guided ? local(language, 'DEMO CAMERA SIGNAL', 'डेमो कैमरा संकेत') : local(language, 'CAMERA WAITING', 'कैमरे की प्रतीक्षा')}</span>
        </div>
      )}
      <small><ShieldCheck size={14} /> {local(language, 'No recording', 'रिकॉर्डिंग नहीं')}</small>
    </div>
  )
}

export function TestPage({ applicationId, onStageChange, language }: { applicationId: string; onStageChange: StageChange; language: Language }) {
  const progress = loadJourneyProgress(applicationId)
  const [state, setState] = useState(() => loadExamSession(applicationId, progress))
  const [selected, setSelected] = useState<number | null>(null)
  const media = useDeviceReadiness()
  const guided = progress.readiness.mode === 'guided-signals'
  const question = demoQuestions[state.exam.currentQuestion]
  useEffect(() => { if (guided && !media.snapshot.started) media.useGuidedSignals() }, [guided, media])
  useEffect(() => {
    const pauseForVisibility = () => {
      if (!document.hidden || state.stage !== 'exam' || state.exam.status !== 'active') return
      const next = journeyReducer(state, { type: 'PAUSE_EXAM', kind: 'visibility', detail: 'The test page became hidden; the latest saved answer remains protected.', synthetic: false })
      saveExamSession(applicationId, next); setState(next); navigatePortal(`/mp/application/${applicationId}/test-interruption`)
    }
    document.addEventListener('visibilitychange', pauseForVisibility)
    return () => document.removeEventListener('visibilitychange', pauseForVisibility)
  }, [applicationId, state])
  useEffect(() => {
    if (state.stage !== 'exam' || state.exam.status !== 'active' || guided) return
    const reason = media.snapshot.blockingReason
    if (!reason && media.snapshot.online) return
    const kind: InterruptionKind = !media.snapshot.online ? 'network-real' : reason === 'multiple-faces' ? 'multiple-faces' : 'camera'
    const detail = !media.snapshot.online ? 'The browser reported a real network loss.' : reason === 'multiple-faces' ? 'More than one face remained visible in the camera field.' : 'The live camera signal could not verify one visible face.'
    const next = journeyReducer(state, { type: 'PAUSE_EXAM', kind, detail, synthetic: false })
    saveExamSession(applicationId, next); setState(next); navigatePortal(`/mp/application/${applicationId}/test-interruption`)
  }, [applicationId, guided, media.snapshot.blockingReason, media.snapshot.online, state])
  if (state.stage !== 'exam' || !question) return <Guard applicationId={applicationId} language={language} title={local(language, 'Open the saved test stage', 'सहेजा परीक्षा चरण खोलें')} body={local(language, 'This route follows the persisted exam state.', 'यह पेज सहेजी हुई परीक्षा स्थिति का अनुसरण करता है।')} route={routeForSession(applicationId, state)} action={local(language, 'Continue saved session', 'सहेजा सत्र जारी रखें')} />

  const mediaReady = guided ? media.snapshot.started : media.ready
  const needsCameraStart = !guided && !media.snapshot.started
  const coaching = media.snapshot.coachingReason === 'multiple-faces'
    ? { title: local(language, 'Only one person should be visible', 'कैमरे में सिर्फ एक व्यक्ति होना चाहिए'), body: local(language, 'Ask others to step away from the camera.', 'दूसरों को कैमरे से दूर जाने को कहें।') }
    : media.snapshot.coachingReason === 'no-face'
      ? { title: local(language, 'Please stay in camera view', 'कृपया कैमरे के सामने रहें'), body: local(language, 'Position your face inside the camera guide.', 'अपना चेहरा कैमरे के बीच में रखें।') }
      : media.snapshot.coachingReason === 'framing'
        ? { title: local(language, 'Adjust your camera position', 'कैमरे की स्थिति ठीक करें'), body: local(language, 'Move closer to the center of the camera.', 'कैमरे के बीच में थोड़ा पास आएँ।') }
        : media.snapshot.coachingReason === 'lighting'
          ? { title: local(language, 'Improve lighting on your face', 'चेहरे पर रोशनी ठीक करें'), body: local(language, 'Turn on light or move to a brighter spot.', 'उजाले में बैठें या लाइट चालू करें।') }
          : null
  const saveAnswer = () => {
    if (selected === null) return
    const next = journeyReducer(state, { type: 'ANSWER', answer: selected, correct: selected === question.correct, isLast: state.exam.currentQuestion === demoQuestions.length - 1, passThreshold: 3, triggerDemoInterruption: state.exam.currentQuestion === 2 })
    saveExamSession(applicationId, next); setState(next); setSelected(null)
    if (next.stage === 'interruption') navigatePortal(`/mp/application/${applicationId}/test-interruption`)
    if (next.stage === 'result') { onStageChange(local(language, 'View result and receipt', 'परिणाम और रसीद देखें')); navigatePortal(`/mp/application/${applicationId}/result`) }
  }
  const answers = questionOptions(question, language)
  const savedCount = Object.keys(state.exam.answers).length

  return (
    <>
      <Breadcrumbs applicationId={applicationId} current={local(language, 'Online test', 'ऑनलाइन टेस्ट')} language={language} />
      <div className="test-live-bar">
        <span><LockKeyhole size={16} />{local(language, 'Answers saved on device', 'उत्तर सुरक्षित')}</span>
        <span><Signal size={16} />{media.snapshot.online ? local(language, 'Internet connected', 'इंटरनेट चालू') : local(language, 'Offline', 'ऑफलाइन')}</span>
        <span><Camera size={16} />{guided ? local(language, 'Demo camera active', 'डेमो कैमरा सक्रिय') : mediaReady ? local(language, 'Camera active', 'कैमरा चालू') : local(language, 'Camera check required', 'कैमरा जाँच आवश्यक')}</span>
      </div>
      <section className="test-workspace">
        <div className="test-question-area">
          <div className="test-question-heading">
            <div>
              <p className="eyebrow">{local(language, `Question ${state.exam.currentQuestion + 1} of ${demoQuestions.length}`, `प्रश्न ${state.exam.currentQuestion + 1} / ${demoQuestions.length}`)}</p>
              <h1 tabIndex={-1}>{questionPrompt(question, language)}</h1>
            </div>
            <span>{local(language, `${savedCount} saved`, `${savedCount} सहेजे`)}</span>
          </div>
          <fieldset className="test-answer-fieldset">
            <legend className="visually-hidden">{local(language, 'Choose one answer', 'एक उत्तर चुनें')}</legend>
            {answers.map((option, index) => (
              <label className={selected === index ? 'selected' : ''} key={option}>
                <input type="radio" name="test-answer" checked={selected === index} onChange={() => setSelected(index)} />
                <span>{String.fromCharCode(65 + index)}</span>
                <strong>{option}</strong>
              </label>
            ))}
          </fieldset>
          <div className="test-save-note">
            <LockKeyhole size={17} />
            <span>{local(language, 'Your answer is saved when you click “Save answer and continue”.', '“उत्तर सहेजें और आगे बढ़ें” दबाने पर उत्तर सुरक्षित होगा।')}</span>
          </div>
          <button className="button button--primary" disabled={selected === null || !mediaReady} onClick={saveAnswer}>
            {state.exam.currentQuestion === demoQuestions.length - 1 ? local(language, 'Save answer and finish', 'उत्तर सहेजें और पूरा करें') : local(language, 'Save answer and continue', 'उत्तर सहेजें और आगे बढ़ें')} <ArrowRight size={18} />
          </button>
        </div>
        <aside className={`test-observation-panel ${coaching || needsCameraStart ? 'test-observation-panel--coach' : ''}`} aria-live="polite">
          <div className="test-monitoring-state">
            {coaching || needsCameraStart ? <TriangleAlert size={22} /> : <ShieldCheck size={22} />}
            <div>
              <h2>{needsCameraStart ? local(language, 'Camera check required', 'कैमरा जाँच आवश्यक') : coaching?.title ?? local(language, 'Monitoring quietly', 'निगरानी जारी है')}</h2>
              <p>{needsCameraStart ? local(language, 'Reconnect camera before saving this answer.', 'यह उत्तर सहेजने से पहले कैमरा फिर जोड़ें।') : coaching?.body ?? local(language, 'Everything is working normally.', 'सब कुछ ठीक काम कर रहा है।')}</p>
            </div>
          </div>
          {needsCameraStart && (
            <button className="button button--secondary button--full" onClick={() => void media.start()}>
              {local(language, 'Reconnect camera', 'कैमरा फिर जोड़ें')}
            </button>
          )}
          <details className="test-camera-details">
            <summary>{local(language, 'View camera status', 'कैमरा स्थिति देखें')}</summary>
            <MiniCamera guided={guided} stream={media.stream} language={language} />
          </details>
          <h2>{local(language, 'Technical help only', 'केवल तकनीकी सहायता')}</h2>
          <p>{local(language, 'We can assist with camera and connection issues. We cannot give exam answers.', 'हम कैमरा या इंटरनेट समस्या में मदद कर सकते हैं, उत्तर नहीं बता सकते।')}</p>
          <dl>
            <div><dt>{local(language, 'Payment', 'भुगतान')}</dt><dd>{local(language, 'Confirmed', 'पुष्ट')}</dd></div>
            <div><dt>{local(language, 'Latest checkpoint', 'नवीनतम चेकपॉइंट')}</dt><dd>{savedCount === 0 ? local(language, 'No answer saved yet', 'अभी कोई उत्तर सहेजा नहीं') : local(language, `Question ${savedCount} saved`, `प्रश्न ${savedCount} सहेजा`)}</dd></div>
          </dl>
        </aside>
      </section>
    </>
  )
}

function translatedInterruptionDetail(detail: string, language: Language): string {
  if (language === 'en') return detail
  if (detail.includes('Demo network interruption')) return 'प्रश्न 3 के बाद तैयार नेटवर्क बाधा; सहेजा उत्तर सुरक्षित रहा।'
  if (detail.includes('page became hidden')) return 'परीक्षा पेज छिप गया; नवीनतम सहेजा उत्तर सुरक्षित है।'
  if (detail.includes('network loss')) return 'ब्राउज़र ने वास्तविक नेटवर्क टूटने की सूचना दी।'
  if (detail.includes('More than one face')) return 'कैमरे में एक से अधिक चेहरे लगातार दिखाई दिए।'
  return 'लाइव कैमरा संकेत एक दिखाई दे रहे चेहरे की पुष्टि नहीं कर सका।'
}

export function InterruptionPage({ applicationId, onStageChange, language }: { applicationId: string; onStageChange: StageChange; language: Language }) {
  const progress = loadJourneyProgress(applicationId)
  const [state, setState] = useState(() => loadExamSession(applicationId, progress))
  if (state.stage !== 'interruption') return <Guard applicationId={applicationId} language={language} title={local(language, 'No active interruption', 'कोई सक्रिय बाधा नहीं')} body={local(language, 'Continue from the current saved test stage.', 'वर्तमान सहेजे परीक्षा चरण से जारी रखें।')} route={routeForSession(applicationId, state)} action={local(language, 'Continue saved session', 'सहेजा सत्र जारी रखें')} />
  const integrity = state.exam.interruptionKind === 'multiple-faces'
  const resume = () => {
    const next = journeyReducer(state, { type: 'RESUME_EXAM' })
    saveExamSession(applicationId, next); setState(next)
    onStageChange(local(language, 'LL test in progress', 'एलएल परीक्षा जारी'))
    navigatePortal(`/mp/application/${applicationId}/test`)
  }
  return (
    <>
      <Breadcrumbs applicationId={applicationId} current={local(language, 'Test paused', 'परीक्षा रुकी')} language={language} />
      <section className="interruption-card">
        <span className="interruption-card__icon">{integrity ? <Camera size={31} /> : <WifiOff size={31} />}</span>
        <p className="eyebrow">{integrity ? local(language, 'Camera observation · not a penalty', 'कैमरा संकेत · कोई पेनल्टी नहीं') : local(language, 'Technical pause · test is not failed', 'तकनीकी रुकावट · टेस्ट फेल नहीं हुआ')}</p>
        <h1 tabIndex={-1}>{integrity ? local(language, 'More than one person was detected.', 'कैमरे में एक से अधिक व्यक्ति दिखे।') : local(language, 'The test paused safely without losing your answer.', 'आपका उत्तर सुरक्षित रखकर परीक्षा रोकी गई।')}</h1>
        <p>{translatedInterruptionDetail(state.exam.interruptionDetail ?? '', language)}</p>
        <div className="recovery-facts">
          <div><span>{local(language, 'Latest answer', 'पिछला उत्तर')}</span><strong>{local(language, 'Saved', 'सहेजा गया')}</strong></div>
          <div><span>{local(language, 'Payment', 'भुगतान')}</span><strong>{local(language, 'Confirmed', 'पुष्ट')}</strong></div>
          <div><span>{local(language, 'Test progress', 'प्रगति')}</span><strong>{local(language, 'Not lost', 'सुरक्षित')}</strong></div>
          <div><span>{local(language, 'Resume point', 'यहाँ से जारी करें')}</span><strong>{local(language, `Question ${state.exam.currentQuestion + 1}`, `प्रश्न ${state.exam.currentQuestion + 1}`)}</strong></div>
        </div>
        <div className="lf-actions">
          <button className="button button--primary" onClick={resume}>
            {local(language, 'Resume test', 'टेस्ट फिर शुरू करें')} <RefreshCcw size={18} />
          </button>
          <FlowLink className="button button--secondary" href={`/mp/application/${applicationId}`}>
            {local(language, 'Application status', 'आवेदन स्थिति')}
          </FlowLink>
        </div>
      </section>
    </>
  )
}

function eventText(event: JourneyEvent, language: Language): { title: string; detail: string; source: string } {
  if (language === 'en') return { title: event.title, detail: event.detail, source: event.synthetic ? 'Demo event' : 'Browser event' }
  const questionMatch = event.title.match(/^Question (\d+) saved$/)
  const title = questionMatch ? `प्रश्न ${questionMatch[1]} सहेजा` : ({
    'Device readiness passed': 'डिवाइस जाँच सफल',
    'Secure-test rehearsal completed': 'सुरक्षित परीक्षा अभ्यास पूरा',
    'Synthetic payment recorded': 'डेमो भुगतान दर्ज',
    'Road-safety tutorial completed': 'सड़क सुरक्षा सीख पूरी',
    'Synthetic learner test started': 'डेमो लर्नर परीक्षा शुरू',
    'Technical interruption paused the test': 'तकनीकी बाधा से परीक्षा रुकी',
    'Test resumed from saved checkpoint': 'सहेजे चेकपॉइंट से परीक्षा जारी',
    'Knowledge simulation passed': 'ज्ञान परीक्षा सफल',
    'Knowledge simulation not passed': 'ज्ञान परीक्षा सफल नहीं',
    'Demonstration LL created': 'डेमो एलएल बनाया गया',
  } as Record<string, string>)[event.title] ?? event.title
  let detail = event.detail
  if (detail.includes('Answer checkpoint preserved')) detail = 'आगे बढ़ने से पहले उत्तर चेकपॉइंट सुरक्षित किया गया।'
  else if (detail.includes('no bank or treasury')) detail = `${detail.split(' · ')[0]} · कोई बैंक या कोषागार जुड़ा नहीं`
  else if (detail.includes('Guided camera-derived')) detail = 'निर्देशित कैमरा संकेत; ब्राउज़र स्टोरेज, कनेक्शन और सुरक्षित संदर्भ की जाँच वास्तविक रही।'
  else if (detail.includes('Sample answer checkpoint')) detail = 'नमूना उत्तर चेकपॉइंट और वापसी व्यवहार पूरा हुआ।'
  else if (detail.includes('Prototype learning pack')) detail = 'प्रोटोटाइप अध्ययन सामग्री और अभ्यास प्रश्न पूरे हुए।'
  else if (detail.includes('question judge demo')) detail = '5 प्रश्नों का निर्णायक प्रदर्शन · आधिकारिक मध्य प्रदेश व्यवस्था नहीं।'
  else if (detail.includes('Demo network interruption')) detail = 'प्रश्न 3 के बाद तैयार नेटवर्क बाधा; उत्तर सुरक्षित रहा।'
  else if (detail.includes('answer(s) preserved')) detail = `${detail.match(/\d+/)?.[0] ?? '0'} उत्तर सुरक्षित · दोबारा भुगतान नहीं`
  else if (detail.includes('correct · LicenceFlow')) detail = `${detail.match(/\d+/)?.[0] ?? '0'} सही · LicenceFlow सिमुलेशन सीमा 3`
  else if (detail.includes('Not a government licence')) detail = 'सरकारी लाइसेंस नहीं और वाहन चलाने के लिए मान्य नहीं।'
  return { title, detail, source: event.synthetic ? 'डेमो घटना' : 'ब्राउज़र घटना' }
}

function eventTime(at: string, language: Language): string {
  const formatted = new Date(at).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })
  return language === 'hi' ? formatted.replace(/\bam\b/i, 'पूर्वाह्न').replace(/\bpm\b/i, 'अपराह्न') : formatted
}

export function ResultPage({ applicationId, onStageChange, language }: { applicationId: string; onStageChange: StageChange; language: Language }) {
  const progress = loadJourneyProgress(applicationId)
  const [state, setState] = useState(() => loadExamSession(applicationId, progress))
  const [confirmClear, setConfirmClear] = useState(false)
  const [documentStatus, setDocumentStatus] = useState<'idle' | 'licence' | 'receipt' | 'licence-ready' | 'receipt-ready' | 'error'>('idle')
  if (state.stage !== 'result') return <Guard applicationId={applicationId} language={language} title={local(language, 'Result not available yet', 'परिणाम अभी उपलब्ध नहीं')} body={local(language, 'Complete the saved synthetic test before opening its outcome.', 'परिणाम खोलने से पहले सहेजी सिंथेटिक परीक्षा पूरी करें।')} route={routeForSession(applicationId, state)} action={local(language, 'Continue saved session', 'सहेजा सत्र जारी रखें')} />
  const passed = state.exam.knowledgeResult === 'passed'
  const eligible = isDemonstrationLicenceEligible({
    paymentConfirmed: isPaymentConfirmed(progress.payment),
    tutorialCompleted: progress.tutorial.status === 'completed',
    examCompleted: state.exam.status === 'completed',
    knowledgePassed: passed,
  })
  const draft = loadApplicationDraft()
  const matchingDraft = draft?.applicationId === applicationId ? draft : null
  const holderName = matchingDraft
    ? [matchingDraft.firstName, matchingDraft.middleName, matchingDraft.lastName].filter(Boolean).join(' ') || state.application.fullName
    : state.application.fullName
  const completedAt = [...state.events].reverse().find((event) => event.kind === 'EXAM_COMPLETED')?.at ?? progress.updatedAt
  const licenceData: DemonstrationLicenceData = {
    applicationId,
    holderName: holderName || local(language, 'Demo MP applicant', 'डेमो मध्य प्रदेश आवेदक'),
    dateOfBirth: matchingDraft?.dateOfBirth,
    vehicleClasses: matchingDraft?.vehicleClasses.length ? matchingDraft.vehicleClasses : state.application.vehicleClass.split(/\s*\+\s*/).filter(Boolean),
    completedAt,
    paymentReference: progress.payment.reference,
  }
  const receiptData: JourneyReceiptData = {
    ...licenceData,
    correctAnswers: state.exam.correctAnswers,
    totalQuestions: demoQuestions.length,
    interruptionRecovered: state.exam.interruptionSeen,
    integrityStatus: state.exam.integrityStatus,
    events: state.events.map((event) => {
      const translated = eventText(event, language)
      return { ...event, title: translated.title, detail: translated.detail }
    }),
  }
  const reset = () => {
    const next = resetExamSession(applicationId, progress)
    setState(next); onStageChange(local(language, 'LL test entry', 'एलएल परीक्षा प्रवेश'))
    navigatePortal(`/mp/application/${applicationId}/test-entry`)
  }
  const downloadLicence = async () => {
    if (!eligible || documentStatus === 'licence' || documentStatus === 'receipt') return
    setDocumentStatus('licence')
    try {
      const pdf = await createDemonstrationLicencePdf(licenceData, language)
      downloadPdf(pdf, `LicenceFlow-${applicationId}-demonstration-LL.pdf`)
      setDocumentStatus('licence-ready')
    } catch {
      setDocumentStatus('error')
    }
  }
  const downloadReceipt = async () => {
    if (documentStatus === 'licence' || documentStatus === 'receipt') return
    setDocumentStatus('receipt')
    try {
      const pdf = await createJourneyReceiptPdf(receiptData, language)
      downloadPdf(pdf, `LicenceFlow-${applicationId}-journey-receipt.pdf`)
      setDocumentStatus('receipt-ready')
    } catch {
      setDocumentStatus('error')
    }
  }
  const clearDevice = () => { clearLicenceFlowDeviceData(); window.location.assign('/') }
  const busy = documentStatus === 'licence' || documentStatus === 'receipt'
  return (
    <>
      <Breadcrumbs applicationId={applicationId} current={local(language, 'Test result', 'परीक्षा परिणाम')} language={language} />
      <section className={`result-hero ${passed ? 'result-hero--passed' : ''}`}>
        <span>{passed ? <CheckCircle2 size={34} /> : <Flag size={34} />}</span>
        <div>
          <p className="eyebrow">{passed ? local(language, 'Application complete', 'आवेदन पूरा हुआ') : local(language, 'Demo test result', 'डेमो टेस्ट परिणाम')}</p>
          <h1 tabIndex={-1}>{passed ? local(language, 'Congratulations! You passed the demo test', 'बधाई हो! आपने डेमो टेस्ट पास कर लिया') : local(language, 'You did not pass the demo test this time', 'इस बार आप डेमो टेस्ट पास नहीं कर सके')}</h1>
          <p>{local(language, `${state.exam.correctAnswers} of ${demoQuestions.length} answers correct · pass mark is 3. This is a demo document.`, `${demoQuestions.length} में से ${state.exam.correctAnswers} उत्तर सही · पास अंक 3 हैं। यह एक डेमो दस्तावेज़ है।`)}</p>
        </div>
      </section>
      <section className="outcome-grid">
        <article>
          <span><BookOpenCheck size={23} /></span>
          <div>
            <small>{local(language, 'Test result', 'टेस्ट परिणाम')}</small>
            <strong>{passed ? local(language, 'Passed', 'पास') : local(language, 'Not passed', 'पास नहीं')}</strong>
            <p>{local(language, 'Based on saved answers.', 'सहेजे उत्तरों पर आधारित।')}</p>
          </div>
        </article>
        <article>
          <span><Network size={23} /></span>
          <div>
            <small>{local(language, 'Technical status', 'तकनीकी स्थिति')}</small>
            <strong>{state.exam.interruptionSeen ? local(language, 'Recovered safely', 'सुरक्षित वापसी') : local(language, 'Normal test', 'सामान्य टेस्ट')}</strong>
            <p>{state.exam.interruptionSeen ? local(language, 'Answers and payment remained intact.', 'उत्तर और भुगतान सुरक्षित रहे।') : local(language, 'Completed normally.', 'प्रक्रिया सामान्य रूप से पूरी हुई।')}</p>
          </div>
        </article>
        <article>
          <span><ShieldCheck size={23} /></span>
          <div>
            <small>{local(language, 'Monitoring status', 'निगरानी स्थिति')}</small>
            <strong>{state.exam.integrityStatus === 'observation-recorded' ? local(language, 'Observation recorded', 'अवलोकन दर्ज') : local(language, 'Completed with no flags', 'बिना किसी समस्या के पूरा हुआ')}</strong>
            <p>{local(language, 'A camera signal is never taken as proof of cheating.', 'कैमरा संकेत को कभी नकल का प्रमाण नहीं माना जाता।')}</p>
          </div>
        </article>
      </section>
      {eligible ? (
        <>
          <section className="demo-licence">
            <div className="demo-licence__watermark">{local(language, 'NOT VALID', 'मान्य नहीं')}</div>
            <div>
              <p>मध्य प्रदेश · {local(language, "LEARNER'S LICENCE", 'लर्नर लाइसेंस')}</p>
              <strong>{local(language, 'DEMO DOCUMENT', 'डेमो दस्तावेज़')}</strong>
            </div>
            <dl>
              <div><dt>{local(language, 'Application', 'आवेदन')}</dt><dd>{applicationId}</dd></div>
              <div><dt>{local(language, 'Holder', 'धारक')}</dt><dd>{licenceData.holderName}</dd></div>
              <div><dt>{local(language, 'Vehicle classes', 'वाहन वर्ग')}</dt><dd>{licenceData.vehicleClasses.join(', ') || local(language, 'Not recorded', 'दर्ज नहीं')}</dd></div>
              <div><dt>{local(language, 'Government record', 'सरकारी रिकॉर्ड')}</dt><dd>{local(language, 'Not a government record', 'सरकारी रिकॉर्ड नहीं')}</dd></div>
            </dl>
          </section>
          <section className="journey-receipt" aria-labelledby="document-download-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{local(language, 'Process complete', 'प्रक्रिया पूरी')}</p>
                <h2 id="document-download-title">{local(language, 'Download your demo documents', 'अपने डेमो दस्तावेज़ डाउनलोड करें')}</h2>
              </div>
              <FileCheck2 size={24} />
            </div>
            <p>{local(language, 'Both PDFs are created privately on your device. They are clearly marked NOT VALID.', 'ये PDF आपकी डिवाइस पर सुरक्षित रूप से बनते हैं। इन पर मान्य नहीं लिखा है।')}</p>
            <div className="lf-actions">
              <button className="button button--primary" disabled={busy} onClick={() => void downloadLicence()}>
                <Download size={18} /> {documentStatus === 'licence' ? local(language, 'Preparing LL PDF…', 'एलएल PDF तैयार हो रहा है…') : local(language, 'Download demo Learner’s Licence (PDF)', 'डेमो लर्नर लाइसेंस डाउनलोड करें (PDF)')}
              </button>
              <button className="button button--secondary" disabled={busy} onClick={() => void downloadReceipt()}>
                <ClipboardCheck size={18} /> {documentStatus === 'receipt' ? local(language, 'Preparing receipt…', 'रसीद तैयार हो रही है…') : local(language, 'Download Journey Receipt (PDF)', 'जर्नी रसीद डाउनलोड करें (PDF)')}
              </button>
            </div>
            <p role="status" aria-live="polite">
              {documentStatus === 'licence-ready' ? local(language, 'The demo Learner’s Licence PDF was downloaded.', 'डेमो लर्नर लाइसेंस PDF डाउनलोड हो गया।') : documentStatus === 'receipt-ready' ? local(language, 'The Journey Receipt PDF was downloaded.', 'जर्नी रसीद PDF डाउनलोड हो गई।') : documentStatus === 'error' ? local(language, 'The PDF could not be created. You can retry or use Print.', 'PDF नहीं बन सकी। दोबारा कोशिश करें या प्रिंट का उपयोग करें।') : ''}
            </p>
          </section>
        </>
      ) : (
        <section className="lf-alert">
          <Info size={20} />
          <div>
            <strong>{local(language, 'No demonstration licence was generated.', 'डेमो लाइसेंस नहीं बनाया गया।')}</strong>
            <p>{local(language, 'A demo LL is available only after confirmed payment and passing the demo test. You can still download your Journey Receipt.', 'डेमो LL केवल पुष्ट भुगतान और टेस्ट पास करने के बाद मिलता है। आप फिर भी अपनी जर्नी रसीद डाउनलोड कर सकते हैं।')}</p>
          </div>
        </section>
      )}
      <section className="journey-receipt">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{local(language, 'Journey receipt', 'यात्रा रसीद')}</p>
            <h2>{local(language, 'What happened during your test', 'आपकी परीक्षा का क्रमवार विवरण')}</h2>
          </div>
          <ClipboardCheck size={24} />
        </div>
        <ol>
          {state.events.map((event) => {
            const translated = eventText(event, language)
            return (
              <li key={event.id}>
                <span><Check size={14} /></span>
                <div>
                  <strong>{translated.title}</strong>
                  <p>{translated.detail}</p>
                  <small>{eventTime(event.at, language)} · {translated.source}</small>
                </div>
              </li>
            )
          })}
        </ol>
      </section>
      {confirmClear && (
        <section className="clear-device-confirm" role="alertdialog" aria-labelledby="clear-device-title">
          <div>
            <p className="eyebrow">{local(language, 'Device privacy', 'डिवाइस गोपनीयता')}</p>
            <h2 id="clear-device-title">{local(language, 'Clear all demo data from this device?', 'क्या इस डिवाइस से सारा डेमो डेटा हटाना है?')}</h2>
            <p>{local(language, 'This removes your demo application, test answers, payment receipt and sign-in session from this browser. It cannot be undone.', 'यह इस ब्राउज़र से डेमो आवेदन, टेस्ट उत्तर, रसीद और लॉगिन सत्र हटा देगा। इसे वापस नहीं लाया जा सकता।')}</p>
          </div>
          <div className="lf-actions">
            <button className="button button--danger" onClick={clearDevice}>
              {local(language, 'Yes, clear all data', 'हाँ, सारा डेटा हटाएँ')}
            </button>
            <button className="button button--secondary" onClick={() => setConfirmClear(false)}>
              {local(language, 'Cancel', 'रद्द करें')}
            </button>
          </div>
        </section>
      )}
      <div className="lf-actions">
        {!eligible && (
          <button className="button button--primary" disabled={busy} onClick={() => void downloadReceipt()}>
            <Download size={18} /> {documentStatus === 'receipt' ? local(language, 'Preparing receipt…', 'रसीद तैयार हो रही है…') : local(language, 'Download Journey Receipt (PDF)', 'जर्नी रसीद डाउनलोड करें (PDF)')}
          </button>
        )}
        <button className="button button--secondary" onClick={() => window.print()}>
          <Printer size={18} /> {local(language, 'Print result', 'परिणाम प्रिंट करें')}
        </button>
        <button className="button button--secondary" onClick={reset}>
          <RotateCcw size={18} /> {local(language, 'Try demo test again', 'डेमो टेस्ट दोबारा दें')}
        </button>
        <button className="text-button" onClick={() => setConfirmClear(true)}>
          <Eraser size={17} /> {local(language, 'Clear device data', 'डिवाइस डेटा हटाएँ')}
        </button>
        <FlowLink className="text-button" href={`/mp/application/${applicationId}`}>
          {local(language, 'Application status', 'आवेदन स्थिति')}
        </FlowLink>
      </div>
    </>
  )
}

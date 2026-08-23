import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpenCheck, Camera, Check, CheckCircle2, CircleHelp,
  ClipboardCheck, Eraser, FileText, Flag, Info, LockKeyhole, Network, Printer,
  RefreshCcw, RotateCcw, ShieldCheck, Signal, TriangleAlert, UserRound, WifiOff,
} from 'lucide-react'
import { demoQuestions, practiceQuestion, type Question } from '../content/questions'
import { journeyReducer, type InterruptionKind, type JourneyEvent, type JourneyState } from '../domain/journey'
import { useDeviceReadiness } from '../hooks/useDeviceReadiness'
import { clearLicenceFlowDeviceData } from './devicePrivacy'
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

  return <><Breadcrumbs applicationId={applicationId} current={local(language, 'Road-safety tutorial', 'सड़क सुरक्षा सीख')} language={language} /><section className="page-title"><div><p className="eyebrow">{local(language, 'Learn before the test', 'परीक्षा से पहले सीखें')}</p><h1 tabIndex={-1}>{local(language, 'Road-safety preparation', 'सड़क सुरक्षा की तैयारी')}</h1><p>{local(language, 'A short active learning pack replaces an unexplained mandatory video. These are educational prototype examples, not official MP test questions.', 'यह छोटा सक्रिय अध्ययन भाग बिना समझाए दिखाए जाने वाले अनिवार्य वीडियो की जगह लेता है। ये शैक्षिक प्रोटोटाइप उदाहरण हैं, आधिकारिक मध्य प्रदेश परीक्षा प्रश्न नहीं।')}</p></div></section><section className="test-learning-grid" aria-label={local(language, 'Learning topics', 'अध्ययन विषय')}><article><span><BookOpenCheck size={22} /></span><h2>{local(language, 'Signs and signals', 'चिह्न और संकेत')}</h2><p>{local(language, 'Recognise what the road is asking before reacting.', 'प्रतिक्रिया से पहले समझें कि सड़क का संकेत क्या कह रहा है।')}</p></article><article><span><ShieldCheck size={22} /></span><h2>{local(language, 'Safety and priority', 'सुरक्षा और प्राथमिकता')}</h2><p>{local(language, 'Protect pedestrians and give emergency vehicles a safe path.', 'पैदल यात्रियों की सुरक्षा करें और आपातकालीन वाहनों को रास्ता दें।')}</p></article><article><span><FileText size={22} /></span><h2>{local(language, 'Duties and documents', 'कर्तव्य और दस्तावेज')}</h2><p>{local(language, 'Understand responsible conduct, documentation and accident priorities.', 'जिम्मेदार व्यवहार, दस्तावेज और दुर्घटना की प्राथमिकताएँ समझें।')}</p></article></section><fieldset className="lf-question-card"><legend>{local(language, 'Learning check', 'सीखने की जाँच')}</legend><h2>{questionPrompt(practiceQuestion, language)}</h2><div className="lf-answer-options">{options.map((option, index) => <label className={selected === index ? 'selected' : ''} key={option}><input type="radio" name="tutorial-answer" checked={selected === index} onChange={() => { setSelected(index); setChecked(false) }} /><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong></label>)}</div></fieldset>{checked && <div className={correct ? 'test-feedback test-feedback--success' : 'test-feedback test-feedback--retry'} role="status">{correct ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}<div><strong>{correct ? local(language, 'Correct—learning check complete.', 'सही—सीखने की जाँच पूरी हुई।') : local(language, 'Not quite. Read the explanation and try again.', 'उत्तर सही नहीं है। समझाइश पढ़कर फिर प्रयास करें।')}</strong><p>{questionExplanation(practiceQuestion, language)}</p></div></div>}<details className="context-help"><summary><CircleHelp size={18} /> {local(language, 'What should I study?', 'मुझे क्या पढ़ना चाहिए?')}</summary><div><p>{local(language, 'Use the official handbook and current Madhya Pradesh guidance for authoritative preparation. This prototype does not replace official material.', 'प्रामाणिक तैयारी के लिए आधिकारिक पुस्तिका और वर्तमान मध्य प्रदेश मार्गदर्शन का उपयोग करें। यह प्रोटोटाइप आधिकारिक सामग्री का विकल्प नहीं है।')}</p></div></details><div className="lf-actions">{!checked || !correct ? <button className="button button--primary" disabled={selected === null} onClick={() => setChecked(true)}>{local(language, 'Check learning answer', 'उत्तर जाँचें')} <ArrowRight size={18} /></button> : <button className="button button--primary" onClick={complete}>{local(language, 'Continue to secure-test entry', 'सुरक्षित परीक्षा प्रवेश पर जाएँ')} <ArrowRight size={18} /></button>}<FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary"><ArrowLeft size={18} /> {local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></div></>
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
  return <><Breadcrumbs applicationId={applicationId} current={local(language, 'Secure-test entry', 'सुरक्षित परीक्षा प्रवेश')} language={language} /><section className="page-title"><div><p className="eyebrow">{local(language, 'Synthetic knowledge test', 'सिंथेटिक ज्ञान परीक्षा')}</p><h1 tabIndex={-1}>{local(language, 'Know the rules before starting', 'शुरू करने से पहले नियम समझें')}</h1><p>{local(language, 'This is a five-question LicenceFlow simulation—not the official Madhya Pradesh question set, timing or scoring configuration.', 'यह पाँच प्रश्नों वाला LicenceFlow सिमुलेशन है—आधिकारिक मध्य प्रदेश प्रश्न, समय या अंक व्यवस्था नहीं।')}</p></div></section><section className="test-instruction-grid"><article><span><FileText size={21} /></span><div><strong>{local(language, '5 questions', '5 प्रश्न')}</strong><small>{local(language, '3 correct to pass this simulation', 'सिमुलेशन पास करने के लिए 3 सही')}</small></div></article><article><span><LockKeyhole size={21} /></span><div><strong>{local(language, 'Checkpoint before next', 'अगले से पहले चेकपॉइंट')}</strong><small>{local(language, 'Every answer is saved before navigation', 'आगे बढ़ने से पहले हर उत्तर सहेजा जाता है')}</small></div></article><article><span><Camera size={21} /></span><div><strong>{progress.readiness.mode === 'guided-signals' ? local(language, 'Guided camera signals', 'निर्देशित कैमरा संकेत') : local(language, 'Live browser observations', 'लाइव ब्राउज़र अवलोकन')}</strong><small>{local(language, 'Conditions are not cheating verdicts', 'संकेत नकल का निर्णय नहीं हैं')}</small></div></article><article><span><CircleHelp size={21} /></span><div><strong>{local(language, 'Technical help only', 'केवल तकनीकी सहायता')}</strong><small>{local(language, 'No answer assistance during the test', 'परीक्षा में उत्तर सहायता नहीं')}</small></div></article></section><div className="test-declaration"><Info size={20} /><p>{local(language, 'A browser cannot provide SmartLock-equivalent lockdown, prevent app switching, or guarantee device integrity. This prototype demonstrates transparent observation and failure recovery.', 'ब्राउज़र SmartLock जैसी लॉकडाउन सुरक्षा, ऐप बदलने की रोकथाम या डिवाइस की पूर्ण विश्वसनीयता की गारंटी नहीं दे सकता। यह प्रोटोटाइप पारदर्शी अवलोकन और समस्या से सुरक्षित वापसी दिखाता है।')}</p></div>{fresh ? <label className="consent-box"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span><strong>{local(language, 'I understand this is a synthetic test.', 'मैं समझता/समझती हूँ कि यह सिंथेटिक परीक्षा है।')}</strong><small>{local(language, "No official attempt, result or Learner's Licence is created.", 'कोई आधिकारिक प्रयास, परिणाम या लर्नर लाइसेंस नहीं बनता।')}</small></span></label> : <div className="lf-success-note"><RefreshCcw size={20} /><div><strong>{local(language, 'A saved test session already exists.', 'एक सहेजा हुआ परीक्षा सत्र मौजूद है।')}</strong><p>{local(language, 'Continue from the exact checkpoint; the synthetic payment remains recorded.', 'सही चेकपॉइंट से जारी रखें; सिंथेटिक भुगतान दर्ज रहता है।')}</p></div></div>}<div className="lf-actions">{fresh ? <button className="button button--primary" disabled={!accepted} onClick={start}>{local(language, 'Start 5-question simulation', '5 प्रश्नों का सिमुलेशन शुरू करें')} <ArrowRight size={18} /></button> : <FlowLink className="button button--primary" href={routeForSession(applicationId, session)}>{local(language, 'Resume saved session', 'सहेजा सत्र जारी रखें')} <ArrowRight size={18} /></FlowLink>}<FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary"><ArrowLeft size={18} /> {local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></div></>
}

function MiniCamera({ guided, stream, language }: { guided: boolean; stream: MediaStream | null; language: Language }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; return () => { if (ref.current) ref.current.srcObject = null } }, [stream])
  return <div className="test-mini-camera">{stream && !guided ? <video ref={ref} autoPlay muted playsInline aria-label={local(language, 'Live test camera', 'लाइव परीक्षा कैमरा')} /> : <div><UserRound size={42} /><span>{guided ? local(language, 'GUIDED CAMERA SIGNAL', 'निर्देशित कैमरा संकेत') : local(language, 'CAMERA WAITING', 'कैमरे की प्रतीक्षा')}</span></div>}<small><ShieldCheck size={14} /> {local(language, 'No recording', 'रिकॉर्डिंग नहीं')}</small></div>
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
    ? { title: local(language, 'Only one person should remain in view', 'कैमरे में केवल एक व्यक्ति रहे'), body: local(language, 'Ask anyone nearby to step outside the camera frame. The test pauses only if this continues.', 'पास के व्यक्ति को कैमरे के फ्रेम से बाहर जाने को कहें। यह स्थिति बनी रहने पर ही परीक्षा रुकेगी।') }
    : media.snapshot.coachingReason === 'no-face'
      ? { title: local(language, 'Bring your face back into view', 'अपना चेहरा फिर कैमरे में लाएँ'), body: local(language, 'Centre your face inside the guide. Brief movement is ignored; sustained loss pauses safely.', 'चेहरा गाइड के बीच रखें। थोड़ी देर की हलचल अनदेखी होगी; लंबे समय तक चेहरा न दिखने पर परीक्षा सुरक्षित रुकेगी।') }
      : media.snapshot.coachingReason === 'framing'
        ? { title: local(language, 'Adjust your camera position', 'कैमरे की स्थिति ठीक करें'), body: local(language, 'Move slightly closer and keep your face near the centre.', 'थोड़ा पास आएँ और चेहरा बीच में रखें।') }
        : media.snapshot.coachingReason === 'lighting'
          ? { title: local(language, 'Improve the light on your face', 'चेहरे पर रोशनी सुधारें'), body: local(language, 'Face a soft light and reduce strong light from behind you.', 'हल्की रोशनी की ओर चेहरा रखें और पीछे की तेज रोशनी कम करें।') }
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

  return <><Breadcrumbs applicationId={applicationId} current={local(language, 'LL knowledge-test simulation', 'एलएल ज्ञान परीक्षा सिमुलेशन')} language={language} /><div className="test-live-bar"><span><LockKeyhole size={16} />{local(language, 'Answer checkpointing on', 'उत्तर चेकपॉइंट चालू')}</span><span><Signal size={16} />{media.snapshot.online ? local(language, 'Online', 'ऑनलाइन') : local(language, 'Offline', 'ऑफलाइन')}</span><span><Camera size={16} />{guided ? local(language, 'Guided signals', 'निर्देशित संकेत') : mediaReady ? local(language, 'Camera ready', 'कैमरा तैयार') : local(language, 'Camera check required', 'कैमरा जाँच आवश्यक')}</span></div><section className="test-workspace"><div className="test-question-area"><div className="test-question-heading"><div><p className="eyebrow">{local(language, `Question ${state.exam.currentQuestion + 1} of ${demoQuestions.length}`, `प्रश्न ${state.exam.currentQuestion + 1} / ${demoQuestions.length}`)}</p><h1 tabIndex={-1}>{questionPrompt(question, language)}</h1></div><span>{local(language, `${savedCount} saved`, `${savedCount} सहेजे`)}</span></div><fieldset className="test-answer-fieldset"><legend className="visually-hidden">{local(language, 'Choose one answer', 'एक उत्तर चुनें')}</legend>{answers.map((option, index) => <label className={selected === index ? 'selected' : ''} key={option}><input type="radio" name="test-answer" checked={selected === index} onChange={() => setSelected(index)} /><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong></label>)}</fieldset><div className="test-save-note"><LockKeyhole size={17} /><span>{local(language, 'Your choice is not counted until you press “Save answer and next”.', '“उत्तर सहेजें और आगे बढ़ें” दबाने तक आपका चुनाव दर्ज नहीं होगा।')}</span></div><button className="button button--primary" disabled={selected === null || !mediaReady} onClick={saveAnswer}>{state.exam.currentQuestion === demoQuestions.length - 1 ? local(language, 'Save answer and finish', 'उत्तर सहेजें और पूरा करें') : local(language, 'Save answer and next', 'उत्तर सहेजें और आगे बढ़ें')} <ArrowRight size={18} /></button></div><aside className={`test-observation-panel ${coaching || needsCameraStart ? 'test-observation-panel--coach' : ''}`} aria-live="polite"><div className="test-monitoring-state">{coaching || needsCameraStart ? <TriangleAlert size={22} /> : <ShieldCheck size={22} />}<div><h2>{needsCameraStart ? local(language, 'Camera check required', 'कैमरा जाँच आवश्यक') : coaching?.title ?? local(language, 'Monitoring quietly', 'शांत निगरानी')}</h2><p>{needsCameraStart ? local(language, 'Reconnect the private browser checks before saving this answer.', 'यह उत्तर सहेजने से पहले निजी ब्राउज़र जाँच फिर जोड़ें।') : coaching?.body ?? local(language, 'Healthy conditions stay out of the way. The test reacts only when you need to do something.', 'स्थिति ठीक रहने पर कोई बाधा नहीं आती। कार्रवाई जरूरी होने पर ही परीक्षा प्रतिक्रिया देती है।')}</p></div></div>{needsCameraStart && <button className="button button--secondary button--full" onClick={() => void media.start()}>{local(language, 'Reconnect private checks', 'निजी जाँच फिर जोड़ें')}</button>}<details className="test-camera-details"><summary>{local(language, 'View camera status', 'कैमरा स्थिति देखें')}</summary><MiniCamera guided={guided} stream={media.stream} language={language} /></details><h2>{local(language, 'Technical help only', 'केवल तकनीकी सहायता')}</h2><p>{local(language, 'We can explain camera, saving and recovery. We cannot reveal or suggest an answer.', 'हम कैमरा, सहेजने और वापसी की प्रक्रिया समझा सकते हैं। उत्तर बता या सुझा नहीं सकते।')}</p><dl><div><dt>{local(language, 'Payment', 'भुगतान')}</dt><dd>{local(language, 'Confirmed once', 'एक बार पुष्ट')}</dd></div><div><dt>{local(language, 'Latest checkpoint', 'नवीनतम चेकपॉइंट')}</dt><dd>{savedCount === 0 ? local(language, 'No answer saved yet', 'अभी कोई उत्तर सहेजा नहीं') : local(language, `Question ${savedCount} saved`, `प्रश्न ${savedCount} सहेजा`)}</dd></div></dl></aside></section></>
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
  return <><Breadcrumbs applicationId={applicationId} current={local(language, 'Test paused safely', 'परीक्षा सुरक्षित रुकी')} language={language} /><section className="interruption-card"><span className="interruption-card__icon">{integrity ? <Camera size={31} /> : <WifiOff size={31} />}</span><p className="eyebrow">{integrity ? local(language, 'Visible condition · not a cheating verdict', 'दिखी स्थिति · नकल का निर्णय नहीं') : local(language, 'Technical interruption · not a failed test', 'तकनीकी बाधा · परीक्षा असफल नहीं')}</p><h1 tabIndex={-1}>{integrity ? local(language, 'The camera observed more than one face.', 'कैमरे में एक से अधिक चेहरे दिखाई दिए।') : local(language, 'The test paused without losing your answer.', 'आपका उत्तर खोए बिना परीक्षा रुक गई।')}</h1><p>{translatedInterruptionDetail(state.exam.interruptionDetail ?? '', language)}</p><div className="recovery-facts"><div><span>{local(language, 'Latest answer', 'नवीनतम उत्तर')}</span><strong>{local(language, 'Saved', 'सहेजा')}</strong></div><div><span>{local(language, 'Payment', 'भुगतान')}</span><strong>{local(language, 'Still confirmed', 'अब भी पुष्ट')}</strong></div><div><span>{local(language, 'Knowledge result', 'ज्ञान परिणाम')}</span><strong>{local(language, 'Not changed', 'नहीं बदला')}</strong></div><div><span>{local(language, 'Resume point', 'वापसी बिंदु')}</span><strong>{local(language, `Question ${state.exam.currentQuestion + 1}`, `प्रश्न ${state.exam.currentQuestion + 1}`)}</strong></div></div><div className="lf-actions"><button className="button button--primary" onClick={resume}>{local(language, 'Resume safely', 'सुरक्षित रूप से जारी रखें')} <RefreshCcw size={18} /></button><FlowLink className="button button--secondary" href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></div></section></>
}

function eventText(event: JourneyEvent, language: Language): { title: string; detail: string; source: string } {
  if (language === 'en') return { title: event.title, detail: event.detail, source: event.synthetic ? 'Synthetic/prototype event' : 'Browser event' }
  const questionMatch = event.title.match(/^Question (\d+) saved$/)
  const title = questionMatch ? `प्रश्न ${questionMatch[1]} सहेजा` : ({
    'Device readiness passed': 'डिवाइस जाँच सफल',
    'Secure-test rehearsal completed': 'सुरक्षित परीक्षा अभ्यास पूरा',
    'Synthetic payment recorded': 'सिंथेटिक भुगतान दर्ज',
    'Road-safety tutorial completed': 'सड़क सुरक्षा सीख पूरी',
    'Synthetic learner test started': 'सिंथेटिक लर्नर परीक्षा शुरू',
    'Technical interruption paused the test': 'तकनीकी बाधा से परीक्षा रुकी',
    'Test resumed from saved checkpoint': 'सहेजे चेकपॉइंट से परीक्षा जारी',
    'Knowledge simulation passed': 'ज्ञान सिमुलेशन सफल',
    'Knowledge simulation not passed': 'ज्ञान सिमुलेशन सफल नहीं',
    'Demonstration LL created': 'प्रदर्शन एलएल बनाया गया',
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
  return { title, detail, source: event.synthetic ? 'सिंथेटिक/प्रोटोटाइप घटना' : 'ब्राउज़र घटना' }
}

function eventTime(at: string, language: Language): string {
  const formatted = new Date(at).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit' })
  return language === 'hi' ? formatted.replace(/\bam\b/i, 'पूर्वाह्न').replace(/\bpm\b/i, 'अपराह्न') : formatted
}

export function ResultPage({ applicationId, onStageChange, language }: { applicationId: string; onStageChange: StageChange; language: Language }) {
  const progress = loadJourneyProgress(applicationId)
  const [state, setState] = useState(() => loadExamSession(applicationId, progress))
  const [confirmClear, setConfirmClear] = useState(false)
  if (state.stage !== 'result') return <Guard applicationId={applicationId} language={language} title={local(language, 'Result not available yet', 'परिणाम अभी उपलब्ध नहीं')} body={local(language, 'Complete the saved synthetic test before opening its outcome.', 'परिणाम खोलने से पहले सहेजी सिंथेटिक परीक्षा पूरी करें।')} route={routeForSession(applicationId, state)} action={local(language, 'Continue saved session', 'सहेजा सत्र जारी रखें')} />
  const passed = state.exam.knowledgeResult === 'passed'
  const reset = () => {
    const next = resetExamSession(applicationId, progress)
    setState(next); onStageChange(local(language, 'LL test entry', 'एलएल परीक्षा प्रवेश'))
    navigatePortal(`/mp/application/${applicationId}/test-entry`)
  }
  const clearDevice = () => { clearLicenceFlowDeviceData(); window.location.assign('/') }
  return <><Breadcrumbs applicationId={applicationId} current={local(language, 'Result and journey receipt', 'परिणाम और यात्रा रसीद')} language={language} /><section className={`result-hero ${passed ? 'result-hero--passed' : ''}`}><span>{passed ? <CheckCircle2 size={34} /> : <Flag size={34} />}</span><div><p className="eyebrow">{local(language, 'Synthetic knowledge result', 'सिंथेटिक ज्ञान परिणाम')}</p><h1 tabIndex={-1}>{passed ? local(language, 'Knowledge simulation passed', 'ज्ञान सिमुलेशन सफल') : local(language, 'Knowledge simulation not passed', 'ज्ञान सिमुलेशन सफल नहीं')}</h1><p>{local(language, `${state.exam.correctAnswers} of ${demoQuestions.length} answers correct · prototype threshold 3. This is not an official MP result.`, `${demoQuestions.length} में से ${state.exam.correctAnswers} उत्तर सही · प्रोटोटाइप सीमा 3। यह आधिकारिक मध्य प्रदेश परिणाम नहीं है।`)}</p></div></section><section className="outcome-grid"><article><span><BookOpenCheck size={23} /></span><div><small>{local(language, 'Knowledge', 'ज्ञान')}</small><strong>{passed ? local(language, 'Passed', 'सफल') : local(language, 'Not passed', 'सफल नहीं')}</strong><p>{local(language, 'Based only on saved simulation answers.', 'केवल सहेजे सिमुलेशन उत्तरों पर आधारित।')}</p></div></article><article><span><Network size={23} /></span><div><small>{local(language, 'Technical status', 'तकनीकी स्थिति')}</small><strong>{state.exam.interruptionSeen ? local(language, 'Recovered safely', 'सुरक्षित वापसी') : local(language, 'No interruption', 'कोई बाधा नहीं')}</strong><p>{state.exam.interruptionSeen ? local(language, 'Answers and payment remained intact.', 'उत्तर और भुगतान सुरक्षित रहे।') : local(language, 'Journey completed normally.', 'प्रक्रिया सामान्य रूप से पूरी हुई।')}</p></div></article><article><span><ShieldCheck size={23} /></span><div><small>{local(language, 'Integrity status', 'अखंडता स्थिति')}</small><strong>{state.exam.integrityStatus === 'observation-recorded' ? local(language, 'Observation recorded', 'अवलोकन दर्ज') : local(language, 'No adverse verdict', 'कोई प्रतिकूल निर्णय नहीं')}</strong><p>{local(language, 'A browser signal is never presented as proof of cheating.', 'ब्राउज़र संकेत को नकल के प्रमाण के रूप में नहीं दिखाया जाता।')}</p></div></article></section>{passed ? <section className="demo-licence"><div className="demo-licence__watermark">{local(language, 'NOT VALID', 'मान्य नहीं')}</div><div><p>मध्य प्रदेश · {local(language, "LEARNER'S LICENCE", 'लर्नर लाइसेंस')}</p><strong>{local(language, 'DEMONSTRATION DOCUMENT', 'प्रदर्शन दस्तावेज')}</strong></div><dl><div><dt>{local(language, 'Application', 'आवेदन')}</dt><dd>{applicationId}</dd></div><div><dt>{local(language, 'Holder', 'धारक')}</dt><dd>{local(language, 'Synthetic MP applicant', 'सिंथेटिक मध्य प्रदेश आवेदक')}</dd></div><div><dt>{local(language, 'Validity', 'वैधता')}</dt><dd>{local(language, 'None · prototype only', 'कोई नहीं · केवल प्रोटोटाइप')}</dd></div><div><dt>{local(language, 'Government record', 'सरकारी रिकॉर्ड')}</dt><dd>{local(language, 'Not created', 'नहीं बनाया गया')}</dd></div></dl></section> : <section className="lf-alert"><Info size={20} /><div><strong>{local(language, 'Practice again without another payment.', 'दोबारा भुगतान के बिना फिर अभ्यास करें।')}</strong><p>{local(language, 'Official retest timing, fees and eligibility remain governed by current Madhya Pradesh rules and are not asserted here.', 'आधिकारिक पुनर्परीक्षा समय, शुल्क और पात्रता वर्तमान मध्य प्रदेश नियमों के अनुसार होंगे; यहाँ उनका दावा नहीं किया गया है।')}</p></div></section>}<section className="journey-receipt"><div className="section-heading"><div><p className="eyebrow">{local(language, 'Journey receipt', 'यात्रा रसीद')}</p><h2>{local(language, 'What happened, in order', 'क्रमवार क्या हुआ')}</h2></div><ClipboardCheck size={24} /></div><ol>{state.events.map((event) => { const translated = eventText(event, language); return <li key={event.id}><span><Check size={14} /></span><div><strong>{translated.title}</strong><p>{translated.detail}</p><small>{eventTime(event.at, language)} · {translated.source}</small></div></li> })}</ol></section>{confirmClear && <section className="clear-device-confirm" role="alertdialog" aria-labelledby="clear-device-title"><div><p className="eyebrow">{local(language, 'Shared computer privacy', 'साझा कंप्यूटर गोपनीयता')}</p><h2 id="clear-device-title">{local(language, 'Clear all LicenceFlow data from this device?', 'इस डिवाइस से LicenceFlow का पूरा डेटा हटाएँ?')}</h2><p>{local(language, 'This removes the saved application, test answers, payment sandbox receipt, preferences and sign-in session from this browser. It cannot be undone.', 'यह इस ब्राउज़र से सहेजा आवेदन, परीक्षा उत्तर, भुगतान सैंडबॉक्स रसीद, पसंद और साइन-इन सत्र हटाता है। इसे वापस नहीं लाया जा सकता।')}</p></div><div className="lf-actions"><button className="button button--danger" onClick={clearDevice}>{local(language, 'Yes, clear this device', 'हाँ, इस डिवाइस का डेटा हटाएँ')}</button><button className="button button--secondary" onClick={() => setConfirmClear(false)}>{local(language, 'Cancel', 'रद्द करें')}</button></div></section>}<div className="lf-actions"><button className="button button--primary" onClick={() => window.print()}><Printer size={18} /> {local(language, 'Print demonstration result', 'प्रदर्शन परिणाम प्रिंट करें')}</button><button className="button button--secondary" onClick={reset}><RotateCcw size={18} /> {local(language, 'Restart test simulation', 'परीक्षा सिमुलेशन फिर शुरू करें')}</button><button className="text-button" onClick={() => setConfirmClear(true)}><Eraser size={17} /> {local(language, 'Clear this device', 'इस डिवाइस का डेटा हटाएँ')}</button><FlowLink className="text-button" href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></div></>
}

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Camera,
  Check,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Flag,
  Info,
  LockKeyhole,
  Network,
  Printer,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Signal,
  TriangleAlert,
  UserRound,
  WifiOff,
} from 'lucide-react'
import { demoQuestions, practiceQuestion } from '../content/questions'
import { journeyReducer, type InterruptionKind, type JourneyState } from '../domain/journey'
import { useDeviceReadiness } from '../hooks/useDeviceReadiness'
import { loadExamSession, resetExamSession, saveExamSession } from './examSession'
import { isPaymentConfirmed } from './payment'
import { completeTutorial, loadJourneyProgress, saveJourneyProgress } from './progress'
import { navigatePortal } from './router'

type StageChange = (label: string) => void

function FlowLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigatePortal(href)
  }
  return <a href={href} className={className} onClick={open}>{children}</a>
}

function Breadcrumbs({ applicationId, current }: { applicationId: string; current: string }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><ol><li><FlowLink href="/mp/services">Services</FlowLink></li><li><FlowLink href={`/mp/application/${applicationId}`}>Application status</FlowLink></li><li><span aria-current="page">{current}</span></li></ol></nav>
}

function Guard({ applicationId, title, body, route, action }: { applicationId: string; title: string; body: string; route: string; action: string }) {
  return <><Breadcrumbs applicationId={applicationId} current={title} /><section className="route-guard"><LockKeyhole size={30} /><p className="eyebrow">Previous stage required</p><h1 tabIndex={-1}>{title}</h1><p>{body}</p><FlowLink className="button button--primary" href={route}>{action}</FlowLink></section></>
}

export function TutorialPage({ applicationId, onStageChange }: { applicationId: string; onStageChange: StageChange }) {
  const [progress, setProgress] = useState(() => loadJourneyProgress(applicationId))
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const correct = selected === practiceQuestion.correct
  if (!isPaymentConfirmed(progress.payment)) return <Guard applicationId={applicationId} title="Complete payment first" body="The learning and secure-test stages unlock only after the saved sandbox payment is confirmed." route={`/mp/application/${applicationId}/payment`} action="Open fee payment" />

  const complete = () => {
    const updated = completeTutorial(progress)
    saveJourneyProgress(updated)
    setProgress(updated)
    onStageChange('LL test entry')
    navigatePortal(`/mp/application/${applicationId}/test-entry`)
  }

  return <><Breadcrumbs applicationId={applicationId} current="Road-safety tutorial" /><section className="page-title"><div><p className="eyebrow">Learn before the test</p><h1 tabIndex={-1}>Road-safety preparation</h1><p>A short active learning pack replaces an unexplained mandatory video. These are educational prototype examples, not official MP test questions.</p></div></section><section className="test-learning-grid" aria-label="Learning topics"><article><span><BookOpenCheck size={22} /></span><h2>Signs and signals</h2><p>Recognise what the road is asking before reacting.</p></article><article><span><ShieldCheck size={22} /></span><h2>Safety and priority</h2><p>Protect pedestrians and give emergency vehicles a safe path.</p></article><article><span><FileText size={22} /></span><h2>Duties and documents</h2><p>Understand responsible conduct, documentation and accident priorities.</p></article></section><fieldset className="lf-question-card"><legend>Learning check</legend><h2>{practiceQuestion.prompt}</h2><div className="lf-answer-options">{practiceQuestion.options.map((option, index) => <label className={selected === index ? 'selected' : ''} key={option}><input type="radio" name="tutorial-answer" checked={selected === index} onChange={() => { setSelected(index); setChecked(false) }} /><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong></label>)}</div></fieldset>{checked && <div className={correct ? 'test-feedback test-feedback--success' : 'test-feedback test-feedback--retry'} role="status">{correct ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}<div><strong>{correct ? 'Correct—learning check complete.' : 'Not quite. Review the explanation and try again.'}</strong><p>{practiceQuestion.explanation}</p></div></div>}<details className="context-help"><summary><CircleHelp size={18} /> What should I study?</summary><div><p>Use the official handbook and current Madhya Pradesh guidance for authoritative preparation. This prototype demonstrates clearer learning design and does not replace official material.</p></div></details><div className="lf-actions">{!checked || !correct ? <button className="button button--primary" disabled={selected === null} onClick={() => setChecked(true)}>Check learning answer <ArrowRight size={18} /></button> : <button className="button button--primary" onClick={complete}>Continue to secure-test entry <ArrowRight size={18} /></button>}<FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary"><ArrowLeft size={18} /> Application status</FlowLink></div></>
}

function routeForSession(applicationId: string, state: JourneyState): string {
  if (state.stage === 'exam') return `/mp/application/${applicationId}/test`
  if (state.stage === 'interruption') return `/mp/application/${applicationId}/test-interruption`
  if (state.stage === 'result') return `/mp/application/${applicationId}/result`
  return `/mp/application/${applicationId}/test-entry`
}

export function TestEntryPage({ applicationId, onStageChange }: { applicationId: string; onStageChange: StageChange }) {
  const progress = loadJourneyProgress(applicationId)
  const [accepted, setAccepted] = useState(false)
  const [session, setSession] = useState(() => loadExamSession(applicationId, progress))
  if (progress.tutorial.status !== 'completed') return <Guard applicationId={applicationId} title="Complete the tutorial first" body="The test starts only after the learning check is completed." route={`/mp/application/${applicationId}/tutorial`} action="Open road-safety tutorial" />

  const fresh = session.stage === 'exam-intro'
  const start = () => {
    const base = session.stage === 'result' ? resetExamSession(applicationId, progress) : session
    const next = journeyReducer(base, { type: 'START_EXAM' })
    saveExamSession(applicationId, next)
    setSession(next)
    onStageChange('LL test in progress')
    navigatePortal(`/mp/application/${applicationId}/test`)
  }

  return <><Breadcrumbs applicationId={applicationId} current="Secure-test entry" /><section className="page-title"><div><p className="eyebrow">Synthetic knowledge test</p><h1 tabIndex={-1}>Know the rules before starting</h1><p>This is a five-question LicenceFlow simulation—not the official Madhya Pradesh question set, timing or scoring configuration.</p></div></section><section className="test-instruction-grid"><article><span><FileText size={21} /></span><div><strong>5 questions</strong><small>3 correct to pass this simulation</small></div></article><article><span><LockKeyhole size={21} /></span><div><strong>Checkpoint before next</strong><small>Every answer is saved before navigation</small></div></article><article><span><Camera size={21} /></span><div><strong>{progress.readiness.mode === 'guided-signals' ? 'Guided camera signals' : 'Live browser observations'}</strong><small>Conditions are not cheating verdicts</small></div></article><article><span><CircleHelp size={21} /></span><div><strong>Technical help only</strong><small>No answer assistance during the test</small></div></article></section><div className="test-declaration"><Info size={20} /><p>A browser cannot provide SmartLock-equivalent lockdown, prevent app switching, or guarantee device integrity. This prototype demonstrates transparent observation and failure recovery.</p></div>{fresh ? <label className="consent-box"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span><strong>I understand this is a synthetic test.</strong><small>No official attempt, result or Learner's Licence is created.</small></span></label> : <div className="lf-success-note"><RefreshCcw size={20} /><div><strong>A saved test session already exists.</strong><p>Continue from the exact checkpoint; the synthetic payment remains recorded.</p></div></div>}<div className="lf-actions">{fresh ? <button className="button button--primary" disabled={!accepted} onClick={start}>Start 5-question simulation <ArrowRight size={18} /></button> : <FlowLink className="button button--primary" href={routeForSession(applicationId, session)}>Resume saved session <ArrowRight size={18} /></FlowLink>}<FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary"><ArrowLeft size={18} /> Application status</FlowLink></div></>
}

function MiniCamera({ guided, stream }: { guided: boolean; stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; return () => { if (ref.current) ref.current.srcObject = null } }, [stream])
  return <div className="test-mini-camera">{stream && !guided ? <video ref={ref} autoPlay muted playsInline aria-label="Live test camera" /> : <div><UserRound size={42} /><span>{guided ? 'GUIDED CAMERA SIGNAL' : 'CAMERA WAITING'}</span></div>}<small><ShieldCheck size={14} /> No recording</small></div>
}

export function TestPage({ applicationId, onStageChange }: { applicationId: string; onStageChange: StageChange }) {
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

  if (state.stage !== 'exam' || !question) return <Guard applicationId={applicationId} title="Open the saved test stage" body="This route follows the persisted exam state." route={routeForSession(applicationId, state)} action="Continue saved session" />
  const mediaReady = guided ? media.snapshot.started : media.ready
  const needsCameraStart = !guided && !media.snapshot.started
  const coaching = media.snapshot.coachingReason === 'multiple-faces'
    ? { title: 'Only one person should remain in view', body: 'Ask anyone nearby to step outside the camera frame. The test pauses only if this continues.' }
    : media.snapshot.coachingReason === 'no-face'
      ? { title: 'Bring your face back into view', body: 'Centre your face inside the guide. A brief movement is ignored; a sustained loss pauses safely.' }
      : media.snapshot.coachingReason === 'framing'
        ? { title: 'Adjust your camera position', body: 'Move slightly closer and keep your face near the centre of the frame.' }
        : media.snapshot.coachingReason === 'lighting'
          ? { title: 'Improve the light on your face', body: 'Face a soft light and reduce strong light from behind you.' }
          : null
  const saveAnswer = () => {
    if (selected === null) return
    const next = journeyReducer(state, { type: 'ANSWER', answer: selected, correct: selected === question.correct, isLast: state.exam.currentQuestion === demoQuestions.length - 1, passThreshold: 3, triggerDemoInterruption: state.exam.currentQuestion === 2 })
    saveExamSession(applicationId, next)
    setState(next)
    setSelected(null)
    if (next.stage === 'interruption') navigatePortal(`/mp/application/${applicationId}/test-interruption`)
    if (next.stage === 'result') { onStageChange('View result and receipt'); navigatePortal(`/mp/application/${applicationId}/result`) }
  }

  return <><Breadcrumbs applicationId={applicationId} current="LL knowledge-test simulation" /><div className="test-live-bar"><span><LockKeyhole size={16} />Answer checkpointing on</span><span><Signal size={16} />{media.snapshot.online ? 'Online' : 'Offline'}</span><span><Camera size={16} />{guided ? 'Guided signals' : mediaReady ? 'Camera ready' : 'Camera check required'}</span></div><section className="test-workspace"><div className="test-question-area"><div className="test-question-heading"><div><p className="eyebrow">Question {state.exam.currentQuestion + 1} of {demoQuestions.length}</p><h1 tabIndex={-1}>{question.prompt}</h1></div><span>{Object.keys(state.exam.answers).length} saved</span></div><fieldset className="test-answer-fieldset"><legend className="visually-hidden">Choose one answer</legend>{question.options.map((option, index) => <label className={selected === index ? 'selected' : ''} key={option}><input type="radio" name="test-answer" checked={selected === index} onChange={() => setSelected(index)} /><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong></label>)}</fieldset><div className="test-save-note"><LockKeyhole size={17} /><span>Your choice is not counted until you press “Save answer and next”.</span></div><button className="button button--primary" disabled={selected === null || !mediaReady} onClick={saveAnswer}>{state.exam.currentQuestion === demoQuestions.length - 1 ? 'Save answer and finish' : 'Save answer and next'} <ArrowRight size={18} /></button></div><aside className={`test-observation-panel ${coaching || needsCameraStart ? 'test-observation-panel--coach' : ''}`} aria-live="polite"><div className="test-monitoring-state">{coaching || needsCameraStart ? <TriangleAlert size={22} /> : <ShieldCheck size={22} />}<div><h2>{needsCameraStart ? 'Camera check required' : coaching?.title ?? 'Monitoring quietly'}</h2><p>{needsCameraStart ? 'Reconnect the private browser checks before saving this answer.' : coaching?.body ?? 'Healthy conditions stay out of the way. The test reacts only when you need to do something.'}</p></div></div>{needsCameraStart && <button className="button button--secondary button--full" onClick={() => void media.start()}>Reconnect private checks</button>}<details className="test-camera-details"><summary>View camera status</summary><MiniCamera guided={guided} stream={media.stream} /></details><h2>Technical help only</h2><p>We can explain camera, saving and recovery. We cannot reveal or suggest an answer.</p><dl><div><dt>Payment</dt><dd>Confirmed once</dd></div><div><dt>Latest checkpoint</dt><dd>{Object.keys(state.exam.answers).length === 0 ? 'No answer saved yet' : `Question ${Object.keys(state.exam.answers).length} saved`}</dd></div></dl></aside></section></>
}

export function InterruptionPage({ applicationId, onStageChange }: { applicationId: string; onStageChange: StageChange }) {
  const progress = loadJourneyProgress(applicationId)
  const [state, setState] = useState(() => loadExamSession(applicationId, progress))
  if (state.stage !== 'interruption') return <Guard applicationId={applicationId} title="No active interruption" body="Continue from the current saved test stage." route={routeForSession(applicationId, state)} action="Continue saved session" />
  const isIntegrityObservation = state.exam.interruptionKind === 'multiple-faces'
  const resume = () => {
    const next = journeyReducer(state, { type: 'RESUME_EXAM' })
    saveExamSession(applicationId, next)
    setState(next)
    onStageChange('LL test in progress')
    navigatePortal(`/mp/application/${applicationId}/test`)
  }
  return <><Breadcrumbs applicationId={applicationId} current="Test paused safely" /><section className="interruption-card"><span className="interruption-card__icon">{isIntegrityObservation ? <Camera size={31} /> : <WifiOff size={31} />}</span><p className="eyebrow">{isIntegrityObservation ? 'Visible condition · not a cheating verdict' : 'Technical interruption · not a failed test'}</p><h1 tabIndex={-1}>{isIntegrityObservation ? 'The camera observed more than one face.' : 'The test paused without losing your answer.'}</h1><p>{state.exam.interruptionDetail}</p><div className="recovery-facts"><div><span>Latest answer</span><strong>Saved</strong></div><div><span>Payment</span><strong>Still confirmed</strong></div><div><span>Knowledge result</span><strong>Not changed</strong></div><div><span>Resume point</span><strong>Question {state.exam.currentQuestion + 1}</strong></div></div><div className="lf-actions"><button className="button button--primary" onClick={resume}>Resume safely <RefreshCcw size={18} /></button><FlowLink className="button button--secondary" href={`/mp/application/${applicationId}`}>Application status</FlowLink></div></section></>
}

export function ResultPage({ applicationId, onStageChange }: { applicationId: string; onStageChange: StageChange }) {
  const progress = loadJourneyProgress(applicationId)
  const [state, setState] = useState(() => loadExamSession(applicationId, progress))
  if (state.stage !== 'result') return <Guard applicationId={applicationId} title="Result not available yet" body="Complete the saved synthetic test before opening its outcome." route={routeForSession(applicationId, state)} action="Continue saved session" />
  const passed = state.exam.knowledgeResult === 'passed'
  const reset = () => {
    const next = resetExamSession(applicationId, progress)
    setState(next)
    onStageChange('LL test entry')
    navigatePortal(`/mp/application/${applicationId}/test-entry`)
  }
  return <><Breadcrumbs applicationId={applicationId} current="Result and journey receipt" /><section className={`result-hero ${passed ? 'result-hero--passed' : ''}`}><span>{passed ? <CheckCircle2 size={34} /> : <Flag size={34} />}</span><div><p className="eyebrow">Synthetic knowledge result</p><h1 tabIndex={-1}>{passed ? 'Knowledge simulation passed' : 'Knowledge simulation not passed'}</h1><p>{state.exam.correctAnswers} of {demoQuestions.length} answers correct · prototype threshold 3. This is not an official MP result.</p></div></section><section className="outcome-grid"><article><span><BookOpenCheck size={23} /></span><div><small>Knowledge</small><strong>{passed ? 'Passed' : 'Not passed'}</strong><p>Based only on saved simulation answers.</p></div></article><article><span><Network size={23} /></span><div><small>Technical status</small><strong>{state.exam.interruptionSeen ? 'Recovered safely' : 'No interruption'}</strong><p>{state.exam.interruptionSeen ? 'Answers and payment remained intact.' : 'Journey completed normally.'}</p></div></article><article><span><ShieldCheck size={23} /></span><div><small>Integrity status</small><strong>{state.exam.integrityStatus === 'observation-recorded' ? 'Observation recorded' : 'No adverse verdict'}</strong><p>A browser signal is never presented as proof of cheating.</p></div></article></section>{passed ? <section className="demo-licence"><div className="demo-licence__watermark">NOT VALID</div><div><p>मध्य प्रदेश · LEARNER'S LICENCE</p><strong>DEMONSTRATION DOCUMENT</strong></div><dl><div><dt>Application</dt><dd>{applicationId}</dd></div><div><dt>Holder</dt><dd>Synthetic MP applicant</dd></div><div><dt>Validity</dt><dd>None · prototype only</dd></div><div><dt>Government record</dt><dd>Not created</dd></div></dl></section> : <section className="lf-alert"><Info size={20} /><div><strong>Practice again without another payment.</strong><p>Official retest timing, fees and eligibility remain governed by current Madhya Pradesh rules and are not asserted here.</p></div></section>}<section className="journey-receipt"><div className="section-heading"><div><p className="eyebrow">Journey receipt</p><h2>What happened, in order</h2></div><ClipboardCheck size={24} /></div><ol>{state.events.map((event) => <li key={event.id}><span><Check size={14} /></span><div><strong>{event.title}</strong><p>{event.detail}</p><small>{new Date(event.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {event.synthetic ? 'Synthetic/prototype event' : 'Browser event'}</small></div></li>)}</ol></section><div className="lf-actions"><button className="button button--primary" onClick={() => window.print()}><Printer size={18} /> Print demonstration result</button><button className="button button--secondary" onClick={reset}><RotateCcw size={18} /> Restart test simulation</button><FlowLink className="text-button" href={`/mp/application/${applicationId}`}>Application status</FlowLink></div></>
}

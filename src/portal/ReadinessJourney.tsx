import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Circle,
  Database,
  EyeOff,
  Info,
  LockKeyhole,
  Mic2,
  MonitorCheck,
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
} from 'lucide-react'
import { practiceQuestion } from '../content/questions'
import { useDeviceReadiness } from '../hooks/useDeviceReadiness'
import {
  completeReadiness,
  completeRehearsal,
  loadJourneyProgress,
  saveJourneyProgress,
  type LLJourneyProgress,
} from './progress'
import { navigatePortal } from './router'

type StageChange = (label: string) => void
type CheckTone = 'idle' | 'working' | 'pass' | 'attention'
type Language = 'en' | 'hi'
const local = (language: Language, en: string, hi: string) => language === 'en' ? en : hi

function FlowLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigatePortal(href)
  }
  return <a href={href} className={className} onClick={open}>{children}</a>
}

function JourneyBreadcrumbs({ applicationId, current }: { applicationId: string; current: string }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb"><ol><li><FlowLink href="/mp/services">Services</FlowLink></li><li><FlowLink href={`/mp/application/${applicationId}`}>Application status</FlowLink></li><li><span aria-current="page">{current}</span></li></ol></nav>
}

function CameraPreview({ stream, guided }: { stream: MediaStream | null; guided: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream
    return () => { if (ref.current) ref.current.srcObject = null }
  }, [stream])

  return <div className={`lf-camera-preview ${guided ? 'lf-camera-preview--guided' : ''}`}>
    {stream && !guided
      ? <video ref={ref} autoPlay muted playsInline aria-label="Private live camera check" />
      : <div className="lf-camera-placeholder" aria-label={guided ? 'Guided camera conditions simulated' : 'Camera preview waiting'}><UserRound size={58} /><span>{guided ? 'GUIDED SIGNALS' : 'CAMERA PREVIEW'}</span></div>}
    <div className="lf-camera-frame" aria-hidden="true" />
    <div className="lf-camera-label"><Camera size={15} />{guided ? 'Simulated camera conditions' : 'Private camera check'}</div>
  </div>
}

function statusFor(value: boolean | null, working = false): CheckTone {
  if (working) return 'working'
  if (value === null) return 'idle'
  return value ? 'pass' : 'attention'
}

function CheckRow({ icon, label, detail, tone }: { icon: ReactNode; label: string; detail: string; tone: CheckTone }) {
  return <li className={`lf-device-check lf-device-check--${tone}`}>
    <span className="lf-device-check__icon" aria-hidden="true">{icon}</span>
    <span><strong>{label}</strong><small>{detail}</small></span>
    <span className="lf-device-check__result" aria-hidden="true">{tone === 'pass' ? <Check size={17} /> : tone === 'attention' ? <TriangleAlert size={17} /> : tone === 'working' ? <RotateCw size={17} /> : <Circle size={13} />}</span>
  </li>
}

export function DeviceReadinessPage({ language, applicationId, onStageChange }: { language: Language; applicationId: string; onStageChange: StageChange }) {
  const media = useDeviceReadiness()
  const { snapshot } = media
  const progress = loadJourneyProgress(applicationId)
  const [preparedIssue, setPreparedIssue] = useState(false)

  const finish = () => {
    const updated = completeReadiness(progress, snapshot.guided ? 'guided-signals' : 'real-browser-checks')
    saveJourneyProgress(updated)
    media.stop()
    onStageChange('Test rehearsal')
    navigatePortal(`/mp/application/${applicationId}/rehearsal`)
  }

  return <>
    <JourneyBreadcrumbs applicationId={applicationId} current="Device readiness" />
    <section className="page-title"><div><p className="eyebrow">Before payment · browser checks</p><h1 tabIndex={-1}>Prove this device can run the test</h1><p>Find camera, microphone, lighting, framing, storage or connection problems before any synthetic fee is committed.</p></div></section>
    {!snapshot.started ? <>
      <section className="lf-permission-card">
        <div className="lf-permission-intro"><span><ShieldCheck size={27} /></span><div><p className="eyebrow">Just-in-time permission</p><h2>Your camera and microphone stay on this device</h2><p>The prototype measures stream health, visible face count, framing, lighting, a head turn and microphone activity. It does not record or upload video or audio.</p></div></div>
        <div className="lf-permission-grid"><div><Camera size={21} /><span><strong>Camera</strong><small>Face, framing, light, movement</small></span></div><div><Mic2 size={21} /><span><strong>Microphone</strong><small>Permission and stream health</small></span></div><div><Database size={21} /><span><strong>Browser storage</strong><small>Checkpoint recovery on this device</small></span></div></div>
      </section>
      {progress.readiness.status === 'passed' && <div className="lf-success-note"><CheckCircle2 size={20} /><div><strong>A readiness pass is already saved.</strong><p>You may continue to rehearsal or run the checks again on this device.</p></div></div>}
      {preparedIssue && <section className="prepayment-issue" role="status"><TriangleAlert size={24} /><div><p className="eyebrow">{local(language, 'Payment paused · prepared recovery scenario', 'भुगतान रुका · तैयार रिकवरी परिदृश्य')}</p><h2>{local(language, 'The exam window could not establish a usable camera session', 'परीक्षा विंडो उपयोग योग्य कैमरा सत्र शुरू नहीं कर सकी')}</h2><div className="warning-contract"><div><strong>{local(language, 'What happened?', 'क्या हुआ?')}</strong><p>{local(language, 'The prepared scenario detected an exam-launch condition that should be fixed before payment.', 'तैयार परिदृश्य में परीक्षा शुरू करने की ऐसी स्थिति मिली जिसे भुगतान से पहले ठीक करना चाहिए।')}</p></div><div><strong>{local(language, 'What happened to my application and payment?', 'मेरे आवेदन और भुगतान का क्या हुआ?')}</strong><p>{local(language, 'Your application is saved. No payment attempt has started, and you can recheck this device now.', 'आपका आवेदन सहेजा गया है। कोई भुगतान प्रयास शुरू नहीं हुआ और अब आप इस डिवाइस की दोबारा जाँच कर सकते हैं।')}</p></div></div><div className="lf-actions"><button className="button button--primary" onClick={() => { setPreparedIssue(false); void media.start() }}>{local(language, 'Recheck this device', 'इस डिवाइस की दोबारा जाँच करें')} <RefreshCcw size={18} /></button><button className="button button--secondary" onClick={() => { setPreparedIssue(false); media.useGuidedSignals() }}>{local(language, 'Use guided fallback', 'निर्देशित विकल्प उपयोग करें')}</button></div></div></section>}
      {!preparedIssue && <div className="lf-actions lf-actions--stack"><button className="button button--primary" onClick={() => void media.start()}>Start private device checks <ArrowRight size={18} /></button><button className="button button--secondary" onClick={() => setPreparedIssue(true)}>{local(language, 'Run prepared exam-window issue', 'तैयार परीक्षा-विंडो समस्या चलाएँ')}</button><button className="button button--secondary" onClick={media.useGuidedSignals}>Use clearly labelled guided signals</button>{progress.readiness.status === 'passed' && <FlowLink className="text-button" href={`/mp/application/${applicationId}/rehearsal`}>Continue with saved pass</FlowLink>}</div>}
    </> : <>
      {snapshot.guided && <div className="lf-simulation-banner"><Info size={19} /><p><strong>Guided scenario:</strong> camera-derived signals are simulated. Browser storage, secure-context and connection checks remain real.</p></div>}
      <section className="lf-readiness-lab">
        <div className="lf-camera-column"><CameraPreview stream={media.stream} guided={snapshot.guided} /><div className="lf-head-turn"><span className={snapshot.headTurnComplete ? 'complete' : ''}><RotateCw size={22} /></span><div><strong>{snapshot.guided ? 'Guided movement signal simulated' : snapshot.headTurnComplete ? 'Head-turn challenge completed' : 'Turn your face gently to either side'}</strong><small>{snapshot.guided ? 'No movement was measured in this route.' : snapshot.headTurnComplete ? 'Responsive movement was observed.' : 'This checks movement—not identity or cheating.'}</small></div></div><div className="lf-audio-meter" aria-label={`Microphone activity ${Math.round(snapshot.audioLevel * 100)} percent`}><Mic2 size={17} /><span>Mic stream</span><div><i style={{ width: `${Math.max(4, snapshot.audioLevel * 100)}%` }} /></div><strong>{snapshot.guided ? 'Simulated' : snapshot.microphone === 'ready' ? 'Ready' : 'Waiting'}</strong></div></div>
        <div className="lf-checks-column"><div className="lf-checks-heading"><div><p className="eyebrow">Live readiness report</p><h2>{media.ready ? 'Ready before payment' : snapshot.error ? 'A fix is needed' : 'Checking this device'}</h2></div><MonitorCheck size={25} /></div><ul className="lf-device-check-list" aria-live="polite">
          <CheckRow icon={<Wifi size={19} />} label="Connection" detail={snapshot.online ? 'Browser reports online' : 'Connection is offline'} tone={statusFor(snapshot.online)} />
          <CheckRow icon={<Database size={19} />} label="Saved progress" detail={snapshot.storage ? 'Checkpoint write succeeded' : 'Browser storage unavailable'} tone={statusFor(snapshot.storage)} />
          <CheckRow icon={<LockKeyhole size={19} />} label="Secure page" detail={snapshot.secureContext ? 'Secure context or trusted localhost' : 'Open the prototype over HTTPS'} tone={statusFor(snapshot.secureContext)} />
          <CheckRow icon={<Camera size={19} />} label={snapshot.guided ? 'Camera condition' : 'Camera stream'} detail={snapshot.guided ? 'Simulated camera-ready signal' : snapshot.camera === 'ready' ? 'Permission and live stream ready' : snapshot.camera === 'denied' ? 'Permission was not allowed' : 'Waiting for permission'} tone={statusFor(snapshot.camera === 'ready', snapshot.camera === 'requesting')} />
          <CheckRow icon={<Mic2 size={19} />} label={snapshot.guided ? 'Microphone condition' : 'Microphone stream'} detail={snapshot.guided ? 'Simulated microphone-ready signal' : snapshot.microphone === 'ready' ? 'Permission and stream ready' : 'Waiting for permission'} tone={statusFor(snapshot.microphone === 'ready', snapshot.microphone === 'requesting')} />
          <CheckRow icon={<UserRound size={19} />} label={snapshot.guided ? 'Face condition' : 'Visible face'} detail={snapshot.guided ? 'Simulated single-face signal' : snapshot.faceCount === null ? 'Loading private face model' : snapshot.faceCount === 1 ? 'Exactly one face visible' : `${snapshot.faceCount} faces visible`} tone={statusFor(snapshot.faceCount === 1, snapshot.model === 'loading')} />
          <CheckRow icon={<Smartphone size={19} />} label="Framing" detail={snapshot.guided ? 'Simulated good framing' : snapshot.framing === 'good' ? 'Distance and position look good' : 'Centre your face inside the guide'} tone={statusFor(snapshot.framing === 'good')} />
          <CheckRow icon={<SunMedium size={19} />} label="Lighting" detail={snapshot.guided ? 'Simulated usable lighting' : snapshot.lighting === 'good' ? `Usable light · level ${snapshot.brightness}` : snapshot.lighting === 'dim' ? 'Move to a brighter place' : snapshot.lighting === 'bright' ? 'Reduce strong backlight' : 'Waiting for camera'} tone={statusFor(snapshot.lighting === 'good')} />
          <CheckRow icon={<RotateCw size={19} />} label="Head-turn challenge" detail={snapshot.guided ? 'Simulated movement signal' : snapshot.headTurnComplete ? 'Responsive movement observed' : 'Turn gently to either side'} tone={statusFor(snapshot.headTurnComplete)} />
        </ul></div>
      </section>
      {snapshot.error && <div className="lf-alert" role="alert"><TriangleAlert size={20} /><div><strong>We could not finish every check.</strong><p>{snapshot.error}</p></div></div>}
      <div className="lf-actions lf-actions--stack"><button className="button button--primary" disabled={!media.ready} onClick={finish}>Confirm readiness and rehearse <ArrowRight size={18} /></button>{!media.ready && <div className="lf-button-pair"><button className="button button--secondary" onClick={() => void media.start()}><RefreshCcw size={18} /> Retry real checks</button><button className="button button--secondary" onClick={media.useGuidedSignals}>Use guided signals instead</button></div>}</div>
    </>}
  </>
}

export function RehearsalPage({ applicationId, onStageChange }: { applicationId: string; onStageChange: StageChange }) {
  const [progress, setProgress] = useState<LLJourneyProgress>(() => loadJourneyProgress(applicationId))
  const [selected, setSelected] = useState<number | null>(() => progress.rehearsal.answer ?? null)
  const saved = progress.rehearsal.status === 'completed'

  if (progress.readiness.status !== 'passed') return <><JourneyBreadcrumbs applicationId={applicationId} current="Test rehearsal" /><section className="route-guard"><TriangleAlert size={30} /><p className="eyebrow">Readiness required</p><h1 tabIndex={-1}>Check this device first</h1><p>Rehearsal unlocks only after a real browser check or the clearly labelled guided scenario passes.</p><FlowLink className="button button--primary" href={`/mp/application/${applicationId}/readiness`}>Open device readiness</FlowLink></section></>

  const saveAnswer = () => {
    if (selected === null) return
    const updated = completeRehearsal(progress, selected)
    saveJourneyProgress(updated)
    setProgress(updated)
    onStageChange('Fee payment')
  }

  return <><JourneyBreadcrumbs applicationId={applicationId} current="Test rehearsal" /><section className="page-title"><div><p className="eyebrow">No attempt used · safe practice</p><h1 tabIndex={-1}>Rehearse the answer checkpoint</h1><p>Experience the same save-before-next pattern that protects every answer in the synthetic test.</p></div></section><div className="lf-status-bar"><span><Camera size={17} />Readiness passed</span><span><Signal size={17} />Connection observed</span><span><LockKeyhole size={17} />Rehearsal only</span></div><fieldset className="lf-question-card"><legend>Rehearsal question</legend><h2>{practiceQuestion.prompt}</h2><div className="lf-answer-options">{practiceQuestion.options.map((option, index) => <label className={selected === index ? 'selected' : ''} key={option}><input type="radio" name="rehearsal-answer" checked={selected === index} onChange={() => { setSelected(index); if (saved) setProgress({ ...progress, rehearsal: { status: 'not-started' } }) }} /><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong></label>)}</div></fieldset>{saved && <div className="lf-success-note" role="status"><CheckCircle2 size={20} /><div><strong>Sample answer checkpointed.</strong><p>If the connection changes now, this saved choice remains available after refresh.</p></div></div>}<section className="lf-rehearsal-notes"><div><WifiOff size={20} /><span><strong>Network drops</strong><small>Pause and preserve answers</small></span></div><div><EyeOff size={20} /><span><strong>Test view disappears</strong><small>Pause and re-check</small></span></div><div><Users size={20} /><span><strong>More than one face</strong><small>Describe the signal; do not accuse</small></span></div></section><div className="lf-actions">{!saved ? <button className="button button--primary" disabled={selected === null} onClick={saveAnswer}>Save sample answer <LockKeyhole size={18} /></button> : <button className="button button--primary" onClick={() => navigatePortal(`/mp/application/${applicationId}/payment`)}>Continue to demo payment <ArrowRight size={18} /></button>}<FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary"><ArrowLeft size={18} /> Application status</FlowLink></div></>
}

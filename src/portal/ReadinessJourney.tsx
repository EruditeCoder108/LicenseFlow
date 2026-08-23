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

function JourneyBreadcrumbs({ language, applicationId, current }: { language: Language; applicationId: string; current: string }) {
  return (
    <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
      <ol>
        <li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li>
        <li><FlowLink href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></li>
        <li><span aria-current="page">{current}</span></li>
      </ol>
    </nav>
  )
}

function CameraPreview({ language, stream, guided }: { language: Language; stream: MediaStream | null; guided: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream
    return () => { if (ref.current) ref.current.srcObject = null }
  }, [stream])

  return (
    <div className={`lf-camera-preview ${guided ? 'lf-camera-preview--guided' : ''}`}>
      {stream && !guided ? (
        <video ref={ref} autoPlay muted playsInline aria-label={local(language, 'Private live camera check', 'निजी लाइव कैमरा जाँच')} />
      ) : (
        <div className="lf-camera-placeholder" aria-label={guided ? local(language, 'Guided camera conditions simulated', 'कैमरा स्थितियाँ सिम्युलेट की गईं') : local(language, 'Camera preview waiting', 'कैमरा का इंतजार')}>
          <UserRound size={58} />
          <span>{guided ? local(language, 'DEMO SIGNALS', 'डेमो संकेत') : local(language, 'CAMERA PREVIEW', 'कैमरा पूर्वावलोकन')}</span>
        </div>
      )}
      <div className="lf-camera-frame" aria-hidden="true" />
      <div className="lf-camera-label">
        <Camera size={15} />
        {guided ? local(language, 'Simulated camera conditions', 'सिम्युलेट की गई कैमरा स्थितियाँ') : local(language, 'Private camera check', 'निजी कैमरा जाँच')}
      </div>
    </div>
  )
}

function readinessError(language: Language, error: string) {
  const translations: Record<string, string> = {
    'Camera checks require HTTPS or localhost and a supported browser.': 'कैमरा जाँच के लिए HTTPS या लोकलहोस्ट और समर्थित ब्राउज़र आवश्यक है।',
    'The camera stream stopped. Reconnect the camera before continuing.': 'कैमरा रुक गया। आगे बढ़ने से पहले कैमरा फिर जोड़ें।',
    'Camera or microphone permission was not allowed. Nothing was recorded.': 'कैमरा या माइक्रोफ़ोन की अनुमति नहीं मिली। कुछ भी रिकॉर्ड नहीं किया गया।',
    'The private camera analysis could not start. You can retry or use the labelled guided scenario.': 'कैमरा जाँच शुरू नहीं हो सकी। दोबारा कोशिश करें या डेमो सिमुलेशन का इस्तेमाल करें।',
    'Face analysis stopped unexpectedly. Retry the device check.': 'चेहरा पहचान अचानक रुक गई। डिवाइस जाँच दोबारा करें।',
  }
  return language === 'en' ? error : translations[error] ?? error
}

function statusFor(value: boolean | null, working = false): CheckTone {
  if (working) return 'working'
  if (value === null) return 'idle'
  return value ? 'pass' : 'attention'
}

function CheckRow({ icon, label, detail, tone }: { icon: ReactNode; label: string; detail: string; tone: CheckTone }) {
  return (
    <li className={`lf-device-check lf-device-check--${tone}`}>
      <span className="lf-device-check__icon" aria-hidden="true">{icon}</span>
      <span><strong>{label}</strong><small>{detail}</small></span>
      <span className="lf-device-check__result" aria-hidden="true">
        {tone === 'pass' ? <Check size={17} /> : tone === 'attention' ? <TriangleAlert size={17} /> : tone === 'working' ? <RotateCw size={17} /> : <Circle size={13} />}
      </span>
    </li>
  )
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

  return (
    <>
      <JourneyBreadcrumbs language={language} applicationId={applicationId} current={local(language, 'Device check', 'डिवाइस जाँच')} />
      <section className="page-title">
        <div>
          <p className="eyebrow">{local(language, 'Before payment · device check', 'भुगतान से पहले · डिवाइस जाँच')}</p>
          <h1 tabIndex={-1}>{local(language, 'Check your device before you pay', 'भुगतान से पहले अपने डिवाइस की जाँच करें')}</h1>
          <p>{local(language, 'We check your camera, microphone, lighting, framing, storage and internet connection before you pay any fee.', 'हम शुल्क से पहले आपके कैमरे, माइक्रोफ़ोन, रोशनी, फ्रेमिंग, मेमोरी और इंटरनेट की जाँच करते हैं।')}</p>
        </div>
      </section>
      {!snapshot.started ? (
        <>
          <section className="lf-permission-card">
            <div className="lf-permission-intro">
              <span><ShieldCheck size={27} /></span>
              <div>
                <p className="eyebrow">{local(language, 'Privacy notice', 'गोपनीयता सूचना')}</p>
                <h2>{local(language, 'Your camera and microphone stay on this device', 'आपका कैमरा और माइक इसी डिवाइस पर रहता है')}</h2>
                <p>{local(language, 'This demo checks your camera, lighting, framing, a simple head turn and microphone. It does not record or upload any video or audio.', 'यह डेमो कैमरे, रोशनी, फ्रेमिंग, सिर घुमाने और माइक की जाँच करता है। यह कोई वीडियो या ऑडियो रिकॉर्ड या अपलोड नहीं करता।')}</p>
              </div>
            </div>
            <div className="lf-permission-grid">
              <div>
                <Camera size={21} />
                <span>
                  <strong>{local(language, 'Camera', 'कैमरा')}</strong>
                  <small>{local(language, 'Face, framing, light, movement', 'चेहरा, फ्रेमिंग, रोशनी, हरकत')}</small>
                </span>
              </div>
              <div>
                <Mic2 size={21} />
                <span>
                  <strong>{local(language, 'Microphone', 'माइक्रोफ़ोन')}</strong>
                  <small>{local(language, 'Check stream works', 'माइक चालू होने की जाँच')}</small>
                </span>
              </div>
              <div>
                <Database size={21} />
                <span>
                  <strong>{local(language, 'Browser storage', 'ब्राउज़र मेमोरी')}</strong>
                  <small>{local(language, 'Saves your progress on this device', 'प्रगति इसी डिवाइस पर सहेजी जाती है')}</small>
                </span>
              </div>
            </div>
          </section>
          {progress.readiness.status === 'passed' && (
            <div className="lf-success-note">
              <CheckCircle2 size={20} />
              <div>
                <strong>{local(language, 'Device check is already complete.', 'डिवाइस जाँच पहले से पूरी है।')}</strong>
                <p>{local(language, 'You can continue to practice or run the check again.', 'आप अभ्यास जारी रख सकते हैं या दोबारा जाँच कर सकते हैं।')}</p>
              </div>
            </div>
          )}
          {preparedIssue && (
            <section className="prepayment-issue" role="status">
              <TriangleAlert size={24} />
              <div>
                <p className="eyebrow">{local(language, 'Payment paused · problem found', 'भुगतान रोका गया · समस्या मिली')}</p>
                <h2>{local(language, 'Camera could not start', 'कैमरा चालू नहीं हो सका')}</h2>
                <div className="warning-contract">
                  <div>
                    <strong>{local(language, 'What happened?', 'क्या हुआ?')}</strong>
                    <p>{local(language, 'The demo found a camera problem that should be fixed before you pay.', 'डेमो में कैमरे की समस्या मिली जिसे भुगतान से पहले ठीक करना होगा।')}</p>
                  </div>
                  <div>
                    <strong>{local(language, 'What happened to my application and payment?', 'मेरे आवेदन और भुगतान का क्या हुआ?')}</strong>
                    <p>{local(language, 'Your application is saved. No fee was charged. You can check your device again now.', 'आपका आवेदन सुरक्षित है। कोई शुल्क नहीं कटा। आप अभी दोबारा जाँच कर सकते हैं।')}</p>
                  </div>
                </div>
                <div className="lf-actions">
                  <button className="button button--primary" onClick={() => { setPreparedIssue(false); void media.start() }}>
                    {local(language, 'Check device again', 'डिवाइस दोबारा जाँचें')} <RefreshCcw size={18} />
                  </button>
                  <button className="button button--secondary" onClick={() => { setPreparedIssue(false); media.useGuidedSignals() }}>
                    {local(language, 'Use demo simulation', 'डेमो सिमुलेशन इस्तेमाल करें')}
                  </button>
                </div>
              </div>
            </section>
          )}
          {!preparedIssue && (
            <div className="lf-actions lf-actions--stack">
              <button className="button button--primary" onClick={() => void media.start()}>
                {local(language, 'Start private device check', 'डिवाइस जाँच शुरू करें')} <ArrowRight size={18} />
              </button>
              <button className="button button--secondary" onClick={() => setPreparedIssue(true)}>
                {local(language, 'Try a problem scenario', 'समस्या वाला डेमो देखें')}
              </button>
              <button className="button button--secondary" onClick={media.useGuidedSignals}>
                {local(language, 'Use demo simulation', 'डेमो सिमुलेशन इस्तेमाल करें')}
              </button>
              {progress.readiness.status === 'passed' && (
                <FlowLink className="text-button" href={`/mp/application/${applicationId}/rehearsal`}>
                  {local(language, 'Continue with saved check', 'सहेजी गई जाँच से आगे बढ़ें')}
                </FlowLink>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {snapshot.guided && (
            <div className="lf-simulation-banner">
              <Info size={19} />
              <p>
                <strong>{local(language, 'Demo simulation:', 'डेमो सिमुलेशन:')}</strong> {local(language, 'camera signals are simulated. Browser storage and connection checks are real.', 'कैमरा संकेत सिम्युलेटेड हैं। स्टोरेज और कनेक्शन की जाँच असली है।')}
              </p>
            </div>
          )}
          <section className="lf-readiness-lab">
            <div className="lf-camera-column">
              <CameraPreview language={language} stream={media.stream} guided={snapshot.guided} />
              <div className="lf-head-turn">
                <span className={snapshot.headTurnComplete ? 'complete' : ''}><RotateCw size={22} /></span>
                <div>
                  <strong>
                    {snapshot.guided
                      ? local(language, 'Demo head turn signal ready', 'डेमो सिर घुमाने का संकेत तैयार')
                      : snapshot.headTurnComplete
                      ? local(language, 'Liveness check passed', 'सक्रियता जाँच पूरी हुई')
                      : snapshot.headTurnStep === 'center_waiting'
                      ? local(language, 'Look straight at the camera', 'कैमरे के सीधे सामने देखें')
                      : snapshot.headTurnDirection === 'left'
                      ? local(language, 'Turn your face gently to the LEFT', 'चेहरा धीरे से बाईं ओर घुमाएँ')
                      : local(language, 'Turn your face gently to the RIGHT', 'चेहरा धीरे से दाईं ओर घुमाएँ')}
                  </strong>
                  <small>
                    {snapshot.guided
                      ? local(language, 'Movement is simulated in this mode.', 'इस मोड में हरकत सिम्युलेटेड है।')
                      : snapshot.headTurnComplete
                      ? local(language, 'Movement verified across frames.', 'हरकत सफलता पूर्वक जाँची गई।')
                      : snapshot.headTurnStep === 'center_waiting'
                      ? local(language, 'Hold your head centered for a moment...', 'कुछ क्षण के लिए चेहरा सीधा रखें...')
                      : local(language, 'Hold the turn for a brief moment.', 'थोड़ी देर के लिए सिर इसी स्थिति में रखें।')}
                  </small>
                </div>
              </div>
              <div className="lf-audio-meter" aria-label={local(language, `Microphone activity ${Math.round(snapshot.audioLevel * 100)} percent`, `माइक्रोफ़ोन गतिविधि ${Math.round(snapshot.audioLevel * 100)} प्रतिशत`)}>
                <Mic2 size={17} />
                <span>{local(language, 'Mic stream', 'माइक')}</span>
                <div><i style={{ width: `${Math.max(4, snapshot.audioLevel * 100)}%` }} /></div>
                <strong>{snapshot.guided ? local(language, 'Simulated', 'सिम्युलेटेड') : snapshot.microphone === 'ready' ? local(language, 'Ready', 'तैयार') : local(language, 'Waiting', 'प्रतीक्षा')}</strong>
              </div>
            </div>
            <div className="lf-checks-column">
              <div className="lf-checks-heading">
                <div>
                  <p className="eyebrow">{local(language, 'Device check status', 'डिवाइस स्थिति')}</p>
                  <h2>
                    {media.ready
                      ? local(language, 'Ready before payment', 'भुगतान के लिए तैयार')
                      : snapshot.error
                      ? local(language, 'A fix is needed', 'सुधार जरूरी है')
                      : local(language, 'Checking this device', 'डिवाइस की जाँच जारी है')}
                  </h2>
                </div>
                <MonitorCheck size={25} />
              </div>
              <ul className="lf-device-check-list" aria-live="polite">
                <CheckRow
                  icon={<Wifi size={19} />}
                  label={local(language, 'Internet', 'इंटरनेट')}
                  detail={snapshot.online ? local(language, 'Connected', 'इंटरनेट चालू है') : local(language, 'Offline', 'इंटरनेट बंद है')}
                  tone={statusFor(snapshot.online)}
                />
                <CheckRow
                  icon={<Database size={19} />}
                  label={local(language, 'Progress saved', 'प्रगति सहेजी गई')}
                  detail={snapshot.storage ? local(language, 'Saved on this device', 'डिवाइस पर सुरक्षित') : local(language, 'Cannot save progress', 'प्रगति सहेजी नहीं जा सकी')}
                  tone={statusFor(snapshot.storage)}
                />
                <CheckRow
                  icon={<LockKeyhole size={19} />}
                  label={local(language, 'Secure page', 'सुरक्षित पेज')}
                  detail={snapshot.secureContext ? local(language, 'Secure connection', 'सुरक्षित कनेक्शन') : local(language, 'Open using HTTPS', 'HTTPS पर खोलें')}
                  tone={statusFor(snapshot.secureContext)}
                />
                <CheckRow
                  icon={<Camera size={19} />}
                  label={local(language, 'Camera', 'कैमरा')}
                  detail={snapshot.guided ? local(language, 'Camera is ready', 'कैमरा तैयार है') : snapshot.camera === 'ready' ? local(language, 'Camera is working', 'कैमरा काम कर रहा है') : snapshot.camera === 'denied' ? local(language, 'Camera blocked', 'कैमरे की अनुमति नहीं मिली') : local(language, 'Waiting for camera', 'कैमरे का इंतजार')}
                  tone={statusFor(snapshot.camera === 'ready', snapshot.camera === 'requesting')}
                />
                <CheckRow
                  icon={<Mic2 size={19} />}
                  label={local(language, 'Microphone', 'माइक्रोफ़ोन')}
                  detail={snapshot.guided ? local(language, 'Microphone is ready', 'माइक तैयार है') : snapshot.microphone === 'ready' ? local(language, 'Microphone is working', 'माइक काम कर रहा है') : snapshot.microphone === 'denied' ? local(language, 'Microphone blocked', 'माइक की अनुमति नहीं मिली') : local(language, 'Waiting for microphone', 'माइक का इंतजार')}
                  tone={statusFor(snapshot.microphone === 'ready', snapshot.microphone === 'requesting')}
                />
                <CheckRow
                  icon={<UserRound size={19} />}
                  label={local(language, 'Face in camera', 'कैमरे में चेहरा')}
                  detail={snapshot.guided ? local(language, 'One face detected', 'एक चेहरा मिला') : snapshot.faceCount === null ? local(language, 'Looking for face', 'चेहरा खोजा जा रहा है') : snapshot.faceCount === 1 ? local(language, 'One face visible', 'एक चेहरा दिख रहा है') : local(language, `${snapshot.faceCount} faces visible`, `${snapshot.faceCount} चेहरे दिख रहे हैं`)}
                  tone={statusFor(snapshot.faceCount === 1, snapshot.model === 'loading')}
                />
                <CheckRow
                  icon={<Smartphone size={19} />}
                  label={local(language, 'Position', 'स्थिति')}
                  detail={snapshot.guided ? local(language, 'Position looks good', 'स्थिति सही है') : snapshot.framing === 'good' ? local(language, 'Position looks good', 'स्थिति सही है') : local(language, 'Move face to the centre', 'चेहरा बीच में लाएँ')}
                  tone={statusFor(snapshot.framing === 'good')}
                />
                <CheckRow
                  icon={<SunMedium size={19} />}
                  label={local(language, 'Lighting', 'रोशनी')}
                  detail={snapshot.guided ? local(language, 'Good lighting', 'रोशनी सही है') : snapshot.lighting === 'good' ? local(language, `Good lighting · level ${snapshot.brightness}`, `रोशनी सही है · स्तर ${snapshot.brightness}`) : snapshot.lighting === 'dim' ? local(language, 'Too dark — move to light', 'रोशनी कम है — उजाले में जाएँ') : snapshot.lighting === 'bright' ? local(language, 'Too bright — reduce backlight', 'रोशनी बहुत तेज है') : local(language, 'Waiting for camera', 'कैमरे का इंतजार')}
                  tone={statusFor(snapshot.lighting === 'good')}
                />
                <CheckRow
                  icon={<RotateCw size={19} />}
                  label={local(language, 'Head turn', 'सिर घुमाना')}
                  detail={
                    snapshot.guided
                      ? local(language, 'Turn completed', 'सिर घुमाना पूरा हुआ')
                      : snapshot.headTurnComplete
                      ? local(language, 'Turn completed', 'सिर घुमाना पूरा हुआ')
                      : snapshot.headTurnStep === 'center_waiting'
                      ? local(language, 'Keep face centered', 'चेहरा केंद्र में रखें')
                      : local(language, `Turn ${snapshot.headTurnDirection.toUpperCase()}`, `${snapshot.headTurnDirection === 'left' ? 'बाईं' : 'दाईं'} ओर घुमाएँ`)
                  }
                  tone={statusFor(snapshot.headTurnComplete)}
                />
              </ul>
            </div>
          </section>
          {snapshot.error && (
            <div className="lf-alert" role="alert">
              <TriangleAlert size={20} />
              <div>
                <strong>{local(language, 'We could not finish every check.', 'हम हर जाँच पूरी नहीं कर सके।')}</strong>
                <p>{readinessError(language, snapshot.error)}</p>
              </div>
            </div>
          )}
          <div className="lf-actions lf-actions--stack">
            <button className="button button--primary" disabled={!media.ready} onClick={finish}>
              {local(language, 'Confirm check and try practice question', 'जाँच की पुष्टि करें और अभ्यास करें')} <ArrowRight size={18} />
            </button>
            {!media.ready && (
              <div className="lf-button-pair">
                <button className="button button--secondary" onClick={() => void media.start()}>
                  <RefreshCcw size={18} /> {local(language, 'Retry real check', 'असली जाँच दोबारा करें')}
                </button>
                <button className="button button--secondary" onClick={media.useGuidedSignals}>
                  {local(language, 'Use demo simulation', 'डेमो सिमुलेशन इस्तेमाल करें')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

export function RehearsalPage({ language, applicationId, onStageChange }: { language: Language; applicationId: string; onStageChange: StageChange }) {
  const [progress, setProgress] = useState<LLJourneyProgress>(() => loadJourneyProgress(applicationId))
  const [selected, setSelected] = useState<number | null>(() => progress.rehearsal.answer ?? null)
  const saved = progress.rehearsal.status === 'completed'
  const rehearsalQuestion = language === 'en' ? practiceQuestion : {
    ...practiceQuestion,
    prompt: 'चौराहे पर बाएँ मुड़ने से पहले आपको सबसे पहले क्या करना चाहिए?',
    options: ['संकेत दें और आसपास के सड़क उपयोगकर्ताओं को जाँचें', 'लगातार हॉर्न बजाएँ', 'सड़क के दाहिने भाग में जाएँ'],
  }

  if (progress.readiness.status !== 'passed') {
    return (
      <>
        <JourneyBreadcrumbs language={language} applicationId={applicationId} current={local(language, 'Practice question', 'अभ्यास प्रश्न')} />
        <section className="route-guard">
          <TriangleAlert size={30} />
          <p className="eyebrow">{local(language, 'Device check required', 'डिवाइस जाँच आवश्यक')}</p>
          <h1 tabIndex={-1}>{local(language, 'Check this device first', 'पहले इस डिवाइस की जाँच करें')}</h1>
          <p>{local(language, 'Practice opens only after a device check passes.', 'अभ्यास तभी खुलेगा जब डिवाइस जाँच पूरी हो जाएगी।')}</p>
          <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/readiness`}>
            {local(language, 'Start device check', 'डिवाइस जाँच शुरू करें')}
          </FlowLink>
        </section>
      </>
    )
  }

  const saveAnswer = () => {
    if (selected === null) return
    const updated = completeRehearsal(progress, selected)
    saveJourneyProgress(updated)
    setProgress(updated)
    onStageChange('Fee payment')
  }

  return (
    <>
      <JourneyBreadcrumbs language={language} applicationId={applicationId} current={local(language, 'Practice question', 'अभ्यास प्रश्न')} />
      <section className="page-title">
        <div>
          <p className="eyebrow">{local(language, 'Safe practice · does not count as a test attempt', 'सुरक्षित अभ्यास · यह मुख्य परीक्षा में नहीं गिना जाएगा')}</p>
          <h1 tabIndex={-1}>{local(language, 'Try a practice question', 'एक अभ्यास प्रश्न हल करें')}</h1>
          <p>{local(language, 'See how questions work and how your answer is saved before you move to the next question.', 'देखें कि प्रश्न कैसे काम करते हैं और अगला प्रश्न खोलने से पहले उत्तर कैसे सहेजता है।')}</p>
        </div>
      </section>
      <div className="lf-status-bar">
        <span><Camera size={17} />{local(language, 'Device check passed', 'डिवाइस जाँच पास')}</span>
        <span><Signal size={17} />{local(language, 'Connected', 'इंटरनेट चालू')}</span>
        <span><LockKeyhole size={17} />{local(language, 'Practice only', 'सिर्फ अभ्यास')}</span>
      </div>
      <fieldset className="lf-question-card">
        <legend>{local(language, 'Practice question', 'अभ्यास प्रश्न')}</legend>
        <h2>{rehearsalQuestion.prompt}</h2>
        <div className="lf-answer-options">
          {rehearsalQuestion.options.map((option, index) => (
            <label className={selected === index ? 'selected' : ''} key={option}>
              <input
                type="radio"
                name="rehearsal-answer"
                checked={selected === index}
                onChange={() => {
                  setSelected(index)
                  if (saved) setProgress({ ...progress, rehearsal: { status: 'not-started' } })
                }}
              />
              <span>{String.fromCharCode(65 + index)}</span>
              <strong>{option}</strong>
            </label>
          ))}
        </div>
      </fieldset>
      {saved && (
        <div className="lf-success-note" role="status">
          <CheckCircle2 size={20} />
          <div>
            <strong>{local(language, 'Sample answer saved.', 'नमूना उत्तर सहेज लिया गया।')}</strong>
            <p>{local(language, 'If you refresh or lose connection, your answer stays saved.', 'रिफ्रेश करने या कनेक्शन टूटने पर भी उत्तर सुरक्षित रहता है।')}</p>
          </div>
        </div>
      )}
      <section className="lf-rehearsal-notes">
        <div>
          <WifiOff size={20} />
          <span>
            <strong>{local(language, 'If the network drops', 'अगर इंटरनेट बंद हो जाए')}</strong>
            <small>{local(language, 'The test pauses; your answers stay saved', 'परीक्षा रुक जाएगी; उत्तर सुरक्षित रहेंगे')}</small>
          </span>
        </div>
        <div>
          <EyeOff size={20} />
          <span>
            <strong>{local(language, 'If the test closes', 'अगर परीक्षा स्क्रीन बंद हो जाए')}</strong>
            <small>{local(language, 'Reopen and resume from where you stopped', 'फिर से खोलें और वहीं से शुरू करें')}</small>
          </span>
        </div>
        <div>
          <Users size={20} />
          <span>
            <strong>{local(language, 'If another person appears', 'अगर कोई और दिखे')}</strong>
            <small>{local(language, 'The system gives a polite reminder; no instant penalty', 'सिस्टम याद दिलाएगा; तुरंत कोई पेनल्टी नहीं')}</small>
          </span>
        </div>
      </section>
      <div className="lf-actions">
        {!saved ? (
          <button className="button button--primary" disabled={selected === null} onClick={saveAnswer}>
            {local(language, 'Save answer', 'उत्तर सहेजें')} <LockKeyhole size={18} />
          </button>
        ) : (
          <button className="button button--primary" onClick={() => navigatePortal(`/mp/application/${applicationId}/payment`)}>
            {local(language, 'Continue to fee payment', 'शुल्क भुगतान पर जाएँ')} <ArrowRight size={18} />
          </button>
        )}
        <FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary">
          <ArrowLeft size={18} /> {local(language, 'Application status', 'आवेदन स्थिति')}
        </FlowLink>
      </div>
    </>
  )
}

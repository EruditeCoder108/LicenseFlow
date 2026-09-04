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
  Sparkles,
  Signal,
  Smartphone,
  SunMedium,
  TriangleAlert,
  UserRound,
  Users,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { practiceQuestion } from '../content/questions'
import { useDeviceReadiness, stopAllMediaTracks } from '../hooks/useDeviceReadiness'
import {
  completeReadiness,
  completeRehearsal,
  loadJourneyProgress,
  saveJourneyProgress,
  type LLJourneyProgress,
} from './progress'
import { navigatePortal } from './router'
import { FocusedAssessmentShell, useFocusedFullscreen } from './FocusedAssessmentShell'
import { translate as local, type Language } from './i18n'

type StageChange = (label: string) => void
type CheckTone = 'idle' | 'working' | 'pass' | 'attention'
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

function CameraPreview({
  language,
  stream,
  guided,
  framing,
  faceCount,
}: {
  language: Language
  stream: MediaStream | null
  guided: boolean
  framing?: 'idle' | 'good' | 'adjust'
  faceCount?: number | null
}) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream
    return () => { if (ref.current) ref.current.srcObject = null }
  }, [stream])

  const frameTone = guided || (framing === 'good' && faceCount === 1)
    ? 'good'
    : faceCount === 0
    ? 'searching'
    : faceCount && faceCount > 1
    ? 'multiple'
    : 'adjust'

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
      <div className={`lf-camera-frame lf-camera-frame--${frameTone}`} aria-hidden="true">
        <span className="lf-camera-corner lf-camera-corner--tl" />
        <span className="lf-camera-corner lf-camera-corner--tr" />
        <span className="lf-camera-corner lf-camera-corner--bl" />
        <span className="lf-camera-corner lf-camera-corner--br" />
      </div>
      <div className="lf-camera-label">
        <Camera size={15} />
        {guided
          ? local(language, 'Simulated camera conditions', 'सिम्युलेट की गई कैमरा स्थितियाँ')
          : faceCount === 1 && framing === 'good'
          ? local(language, 'Live camera · Face aligned', 'लाइव कैमरा · चेहरा संरेखित')
          : faceCount === 0
          ? local(language, 'Live camera · Align face inside oval', 'लाइव कैमरा · चेहरा ओवल के अंदर रखें')
          : local(language, 'Private camera check', 'निजी कैमरा जाँच')}
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
    'Phone detection could not start. Retry before beginning the test.': 'फ़ोन की जाँच शुरू नहीं हो सकी। टेस्ट शुरू करने से पहले दोबारा कोशिश करें।',
  }
  return local(language, error, translations[error] ?? error)
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

  useEffect(() => {
    return () => {
      media.stop()
      stopAllMediaTracks()
    }
  }, [media.stop])

  const finish = async () => {
    const updated = completeReadiness(progress, snapshot.guided ? 'guided-signals' : 'real-browser-checks')
    saveJourneyProgress(updated)
    media.stop()
    stopAllMediaTracks()
    onStageChange('Demo test question')
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // non-blocking fallback
    }
    navigatePortal(`/mp/application/${applicationId}/rehearsal`)
  }

  return (
    <>
      <JourneyBreadcrumbs language={language} applicationId={applicationId} current={local(language, 'Device check', 'डिवाइस जाँच')} />
      <section className="page-title" data-tour="readiness-overview">
        <div>
          <p className="eyebrow">{local(language, 'Before payment · device check', 'भुगतान से पहले · डिवाइस जाँच')}</p>
          <h1 tabIndex={-1}>{local(language, 'Check your device before you pay', 'भुगतान से पहले अपने डिवाइस की जाँच करें')}</h1>
          <p>{local(language, 'We check your camera, microphone, lighting, framing, phone visibility, storage and internet connection before you pay any fee.', 'हम शुल्क से पहले आपके कैमरे, माइक्रोफ़ोन, रोशनी, फ्रेमिंग, फ़ोन की दृश्यता, मेमोरी और इंटरनेट की जाँच करते हैं।')}</p>
        </div>
      </section>
      {!snapshot.started ? (
        <>
          <div className="lf-readiness-layout">
            <div className="lf-readiness-layout__main">
              <section className="lf-permission-card">
                <div className="lf-permission-intro">
                  <span className="lf-permission-shield"><ShieldCheck size={28} /></span>
                  <div>
                    <p className="eyebrow">{local(language, 'Privacy & Security Guarantee', 'गोपनीयता और सुरक्षा गारंटी')}</p>
                    <h2>{local(language, 'Private & on-device only analysis', 'निजी और केवल डिवाइस पर विश्लेषण')}</h2>
                    <p>{local(language, 'Face and object checks run entirely inside your browser using local AI vision models. No audio or video is ever recorded, stored, or uploaded to any server.', 'चेहरे और वस्तु की जाँच आपके ब्राउज़र में स्थानीय AI विज़न मॉडल द्वारा की जाती है। कोई भी ऑडियो या वीडियो रिकॉर्ड या अपलोड नहीं किया जाता।')}</p>
                  </div>
                </div>
                <div className="lf-permission-grid">
                  <div className="lf-permission-item">
                    <Camera size={20} />
                    <div>
                      <strong>{local(language, 'Camera & Lighting', 'कैमरा और रोशनी')}</strong>
                      <small>{local(language, 'Face framing, single occupant, ambient light', 'चेहरा फ्रेमिंग, अकेले बैठना, रोशनी')}</small>
                    </div>
                  </div>
                  <div className="lf-permission-item">
                    <Mic2 size={20} />
                    <div>
                      <strong>{local(language, 'Audio & Liveness', 'ऑडियो और लाइवनेस')}</strong>
                      <small>{local(language, 'Microphone stream and natural head movement', 'माइक स्ट्रीम और सामान्य सिर की हरकत')}</small>
                    </div>
                  </div>
                  <div className="lf-permission-item">
                    <Database size={20} />
                    <div>
                      <strong>{local(language, 'Browser Storage', 'ब्राउज़र स्टोरेज')}</strong>
                      <small>{local(language, 'Saves encrypted progress locally on this device', 'प्रगति इसी डिवाइस पर सुरक्षित रहती है')}</small>
                    </div>
                  </div>
                </div>
              </section>

              {progress.readiness.status === 'passed' && (
                <div className="lf-success-note">
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>{local(language, 'Device check is already complete.', 'डिवाइस जाँच पहले से पूरी है।')}</strong>
                    <p>{local(language, 'You can open the demo question or run the device check again.', 'आप डेमो प्रश्न खोल सकते हैं या डिवाइस जाँच दोबारा कर सकते हैं।')}</p>
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
                <div className="lf-readiness-actions-bar" data-tour="readiness-controls">
                  <div className="lf-readiness-actions-row">
                    <button className="button button--primary" onClick={() => void media.start()}>
                      {local(language, 'Start private device check', 'डिवाइस जाँच शुरू करें')} <ArrowRight size={18} />
                    </button>
                    <button className="button button--secondary quick-fill-btn" onClick={media.useGuidedSignals} data-tour="readiness-demo-simulation">
                      <CheckCircle2 size={15} />
                      <span>{local(language, 'Use Demo Simulation', 'डेमो सिमुलेशन')}</span>
                    </button>
                    {progress.readiness.status === 'passed' && (
                      <FlowLink className="button button--secondary" href={`/mp/application/${applicationId}/rehearsal`}>
                        {local(language, 'Open demo question', 'डेमो प्रश्न खोलें')} <ArrowRight size={16} />
                      </FlowLink>
                    )}
                    <FlowLink className="button button--secondary" href={`/mp/application/${applicationId}`}>
                      <ArrowLeft size={16} /> {local(language, 'Application status', 'आवेदन स्थिति')}
                    </FlowLink>
                  </div>

                  <details className="lf-problem-scenario-tools">
                    <summary>
                      <Info size={15} /> {local(language, 'Developer / Evaluation Simulation Tools', 'डेवलपर / मूल्यांकन सिमुलेशन टूल्स')}
                    </summary>
                    <div className="lf-problem-scenario-tools__body">
                      <p>{local(language, 'Test how LicenceFlow protects applicants by intercepting hardware issues before fee payment:', 'जाँचें कि भुगतान से पहले कैमरा समस्या आने पर लाइसेंसफ्लो कैसे सुरक्षित रोकता है:')}</p>
                      <button type="button" className="button button--secondary" onClick={() => setPreparedIssue(true)}>
                        <TriangleAlert size={16} /> {local(language, 'Simulate Camera Failure Scenario', 'कैमरा विफलता का परीक्षण करें')}
                      </button>
                    </div>
                  </details>
                </div>
              )}
            </div>

            <div className="lf-readiness-layout__sidebar">
              <div className="lf-instructions-card">
                <div className="lf-instructions-card__header">
                  <Info size={18} />
                  <div>
                    <strong>{local(language, 'Visual Guidance', 'दृश्य मार्गदर्शन')}</strong>
                    <small>{local(language, '2 quick steps during check', 'जाँच के २ त्वरित चरण')}</small>
                  </div>
                </div>

                <div className="lf-instruction-step">
                  <div className="lf-instruction-step__thumb-wrap">
                    <img
                      src="/assets/readiness-face-framing.png"
                      alt={local(language, 'Face framing guide', 'चेहरा फ्रेमिंग गाइड')}
                      className="lf-instruction-step__thumb"
                    />
                  </div>
                  <div className="lf-instruction-step__content">
                    <span className="step-pill">1</span>
                    <div>
                      <h4>{local(language, 'Position & Framing', 'सही स्थिति और फ्रेमिंग')}</h4>
                      <p>{local(language, 'Center face within oval. Ensure clear frontal lighting with single occupant.', 'चेहरा ओवल के बीच में रखें। अच्छी रोशनी में अकेले बैठें।')}</p>
                    </div>
                  </div>
                </div>

                <div className="lf-instruction-step">
                  <div className="lf-instruction-step__thumb-wrap">
                    <img
                      src="/assets/readiness-head-turn.png"
                      alt={local(language, 'Head turn liveness guide', 'सिर घुमाने की लाइवनेस गाइड')}
                      className="lf-instruction-step__thumb"
                    />
                  </div>
                  <div className="lf-instruction-step__content">
                    <span className="step-pill">2</span>
                    <div>
                      <h4>{local(language, 'Active Liveness Check', 'सक्रिय जीवंतता जाँच')}</h4>
                      <p>{local(language, 'Turn head gently left or right when prompted to verify presence.', 'स्क्रीन के निर्देश पर सिर हल्का सा घुमाएँ।')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              <CameraPreview
                language={language}
                stream={media.stream}
                guided={snapshot.guided}
                framing={snapshot.framing}
                faceCount={snapshot.faceCount}
              />
              <div className="lf-head-turn">
                <div className="lf-head-turn__thumb-wrap">
                  <img
                    src="/assets/readiness-head-turn.png"
                    alt="Head turn liveness check"
                    className="lf-head-turn__thumb"
                  />
                </div>
                <span className={snapshot.headTurnComplete ? 'complete' : ''}><RotateCw size={20} /></span>
                <div>
                  <strong>
                    {snapshot.guided
                      ? local(language, 'Demo head turn signal ready', 'डेमो सिर घुमाने का संकेत तैयार')
                      : snapshot.headTurnComplete
                      ? local(language, 'Liveness check passed (Verified)', 'सक्रियता जाँच पूरी हुई (सत्यापित)')
                      : snapshot.headTurnStep === 'center_waiting'
                      ? local(language, 'Step 1: Look straight at camera', 'चरण १: कैमरे के सीधे सामने देखें')
                      : snapshot.headTurnDirection === 'left'
                      ? local(language, 'Step 2: Turn gently to the LEFT', 'चरण २: चेहरा धीरे से बाईं ओर घुमाएँ')
                      : local(language, 'Step 2: Turn gently to the RIGHT', 'चरण २: चेहरा धीरे से दाईं ओर घुमाएँ')}
                  </strong>
                  <small>
                    {snapshot.guided
                      ? local(language, 'Movement is simulated in this mode.', 'इस मोड में हरकत सिम्युलेटेड है।')
                      : snapshot.headTurnComplete
                      ? local(language, 'Movement verified across multiple frames.', 'हरकत सफलता पूर्वक जाँची गई।')
                      : snapshot.headTurnStep === 'center_waiting'
                      ? local(language, 'Hold your head centered for a moment...', 'कुछ क्षण के लिए चेहरा सीधा रखें...')
                      : local(language, 'Hold the turn for 5 frames...', '५ फ्रेम के लिए सिर इसी स्थिति में रखें...')}
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
                  icon={<MonitorCheck size={19} />}
                  label={local(language, 'Position', 'स्थिति')}
                  detail={snapshot.guided ? local(language, 'Position looks good', 'स्थिति सही है') : snapshot.framing === 'good' ? local(language, 'Position looks good', 'स्थिति सही है') : local(language, 'Move face to the centre', 'चेहरा बीच में लाएँ')}
                  tone={statusFor(snapshot.framing === 'good')}
                />
                <CheckRow
                  icon={<Smartphone size={19} />}
                  label={local(language, 'Phone in camera', 'कैमरे में फ़ोन')}
                  detail={snapshot.guided
                    ? local(language, 'No phone detected', 'कोई फ़ोन नहीं मिला')
                    : snapshot.objectModel === 'loading' || snapshot.phoneDetected === null
                    ? local(language, 'Loading phone detector', 'फ़ोन की जाँच तैयार हो रही है')
                    : snapshot.phoneDetected
                    ? local(language, 'Phone detected — move it out of view', 'फ़ोन मिला — उसे कैमरे से बाहर रखें')
                    : local(language, 'No phone detected', 'कोई फ़ोन नहीं मिला')}
                  tone={statusFor(snapshot.phoneDetected === false, snapshot.objectModel === 'loading')}
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
            <button className="button button--primary" disabled={!media.ready} onClick={finish} data-tour="readiness-continue">
              {local(language, 'Open demo question', 'डेमो प्रश्न खोलें')} <ArrowRight size={18} />
            </button>
            <p className="lf-actions__supporting-text">
              {local(
                language,
                'Open one sample question to confirm that this device can display choices and save an answer before payment.',
                'भुगतान से पहले पुष्टि करने के लिए एक नमूना प्रश्न खोलें कि यह डिवाइस विकल्प दिखा सकता है और उत्तर सहेज सकता है।'
              )}
            </p>
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
  const [speaking, setSpeaking] = useState(false)
  const { exitFullscreen } = useFocusedFullscreen()
  const saved = progress.rehearsal.status === 'completed'
  const rehearsalQuestion = language === 'en' ? practiceQuestion : language === 'hi' ? {
    ...practiceQuestion,
    prompt: 'चौराहे पर बाएँ मुड़ने से पहले आपको सबसे पहले क्या करना चाहिए?',
    options: ['संकेत दें और आसपास के सड़क उपयोगकर्ताओं को जाँचें', 'लगातार हॉर्न बजाएँ', 'सड़क के दाहिने भाग में जाएँ'],
  } : {
    ...practiceQuestion,
    prompt: local(language, practiceQuestion.prompt, practiceQuestion.prompt),
    options: practiceQuestion.options.map((option) => local(language, option, option)),
  }

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  if (progress.readiness.status !== 'passed') {
    return (
      <FocusedAssessmentShell
        mode="rehearsal"
        title="LicenceFlow"
        stageBadge={local(language, 'Demo question', 'डेमो प्रश्न')}
        language={language}
        onExit={() => navigatePortal(`/mp/application/${applicationId}`)}
      >
        <section className="route-guard route-guard--focused">
          <TriangleAlert size={34} />
          <p className="eyebrow">{local(language, 'Device check required', 'डिवाइस जाँच आवश्यक')}</p>
          <h1 tabIndex={-1}>{local(language, 'Check this device first', 'पहले इस डिवाइस की जाँच करें')}</h1>
          <p>{local(language, 'Practice opens only after a device check passes.', 'अभ्यास तभी खुलेगा जब डिवाइस जाँच पूरी हो जाएगी।')}</p>
          <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/readiness`}>
            {local(language, 'Start device check', 'डिवाइस जाँच शुरू करें')}
          </FlowLink>
        </section>
      </FocusedAssessmentShell>
    )
  }

  const saveAnswer = () => {
    if (selected === null) return
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    const updated = completeRehearsal(progress, selected)
    saveJourneyProgress(updated)
    setProgress(updated)
    onStageChange('Fee payment')
  }

  const exitToPayment = async () => {
    await exitFullscreen()
    navigatePortal(`/mp/application/${applicationId}/payment`)
  }

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const optionsText = rehearsalQuestion.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('. ')
    const utterance = new SpeechSynthesisUtterance(`${rehearsalQuestion.prompt}. ${optionsText}`)
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.rate = 0.92
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const exitRehearsal = async () => {
    window.speechSynthesis?.cancel()
    await exitFullscreen()
    navigatePortal(`/mp/application/${applicationId}`)
  }

  return (
    <FocusedAssessmentShell
      mode="rehearsal"
      title="LicenceFlow"
      stageBadge={local(language, 'Demo question · does not count', 'डेमो प्रश्न · मुख्य परीक्षा में नहीं गिना जाएगा')}
      online={true}
      cameraActive={true}
      cameraGuided={progress.readiness.mode === 'guided-signals'}
      cameraLabel={progress.readiness.mode === 'guided-signals'
        ? local(language, 'Camera-free demo', 'कैमरा-रहित डेमो')
        : local(language, 'Device ready', 'डिवाइस तैयार')}
      language={language}
      onExit={exitRehearsal}
      exitLabel={local(language, 'Exit demo question', 'डेमो प्रश्न बंद करें')}
      bottomBar={
        !saved ? (
          <div className="focused-bottom-actions">
            <button
              type="button"
              className="button button--primary"
              disabled={selected === null}
              onClick={saveAnswer}
              data-tour="rehearsal-save"
            >
              {local(language, 'Save demo answer', 'डेमो उत्तर सहेजें')} <LockKeyhole size={17} />
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={exitRehearsal}
            >
              {local(language, 'Exit to application', 'आवेदन पर लौटें')}
            </button>
          </div>
        ) : (
          <div className="focused-bottom-actions">
            <button
              type="button"
              className="button button--primary"
              onClick={exitToPayment}
              data-tour="rehearsal-continue-payment"
            >
              {local(language, 'Continue to fee payment', 'शुल्क भुगतान पर जाएँ')}{' '}
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                const reset = { ...progress, rehearsal: { status: 'not-started' as const } }
                setProgress(reset)
                saveJourneyProgress(reset)
                setSelected(null)
              }}
            >
              <RefreshCcw size={16} /> {local(language, 'Try question again', 'प्रश्न दोबारा आज़माएँ')}
            </button>
          </div>
        )
      }
    >
      <div className="focused-workspace-container">
        {!saved ? (
          <div className="focused-question-card" data-tour="rehearsal-overview">
            <div className="focused-explanation-banner">
              <Info size={18} aria-hidden="true" />
              <div>
                <strong>
                  {local(
                    language,
                    'This demo question checks whether this device can run the test.',
                    'यह डेमो प्रश्न जाँचता है कि आपका डिवाइस परीक्षा चला सकता है या नहीं।'
                  )}
                </strong>
                <p>
                  {local(
                    language,
                    'Try selecting an option and saving. This question does not affect your real test score.',
                    'विकल्प चुनकर सहेजें। यह प्रश्न आपके वास्तविक परीक्षा अंक को प्रभावित नहीं करता।'
                  )}
                </p>
              </div>
            </div>

            <div className="focused-question-heading">
              <p className="eyebrow">
                {local(language, 'Practice Question', 'अभ्यास प्रश्न')}
              </p>
              <h2>{rehearsalQuestion.prompt}</h2>
              {typeof window !== 'undefined' && 'speechSynthesis' in window && (
                <button
                  type="button"
                  className="question-speech-button"
                  onClick={toggleSpeech}
                  aria-pressed={speaking}
                >
                  {speaking ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  <span>
                    {speaking
                      ? local(language, 'Stop reading', 'पढ़ना रोकें')
                      : local(language, 'Read question aloud', 'प्रश्न सुनें')}
                  </span>
                </button>
              )}
            </div>

            <fieldset className="focused-option-grid">
              <legend className="visually-hidden">
                {local(language, 'Select one answer option', 'एक उत्तर विकल्प चुनें')}
              </legend>
              {rehearsalQuestion.options.map((option, index) => {
                const isSelected = selected === index
                return (
                  <label
                    key={option}
                    data-tour={index === 0 ? 'rehearsal-first-answer' : undefined}
                    className={`focused-option-card ${
                      isSelected ? 'focused-option-card--selected' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="rehearsal-answer-radio"
                      checked={isSelected}
                      onChange={() => setSelected(index)}
                    />
                    <span className="focused-option-card__badge">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <strong className="focused-option-card__label">{option}</strong>
                  </label>
                )
              })}
            </fieldset>

            <div className="focused-security-note">
              <LockKeyhole size={16} aria-hidden="true" />
              <span>
                {local(
                  language,
                  'Answers are saved locally on this browser so they survive unexpected network drops or refreshes.',
                  'उत्तर स्थानीय ब्राउज़र पर सुरक्षित रहते हैं ताकि नेटवर्क कटने पर भी सुरक्षित रहें।'
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="focused-success-card">
            <div className="focused-success-card__icon" aria-hidden="true">
              <CheckCircle2 size={44} />
            </div>
            <p className="eyebrow">{local(language, 'Readiness verified', 'तैयारी सत्यापित')}</p>
            <h1>{local(language, 'Demo question completed', 'डेमो प्रश्न पूरा हुआ')}</h1>
            <p className="focused-success-card__sub">
              {local(
                language,
                'This device displayed the question, accepted your answer and saved it successfully.',
                'इस डिवाइस ने प्रश्न दिखाया, आपका उत्तर स्वीकार किया और उसे सफलतापूर्वक सहेजा।'
              )}
            </p>

            <ul className="focused-checklist" aria-label={local(language, 'Demo question checks', 'डेमो प्रश्न जाँच')}>
              <li>
                <Check size={18} aria-hidden="true" />
                <div>
                  <strong>{local(language, 'Question displayed correctly', 'प्रश्न सही तरीके से प्रदर्शित हुआ')}</strong>
                  <small>{local(language, 'Text, prompt and choices rendered with complete clarity.', 'अक्षर और विकल्प स्पष्ट रूप से पढ़े जा सकते हैं।')}</small>
                </div>
              </li>
              <li>
                <Check size={18} aria-hidden="true" />
                <div>
                  <strong>{local(language, 'Answer controls responsive', 'उत्तर नियंत्रण सक्रिय और सुगम')}</strong>
                  <small>{local(language, 'Touch, mouse and keyboard selection verified.', 'टच, माउस और कीबोर्ड चयन सुचारू रूप से कार्य कर रहा है।')}</small>
                </div>
              </li>
              <li>
                <Check size={18} aria-hidden="true" />
                <div>
                  <strong>{local(language, 'Response saved on this device', 'प्रतिक्रिया इस डिवाइस पर सहेजी गई')}</strong>
                  <small>{local(language, 'Encrypted local checkpoint verified against simulated drops.', 'ब्राउज़र स्टोरेज में सुरक्षित चेकपॉइंट सत्यापित।')}</small>
                </div>
              </li>
              <li>
                <Check size={18} aria-hidden="true" />
                <div>
                  <strong>{local(language, 'Connection available', 'इंटरनेट कनेक्शन चालू')}</strong>
                  <small>{local(language, 'Network baseline verified for smooth session delivery.', 'सत्र के लिए नेटवर्क क्षमता उपयुक्त है।')}</small>
                </div>
              </li>
              <li>
                <Check size={18} aria-hidden="true" />
                <div>
                  <strong>{local(language, 'Camera and biometric readiness confirmed', 'कैमरा और बायोमेट्रिक तैयारी पुष्ट')}</strong>
                  <small>{local(language, 'Private on-device face alignment and liveness check passed.', 'निजी ऑन-डिवाइस चेहरा संरेखण और जीवंतता जाँच पूर्ण।')}</small>
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>
    </FocusedAssessmentShell>
  )
}

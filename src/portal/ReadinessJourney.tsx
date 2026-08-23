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
  return <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'पथ')}><ol><li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li><li><FlowLink href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></li><li><span aria-current="page">{current}</span></li></ol></nav>
}

function CameraPreview({ language, stream, guided }: { language: Language; stream: MediaStream | null; guided: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream
    return () => { if (ref.current) ref.current.srcObject = null }
  }, [stream])

  return <div className={`lf-camera-preview ${guided ? 'lf-camera-preview--guided' : ''}`}>
    {stream && !guided
      ? <video ref={ref} autoPlay muted playsInline aria-label={local(language, 'Private live camera check', 'निजी लाइव कैमरा जाँच')} />
      : <div className="lf-camera-placeholder" aria-label={guided ? local(language, 'Guided camera conditions simulated', 'निर्देशित कैमरा स्थितियाँ सिम्युलेट की गईं') : local(language, 'Camera preview waiting', 'कैमरा पूर्वावलोकन प्रतीक्षारत')}><UserRound size={58} /><span>{guided ? local(language, 'GUIDED SIGNALS', 'निर्देशित संकेत') : local(language, 'CAMERA PREVIEW', 'कैमरा पूर्वावलोकन')}</span></div>}
    <div className="lf-camera-frame" aria-hidden="true" />
    <div className="lf-camera-label"><Camera size={15} />{guided ? local(language, 'Simulated camera conditions', 'सिम्युलेट की गई कैमरा स्थितियाँ') : local(language, 'Private camera check', 'निजी कैमरा जाँच')}</div>
  </div>
}

function readinessError(language: Language, error: string) {
  const translations: Record<string, string> = {
    'Camera checks require HTTPS or localhost and a supported browser.': 'कैमरा जाँच के लिए HTTPS या लोकलहोस्ट और समर्थित ब्राउज़र आवश्यक है।',
    'The camera stream stopped. Reconnect the camera before continuing.': 'कैमरा स्ट्रीम रुक गई। आगे बढ़ने से पहले कैमरा फिर जोड़ें।',
    'Camera or microphone permission was not allowed. Nothing was recorded.': 'कैमरा या माइक्रोफोन की अनुमति नहीं मिली। कुछ भी रिकॉर्ड नहीं किया गया।',
    'The private camera analysis could not start. You can retry or use the labelled guided scenario.': 'निजी कैमरा विश्लेषण शुरू नहीं हो सका। दोबारा कोशिश करें या स्पष्ट रूप से चिह्नित निर्देशित परिदृश्य उपयोग करें।',
    'Face analysis stopped unexpectedly. Retry the device check.': 'चेहरा विश्लेषण अचानक रुक गया। डिवाइस जाँच दोबारा करें।',
  }
  return language === 'en' ? error : translations[error] ?? error
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
    <JourneyBreadcrumbs language={language} applicationId={applicationId} current={local(language, 'Device readiness', 'डिवाइस अनुकूलता')} />
    <section className="page-title"><div><p className="eyebrow">{local(language, 'Before payment · browser checks', 'भुगतान से पहले · ब्राउज़र जाँच')}</p><h1 tabIndex={-1}>{local(language, 'Prove this device can run the test', 'जाँचें कि यह डिवाइस परीक्षा चला सकता है')}</h1><p>{local(language, 'Find camera, microphone, lighting, framing, storage or connection problems before any synthetic fee is committed.', 'कोई भी सिंथेटिक शुल्क दर्ज होने से पहले कैमरा, माइक्रोफोन, रोशनी, फ्रेमिंग, स्टोरेज या कनेक्शन की समस्या पता करें।')}</p></div></section>
    {!snapshot.started ? <>
      <section className="lf-permission-card">
        <div className="lf-permission-intro"><span><ShieldCheck size={27} /></span><div><p className="eyebrow">{local(language, 'Just-in-time permission', 'जरूरत के समय अनुमति')}</p><h2>{local(language, 'Your camera and microphone stay on this device', 'आपका कैमरा और माइक्रोफोन इसी डिवाइस पर रहते हैं')}</h2><p>{local(language, 'The prototype measures stream health, visible face count, framing, lighting, a head turn and microphone activity. It does not record or upload video or audio.', 'प्रोटोटाइप स्ट्रीम की स्थिति, दिख रहे चेहरों की संख्या, फ्रेमिंग, रोशनी, सिर घुमाने और माइक्रोफोन गतिविधि को मापता है। यह वीडियो या ऑडियो रिकॉर्ड अथवा अपलोड नहीं करता।')}</p></div></div>
        <div className="lf-permission-grid"><div><Camera size={21} /><span><strong>{local(language, 'Camera', 'कैमरा')}</strong><small>{local(language, 'Face, framing, light, movement', 'चेहरा, फ्रेमिंग, रोशनी, गतिविधि')}</small></span></div><div><Mic2 size={21} /><span><strong>{local(language, 'Microphone', 'माइक्रोफोन')}</strong><small>{local(language, 'Permission and stream health', 'अनुमति और स्ट्रीम स्थिति')}</small></span></div><div><Database size={21} /><span><strong>{local(language, 'Browser storage', 'ब्राउज़र स्टोरेज')}</strong><small>{local(language, 'Checkpoint recovery on this device', 'इस डिवाइस पर चेकपॉइंट रिकवरी')}</small></span></div></div>
      </section>
      {progress.readiness.status === 'passed' && <div className="lf-success-note"><CheckCircle2 size={20} /><div><strong>{local(language, 'A readiness pass is already saved.', 'डिवाइस जाँच की सफलता पहले से सहेजी गई है।')}</strong><p>{local(language, 'You may continue to rehearsal or run the checks again on this device.', 'आप अभ्यास जारी रख सकते हैं या इस डिवाइस पर जाँच दोबारा चला सकते हैं।')}</p></div></div>}
      {preparedIssue && <section className="prepayment-issue" role="status"><TriangleAlert size={24} /><div><p className="eyebrow">{local(language, 'Payment paused · prepared recovery scenario', 'भुगतान रुका · तैयार रिकवरी परिदृश्य')}</p><h2>{local(language, 'The exam window could not establish a usable camera session', 'परीक्षा विंडो उपयोग योग्य कैमरा सत्र शुरू नहीं कर सकी')}</h2><div className="warning-contract"><div><strong>{local(language, 'What happened?', 'क्या हुआ?')}</strong><p>{local(language, 'The prepared scenario detected an exam-launch condition that should be fixed before payment.', 'तैयार परिदृश्य में परीक्षा शुरू करने की ऐसी स्थिति मिली जिसे भुगतान से पहले ठीक करना चाहिए।')}</p></div><div><strong>{local(language, 'What happened to my application and payment?', 'मेरे आवेदन और भुगतान का क्या हुआ?')}</strong><p>{local(language, 'Your application is saved. No payment attempt has started, and you can recheck this device now.', 'आपका आवेदन सहेजा गया है। कोई भुगतान प्रयास शुरू नहीं हुआ और अब आप इस डिवाइस की दोबारा जाँच कर सकते हैं।')}</p></div></div><div className="lf-actions"><button className="button button--primary" onClick={() => { setPreparedIssue(false); void media.start() }}>{local(language, 'Recheck this device', 'इस डिवाइस की दोबारा जाँच करें')} <RefreshCcw size={18} /></button><button className="button button--secondary" onClick={() => { setPreparedIssue(false); media.useGuidedSignals() }}>{local(language, 'Use guided fallback', 'निर्देशित विकल्प उपयोग करें')}</button></div></div></section>}
      {!preparedIssue && <div className="lf-actions lf-actions--stack"><button className="button button--primary" onClick={() => void media.start()}>{local(language, 'Start private device checks', 'निजी डिवाइस जाँच शुरू करें')} <ArrowRight size={18} /></button><button className="button button--secondary" onClick={() => setPreparedIssue(true)}>{local(language, 'Run prepared exam-window issue', 'तैयार परीक्षा-विंडो समस्या चलाएँ')}</button><button className="button button--secondary" onClick={media.useGuidedSignals}>{local(language, 'Use clearly labelled guided signals', 'स्पष्ट रूप से चिह्नित निर्देशित संकेत उपयोग करें')}</button>{progress.readiness.status === 'passed' && <FlowLink className="text-button" href={`/mp/application/${applicationId}/rehearsal`}>{local(language, 'Continue with saved pass', 'सहेजी गई सफलता के साथ आगे बढ़ें')}</FlowLink>}</div>}
    </> : <>
      {snapshot.guided && <div className="lf-simulation-banner"><Info size={19} /><p><strong>{local(language, 'Guided scenario:', 'निर्देशित परिदृश्य:')}</strong> {local(language, 'camera-derived signals are simulated. Browser storage, secure-context and connection checks remain real.', 'कैमरा-आधारित संकेत सिम्युलेट किए गए हैं। ब्राउज़र स्टोरेज, सुरक्षित पेज और कनेक्शन जाँच वास्तविक रहती हैं।')}</p></div>}
      <section className="lf-readiness-lab">
        <div className="lf-camera-column"><CameraPreview language={language} stream={media.stream} guided={snapshot.guided} /><div className="lf-head-turn"><span className={snapshot.headTurnComplete ? 'complete' : ''}><RotateCw size={22} /></span><div><strong>{snapshot.guided ? local(language, 'Guided movement signal simulated', 'निर्देशित गतिविधि संकेत सिम्युलेट किया गया') : snapshot.headTurnComplete ? local(language, 'Head-turn challenge completed', 'सिर घुमाने की जाँच पूरी') : local(language, 'Turn your face gently to either side', 'चेहरा धीरे से किसी एक ओर घुमाएँ')}</strong><small>{snapshot.guided ? local(language, 'No movement was measured in this route.', 'इस मार्ग में गतिविधि नहीं मापी गई।') : snapshot.headTurnComplete ? local(language, 'Responsive movement was observed.', 'प्रतिक्रियाशील गतिविधि देखी गई।') : local(language, 'This checks movement—not identity or cheating.', 'यह गतिविधि जाँचता है—पहचान या नकल नहीं।')}</small></div></div><div className="lf-audio-meter" aria-label={local(language, `Microphone activity ${Math.round(snapshot.audioLevel * 100)} percent`, `माइक्रोफोन गतिविधि ${Math.round(snapshot.audioLevel * 100)} प्रतिशत`)}><Mic2 size={17} /><span>{local(language, 'Mic stream', 'माइक स्ट्रीम')}</span><div><i style={{ width: `${Math.max(4, snapshot.audioLevel * 100)}%` }} /></div><strong>{snapshot.guided ? local(language, 'Simulated', 'सिम्युलेटेड') : snapshot.microphone === 'ready' ? local(language, 'Ready', 'तैयार') : local(language, 'Waiting', 'प्रतीक्षा')}</strong></div></div>
        <div className="lf-checks-column"><div className="lf-checks-heading"><div><p className="eyebrow">{local(language, 'Live readiness report', 'लाइव डिवाइस रिपोर्ट')}</p><h2>{media.ready ? local(language, 'Ready before payment', 'भुगतान से पहले तैयार') : snapshot.error ? local(language, 'A fix is needed', 'सुधार आवश्यक है') : local(language, 'Checking this device', 'इस डिवाइस की जाँच हो रही है')}</h2></div><MonitorCheck size={25} /></div><ul className="lf-device-check-list" aria-live="polite">
          <CheckRow icon={<Wifi size={19} />} label={local(language, 'Connection', 'कनेक्शन')} detail={snapshot.online ? local(language, 'Browser reports online', 'ब्राउज़र ऑनलाइन है') : local(language, 'Connection is offline', 'कनेक्शन ऑफलाइन है')} tone={statusFor(snapshot.online)} />
          <CheckRow icon={<Database size={19} />} label={local(language, 'Saved progress', 'सहेजी प्रगति')} detail={snapshot.storage ? local(language, 'Checkpoint write succeeded', 'चेकपॉइंट सफलतापूर्वक सहेजा गया') : local(language, 'Browser storage unavailable', 'ब्राउज़र स्टोरेज उपलब्ध नहीं')} tone={statusFor(snapshot.storage)} />
          <CheckRow icon={<LockKeyhole size={19} />} label={local(language, 'Secure page', 'सुरक्षित पेज')} detail={snapshot.secureContext ? local(language, 'Secure context or trusted localhost', 'सुरक्षित पेज या विश्वसनीय लोकलहोस्ट') : local(language, 'Open the prototype over HTTPS', 'प्रोटोटाइप को HTTPS पर खोलें')} tone={statusFor(snapshot.secureContext)} />
          <CheckRow icon={<Camera size={19} />} label={snapshot.guided ? local(language, 'Camera condition', 'कैमरा स्थिति') : local(language, 'Camera stream', 'कैमरा स्ट्रीम')} detail={snapshot.guided ? local(language, 'Simulated camera-ready signal', 'कैमरा तैयार होने का सिम्युलेटेड संकेत') : snapshot.camera === 'ready' ? local(language, 'Permission and live stream ready', 'अनुमति और लाइव स्ट्रीम तैयार') : snapshot.camera === 'denied' ? local(language, 'Permission was not allowed', 'अनुमति नहीं दी गई') : local(language, 'Waiting for permission', 'अनुमति की प्रतीक्षा')} tone={statusFor(snapshot.camera === 'ready', snapshot.camera === 'requesting')} />
          <CheckRow icon={<Mic2 size={19} />} label={snapshot.guided ? local(language, 'Microphone condition', 'माइक्रोफोन स्थिति') : local(language, 'Microphone stream', 'माइक्रोफोन स्ट्रीम')} detail={snapshot.guided ? local(language, 'Simulated microphone-ready signal', 'माइक्रोफोन तैयार होने का सिम्युलेटेड संकेत') : snapshot.microphone === 'ready' ? local(language, 'Permission and stream ready', 'अनुमति और स्ट्रीम तैयार') : local(language, 'Waiting for permission', 'अनुमति की प्रतीक्षा')} tone={statusFor(snapshot.microphone === 'ready', snapshot.microphone === 'requesting')} />
          <CheckRow icon={<UserRound size={19} />} label={snapshot.guided ? local(language, 'Face condition', 'चेहरे की स्थिति') : local(language, 'Visible face', 'दिख रहा चेहरा')} detail={snapshot.guided ? local(language, 'Simulated single-face signal', 'एक चेहरे का सिम्युलेटेड संकेत') : snapshot.faceCount === null ? local(language, 'Loading private face model', 'निजी चेहरा मॉडल लोड हो रहा है') : snapshot.faceCount === 1 ? local(language, 'Exactly one face visible', 'ठीक एक चेहरा दिख रहा है') : local(language, `${snapshot.faceCount} faces visible`, `${snapshot.faceCount} चेहरे दिख रहे हैं`)} tone={statusFor(snapshot.faceCount === 1, snapshot.model === 'loading')} />
          <CheckRow icon={<Smartphone size={19} />} label={local(language, 'Framing', 'फ्रेमिंग')} detail={snapshot.guided ? local(language, 'Simulated good framing', 'अच्छी फ्रेमिंग का सिम्युलेटेड संकेत') : snapshot.framing === 'good' ? local(language, 'Distance and position look good', 'दूरी और स्थिति सही है') : local(language, 'Centre your face inside the guide', 'चेहरा गाइड के बीच में रखें')} tone={statusFor(snapshot.framing === 'good')} />
          <CheckRow icon={<SunMedium size={19} />} label={local(language, 'Lighting', 'रोशनी')} detail={snapshot.guided ? local(language, 'Simulated usable lighting', 'उपयोग योग्य रोशनी का सिम्युलेटेड संकेत') : snapshot.lighting === 'good' ? local(language, `Usable light · level ${snapshot.brightness}`, `उपयोग योग्य रोशनी · स्तर ${snapshot.brightness}`) : snapshot.lighting === 'dim' ? local(language, 'Move to a brighter place', 'अधिक रोशनी वाली जगह जाएँ') : snapshot.lighting === 'bright' ? local(language, 'Reduce strong backlight', 'पीछे की तेज रोशनी कम करें') : local(language, 'Waiting for camera', 'कैमरे की प्रतीक्षा')} tone={statusFor(snapshot.lighting === 'good')} />
          <CheckRow icon={<RotateCw size={19} />} label={local(language, 'Head-turn challenge', 'सिर घुमाने की जाँच')} detail={snapshot.guided ? local(language, 'Simulated movement signal', 'गतिविधि का सिम्युलेटेड संकेत') : snapshot.headTurnComplete ? local(language, 'Responsive movement observed', 'प्रतिक्रियाशील गतिविधि देखी गई') : local(language, 'Turn gently to either side', 'धीरे से किसी एक ओर घुमाएँ')} tone={statusFor(snapshot.headTurnComplete)} />
        </ul></div>
      </section>
      {snapshot.error && <div className="lf-alert" role="alert"><TriangleAlert size={20} /><div><strong>{local(language, 'We could not finish every check.', 'हम हर जाँच पूरी नहीं कर सके।')}</strong><p>{readinessError(language, snapshot.error)}</p></div></div>}
      <div className="lf-actions lf-actions--stack"><button className="button button--primary" disabled={!media.ready} onClick={finish}>{local(language, 'Confirm readiness and rehearse', 'डिवाइस तैयारी पक्की करें और अभ्यास करें')} <ArrowRight size={18} /></button>{!media.ready && <div className="lf-button-pair"><button className="button button--secondary" onClick={() => void media.start()}><RefreshCcw size={18} /> {local(language, 'Retry real checks', 'वास्तविक जाँच दोबारा करें')}</button><button className="button button--secondary" onClick={media.useGuidedSignals}>{local(language, 'Use guided signals instead', 'इसके बजाय निर्देशित संकेत उपयोग करें')}</button></div>}</div>
    </>}
  </>
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

  if (progress.readiness.status !== 'passed') return <><JourneyBreadcrumbs language={language} applicationId={applicationId} current={local(language, 'Test rehearsal', 'परीक्षा अभ्यास')} /><section className="route-guard"><TriangleAlert size={30} /><p className="eyebrow">{local(language, 'Readiness required', 'डिवाइस जाँच आवश्यक')}</p><h1 tabIndex={-1}>{local(language, 'Check this device first', 'पहले इस डिवाइस की जाँच करें')}</h1><p>{local(language, 'Rehearsal unlocks only after a real browser check or the clearly labelled guided scenario passes.', 'अभ्यास तभी खुलेगा जब वास्तविक ब्राउज़र जाँच या स्पष्ट रूप से चिह्नित निर्देशित परिदृश्य सफल हो।')}</p><FlowLink className="button button--primary" href={`/mp/application/${applicationId}/readiness`}>{local(language, 'Open device readiness', 'डिवाइस जाँच खोलें')}</FlowLink></section></>

  const saveAnswer = () => {
    if (selected === null) return
    const updated = completeRehearsal(progress, selected)
    saveJourneyProgress(updated)
    setProgress(updated)
    onStageChange('Fee payment')
  }

  return <><JourneyBreadcrumbs language={language} applicationId={applicationId} current={local(language, 'Test rehearsal', 'परीक्षा अभ्यास')} /><section className="page-title"><div><p className="eyebrow">{local(language, 'No attempt used · safe practice', 'कोई प्रयास उपयोग नहीं · सुरक्षित अभ्यास')}</p><h1 tabIndex={-1}>{local(language, 'Rehearse the answer checkpoint', 'उत्तर चेकपॉइंट का अभ्यास करें')}</h1><p>{local(language, 'Experience the same save-before-next pattern that protects every answer in the synthetic test.', 'वही “अगला खोलने से पहले सहेजें” प्रक्रिया आजमाएँ जो सिंथेटिक परीक्षा के हर उत्तर को सुरक्षित रखती है।')}</p></div></section><div className="lf-status-bar"><span><Camera size={17} />{local(language, 'Readiness passed', 'डिवाइस जाँच सफल')}</span><span><Signal size={17} />{local(language, 'Connection observed', 'कनेक्शन देखा गया')}</span><span><LockKeyhole size={17} />{local(language, 'Rehearsal only', 'केवल अभ्यास')}</span></div><fieldset className="lf-question-card"><legend>{local(language, 'Rehearsal question', 'अभ्यास प्रश्न')}</legend><h2>{rehearsalQuestion.prompt}</h2><div className="lf-answer-options">{rehearsalQuestion.options.map((option, index) => <label className={selected === index ? 'selected' : ''} key={option}><input type="radio" name="rehearsal-answer" checked={selected === index} onChange={() => { setSelected(index); if (saved) setProgress({ ...progress, rehearsal: { status: 'not-started' } }) }} /><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong></label>)}</div></fieldset>{saved && <div className="lf-success-note" role="status"><CheckCircle2 size={20} /><div><strong>{local(language, 'Sample answer checkpointed.', 'नमूना उत्तर चेकपॉइंट पर सहेजा गया।')}</strong><p>{local(language, 'If the connection changes now, this saved choice remains available after refresh.', 'अब कनेक्शन बदलने पर भी यह सहेजा विकल्प रिफ्रेश के बाद उपलब्ध रहेगा।')}</p></div></div>}<section className="lf-rehearsal-notes"><div><WifiOff size={20} /><span><strong>{local(language, 'Network drops', 'नेटवर्क टूटता है')}</strong><small>{local(language, 'Pause and preserve answers', 'रुकें और उत्तर सुरक्षित रखें')}</small></span></div><div><EyeOff size={20} /><span><strong>{local(language, 'Test view disappears', 'परीक्षा स्क्रीन गायब होती है')}</strong><small>{local(language, 'Pause and re-check', 'रुकें और दोबारा जाँचें')}</small></span></div><div><Users size={20} /><span><strong>{local(language, 'More than one face', 'एक से अधिक चेहरे')}</strong><small>{local(language, 'Describe the signal; do not accuse', 'संकेत बताएँ; आरोप न लगाएँ')}</small></span></div></section><div className="lf-actions">{!saved ? <button className="button button--primary" disabled={selected === null} onClick={saveAnswer}>{local(language, 'Save sample answer', 'नमूना उत्तर सहेजें')} <LockKeyhole size={18} /></button> : <button className="button button--primary" onClick={() => navigatePortal(`/mp/application/${applicationId}/payment`)}>{local(language, 'Continue to fee review', 'शुल्क समीक्षा पर जाएँ')} <ArrowRight size={18} /></button>}<FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary"><ArrowLeft size={18} /> {local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></div></>
}

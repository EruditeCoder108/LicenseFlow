import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, FastForward, LockKeyhole, RefreshCcw, ShieldCheck, Volume2, VolumeX } from 'lucide-react'
import { FocusedAssessmentShell, QuestionStatusMap, useFocusedFullscreen } from './FocusedAssessmentShell'
import { ProtectedExamClient, ExamServiceError, acceptExamSnapshot, displayedSeconds } from './protectedExamClient'
import type { ProtectedExamReview, ProtectedExamSnapshot } from './protectedExamTypes'
import { loadJourneyProgress } from './progress'
import { createPassingJudgeExamSession } from './examSession'
import { navigatePortal } from './router'
import { translate as copy, type Language } from './i18n'
import { stopAllMediaTracks, useDeviceReadiness } from '../hooks/useDeviceReadiness'
import './protectedExam.css'

function pendingStorage() { try { return window.sessionStorage } catch { return undefined } }

// Deliberately separate from TestJourney's locally scripted judge demonstration.
// Rendering cached browser state is never enough to unlock a result here.
export function ProtectedExamPage({ applicationId, language }: { applicationId: string; language: Language }) {
  const [client] = useState(() => new ProtectedExamClient(applicationId, undefined, pendingStorage()))
  const [attempt, setAttempt] = useState<ProtectedExamSnapshot | null>(null)
  const [review, setReview] = useState<ProtectedExamReview | null>(null)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [answerStage, setAnswerStage] = useState<'saving' | 'opening' | null>(null)
  const [slowAnswer, setSlowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ExamServiceError | null>(null)
  const [hidden, setHidden] = useState(document.hidden)
  const [fullscreenLost, setFullscreenLost] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [guided] = useState(() => loadJourneyProgress(applicationId).readiness.mode === 'guided-signals')
  const latest = useRef(attempt)
  const receivedAt = useRef(performance.now())
  const busyRef = useRef(false)
  const errorRef = useRef(error)
  const mounted = useRef(true)
  const heading = useRef<HTMLHeadingElement>(null)
  const fullscreenEntered = useRef(false)
  const media = useDeviceReadiness()
  const { enterFullscreen, exitFullscreen } = useFocusedFullscreen()
  const cameraReady = guided || (media.snapshot.camera === 'ready' && media.snapshot.microphone === 'ready'
    && media.snapshot.model === 'ready' && media.snapshot.objectModel === 'ready'
    && media.snapshot.faceCount === 1 && media.snapshot.phoneDetected === false
    && media.snapshot.framing === 'good' && media.snapshot.lighting === 'good')

  const accept = useCallback((incoming: ProtectedExamSnapshot) => {
    const next = acceptExamSnapshot(latest.current, incoming)
    if (next !== incoming) return
    if (latest.current?.question?.token !== next.question?.token) {
      setSelected(null)
      window.speechSynthesis?.cancel()
      setSpeaking(false)
    }
    latest.current = next
    receivedAt.current = performance.now()
    setElapsed(0)
    setAttempt(next)
  }, [])

  const perform = useCallback(async (operation: () => Promise<ProtectedExamSnapshot>) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    errorRef.current = null
    try {
      const next = await operation()
      if (mounted.current) accept(next)
      return next
    } catch (cause) {
      const problem = cause instanceof ExamServiceError ? cause : new ExamServiceError('exam_unavailable', 'The exam service could not confirm this action. Please reconnect.')
      if (mounted.current) { setError(problem); errorRef.current = problem }
    } finally {
      busyRef.current = false
      if (mounted.current) setBusy(false)
    }
  }, [accept])

  useEffect(() => {
    mounted.current = true
    let cancelled = false
    client.status().then((saved) => { if (!cancelled && saved) accept(saved) }).catch((cause: unknown) => {
      if (!cancelled) {
        const problem = cause instanceof ExamServiceError ? cause : new ExamServiceError('exam_unavailable', 'Could not load the server checkpoint.')
        setError(problem); errorRef.current = problem
      }
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; mounted.current = false }
  }, [client, accept])

  useEffect(() => {
    const interval = window.setInterval(() => setElapsed(performance.now() - receivedAt.current), 250)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    setSlowAnswer(false)
    if (!answerStage) return
    const timeout = window.setTimeout(() => setSlowAnswer(true), 2000)
    return () => window.clearTimeout(timeout)
  }, [answerStage])

  useEffect(() => {
    let heartbeatRunning = false
    const heartbeat = window.setInterval(() => {
      const current = latest.current
      if (!current?.ownsLease || current.phase === 'completed' || document.hidden || busyRef.current || errorRef.current || heartbeatRunning) return
      heartbeatRunning = true
      // A background lease renewal must not disable an answer button or swallow
      // a click. CAS + revision ordering also protect overlapping responses.
      void client.action(current, 'heartbeat').then((next) => { if (mounted.current && !busyRef.current) accept(next) }).catch((cause: unknown) => {
        if (!mounted.current || busyRef.current || latest.current?.attemptId !== current.attemptId || latest.current.revision > current.revision) return
        const problem = cause instanceof ExamServiceError ? cause : new ExamServiceError('connection_lost', 'Reconnect to check your saved test.')
        setError(problem); errorRef.current = problem
      }).finally(() => { heartbeatRunning = false })
    }, 5000)
    return () => window.clearInterval(heartbeat)
  }, [client, accept])

  useEffect(() => {
    const visibility = () => setHidden(document.hidden)
    const leaving = () => {
      const current = latest.current
      if (current?.phase === 'active' && current.ownsLease && !busyRef.current) void client.pause(current, 'exit', true).catch(() => undefined)
    }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', leaving)
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', leaving) }
  }, [client])

  useEffect(() => {
    const fullscreenElement = () => document.fullscreenElement
      || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
    const updateFullscreen = () => {
      if (fullscreenElement()) {
        fullscreenEntered.current = true
        setFullscreenLost(false)
      } else if (fullscreenEntered.current && latest.current?.phase === 'active') {
        setFullscreenLost(true)
      }
    }
    document.addEventListener('fullscreenchange', updateFullscreen)
    document.addEventListener('webkitfullscreenchange', updateFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreen)
      document.removeEventListener('webkitfullscreenchange', updateFullscreen)
    }
  }, [])

  useEffect(() => {
    if (attempt?.phase !== 'active' || !attempt.ownsLease || busy || error) return
    const reason = hidden ? 'visibility' : !media.snapshot.online ? 'network'
      : fullscreenLost ? 'fullscreen-exit'
        : !guided && media.snapshot.blockingReason ? media.snapshot.blockingReason : null
    if (reason) void perform(() => client.pause(attempt, reason, hidden))
  }, [attempt, busy, error, hidden, fullscreenLost, guided, media.snapshot.online, media.snapshot.blockingReason, client, perform])

  useEffect(() => {
    if (attempt?.phase !== 'completed') return
    media.stop(); stopAllMediaTracks()
    void exitFullscreen()
  }, [attempt?.phase, media.stop, exitFullscreen])
  useEffect(() => () => { media.stop(); stopAllMediaTracks(); window.speechSynthesis?.cancel() }, [media.stop])
  useEffect(() => {
    const frame = requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [attempt?.phase, attempt?.currentIndex, reviewIndex, Boolean(review)])

  const reconnect = () => {
    if (!cameraReady && attempt?.phase !== 'completed') return
    void perform(async () => {
      await enterFullscreen()
      const activeFullscreen = document.fullscreenElement
        || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      if (fullscreenEntered.current && !activeFullscreen) {
        throw new ExamServiceError('fullscreen_required', 'Return to fullscreen before resuming this assessment.')
      }
      setFullscreenLost(false)
      let next = await client.connect(latest.current ?? await client.create())
      if (next.phase === 'completed') return next
      if (document.hidden) return next
      if (next.phase === 'paused') next = await client.resume(next)
      if (next.phase === 'ready' || next.phase === 'waiting') next = await client.open(next)
      return next
    })
  }
  const answer = () => {
    if (!attempt || selected === null || busyRef.current) return
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    setAnswerStage('saving')
    void perform(async () => {
      let confirmed: ProtectedExamSnapshot | null = null
      try {
        return await client.answerAndContinue(attempt, selected, (saved) => {
          confirmed = saved
          if (mounted.current) setAnswerStage('opening')
        }, () => mounted.current && !document.hidden)
      } catch (cause) {
        if (mounted.current && confirmed) accept(confirmed)
        throw cause
      }
    }).finally(() => { if (mounted.current) setAnswerStage(null) })
  }
  const previewResult = async () => {
    if (busyRef.current || loading || error) return
    if (latest.current?.ownsLease && latest.current.phase !== 'completed') {
      const paused = await perform(async () => (await client.prepareResultPreview(latest.current))!)
      if (!paused) return
    }
    createPassingJudgeExamSession(applicationId, loadJourneyProgress(applicationId))
    media.stop(); stopAllMediaTracks()
    await exitFullscreen()
    navigatePortal(`/mp/application/${applicationId}/result`)
  }
  const exit = async () => {
    if (busyRef.current) return
    if (attempt?.phase === 'active' && attempt.ownsLease && !error) {
      const confirmed = await perform(() => client.pause(attempt, 'exit'))
      if (!confirmed) return
    }
    media.stop(); stopAllMediaTracks()
    await exitFullscreen()
    navigatePortal(`/mp/application/${applicationId}`)
  }

  const active = Boolean(attempt?.phase === 'active' && attempt.question && attempt.ownsLease && !error && !hidden)
  const question = active ? attempt!.question : null
  const prompt = question ? copy(language, question.prompt, question.promptHi ?? question.prompt) : ''
  const options = question?.options.map((option, index) => copy(language, option, question.optionsHi?.[index] ?? option)) ?? []
  const seconds = displayedSeconds(attempt, elapsed)
  const needsConnection = Boolean(error || (attempt && !attempt.ownsLease && attempt.phase !== 'completed'))
  const speak = () => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const text = new SpeechSynthesisUtterance(`${prompt}. ${options.map((option, i) => `${String.fromCharCode(65 + i)}. ${option}`).join('. ')}`)
    text.lang = language === 'hi' && question?.promptHi ? 'hi-IN' : 'en-IN'
    text.rate = 0.92
    text.onend = text.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(text)
  }
  const result = attempt?.result
  const integritySummary = attempt?.integritySummary
  const reviewItem = review?.review[reviewIndex]

  return (
    <FocusedAssessmentShell mode={active ? 'exam' : 'interruption'} title={copy(language, 'Learner’s Licence assessment', 'लर्नर लाइसेंस परीक्षा')}
      stageBadge={copy(language, 'Server-saved · prototype', 'सर्वर पर सहेजा · प्रोटोटाइप')}
      timerSeconds={active && answerStage !== 'opening' ? seconds : undefined} online={!error && media.snapshot.online}
      cameraActive={cameraReady && attempt?.phase !== 'completed'} cameraGuided={guided}
      cameraLabel={guided ? copy(language, 'Camera simulated', 'कैमरा सिमुलेशन') : media.snapshot.camera === 'ready' ? copy(language, 'Camera on', 'कैमरा चालू') : copy(language, 'Camera off', 'कैमरा बंद')}
      onExit={() => void exit()} language={language}
      statusMap={attempt && <QuestionStatusMap total={attempt.totalQuestions} mode={review ? 'review' : 'exam'} currentIndex={attempt.currentIndex}
        answers={attempt.answers} language={language} correctAnswers={review ? Object.fromEntries(review.review.map((q) => [q.index, q.correct])) : undefined}
        activeIndex={review ? reviewIndex : null} onSelectQuestion={review ? setReviewIndex : undefined} />}
      bottomBar={<div className="protected-exam-bottom">
        {active && <div className="focused-bottom-actions">
        <button type="button" className="button button--primary" disabled={selected === null || busy || seconds === 0 || !cameraReady} onClick={answer}>
          {answerStage === 'saving' ? copy(language, 'Saving answer…', 'उत्तर सहेजा जा रहा है…') : answerStage === 'opening' ? copy(language, 'Opening next question…', 'अगला प्रश्न खुल रहा है…') : busy ? copy(language, 'Please wait…', 'कृपया प्रतीक्षा करें…') : copy(language, attempt!.currentIndex === 14 ? 'Lock answer and finish' : 'Lock answer and continue', attempt!.currentIndex === 14 ? 'उत्तर लॉक करें और समाप्त करें' : 'उत्तर लॉक करें और आगे बढ़ें')} <ArrowRight size={17} />
        </button>
        <span className="focused-security-note protected-exam-save-status" role="status" aria-live="polite">
          {answerStage === 'opening' ? <CheckCircle2 size={15} /> : <LockKeyhole size={15} />}
          {answerStage === 'opening' ? copy(language, 'Answer saved. Loading the next question.', 'उत्तर सहेजा गया। अगला प्रश्न लोड हो रहा है।') : answerStage === 'saving' ? slowAnswer ? copy(language, 'Still waiting for confirmation. Please don’t submit again.', 'पुष्टि का इंतज़ार है। कृपया दोबारा जमा न करें।') : copy(language, 'Saving your choice securely.', 'आपका उत्तर सुरक्षित सहेजा जा रहा है।') : copy(language, 'Correct answers are shown after the test.', 'सही उत्तर परीक्षा के बाद दिखाए जाएँगे।')}
        </span>
      </div>}
      {attempt?.phase !== 'completed' && <div className="protected-exam-preview">
        <button type="button" disabled={busy || loading || Boolean(error)} onClick={() => void previewResult()}><FastForward size={16} />{copy(language, 'Skip to result preview · judges', 'परिणाम पूर्वावलोकन देखें · जज')}</button>
        <small>{copy(language, 'Simulated result and demo licence only. This does not pass your server test.', 'केवल सिम्युलेटेड परिणाम और डेमो लाइसेंस। इससे सर्वर परीक्षा पास नहीं होती।')}</small>
      </div>}
      </div>}>
      {active && question ? (
        <div className="focused-workspace-container focused-workspace-container--split">
          <section className="focused-question-card protected-exam-question" key={question.token} aria-busy={Boolean(answerStage)}>
            <div className="focused-question-heading">
              <div className="focused-question-meta"><span className="focused-question-pill">{copy(language, `Question ${question.index + 1} of 15`, `प्रश्न ${question.index + 1} / 15`)}</span><span className="focused-question-saved-pill"><LockKeyhole size={13} />{copy(language, `${attempt!.currentIndex} saved on server`, `${attempt!.currentIndex} उत्तर सर्वर पर सहेजे`)}</span></div>
              <h1 ref={heading} tabIndex={-1}>{prompt}</h1>
              {'speechSynthesis' in window && <button type="button" className="question-speech-button" onClick={speak} disabled={busy} aria-pressed={speaking}>
                {speaking ? <VolumeX size={17} /> : <Volume2 size={17} />}{speaking ? copy(language, 'Stop reading', 'पढ़ना रोकें') : copy(language, 'Read question aloud', 'प्रश्न सुनें')}
              </button>}
            </div>
            <fieldset className="focused-option-grid" disabled={busy || seconds === 0 || !cameraReady}>
              <legend className="visually-hidden">{copy(language, 'Choose one answer', 'एक उत्तर चुनें')}</legend>
              {options.map((option, index) => <label key={`${question.token}:${index}`} className={`focused-option-card ${selected === index ? 'focused-option-card--selected' : ''}`}>
                <input type="radio" name="protected-answer" checked={selected === index} onChange={() => setSelected(index)} />
                <span className="focused-option-card__badge">{String.fromCharCode(65 + index)}</span><strong className="focused-option-card__label">{option}</strong>
              </label>)}
            </fieldset>
          </section>
          <aside className="focused-observation-panel">
            <div className="focused-obs-card"><div className="focused-obs-card__header"><ShieldCheck size={18} /><strong>{copy(language, 'Saved before you move on', 'आगे बढ़ने से पहले सुरक्षित')}</strong></div>
              <p className="focused-obs-card__body">{copy(language, 'This tab displays questions. The server controls the timer, locks each answer, and calculates your result.', 'यह टैब प्रश्न दिखाता है। समय, उत्तर लॉक करना और परिणाम की गणना सर्वर करता है।')}</p>
              <p className="focused-obs-card__body">{guided ? copy(language, 'Camera signals are simulated for this demonstration. Scoring and answer saving still use the real server.', 'इस डेमो में कैमरा संकेत सिम्युलेटेड हैं। अंक और उत्तर वास्तविक सर्वर पर सहेजे जाते हैं।') : copy(language, 'Camera analysis stays on this device. Camera observations do not decide your score.', 'कैमरा विश्लेषण इसी डिवाइस पर होता है। कैमरा संकेत आपके अंक तय नहीं करते।')}</p>
              {!guided && <p className="focused-obs-card__body">{media.snapshot.phoneDetected ? copy(language, 'A phone remains visible. Move it out of camera view to continue.', 'फ़ोन कैमरे में दिख रहा है। आगे बढ़ने के लिए उसे कैमरे से बाहर रखें।') : copy(language, 'The local object model is checking that no phone remains in view.', 'स्थानीय ऑब्जेक्ट मॉडल जाँच रहा है कि कैमरे में कोई फ़ोन न दिखे।')}</p>}
              {!cameraReady && <p role="status">{copy(language, 'Please centre your face and move any phone out of view before continuing.', 'आगे बढ़ने से पहले कैमरे के सामने बैठें और फ़ोन को कैमरे से बाहर रखें।')}</p>}
            </div>
            {guided && <div className="focused-obs-card">
              <strong>{copy(language, 'Judge-only phone check', 'केवल जज के लिए फ़ोन जाँच')}</strong>
              <p className="focused-obs-card__body">{copy(language, 'Simulate a phone remaining in frame. The server pauses safely and stores it separately from real integrity evidence.', 'कैमरे में फ़ोन बने रहने का सिमुलेशन करें। सर्वर परीक्षा सुरक्षित रोकता है और इसे असली अखंडता रिकॉर्ड से अलग रखता है।')}</p>
              <button className="button button--secondary button--compact" disabled={busy} onClick={() => void perform(() => client.pause(attempt!, 'phone', false, 'judge-simulation'))}>{copy(language, 'Simulate phone in frame', 'कैमरे में फ़ोन का सिमुलेशन')}</button>
            </div>}
            <div className="focused-obs-card"><strong>{copy(language, 'Need to step away?', 'थोड़ी देर रुकना है?')}</strong><p className="focused-obs-card__body">{copy(language, 'A confirmed pause preserves your time for up to two minutes across this attempt. After that, the current question’s timer continues.', 'पुष्ट विराम इस प्रयास में कुल दो मिनट तक समय बचाता है। उसके बाद वर्तमान प्रश्न का समय फिर चलने लगता है।')}</p>
              <button className="button button--secondary button--compact" disabled={busy} onClick={() => void perform(() => client.pause(attempt!, 'exit'))}>{copy(language, 'Pause test', 'टेस्ट रोकें')}</button>
            </div>
          </aside>
        </div>
      ) : (
        <section className="protected-exam-panel" aria-busy={busy || loading}>
          {loading ? <><h1 ref={heading} tabIndex={-1}>{copy(language, 'Checking your saved test…', 'सहेजी परीक्षा जाँची जा रही है…')}</h1><p role="status">{copy(language, 'We are asking the server for your latest checkpoint.', 'आपकी नवीनतम स्थिति सर्वर से ली जा रही है।')}</p></>
            : reviewItem ? <>
              <p className="eyebrow">{copy(language, `Answer review · ${reviewIndex + 1} / 15`, `उत्तर समीक्षा · ${reviewIndex + 1} / 15`)}</p>
              <h1 ref={heading} tabIndex={-1}>{copy(language, reviewItem.prompt, reviewItem.promptHi ?? reviewItem.prompt)}</h1>
              <dl className="protected-exam-review">
                <div><dt>{copy(language, 'Your answer', 'आपका उत्तर')}</dt><dd>{reviewItem.selected < 0 ? copy(language, reviewItem.timedOut ? 'Time ended — unanswered' : 'Not answered', 'उत्तर नहीं दिया') : copy(language, reviewItem.options[reviewItem.selected]!, reviewItem.optionsHi?.[reviewItem.selected] ?? reviewItem.options[reviewItem.selected]!)}</dd></div>
                <div><dt>{copy(language, 'Correct answer', 'सही उत्तर')}</dt><dd>{copy(language, reviewItem.options[reviewItem.correct]!, reviewItem.optionsHi?.[reviewItem.correct] ?? reviewItem.options[reviewItem.correct]!)}</dd></div>
              </dl>
              <p>{copy(language, reviewItem.explanation, reviewItem.explanationHi ?? reviewItem.explanation)}</p>
              <div className="lf-actions"><button className="button button--secondary" disabled={reviewIndex === 0} onClick={() => setReviewIndex((i) => i - 1)}><ArrowLeft size={17} />{copy(language, 'Previous', 'पिछला')}</button><button className="button button--primary" disabled={reviewIndex === 14} onClick={() => setReviewIndex((i) => i + 1)}>{copy(language, 'Next question', 'अगला प्रश्न')}<ArrowRight size={17} /></button><button className="button button--secondary" onClick={() => setReview(null)}>{copy(language, 'Back to result', 'परिणाम पर लौटें')}</button></div>
            </> : result ? <>
              <p className="eyebrow"><CheckCircle2 size={17} /> {copy(language, 'Result confirmed by server', 'सर्वर ने परिणाम की पुष्टि की')}</p>
              <h1 ref={heading} tabIndex={-1}>{result.passed ? copy(language, 'You passed this assessment', 'आप इस परीक्षा में पास हुए') : copy(language, 'A little more practice, then try again', 'थोड़ा अभ्यास करें, फिर प्रयास करें')}</h1>
              <p className="protected-exam-score">{result.score} / {attempt!.totalQuestions} <span>{copy(language, `correct · Pass mark: ${attempt!.passMark}`, `सही · पास अंक: ${attempt!.passMark}`)}</span></p>
              <p>{copy(language, 'This is a prototype assessment, not an official licence. Identity checks and payment remain simulated. Judge shortcut results are never used here.', 'यह प्रोटोटाइप परीक्षा है, आधिकारिक लाइसेंस नहीं। पहचान जाँच और भुगतान सिम्युलेटेड हैं। जज शॉर्टकट के परिणाम यहाँ उपयोग नहीं होते।')}</p>
              <div className="protected-exam-metadata"><span>{copy(language, `Attempt ${attempt!.attemptNumber}`, `प्रयास ${attempt!.attemptNumber}`)}</span><span>{attempt!.fingerprint}</span><span>{copy(language, 'Server-graded', 'सर्वर द्वारा अंकित')}</span></div>
              {integritySummary && <section className="protected-integrity-summary" aria-labelledby="protected-integrity-title">
                <div className="protected-integrity-summary__heading">
                  <div><p className="eyebrow">{copy(language, 'Explainable monitoring record', 'स्पष्ट निगरानी रिकॉर्ड')}</p><h2 id="protected-integrity-title">{integritySummary.status === 'review-recommended' ? copy(language, 'Human review recommended', 'मानव समीक्षा की सलाह') : integritySummary.status === 'observations-recorded' ? copy(language, 'Attention events recorded', 'ध्यान देने योग्य घटनाएँ दर्ज') : copy(language, 'No integrity review required', 'अखंडता समीक्षा आवश्यक नहीं')}</h2></div>
                  <ShieldCheck size={24} aria-hidden="true" />
                </div>
                <p>{copy(language, 'Counts are based on browser-reported conditions and server timestamps. They do not change the knowledge score or automatically accuse the applicant.', 'गिनती ब्राउज़र से मिली स्थितियों और सर्वर समय पर आधारित है। इससे ज्ञान अंक नहीं बदलते और आवेदक पर अपने-आप आरोप नहीं लगता।')}</p>
                <dl>
                  <div><dt>{copy(language, 'Technical interruptions', 'तकनीकी रुकावटें')}</dt><dd>{integritySummary.technicalInterruptions}</dd></div>
                  <div><dt>{copy(language, 'Attention events', 'ध्यान घटनाएँ')}</dt><dd>{integritySummary.attentionEvents}</dd></div>
                  <div><dt>{copy(language, 'Integrity observations', 'अखंडता संकेत')}</dt><dd>{integritySummary.integrityObservations}</dd></div>
                  <div><dt>{copy(language, 'Applicant pauses', 'आवेदक विराम')}</dt><dd>{integritySummary.manualPauses}</dd></div>
                  <div><dt>{copy(language, 'Judge simulations', 'जज सिमुलेशन')}</dt><dd>{integritySummary.simulatedEvents}</dd></div>
                </dl>
              </section>}
              <div className="lf-actions"><button className="button button--primary" disabled={busy} onClick={() => void perform(async () => { const data = await client.review(attempt!); setReview(data); setReviewIndex(0); return data.attempt })}>{copy(language, 'Review answers and explanations', 'उत्तर और व्याख्या देखें')}<ArrowRight size={17} /></button><button className="button button--secondary" disabled={busy || attempt!.attemptNumber >= 5} onClick={() => { setAccepted(false); void perform(() => client.create(attempt!.attemptId)) }}><RefreshCcw size={17} />{copy(language, 'Try a new balanced paper', 'नया संतुलित प्रश्नपत्र आज़माएँ')}</button></div>
              <details className="protected-exam-audit"><summary>{copy(language, 'Exam activity recorded by the server', 'सर्वर पर दर्ज परीक्षा गतिविधि')}</summary><ol>{attempt!.events.map((event) => <li key={event.id}><time>{new Date(event.at).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN')}</time><span>{event.detail}</span></li>)}</ol></details>
            </> : <>
              <p className="eyebrow"><ShieldCheck size={17} />{copy(language, 'Server-controlled assessment', 'सर्वर-नियंत्रित परीक्षा')}</p>
              <h1 ref={heading} tabIndex={-1}>{attempt?.phase === 'paused' ? copy(language, 'Your test is paused', 'आपकी परीक्षा रुकी है') : needsConnection ? copy(language, 'Reconnect to your saved test', 'अपनी सहेजी परीक्षा से फिर जुड़ें') : attempt?.phase === 'waiting' ? copy(language, 'Checkpoint saved. Ready for the next question?', 'प्रगति सहेजी गई। अगले प्रश्न के लिए तैयार हैं?') : copy(language, 'Ready for your 15-question test?', '15 प्रश्नों की परीक्षा के लिए तैयार हैं?')}</h1>
              <p>{attempt ? copy(language, `${attempt.currentIndex} of 15 answers are confirmed by the server. We will check your remaining time before continuing.`, `15 में से ${attempt.currentIndex} उत्तर सर्वर पर पुष्ट हैं। आगे बढ़ने से पहले बचा समय जाँचा जाएगा।`) : copy(language, 'The server chooses a balanced paper, gives 30 seconds per question, and saves each answer before moving on. The pass mark is 9 of 15.', 'सर्वर संतुलित प्रश्नपत्र चुनता है, हर प्रश्न के लिए 30 सेकंड देता है और आगे बढ़ने से पहले उत्तर सहेजता है। पास होने के लिए 15 में से 9 अंक चाहिए।')}</p>
              {attempt?.phase === 'paused' && attempt.pauseReason === 'phone' && <p className="protected-exam-notice">{attempt.integritySummary.lastSource === 'judge-simulation'
                ? copy(language, 'Judge simulation complete: the test paused, the remaining time was preserved, and no real integrity observation was added.', 'जज सिमुलेशन पूरा हुआ: परीक्षा रुकी, बचा समय सुरक्षित रहा और कोई असली अखंडता संकेत नहीं जोड़ा गया।')
                : copy(language, 'A phone-like object remained visible. Move it away, then reconnect. This observation does not change your score.', 'फ़ोन जैसी वस्तु कैमरे में दिखती रही। उसे हटाकर फिर जुड़ें। इस संकेत से आपके अंक नहीं बदलते।')}</p>}
              <p>{copy(language, 'One active tab per session. Pauses share a two-minute allowance; the whole attempt expires after 30 minutes. A network loss can pause time only once the server receives the pause request.', 'एक सत्र में एक सक्रिय टैब। सभी विरामों के लिए कुल दो मिनट मिलते हैं; पूरा प्रयास 30 मिनट बाद समाप्त होता है। इंटरनेट कटने पर समय तभी रुकता है जब सर्वर को विराम अनुरोध मिल जाए।')}</p>
              {guided ? <p className="protected-exam-notice">{copy(language, 'Camera simulation is selected for this judge demo. No camera or microphone is opened; answer saving and scoring are genuinely server-controlled.', 'इस जज डेमो में कैमरा सिमुलेशन चुना गया है। कैमरा या माइक्रोफोन नहीं खुलता; उत्तर और अंक वास्तविक सर्वर पर नियंत्रित होते हैं।')}</p> : <div className="protected-exam-notice"><p>{cameraReady ? copy(language, 'Camera, face and phone checks are ready. Analysis stays on this device.', 'कैमरा, चेहरा और फ़ोन जाँच तैयार हैं। विश्लेषण इसी डिवाइस पर होता है।') : copy(language, 'Check your camera before opening a timed question.', 'समयबद्ध प्रश्न खोलने से पहले अपना कैमरा जाँचें।')}</p>{!cameraReady && <button className="button button--secondary" onClick={() => void media.start()} disabled={media.snapshot.camera === 'requesting' || media.snapshot.model === 'loading' || media.snapshot.objectModel === 'loading'}>{copy(language, 'Check camera and microphone', 'कैमरा और माइक्रोफोन जाँचें')}</button>}{media.snapshot.error && <p role="status">{media.snapshot.error}</p>}</div>}
              {!attempt && <label className="consent-box"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>{copy(language, 'I understand this is a prototype. My answers and result are saved in an anonymous server session that expires after seven days; no identity documents, video or audio are uploaded.', 'मैं समझता/समझती हूँ कि यह प्रोटोटाइप है। मेरे उत्तर और परिणाम बिना नाम के सर्वर सत्र में सहेजे जाते हैं, जो सात दिन बाद समाप्त होता है। पहचान दस्तावेज़, वीडियो या ऑडियो अपलोड नहीं होते।')}</span></label>}
              {language === 'hi' && <p>इस प्रश्न बैंक के प्रश्न अभी अंग्रेज़ी में हैं। परीक्षा के नियंत्रण और सहायता हिन्दी में उपलब्ध हैं।</p>}
              <div className="lf-actions"><button className="button button--primary" disabled={busy || hidden || !cameraReady || (!attempt && !accepted)} onClick={reconnect}>{busy ? copy(language, 'Connecting…', 'जुड़ रहा है…') : attempt ? copy(language, 'Reconnect and continue', 'फिर जुड़ें और जारी रखें') : copy(language, 'Start server-saved test', 'सर्वर पर सहेजी परीक्षा शुरू करें')}<ArrowRight size={17} /></button></div>
            </>}
          {error && <div className="protected-exam-error" role="alert"><strong>{copy(language, 'Action not confirmed', 'कार्रवाई की पुष्टि नहीं हुई')}</strong><p>{error.message}{error.retryAfter > 0 ? ` ${copy(language, `Try again in ${error.retryAfter} seconds.`, `${error.retryAfter} सेकंड बाद फिर प्रयास करें।`)}` : ''}</p>{client.hasPendingAnswer && <p>{copy(language, 'Your last choice is queued for an exact retry. Reconnecting will check it without saving a second answer.', 'आपका पिछला उत्तर दोबारा जाँचने के लिए रखा है। फिर जुड़ने पर वही उत्तर जाँचा जाएगा, दूसरा उत्तर जमा नहीं होगा।')}</p>}</div>}
          {!active && <p className="protected-exam-footnote">{copy(language, 'Clearing browser progress does not change the server’s score. Keep this browser’s session cookie to return to the same attempt.', 'ब्राउज़र की प्रगति मिटाने से सर्वर के अंक नहीं बदलते। इसी प्रयास पर लौटने के लिए इस ब्राउज़र की सत्र कुकी रखें।')}</p>}
        </section>
      )}
    </FocusedAssessmentShell>
  )
}

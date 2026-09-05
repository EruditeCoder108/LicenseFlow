import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, CloudOff, FastForward, FileDown, FlaskConical, LockKeyhole, RefreshCcw, Save, ShieldCheck, SquareStack, Volume2, VolumeX } from 'lucide-react'
import { FocusedAssessmentShell, QuestionStatusMap, useFocusedFullscreen } from './FocusedAssessmentShell'
import { ProtectedExamClient, ExamServiceError, acceptExamSnapshot, displayedSeconds, requestExam } from './protectedExamClient'
import type { ProtectedExamReview, ProtectedExamSnapshot } from './protectedExamTypes'
import { loadJourneyProgress } from './progress'
import { createPassingJudgeExamSession } from './examSession'
import { navigatePortal } from './router'
import { translate as copy, type Language } from './i18n'
import { stopAllMediaTracks, useDeviceReadiness } from '../hooks/useDeviceReadiness'
import { createRecoveryFaultController, recoveryLabEnabled } from './resilience/faultInjection'
import { recoveryRecordEvents } from './resilience/recoveryRecord'
import { createProtectedRecoveryRecordPdf, downloadPdf } from './downloadDocuments'
import './protectedExam.css'

function pendingStorage() { try { return window.sessionStorage } catch { return undefined } }

type RecoveryProof = {
  kind: 'connection' | 'answer' | 'refresh' | 'second-tab'
  attemptPreserved: boolean
  questionNumber: number
  savedAnswers: number
  remainingSeconds?: number
}

const refreshProofKey = (applicationId: string) => `lf-recovery-refresh:${applicationId}`
const answerCount = (snapshot: ProtectedExamSnapshot) => Object.keys(snapshot.answers).length

// Deliberately separate from TestJourney's locally scripted judge demonstration.
// Rendering cached browser state is never enough to unlock a result here.
export function ProtectedExamPage({ applicationId, language }: { applicationId: string; language: Language }) {
  const [guided] = useState(() => loadJourneyProgress(applicationId).readiness.mode === 'guided-signals')
  const [recoveryLab] = useState(() => createRecoveryFaultController(recoveryLabEnabled(window.location.search, guided)))
  const [client] = useState(() => new ProtectedExamClient(applicationId, recoveryLab.wrap(requestExam), pendingStorage()))
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
  const [recoveryProof, setRecoveryProof] = useState<RecoveryProof | null>(null)
  const [recoveryLabOpen, setRecoveryLabOpen] = useState(false)
  const [recoveryDownload, setRecoveryDownload] = useState<'idle' | 'creating' | 'ready' | 'error'>('idle')
  const latest = useRef(attempt)
  const receivedAt = useRef(performance.now())
  const busyRef = useRef(false)
  const errorRef = useRef(error)
  const mounted = useRef(true)
  const heading = useRef<HTMLHeadingElement>(null)
  const recoveryDialog = useRef<HTMLDialogElement>(null)
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
    client.status().then((saved) => {
      if (cancelled || !saved) return
      accept(saved)
      if (!recoveryLab.enabled) return
      try {
        const stored = JSON.parse(sessionStorage.getItem(refreshProofKey(applicationId)) ?? 'null') as { attemptId?: string } | null
        if (stored?.attemptId) {
          setRecoveryProof({
            kind: 'refresh',
            attemptPreserved: stored.attemptId === saved.attemptId,
            questionNumber: saved.currentIndex + 1,
            savedAnswers: answerCount(saved),
            remainingSeconds: saved.deadlineAt ? displayedSeconds(saved, 0) : saved.remainingMs === null ? undefined : Math.ceil(saved.remainingMs / 1000),
          })
          sessionStorage.removeItem(refreshProofKey(applicationId))
          setRecoveryLabOpen(true)
        }
      } catch { sessionStorage.removeItem(refreshProofKey(applicationId)) }
    }).catch((cause: unknown) => {
      if (!cancelled) {
        const problem = cause instanceof ExamServiceError ? cause : new ExamServiceError('exam_unavailable', 'Could not load the server checkpoint.')
        setError(problem); errorRef.current = problem
      }
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; mounted.current = false }
  }, [client, accept, recoveryLab.enabled, applicationId])

  useEffect(() => {
    const dialog = recoveryDialog.current
    if (!dialog) return
    if (recoveryLabOpen && !dialog.open) dialog.showModal()
    if (!recoveryLabOpen && dialog.open) dialog.close()
  }, [recoveryLabOpen])

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
  const proveConnectionRecovery = () => {
    if (!attempt || !active || busyRef.current) return
    const before = attempt
    void perform(async () => {
      recoveryLab.arm('exam-connection-loss')
      try {
        await client.action(before, 'heartbeat')
        throw new ExamServiceError('simulation_failed', 'The recovery simulation did not interrupt the request.')
      } catch (cause) {
        if (!(cause instanceof ExamServiceError) || cause.code !== 'connection_lost') throw cause
      }
      const recovered = await client.connect(before)
      setRecoveryProof({
        kind: 'connection',
        attemptPreserved: recovered.attemptId === before.attemptId,
        questionNumber: recovered.currentIndex + 1,
        savedAnswers: answerCount(recovered),
        remainingSeconds: displayedSeconds(recovered, 0),
      })
      return recovered
    })
  }
  const proveLostAnswerRecovery = () => {
    if (!attempt || !active || selected === null || busyRef.current) return
    const before = attempt
    void perform(async () => {
      recoveryLab.arm('exam-lost-answer-response')
      try {
        await client.answer(before, selected)
        throw new ExamServiceError('simulation_failed', 'The recovery simulation did not hide the acknowledgement.')
      } catch (cause) {
        if (!(cause instanceof ExamServiceError) || cause.code !== 'connection_lost') throw cause
      }
      let recovered = await client.connect(before)
      setRecoveryProof({
        kind: 'answer',
        attemptPreserved: recovered.attemptId === before.attemptId,
        questionNumber: recovered.currentIndex + 1,
        savedAnswers: answerCount(recovered),
      })
      if (recovered.phase === 'waiting' && !document.hidden) recovered = await client.open(recovered)
      return recovered
    })
  }
  const proveRefreshRecovery = () => {
    if (!attempt || !active || busyRef.current) return
    sessionStorage.setItem(refreshProofKey(applicationId), JSON.stringify({ attemptId: attempt.attemptId }))
    window.location.reload()
  }
  const proveSingleTabControl = () => {
    if (!attempt || !active || busyRef.current) return
    const before = attempt
    void perform(async () => {
      const competingClient = new ProtectedExamClient(applicationId, requestExam)
      try {
        await competingClient.connect(before)
        throw new ExamServiceError('simulation_failed', 'The second test client was not blocked.')
      } catch (cause) {
        if (!(cause instanceof ExamServiceError) || cause.code !== 'lease_conflict') throw cause
      }
      const current = await client.action(before, 'heartbeat')
      setRecoveryProof({
        kind: 'second-tab',
        attemptPreserved: current.attemptId === before.attemptId,
        questionNumber: current.currentIndex + 1,
        savedAnswers: answerCount(current),
        remainingSeconds: displayedSeconds(current, 0),
      })
      return current
    })
  }
  const enableRecoveryLab = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('resilience', '1')
    window.location.assign(url)
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
  const citizenRecoveryEvents = attempt ? recoveryRecordEvents(attempt, language) : []
  const reviewItem = review?.review[reviewIndex]
  const downloadRecoveryRecord = async () => {
    if (!attempt?.result || recoveryDownload === 'creating') return
    setRecoveryDownload('creating')
    try {
      const pdf = await createProtectedRecoveryRecordPdf({
        applicationId,
        attemptId: attempt.attemptId,
        attemptNumber: attempt.attemptNumber,
        fingerprint: attempt.fingerprint,
        score: attempt.result.score,
        totalQuestions: attempt.totalQuestions,
        passMark: attempt.passMark,
        passed: attempt.result.passed,
        completedAt: attempt.result.completedAt,
        events: citizenRecoveryEvents,
      }, language)
      downloadPdf(pdf, `LicenceFlow-${applicationId}-test-recovery-record.pdf`)
      setRecoveryDownload('ready')
    } catch {
      setRecoveryDownload('error')
    }
  }
  const pauseGuidance = attempt?.phase === 'paused' ? (() => {
    if (attempt.pauseReason === 'phone') return attempt.integritySummary.lastSource === 'judge-simulation'
      ? copy(language, 'Phone-pause demonstration complete. Your answers and time are safe. Choose Resume test to continue.', 'फ़ोन-विराम डेमो पूरा हुआ। आपके उत्तर और समय सुरक्षित हैं। आगे बढ़ने के लिए टेस्ट जारी रखें चुनें।')
      : copy(language, 'Move the phone out of camera view, then resume. This does not change your score.', 'फ़ोन को कैमरे से बाहर रखें, फिर टेस्ट जारी रखें। इससे आपके अंक नहीं बदलते।')
    if (attempt.pauseReason === 'multiple-faces') return copy(language, 'Make sure only you are in camera view, then resume. This observation does not change your score.', 'सुनिश्चित करें कि कैमरे में केवल आप हों, फिर टेस्ट जारी रखें। इस संकेत से आपके अंक नहीं बदलते।')
    if (attempt.pauseReason === 'no-face') return copy(language, 'Sit where your full face is visible, then resume the test.', 'ऐसे बैठें कि आपका पूरा चेहरा दिखाई दे, फिर टेस्ट जारी रखें।')
    if (attempt.pauseReason === 'camera' || attempt.pauseReason === 'camera-stopped') return copy(language, 'Reconnect your camera, check that you are visible, then resume.', 'कैमरा फिर से जोड़ें, जाँचें कि आप दिखाई दे रहे हैं, फिर टेस्ट जारी रखें।')
    if (attempt.pauseReason === 'network') return copy(language, 'Reconnect to the internet, then resume. Your confirmed answers are safe.', 'इंटरनेट फिर जोड़ें, फिर टेस्ट जारी रखें। आपके पुष्ट उत्तर सुरक्षित हैं।')
    if (attempt.pauseReason === 'visibility' || attempt.pauseReason === 'fullscreen-exit') return copy(language, 'Return to this page and choose Resume test. Fullscreen will open again.', 'इस पेज पर लौटें और टेस्ट जारी रखें चुनें। फुलस्क्रीन फिर खुल जाएगा।')
    return copy(language, 'Resume when you are ready. Your confirmed answers are safe.', 'तैयार होने पर टेस्ट जारी रखें। आपके पुष्ट उत्तर सुरक्षित हैं।')
  })() : null

  return (
    <FocusedAssessmentShell mode={active ? 'exam' : 'interruption'} title={copy(language, 'Learner’s Licence assessment', 'लर्नर लाइसेंस परीक्षा')}
      stageBadge={copy(language, 'Protected test · demo', 'सुरक्षित परीक्षा · डेमो')}
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
        <span className={`focused-security-note protected-exam-save-status${answerStage ? ' protected-exam-save-status--active' : ''}`} role="status" aria-live="polite">
          {answerStage === 'opening' ? <CheckCircle2 size={15} /> : <LockKeyhole size={15} />}
          {answerStage === 'opening' ? copy(language, 'Answer saved. Loading the next question.', 'उत्तर सहेजा गया। अगला प्रश्न लोड हो रहा है।') : answerStage === 'saving' ? slowAnswer ? copy(language, 'Still waiting for confirmation. Please don’t submit again.', 'पुष्टि का इंतज़ार है। कृपया दोबारा जमा न करें।') : copy(language, 'Saving your choice securely.', 'आपका उत्तर सुरक्षित सहेजा जा रहा है।') : copy(language, 'Correct answers are shown after the test.', 'सही उत्तर परीक्षा के बाद दिखाए जाएँगे।')}
        </span>
        <button type="button" className="protected-exam-pause" disabled={busy} onClick={() => void perform(() => client.pause(attempt!, 'exit'))}>
          {copy(language, 'Pause test', 'टेस्ट रोकें')}
        </button>
      </div>}
      {attempt?.phase !== 'completed' && !recoveryLab.enabled && <div className="protected-exam-preview">
        <button type="button" disabled={busy || loading || Boolean(error)} onClick={() => void previewResult()}><FastForward size={16} />{copy(language, 'Skip to result preview · judges', 'परिणाम पूर्वावलोकन देखें · जज')}</button>
        <small>{copy(language, 'Simulated result and demo licence only. This does not pass your server test.', 'केवल सिम्युलेटेड परिणाम और डेमो लाइसेंस। इससे सर्वर परीक्षा पास नहीं होती।')}</small>
      </div>}
      {guided && recoveryLab.enabled && attempt?.phase !== 'completed' && <div className="protected-exam-lab-entry">
        <button type="button" onClick={() => setRecoveryLabOpen(true)}><FlaskConical size={16} />{copy(language, 'Open recovery lab', 'रिकवरी लैब खोलें')}</button>
      </div>}
      </div>}>
      {recoveryLab.enabled && <dialog ref={recoveryDialog} className="protected-recovery-dialog" onClose={() => setRecoveryLabOpen(false)} aria-labelledby="protected-recovery-title">
        <form method="dialog" className="protected-recovery-dialog__heading">
          <div><p className="eyebrow">{copy(language, 'Judge simulation', 'जज सिमुलेशन')}</p><h2 id="protected-recovery-title">{copy(language, 'Test recovery lab', 'टेस्ट रिकवरी लैब')}</h2></div>
          <button type="submit" aria-label={copy(language, 'Close recovery lab', 'रिकवरी लैब बंद करें')}>×</button>
        </form>
        <p>{copy(language, 'These controls interrupt the real protected-test path. They cannot change the paper, timer rules or marking.', 'ये नियंत्रण वास्तविक सुरक्षित टेस्ट प्रक्रिया में रुकावट दिखाते हैं। ये प्रश्नपत्र, समय के नियम या अंक नहीं बदल सकते।')}</p>
        <div className="protected-recovery-actions">
          <button type="button" disabled={!active || busy} onClick={proveConnectionRecovery}><CloudOff size={18} /><span><strong>{copy(language, 'Interrupt connection', 'कनेक्शन रोकें')}</strong><small>{copy(language, 'One request fails, then the same test reconnects.', 'एक अनुरोध विफल होगा, फिर वही टेस्ट दोबारा जुड़ेगा।')}</small></span></button>
          <button type="button" disabled={!active || selected === null || busy} onClick={proveLostAnswerRecovery}><Save size={18} /><span><strong>{copy(language, 'Lose save acknowledgement', 'सेव की पुष्टि खोएँ')}</strong><small>{selected === null ? copy(language, 'Select an answer first.', 'पहले एक उत्तर चुनें।') : copy(language, 'The server saves your choice; the browser misses the reply.', 'सर्वर आपका उत्तर सहेजता है; ब्राउज़र को जवाब नहीं मिलता।')}</small></span></button>
          <button type="button" disabled={!active || busy} onClick={proveSingleTabControl}><SquareStack size={18} /><span><strong>{copy(language, 'Try a second test client', 'दूसरा टेस्ट क्लाइंट आज़माएँ')}</strong><small>{copy(language, 'A separate client tries to take control of this attempt.', 'एक अलग क्लाइंट इस प्रयास को नियंत्रित करने की कोशिश करता है।')}</small></span></button>
          <button type="button" disabled={!active || busy} onClick={proveRefreshRecovery}><RefreshCcw size={18} /><span><strong>{copy(language, 'Reload during question', 'प्रश्न के बीच रीलोड करें')}</strong><small>{copy(language, 'Reload this page and recover the same server attempt.', 'पेज रीलोड करें और वही सर्वर प्रयास वापस पाएँ।')}</small></span></button>
        </div>
        {recoveryProof && <section className="protected-recovery-proof" role="status" aria-live="polite">
          <CheckCircle2 size={21} aria-hidden="true" />
          <div><strong>{recoveryProof.kind === 'answer' ? copy(language, 'The selected answer was saved once.', 'चुना गया उत्तर एक बार सहेजा गया।') : recoveryProof.kind === 'refresh' ? copy(language, 'The page reloaded without creating a new attempt.', 'नया प्रयास बनाए बिना पेज रीलोड हुआ।') : recoveryProof.kind === 'second-tab' ? copy(language, 'The second client was blocked.', 'दूसरा क्लाइंट रोक दिया गया।') : copy(language, 'The same test reconnected.', 'वही टेस्ट दोबारा जुड़ गया।')}</strong>
            <p>{copy(language, `${recoveryProof.attemptPreserved ? 'Same attempt' : 'Attempt changed'} · Question ${recoveryProof.questionNumber} · ${recoveryProof.savedAnswers} confirmed answer${recoveryProof.savedAnswers === 1 ? '' : 's'}${recoveryProof.remainingSeconds === undefined ? '' : ` · ${recoveryProof.remainingSeconds}s remaining`}`, `${recoveryProof.attemptPreserved ? 'वही प्रयास' : 'प्रयास बदला'} · प्रश्न ${recoveryProof.questionNumber} · ${recoveryProof.savedAnswers} पुष्ट उत्तर${recoveryProof.remainingSeconds === undefined ? '' : ` · ${recoveryProof.remainingSeconds} सेकंड शेष`}`)}</p>
          </div>
        </section>}
        <p className="protected-recovery-dialog__note">{copy(language, 'Simulation is available only in the labelled judge journey.', 'सिमुलेशन केवल चिह्नित जज यात्रा में उपलब्ध है।')}</p>
      </dialog>}
      {active && question ? (
        <div className="focused-workspace-container focused-workspace-container--split">
          <section className="focused-question-card protected-exam-question" key={question.token} aria-busy={Boolean(answerStage)}>
            <div className="focused-question-heading">
              <div className="focused-question-meta"><span className="focused-question-pill">{copy(language, `Question ${question.index + 1} of 15`, `प्रश्न ${question.index + 1} / 15`)}</span><span className="focused-question-saved-pill"><LockKeyhole size={13} />{copy(language, `${attempt!.currentIndex} saved`, `${attempt!.currentIndex} उत्तर सहेजे`)}</span></div>
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
          <aside className="focused-observation-panel" aria-label={copy(language, 'Test help and controls', 'टेस्ट सहायता और नियंत्रण')}>
            <div className="focused-obs-card focused-obs-card--summary"><div className="focused-obs-card__header"><ShieldCheck size={18} /><strong>{copy(language, 'Your answers stay safe', 'आपके उत्तर सुरक्षित रहते हैं')}</strong></div>
              <p className="focused-obs-card__body">{copy(language, 'Your choice is saved before the next question opens. Camera checks never decide your score.', 'अगला प्रश्न खुलने से पहले आपका उत्तर सहेजा जाता है। कैमरा जाँच आपके अंक तय नहीं करती।')}</p>
            </div>
            <details className="focused-assessment-details">
              <summary>{copy(language, 'How this test is protected', 'यह टेस्ट कैसे सुरक्षित है')}</summary>
              <div className="focused-assessment-details__body">
                <p>{guided ? copy(language, 'Judge mode uses simulated camera signals. Answers, timing and scoring still use the assessment service.', 'जज मोड में कैमरा संकेत सिम्युलेटेड हैं। उत्तर, समय और अंक फिर भी परीक्षा सेवा से नियंत्रित होते हैं।') : copy(language, 'Camera analysis stays on this device. No video is uploaded.', 'कैमरा विश्लेषण इसी डिवाइस पर होता है। कोई वीडियो अपलोड नहीं होता।')}</p>
                {!guided && <p role="status">{media.snapshot.phoneDetected ? copy(language, 'Move the phone out of camera view to continue.', 'आगे बढ़ने के लिए फ़ोन को कैमरे से बाहर रखें।') : copy(language, 'The on-device check is watching for a phone in view.', 'डिवाइस पर चलने वाली जाँच कैमरे में फ़ोन ढूँढ रही है।')}</p>}
                {guided && <div className="focused-assessment-details__action"><p>{copy(language, 'Judge demo: show how a visible phone pauses the test without changing the score.', 'जज डेमो: दिखाएँ कि फ़ोन दिखने पर अंक बदले बिना टेस्ट कैसे रुकता है।')}</p><button className="button button--secondary button--compact" disabled={busy} onClick={() => void perform(() => client.pause(attempt!, 'phone', false, 'judge-simulation'))}>{copy(language, 'Preview phone pause', 'फ़ोन विराम देखें')}</button></div>}
              </div>
            </details>
          </aside>
        </div>
      ) : (
        <section className="protected-exam-panel" aria-busy={busy || loading}>
          {loading ? <><h1 ref={heading} tabIndex={-1}>{copy(language, 'Restoring your test…', 'आपकी परीक्षा वापस लाई जा रही है…')}</h1><p role="status">{copy(language, 'Checking your latest saved answer and remaining time.', 'आपका अंतिम सहेजा उत्तर और बचा समय जाँचा जा रहा है।')}</p></>
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
              <p className="eyebrow"><CheckCircle2 size={17} /> {copy(language, 'Test result', 'परीक्षा परिणाम')}</p>
              <h1 ref={heading} tabIndex={-1}>{result.passed ? copy(language, 'You passed this assessment', 'आप इस परीक्षा में पास हुए') : copy(language, 'A little more practice, then try again', 'थोड़ा अभ्यास करें, फिर प्रयास करें')}</h1>
              <p className="protected-exam-score">{result.score} / {attempt!.totalQuestions} <span>{copy(language, `correct · Pass mark: ${attempt!.passMark}`, `सही · पास अंक: ${attempt!.passMark}`)}</span></p>
              <p>{copy(language, 'This is a prototype assessment, not an official licence. Identity checks and payment remain simulated. Judge shortcut results are never used here.', 'यह प्रोटोटाइप परीक्षा है, आधिकारिक लाइसेंस नहीं। पहचान जाँच और भुगतान सिम्युलेटेड हैं। जज शॉर्टकट के परिणाम यहाँ उपयोग नहीं होते।')}</p>
              <div className="protected-exam-metadata"><span>{copy(language, `Attempt ${attempt!.attemptNumber}`, `प्रयास ${attempt!.attemptNumber}`)}</span><span>{copy(language, 'Score verified', 'अंक सत्यापित')}</span></div>
              {integritySummary && <details className="protected-result-details"><summary>{copy(language, 'Monitoring and technical record', 'निगरानी और तकनीकी रिकॉर्ड')}</summary><section className="protected-integrity-summary" aria-labelledby="protected-integrity-title">
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
              </section></details>}
              <div className="lf-actions"><button className="button button--primary" disabled={busy} onClick={() => void perform(async () => { const data = await client.review(attempt!); setReview(data); setReviewIndex(0); return data.attempt })}>{copy(language, 'Review answers and explanations', 'उत्तर और व्याख्या देखें')}<ArrowRight size={17} /></button><button className="button button--secondary" disabled={busy || attempt!.attemptNumber >= 5} onClick={() => { setAccepted(false); void perform(() => client.create(attempt!.attemptId)) }}><RefreshCcw size={17} />{copy(language, 'Try a new balanced paper', 'नया संतुलित प्रश्नपत्र आज़माएँ')}</button></div>
              <section className="protected-recovery-record" aria-labelledby="protected-recovery-record-title">
                <div className="protected-recovery-record__heading">
                  <div><p className="eyebrow">{copy(language, 'Citizen recovery record', 'नागरिक रिकवरी रिकॉर्ड')}</p><h2 id="protected-recovery-record-title">{copy(language, 'What the test saved', 'टेस्ट ने क्या सुरक्षित रखा')}</h2></div>
                  <button type="button" className="button button--secondary" disabled={recoveryDownload === 'creating'} onClick={() => void downloadRecoveryRecord()}><FileDown size={17} />{recoveryDownload === 'creating' ? copy(language, 'Creating PDF…', 'PDF बन रही है…') : copy(language, 'Download record', 'रिकॉर्ड डाउनलोड करें')}</button>
                </div>
                <p>{copy(language, 'This plain-language timeline comes from the assessment service. It includes no identity, camera images, audio, question text or selected answers.', 'यह सरल समयरेखा परीक्षा सेवा से आती है। इसमें पहचान, कैमरा चित्र, ऑडियो, प्रश्न या चुने गए उत्तर शामिल नहीं हैं।')}</p>
                {recoveryDownload === 'ready' && <p className="protected-recovery-record__status" role="status">{copy(language, 'Recovery record downloaded.', 'रिकवरी रिकॉर्ड डाउनलोड हो गया।')}</p>}
                {recoveryDownload === 'error' && <p className="protected-recovery-record__error" role="alert">{copy(language, 'The PDF could not be created. The record remains visible below.', 'PDF नहीं बन सकी। रिकॉर्ड नीचे उपलब्ध है।')}</p>}
                <ol>{citizenRecoveryEvents.map((event) => <li key={event.id}><span aria-hidden="true" /><div><strong>{event.title}</strong><p>{event.detail}</p><time>{new Date(event.at).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN')}</time></div></li>)}</ol>
              </section>
              <details className="protected-exam-audit"><summary>{copy(language, 'Technical audit details', 'तकनीकी ऑडिट विवरण')}</summary><ol>{attempt!.events.map((event) => <li key={event.id}><time>{new Date(event.at).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN')}</time><span>{event.detail}</span></li>)}</ol></details>
            </> : <>
              <p className="eyebrow"><ShieldCheck size={17} />{copy(language, 'Test readiness', 'परीक्षा की तैयारी')}</p>
              <h1 ref={heading} tabIndex={-1}>{attempt?.phase === 'paused' ? copy(language, 'Your test is paused', 'आपकी परीक्षा रुकी है') : needsConnection ? copy(language, 'Return to your saved test', 'अपनी सहेजी परीक्षा पर लौटें') : attempt?.phase === 'waiting' ? copy(language, 'Answer saved. Continue when ready.', 'उत्तर सहेजा गया। तैयार होने पर आगे बढ़ें।') : copy(language, 'Ready to begin?', 'शुरू करने के लिए तैयार हैं?')}</h1>
              <p>{attempt ? copy(language, `${attempt.currentIndex} of 15 answers are safe. Your remaining time will be checked before the next question opens.`, `15 में से ${attempt.currentIndex} उत्तर सुरक्षित हैं। अगला प्रश्न खुलने से पहले बचा समय जाँचा जाएगा।`) : copy(language, 'You will answer 15 balanced questions, with 30 seconds for each. Score 9 or more to pass.', 'आप 15 संतुलित प्रश्नों के उत्तर देंगे। हर प्रश्न के लिए 30 सेकंड होंगे। पास होने के लिए 9 या अधिक अंक चाहिए।')}</p>
              {pauseGuidance && <p className="protected-exam-notice">{pauseGuidance}</p>}
              {guided ? <p className="protected-exam-notice">{copy(language, 'Judge mode does not open your camera or microphone. It still demonstrates real answer saving, timing and recovery.', 'जज मोड आपका कैमरा या माइक्रोफोन नहीं खोलता। यह फिर भी वास्तविक उत्तर सहेजना, समय और वापसी दिखाता है।')}</p> : <div className="protected-exam-notice"><p>{cameraReady ? copy(language, 'Camera check complete. Analysis stays on this device.', 'कैमरा जाँच पूरी हुई। विश्लेषण इसी डिवाइस पर रहता है।') : copy(language, 'Check your camera before opening a timed question.', 'समयबद्ध प्रश्न खोलने से पहले अपना कैमरा जाँचें।')}</p>{!cameraReady && <button className="button button--secondary" onClick={() => void media.start()} disabled={media.snapshot.camera === 'requesting' || media.snapshot.model === 'loading' || media.snapshot.objectModel === 'loading'}>{copy(language, 'Check camera and microphone', 'कैमरा और माइक्रोफोन जाँचें')}</button>}{media.snapshot.error && <p role="status">{media.snapshot.error}</p>}</div>}
              {!attempt && <label className="consent-box"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span><strong>{copy(language, 'I understand this is a prototype test.', 'मैं समझता/समझती हूँ कि यह एक प्रोटोटाइप टेस्ट है।')}</strong><small>{copy(language, 'No identity document, video or audio is uploaded.', 'कोई पहचान दस्तावेज़, वीडियो या ऑडियो अपलोड नहीं होता।')}</small></span></label>}
              {language === 'hi' && <p>इस प्रश्न बैंक के प्रश्न अभी अंग्रेज़ी में हैं। परीक्षा के नियंत्रण और सहायता हिन्दी में उपलब्ध हैं।</p>}
              <div className="lf-actions"><button className="button button--primary" disabled={busy || hidden || !cameraReady || (!attempt && !accepted)} onClick={reconnect}>{busy ? copy(language, 'Getting your test ready…', 'आपकी परीक्षा तैयार की जा रही है…') : attempt ? copy(language, 'Resume test', 'टेस्ट जारी रखें') : copy(language, 'Start test', 'टेस्ट शुरू करें')}<ArrowRight size={17} /></button></div>
              {guided && !recoveryLab.enabled && <button type="button" className="protected-recovery-opt-in" onClick={enableRecoveryLab}><FlaskConical size={17} />{copy(language, 'Open the judge recovery lab', 'जज रिकवरी लैब खोलें')}</button>}
              <details className="protected-exam-details"><summary>{copy(language, 'Privacy and technical details', 'गोपनीयता और तकनीकी जानकारी')}</summary><p>{copy(language, 'Only one tab can control this session. Pauses share a two-minute allowance, and the whole attempt expires after 30 minutes. Answers and the result use an anonymous session that expires after seven days.', 'एक समय में केवल एक टैब इस सत्र को नियंत्रित कर सकता है। विराम के लिए कुल दो मिनट हैं और पूरा प्रयास 30 मिनट बाद समाप्त होता है। उत्तर और परिणाम बिना नाम वाले सत्र में रहते हैं, जो सात दिन बाद समाप्त होता है।')}</p>{attempt && <p>{copy(language, `Paper reference: ${attempt.fingerprint}`, `प्रश्नपत्र संदर्भ: ${attempt.fingerprint}`)}</p>}</details>
            </>}
          {error && <div className="protected-exam-error" role="alert"><strong>{copy(language, 'We could not confirm that action', 'हम उस कार्रवाई की पुष्टि नहीं कर सके')}</strong><p>{copy(language, 'Check your connection, then choose Resume test. Your last confirmed answer is safe.', 'अपना इंटरनेट जाँचें, फिर टेस्ट जारी रखें चुनें। आपका अंतिम पुष्ट उत्तर सुरक्षित है।')}{error.retryAfter > 0 ? ` ${copy(language, `Try again in ${error.retryAfter} seconds.`, `${error.retryAfter} सेकंड बाद फिर प्रयास करें।`)}` : ''}</p>{client.hasPendingAnswer && <p>{copy(language, 'Your last choice will be checked once. It will not be submitted twice.', 'आपका अंतिम उत्तर एक बार जाँचा जाएगा। वह दो बार जमा नहीं होगा।')}</p>}</div>}
        </section>
      )}
    </FocusedAssessmentShell>
  )
}

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpenCheck, Camera, Check, CheckCircle2, CircleHelp, Clock3,
  ClipboardCheck, Download, Eraser, FastForward, FileCheck2, FileText, Flag, Info, LockKeyhole, Network, Printer,
  RefreshCcw, RotateCcw, ShieldCheck, Signal, TriangleAlert, UserRound, Volume2, VolumeX, WifiOff,
  Maximize2, Minimize2, ChevronRight, Filter, Slash, CheckCircle, X,
} from 'lucide-react'
import type { Question } from '../content/questions'
import { paperFingerprint, resolveQuestionPaper } from '../content/questionPaper'
import { LL_TEST_CONFIG, OFFICIAL_QUESTION_BANK, ROAD_SAFETY_VIDEO } from '../content/testConfig'
import { journeyReducer, type InterruptionKind, type JourneyEvent, type JourneyState } from '../domain/journey'
import { useDeviceReadiness, stopAllMediaTracks } from '../hooks/useDeviceReadiness'
import { clearLicenceFlowDeviceData } from './devicePrivacy'
import { loadApplicationDraft } from './application'
import { ageOnDate, createDemonstrationLicencePdf, createJourneyReceiptPdf, demonstrationLicenceNumber, downloadPdf, isDemonstrationLicenceEligible, type DemonstrationLicenceData, type JourneyReceiptData } from './downloadDocuments'
import { createPassingJudgeExamSession, loadExamSession, resetExamSession, saveExamSession } from './examSession'
import { isPaymentConfirmed } from './payment'
import { completeTutorial, loadJourneyProgress, saveJourneyProgress, startTutorial, updateTutorialWatch } from './progress'
import { loadReliabilityStatus, refreshReliabilityReceipt, subscribeReliabilityStatus } from './reliability'
import { navigatePortal } from './router'
import { loadYouTubeIframeApi, type YouTubePlayer, type YouTubePlayerStateEvent } from './youtubeIframeApi'
import { FocusedAssessmentShell, QuestionStatusMap, useFocusedFullscreen } from './FocusedAssessmentShell'

type Language = 'en' | 'hi'
type StageChange = (label: string) => void

const local = (language: Language, en: string, hi: string) => language === 'hi' ? hi : en
const questionPrompt = (question: Question, language: Language) => language === 'hi' ? question.promptHi ?? question.prompt : question.prompt
const questionOptions = (question: Question, language: Language) => language === 'hi' ? question.optionsHi ?? question.options : question.options
const questionExplanation = (question: Question, language: Language) => language === 'hi' ? question.explanationHi ?? question.explanation : question.explanation

function FlowLink({ href, className, children, dataTour }: { href: string; className?: string; children: ReactNode; dataTour?: string }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigatePortal(href)
  }
  return <a href={href} className={className} onClick={open} data-tour={dataTour}>{children}</a>
}

function Breadcrumbs({ applicationId, current, language }: { applicationId: string; current: string; language: Language }) {
  return <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'पथ')}><ol><li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li><li><FlowLink href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></li><li><span aria-current="page">{current}</span></li></ol></nav>
}

function Guard({ applicationId, title, body, route, action, language }: { applicationId: string; title: string; body: string; route: string; action: string; language: Language }) {
  return <><Breadcrumbs applicationId={applicationId} current={title} language={language} /><section className="route-guard"><LockKeyhole size={30} /><p className="eyebrow">{local(language, 'Previous stage required', 'पिछला चरण आवश्यक')}</p><h1 tabIndex={-1}>{title}</h1><p>{body}</p><FlowLink className="button button--primary" href={route}>{action}</FlowLink></section></>
}

export function TutorialPage({ applicationId, onStageChange, language }: { applicationId: string; onStageChange: StageChange; language: Language }) {
  const [progress, setProgress] = useState(() => loadJourneyProgress(applicationId))
  const [playbackSeconds, setPlaybackSeconds] = useState(0)
  const [videoDuration, setVideoDuration] = useState<number>(ROAD_SAFETY_VIDEO.expectedDurationSeconds)
  const [playerStatus, setPlayerStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [playerMessage, setPlayerMessage] = useState('')
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const progressRef = useRef(progress)
  const maxWatchedRef = useRef(progress.tutorial.maxWatched || 0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPersistedAtRef = useRef(0)
  const lastSampleAtRef = useRef(0)
  const onStageChangeRef = useRef(onStageChange)
  const languageRef = useRef(language)

  useEffect(() => {
    onStageChangeRef.current = onStageChange
    languageRef.current = language
  }, [language, onStageChange])

  // Load YouTube IFrame API and attach anti-scrubbing controller
  useEffect(() => {
    if (!isPaymentConfirmed(progressRef.current.payment)) return
    let cancelled = false
    let mountedPlayer: YouTubePlayer | null = null

    const stopTracking = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const commitProgress = (next: typeof progress, updateUi = true) => {
      progressRef.current = next
      saveJourneyProgress(next)
      if (updateUi) setProgress(next)
    }

    const recordPosition = (player: YouTubePlayer, force = false, updateUi = true) => {
      const current = player.getCurrentTime()
      const duration = player.getDuration() || ROAD_SAFETY_VIDEO.expectedDurationSeconds
      if (!Number.isFinite(current) || !Number.isFinite(duration) || duration <= 0) return false

      player.setPlaybackRate?.(1)
      const sampledAt = performance.now()
      const elapsed = lastSampleAtRef.current ? Math.max(0, (sampledAt - lastSampleAtRef.current) / 1_000) : 0
      lastSampleAtRef.current = sampledAt
      if (updateUi) {
        setPlaybackSeconds(current)
        setVideoDuration(duration)
      }
      const alreadyCompleted = progressRef.current.tutorial.status === 'completed'
      const allowedLead = Math.max(0.9, elapsed + 0.35)
      if (!alreadyCompleted && current > maxWatchedRef.current + allowedLead) {
        player.seekTo(maxWatchedRef.current, true)
        if (updateUi) setPlayerMessage(local(languageRef.current, 'Forward skipping is locked until that section has been watched.', 'जब तक वह भाग देखा न जाए, आगे छोड़ना लॉक है।'))
        return false
      }

      maxWatchedRef.current = Math.max(maxWatchedRef.current, current)
      if (!force && Date.now() - lastPersistedAtRef.current < 2_000) return true
      lastPersistedAtRef.current = Date.now()
      const updated = updateTutorialWatch(progressRef.current, {
        revision: ROAD_SAFETY_VIDEO.revision,
        position: current,
        maxWatched: maxWatchedRef.current,
        duration,
      })
      commitProgress(updated, updateUi)
      return true
    }

    const finishIfFullyWatched = (player: YouTubePlayer) => {
      const duration = player.getDuration() || ROAD_SAFETY_VIDEO.expectedDurationSeconds
      if (!recordPosition(player, true)) return
      const completed = completeTutorial(progressRef.current, ROAD_SAFETY_VIDEO.revision, duration)
      if (completed.tutorial.status !== 'completed') {
        player.seekTo(maxWatchedRef.current, true)
        setPlayerMessage(local(languageRef.current, 'The video must be watched in order before the test unlocks.', 'टेस्ट खुलने से पहले वीडियो क्रम में पूरा देखना आवश्यक है।'))
        return
      }
      commitProgress(completed)
      setPlayerMessage(local(languageRef.current, 'Tutorial complete. Test instructions are now unlocked.', 'ट्यूटोरियल पूरा हुआ। टेस्ट निर्देश अब खुल गए हैं।'))
      onStageChangeRef.current(local(languageRef.current, 'Road-safety learning complete', 'सड़क सुरक्षा सीख पूरी'))
    }

    setPlayerStatus('loading')
    void loadYouTubeIframeApi().then((youtube) => {
      if (cancelled || !playerContainerRef.current) return
      const mountNode = document.createElement('div')
      mountNode.className = 'lf-theatre-player-mount'
      playerContainerRef.current.replaceChildren(mountNode)

      mountedPlayer = new youtube.Player(mountNode, {
          videoId: ROAD_SAFETY_VIDEO.youtubeId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return
              const dur = event.target.getDuration()
              const duration = dur > 0 ? dur : ROAD_SAFETY_VIDEO.expectedDurationSeconds
              setVideoDuration(duration)
              setPlayerStatus('ready')
              event.target.setPlaybackRate?.(1)
              const started = startTutorial(progressRef.current, ROAD_SAFETY_VIDEO.revision, duration)
              progressRef.current = started
              maxWatchedRef.current = started.tutorial.maxWatched
              saveJourneyProgress(started)
              setProgress(started)
              const savedPos = started.tutorial.lastPosition
              setPlaybackSeconds(savedPos)
              if (savedPos > 0 && savedPos < dur - 5) {
                event.target.seekTo(savedPos, true)
              }
            },
            onStateChange: (event: YouTubePlayerStateEvent) => {
              if (event.data === 1) {
                stopTracking()
                setPlayerMessage('')
                event.target.setPlaybackRate?.(1)
                lastSampleAtRef.current = performance.now()
                if (event.target.getCurrentTime() > maxWatchedRef.current + 0.9 && progressRef.current.tutorial.status !== 'completed') {
                  event.target.seekTo(maxWatchedRef.current, true)
                }
                intervalRef.current = setInterval(() => {
                  if (playerRef.current) recordPosition(playerRef.current)
                }, 600)
              } else {
                stopTracking()
                if (event.data === 0) finishIfFullyWatched(event.target)
                else if (event.data === 2) recordPosition(event.target, true)
              }
            },
            onError: () => {
              stopTracking()
              setPlayerStatus('unavailable')
              setPlayerMessage(local(languageRef.current, 'The external video could not be played. Reload the page or try again when online.', 'बाहरी वीडियो नहीं चल सका। पृष्ठ फिर लोड करें या ऑनलाइन होने पर दोबारा कोशिश करें।'))
            },
          },
        })
      playerRef.current = mountedPlayer
    }).catch(() => {
      if (cancelled) return
      setPlayerStatus('unavailable')
      setPlayerMessage(local(languageRef.current, 'The YouTube player could not load. Check the connection and reload this page.', 'YouTube प्लेयर लोड नहीं हुआ। कनेक्शन जाँचें और पृष्ठ फिर लोड करें।'))
    })

    return () => {
      cancelled = true
      stopTracking()
      if (mountedPlayer) {
        try {
          recordPosition(mountedPlayer, true, false)
          mountedPlayer.destroy()
        } catch {
          // The API may already have removed its iframe during page teardown.
        }
      }
      if (playerRef.current === mountedPlayer) playerRef.current = null
      playerContainerRef.current?.replaceChildren()
    }
  }, [applicationId])

  // Auto-pause video when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const skipTutorialForJudgeDemo = () => {
    if (progressRef.current.tutorial.status === 'completed') return
    const duration = Number.isFinite(videoDuration) && videoDuration > 0
      ? videoDuration
      : ROAD_SAFETY_VIDEO.expectedDurationSeconds
    const started = startTutorial(progressRef.current, ROAD_SAFETY_VIDEO.revision, duration)
    const watched = updateTutorialWatch(started, {
      revision: ROAD_SAFETY_VIDEO.revision,
      position: duration,
      maxWatched: duration,
      duration,
    })
    const completedProgress = completeTutorial(watched, ROAD_SAFETY_VIDEO.revision, duration)
    if (completedProgress.tutorial.status !== 'completed') return

    playerRef.current?.pauseVideo()
    progressRef.current = completedProgress
    maxWatchedRef.current = duration
    saveJourneyProgress(completedProgress)
    setProgress(completedProgress)
    setPlaybackSeconds(duration)
    setPlayerMessage(local(language, 'Judge demo bypass used. Tutorial marked complete for this prototype session.', 'जज डेमो बायपास उपयोग किया गया। इस प्रोटोटाइप सत्र के लिए ट्यूटोरियल पूरा माना गया।'))
    onStageChange(local(language, 'Road-safety learning complete · judge demo bypass', 'सड़क सुरक्षा सीख पूरी · जज डेमो बायपास'))
    navigatePortal(`/mp/application/${applicationId}/test-entry`)
  }

  if (!isPaymentConfirmed(progress.payment)) return <Guard applicationId={applicationId} language={language} title={local(language, 'Complete payment first', 'पहले भुगतान पूरा करें')} body={local(language, 'The learning and secure-test stages unlock only after the saved sandbox payment is confirmed.', 'सीखने और सुरक्षित परीक्षा के चरण सैंडबॉक्स भुगतान पुष्ट होने के बाद ही खुलते हैं।')} route={`/mp/application/${applicationId}/payment`} action={local(language, 'Open fee payment', 'शुल्क भुगतान खोलें')} />

  const completed = progress.tutorial.status === 'completed'
  const progressPercent = Math.min(100, Math.round(((completed ? videoDuration : maxWatchedRef.current) / (videoDuration || ROAD_SAFETY_VIDEO.expectedDurationSeconds)) * 100))

  return (
    <>
      <Breadcrumbs applicationId={applicationId} current={local(language, 'Road safety learning', 'सड़क सुरक्षा सीख')} language={language} />
      <section className="page-title" data-tour="tutorial-overview">
        <div>
          <p className="eyebrow">{local(language, 'Required prototype learning', 'आवश्यक प्रोटोटाइप सीख')}</p>
          <h1 tabIndex={-1}>{local(language, 'Road Safety Tutorial', 'सड़क सुरक्षा ट्यूटोरियल')}</h1>
          <p>{local(language, 'Complete the road safety learning video before entering the learner licence examination.', 'लर्नर लाइसेंस परीक्षा शुरू करने से पहले सड़क सुरक्षा ट्यूटोरियल वीडियो पूरा करें।')}</p>
        </div>
      </section>

      <div className="lf-theatre-layout">
        {/* Left Column: Video Screen & Control Strip */}
        <div className="lf-theatre-main">
          <div className="lf-theatre-frame">
            <div ref={playerContainerRef} className="lf-theatre-iframe" />
            {playerStatus !== 'ready' && (
              <div className="lf-theatre-player-status" role="status" aria-live="polite">
                {playerStatus === 'unavailable' ? <TriangleAlert size={28} aria-hidden="true" /> : <Clock3 size={28} aria-hidden="true" />}
                <strong>
                  {playerStatus === 'unavailable'
                    ? local(language, 'Video player unavailable', 'वीडियो प्लेयर उपलब्ध नहीं')
                    : local(language, 'Loading road-safety video…', 'सड़क सुरक्षा वीडियो लोड हो रहा है…')}
                </strong>
                {playerStatus === 'unavailable' && (
                  <button type="button" className="button button--secondary" onClick={() => window.location.reload()}>
                    <RefreshCcw size={16} aria-hidden="true" /> {local(language, 'Reload player', 'प्लेयर फिर लोड करें')}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="lf-theatre-meta-bar">
            <div className="lf-theatre-meta-info">
              <span>{local(language, 'Road-safety learning video · approximately 12 minutes', 'सड़क सुरक्षा सीखने का वीडियो · लगभग १२ मिनट')}</span>
              <a href={ROAD_SAFETY_VIDEO.youtubeUrl} target="_blank" rel="noreferrer noopener">
                {local(language, 'Open source video (progress is not tracked)', 'स्रोत वीडियो खोलें (प्रगति ट्रैक नहीं होगी)')} ↗
              </a>
            </div>
          </div>

          {/* Active Watch Progress Bar */}
          <div className="lf-theatre-watch-progress" role="progressbar" aria-label={local(language, 'Tutorial watch progress', 'ट्यूटोरियल देखने की प्रगति')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
            <div className="lf-theatre-watch-progress__bar">
              <div className="lf-theatre-watch-progress__fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="lf-theatre-watch-progress__meta">
              <small>
                {completed
                  ? local(language, '100% Watched · Requirement Complete', '१००% देखा गया · आवश्यकता पूरी')
                  : local(language, `${progressPercent}% Watched · Forward skipping locked until watched`, `${progressPercent}% देखा गया · आगे छोड़ना लॉक है`)}
              </small>
              <small>
                {Math.floor(playbackSeconds / 60)}:{String(Math.floor(playbackSeconds % 60)).padStart(2, '0')} / {Math.floor(videoDuration / 60)}:{String(Math.floor(videoDuration % 60)).padStart(2, '0')}
              </small>
            </div>
            {playerMessage && <small className="lf-theatre-watch-message" role="status" aria-live="polite">{playerMessage}</small>}
          </div>
        </div>

        {/* Right Column: Status, Study Pack & Actions */}
        <div className="lf-theatre-sidebar">
          <div className="lf-theatre-card">
            <div className="lf-theatre-card__header">
              <div>
                <p className="eyebrow">{local(language, 'Requirement status', 'आवश्यकता स्थिति')}</p>
                <h3>{local(language, 'Road Safety Module', 'सड़क सुरक्षा मॉड्यूल')}</h3>
              </div>
              <span className={completed ? 'learning-status learning-status--complete' : 'learning-status'}>
                {completed ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
                {completed ? local(language, 'Completed', 'पूरा') : local(language, 'Required', 'अनिवार्य')}
              </span>
            </div>
            <p className="lf-theatre-card__desc">
              {completed
                ? local(language, 'Tutorial requirements satisfied. You may now proceed to the online knowledge examination.', 'ट्यूटोरियल की आवश्यकता पूरी हुई। अब आप ऑनलाइन परीक्षा शुरू कर सकते हैं।')
                : local(language, 'Watch the full video in order to unlock the test entry stage. Your furthest watched point is saved on this device.', 'टेस्ट खोलने के लिए वीडियो क्रम में पूरा देखें। सबसे आगे देखी गई जगह इस डिवाइस पर सहेजी जाती है।')}
            </p>

            <aside className="lf-theatre-judge-shortcut" aria-label={local(language, 'Judge demonstration shortcut', 'जज प्रदर्शन शॉर्टकट')}>
              <div>
                <strong>{local(language, 'Judge demo shortcut', 'जज डेमो शॉर्टकट')}</strong>
                <p>{local(language, 'This visible prototype bypass saves review time. Production tutorial enforcement is demonstrated by the locked watch progress above.', 'यह स्पष्ट प्रोटोटाइप बायपास समीक्षा का समय बचाता है। प्रोडक्शन ट्यूटोरियल प्रवर्तन ऊपर लॉक की गई देखने की प्रगति द्वारा दिखाया गया है।')}</p>
              </div>
              <button type="button" className="button button--secondary" onClick={skipTutorialForJudgeDemo} disabled={completed} data-tour="skip-tutorial-judge">
                {completed ? <Check size={17} aria-hidden="true" /> : <FastForward size={17} aria-hidden="true" />}
                {completed
                  ? local(language, 'Tutorial already complete', 'ट्यूटोरियल पहले से पूरा')
                  : local(language, 'Skip tutorial and continue', 'ट्यूटोरियल छोड़ें और आगे बढ़ें')}
              </button>
            </aside>

            <div className="lf-theatre-study-box">
              <div className="lf-theatre-study-box__top">
                <BookOpenCheck size={18} />
                <strong>{local(language, 'Reference question bank', 'संदर्भ प्रश्न बैंक')}</strong>
              </div>
              <p>{local(language, 'STALL sample question pack for traffic signs & road rules.', 'यातायात संकेतों और नियमों के लिए आधिकारिक अभ्यास सेट।')}</p>
              <a className="button button--secondary lf-theatre-study-box__btn" href={OFFICIAL_QUESTION_BANK.source} download>
                <Download size={15} /> {local(language, 'Download PDF', 'PDF डाउनलोड')}
              </a>
            </div>

            <div className="lf-theatre-actions">
              {completed ? (
                <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/test-entry`}>
                  {local(language, 'Continue to test instructions', 'टेस्ट निर्देशों पर जाएँ')} <ArrowRight size={18} />
                </FlowLink>
              ) : (
                <button className="button button--primary" disabled>
                  {local(language, 'Watch video to unlock test', 'टेस्ट खोलने के लिए वीडियो देखें')} <ArrowRight size={18} />
                </button>
              )}
              <FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary">
                <ArrowLeft size={16} /> {local(language, 'Application status', 'आवेदन स्थिति')}
              </FlowLink>
            </div>
          </div>

          <details className="lf-theatre-policy-note">
            <summary>
              <CircleHelp size={15} /> {local(language, 'Why is this video mandatory?', 'यह वीडियो अनिवार्य क्यों है?')}
            </summary>
            <p>
              {local(
                language,
                'This prototype models tutorial completion as a required gate before the knowledge examination. It saves watch progress locally and blocks forward skipping.',
                'यह प्रोटोटाइप ज्ञान परीक्षा से पहले ट्यूटोरियल पूरा करना आवश्यक मानता है। यह देखने की प्रगति स्थानीय रूप से सहेजता है और आगे छोड़ने से रोकता है।'
              )}
            </p>
          </details>
        </div>
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

function JudgePassShortcut({
  language,
  onActivate,
  onRecovery,
  compact = false,
}: {
  language: Language
  onActivate: () => void
  onRecovery?: () => void
  compact?: boolean
}) {
  return (
    <aside className={`judge-result-shortcut${compact ? ' judge-result-shortcut--compact' : ''}`} aria-label={local(language, 'Judge result preview control', 'जज परिणाम पूर्वावलोकन नियंत्रण')}>
      <span className="judge-result-shortcut__icon"><ClipboardCheck size={20} aria-hidden="true" /></span>
      <div>
        <strong>{local(language, 'Judge review controls', 'जज समीक्षा नियंत्रण')}</strong>
        <p>{local(language, 'Generate a passing prototype attempt through the normal scoring flow and open the result, receipt and demo licence.', 'सामान्य स्कोरिंग प्रवाह से पासिंग प्रोटोटाइप प्रयास बनाएँ और परिणाम, रसीद तथा डेमो लाइसेंस खोलें।')}</p>
      </div>
      <div className="judge-result-shortcut__actions">
        {onRecovery && (
          <button type="button" className="button button--secondary" onClick={onRecovery} data-tour="preview-recovery-judge">
            <WifiOff size={17} aria-hidden="true" /> {local(language, 'Preview safe recovery', 'सुरक्षित रिकवरी देखें')}
          </button>
        )}
        <button type="button" className="button button--secondary" onClick={onActivate} data-tour="preview-result-judge">
          <FastForward size={17} aria-hidden="true" /> {local(language, 'Preview passing result', 'पास परिणाम देखें')}
        </button>
      </div>
    </aside>
  )
}

export function TestEntryPage({ applicationId, onStageChange, language }: { applicationId: string; onStageChange: StageChange; language: Language }) {
  const progress = loadJourneyProgress(applicationId)
  const [accepted, setAccepted] = useState(false)
  const [session, setSession] = useState(() => loadExamSession(applicationId, progress))
  const media = useDeviceReadiness()
  const guided = progress.readiness.mode === 'guided-signals'

  useEffect(() => {
    if (guided) {
      if (!media.snapshot.started) media.useGuidedSignals()
    } else if (!media.snapshot.started) {
      void media.start()
    }
  }, [guided, media.snapshot.started, media.start, media.useGuidedSignals])

  const preTestReady =
    media.snapshot.camera === 'ready' &&
    media.snapshot.microphone === 'ready' &&
    media.snapshot.model === 'ready' &&
    media.snapshot.faceCount === 1 &&
    media.snapshot.framing === 'good' &&
    media.snapshot.lighting === 'good' &&
    media.snapshot.storage &&
    media.snapshot.secureContext &&
    media.snapshot.online

  useEffect(() => {
    return () => {
      media.stop()
      stopAllMediaTracks()
    }
  }, [media.stop])

  if (progress.tutorial.status !== 'completed') return <Guard applicationId={applicationId} language={language} title={local(language, 'Complete the tutorial first', 'पहले सीखने का भाग पूरा करें')} body={local(language, 'The test starts only after the learning check is completed.', 'सीखने की जाँच पूरी होने के बाद ही परीक्षा शुरू होती है।')} route={`/mp/application/${applicationId}/tutorial`} action={local(language, 'Open road-safety tutorial', 'सड़क सुरक्षा सीख खोलें')} />
  const fresh = session.stage === 'exam-intro'
  const start = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // safe fallback
    }
    media.stop()
    stopAllMediaTracks()
    const base = session.stage === 'result' ? resetExamSession(applicationId, progress) : session
    const next = journeyReducer(base, { type: 'START_EXAM' })
    saveExamSession(applicationId, next)
    setSession(next)
    onStageChange(local(language, 'LL test in progress', 'एलएल परीक्षा जारी'))
    navigatePortal(`/mp/application/${applicationId}/test`)
  }
  const previewPassingResult = () => {
    media.stop()
    stopAllMediaTracks()
    const next = createPassingJudgeExamSession(applicationId, progress)
    setSession(next)
    onStageChange(local(language, 'Passing result preview · judge shortcut', 'पास परिणाम पूर्वावलोकन · जज शॉर्टकट'))
    navigatePortal(`/mp/application/${applicationId}/result`)
  }

  return (
    <>
      <Breadcrumbs applicationId={applicationId} current={local(language, 'Online test instructions', 'ऑनलाइन टेस्ट निर्देश')} language={language} />
      <section className="page-title" data-tour="test-entry-overview">
        <div>
          <p className="eyebrow">{local(language, 'Demo test', 'डेमो टेस्ट')}</p>
          <h1 tabIndex={-1}>{local(language, 'Final system check before your 15-question demo test', '15-प्रश्न डेमो परीक्षा से पहले अंतिम सिस्टम जाँच')}</h1>
          <p>{local(language, 'Review your system signals and start the focused 15-question knowledge test. Each answer is saved locally as you proceed.', 'अपने सिस्टम संकेतों की समीक्षा करें और 15 प्रश्नों का फ़ोकस्ड टेस्ट शुरू करें। जैसे-जैसे आप आगे बढ़ेंगे, प्रत्येक उत्तर सुरक्षित रहेगा।')}</p>
        </div>
      </section>
      <section className="test-instruction-grid">
        <article>
          <span><FileText size={21} /></span>
          <div>
            <strong>{local(language, `${LL_TEST_CONFIG.questionCount} questions`, `${LL_TEST_CONFIG.questionCount} प्रश्न`)}</strong>
            <small>{local(language, `Score ${LL_TEST_CONFIG.passMark} or more to pass`, `पास होने के लिए ${LL_TEST_CONFIG.passMark} या अधिक सही करें`)}</small>
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
            <strong>{guided ? local(language, 'Demo camera simulation', 'डेमो कैमरा सिमुलेशन') : local(language, 'Camera monitoring', 'कैमरा निगरानी')}</strong>
            <small>{local(language, 'Checks you are visible during the test', 'जाँचता है कि आप परीक्षा के दौरान सामने हैं')}</small>
          </div>
        </article>
        <article>
          <span><Clock3 size={21} /></span>
          <div>
            <strong>{local(language, `${LL_TEST_CONFIG.secondsPerQuestion} seconds per question`, `हर प्रश्न के लिए ${LL_TEST_CONFIG.secondsPerQuestion} सेकंड`)}</strong>
            <small>{local(language, 'No negative marking in this prototype', 'इस प्रोटोटाइप में नेगेटिव मार्किंग नहीं है')}</small>
          </div>
        </article>
      </section>
      <div className="test-entry-camera-card">
        <div className="test-entry-camera-preview">
          <MiniCamera guided={guided} stream={media.stream} language={language} />
        </div>
        <div className="test-entry-camera-status">
          <div className="test-entry-camera-status__header">
            <Camera size={18} />
            <strong>
              {guided
                ? local(language, 'Demo camera simulation ready', 'डेमो कैमरा सिमुलेशन तैयार')
                : preTestReady
                ? local(language, 'Camera ready for test', 'कैमरा परीक्षा के लिए तैयार')
                : media.snapshot.camera === 'ready'
                ? local(language, 'Framing face for verification...', 'चेहरा जाँचा जा रहा है...')
                : media.snapshot.camera === 'denied'
                ? local(language, 'Camera permission required', 'कैमरा अनुमति आवश्यक है')
                : local(language, 'Connecting camera...', 'कैमरा कनेक्ट हो रहा है...')}
            </strong>
          </div>
          <p>
            {guided
              ? local(language, `Simulated camera monitoring will run during the ${LL_TEST_CONFIG.questionCount} test questions.`, `परीक्षा के ${LL_TEST_CONFIG.questionCount} प्रश्नों के दौरान सिम्युलेटेड कैमरा निगरानी चलेगी।`)
              : preTestReady
              ? local(language, 'Your face and lighting are verified. Continuous monitoring will remain active during the exam.', 'आपका चेहरा और रोशनी सत्यापित हैं। परीक्षा के दौरान निरंतर निगरानी सक्रिय रहेगी।')
              : media.snapshot.camera === 'ready'
              ? local(language, 'Please look directly into the camera so your face and framing can be verified.', 'कृपया कैमरे के सामने सीधे देखें ताकि चेहरा और स्थिति सत्यापित हो सके।')
              : media.snapshot.camera === 'denied'
              ? local(language, 'Allow camera access in your browser settings to proceed with the test.', 'परीक्षा शुरू करने के लिए ब्राउज़र सेटिंग में कैमरे की अनुमति दें।')
              : local(language, 'Starting private camera check before test entry.', 'टेस्ट शुरू करने से पहले निजी कैमरा जाँच शुरू की जा रही है।')}
          </p>
        </div>
      </div>
      <div className="test-declaration">
        <Info size={20} />
        <p>{local(language, 'This browser prototype demonstrates device checks, monitoring signals and safe recovery. A production high-stakes test would still require a separately audited native secure-test companion for operating-system lockdown.', 'यह ब्राउज़र प्रोटोटाइप डिवाइस जाँच, निगरानी संकेत और सुरक्षित रिकवरी दिखाता है। वास्तविक उच्च-जोखिम परीक्षा में ऑपरेटिंग सिस्टम लॉकडाउन के लिए अलग से जाँचे गए नेटिव सुरक्षित-टेस्ट साथी की जरूरत होगी।')}</p>
      </div>
      {fresh ? (
        <label className="consent-box" data-tour="test-entry-consent">
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
          <button className="button button--primary" disabled={!accepted || (!guided && !preTestReady)} onClick={start} data-tour="test-entry-start">
            {local(language, `Enter focused mode and start ${LL_TEST_CONFIG.questionCount}-question test`, `फ़ोकस्ड मोड में प्रवेश करें और ${LL_TEST_CONFIG.questionCount}-प्रश्नों का टेस्ट शुरू करें`)} <ArrowRight size={18} />
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
      <JudgePassShortcut language={language} onActivate={previewPassingResult} />
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
  const [speaking, setSpeaking] = useState(false)
  const media = useDeviceReadiness()
  const guided = progress.readiness.mode === 'guided-signals'
  const paper = resolveQuestionPaper(state.exam.paperQuestionIds)
  const question = paper[state.exam.currentQuestion]
  const [secondsLeft, setSecondsLeft] = useState<number>(LL_TEST_CONFIG.secondsPerQuestion)
  const timeoutHandledQuestion = useRef(-1)

  const submitAnswer = (answer: number) => {
    if (!question) return
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    const next = journeyReducer(state, {
      type: 'ANSWER',
      answer,
      correct: answer === question.correct,
      isLast: state.exam.currentQuestion === paper.length - 1,
      passThreshold: LL_TEST_CONFIG.passMark,
      triggerDemoInterruption: state.exam.currentQuestion === LL_TEST_CONFIG.interruptionAfterQuestion - 1,
    })
    saveExamSession(applicationId, next)
    setState(next)
    setSelected(null)
    if (next.stage === 'interruption') {
      media.stop()
      stopAllMediaTracks()
      navigatePortal(`/mp/application/${applicationId}/test-interruption`)
    }
    if (next.stage === 'result') {
      media.stop()
      stopAllMediaTracks()
      onStageChange(local(language, 'View result and receipt', 'परिणाम और रसीद देखें'))
      navigatePortal(`/mp/application/${applicationId}/result`)
    }
  }

  useEffect(() => {
    return () => {
      media.stop()
      stopAllMediaTracks()
    }
  }, [media.stop])

  useEffect(() => {
    if (state.stage !== 'exam' || state.exam.status !== 'active' || !state.exam.questionDeadlineAt) return
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(state.exam.questionDeadlineAt!).getTime() - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0 && timeoutHandledQuestion.current !== state.exam.currentQuestion) {
        timeoutHandledQuestion.current = state.exam.currentQuestion
        submitAnswer(-1)
      }
    }
    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [state.stage, state.exam.status, state.exam.currentQuestion, state.exam.questionDeadlineAt])

  useEffect(() => {
    if (guided) {
      if (!media.snapshot.started) media.useGuidedSignals()
    } else if (!media.snapshot.started) {
      void media.start()
    }
  }, [guided, media.snapshot.started, media.start, media.useGuidedSignals])

  useEffect(() => {
    const pauseForVisibility = () => {
      if (!document.hidden || state.stage !== 'exam' || state.exam.status !== 'active') return
      const next = journeyReducer(state, {
        type: 'PAUSE_EXAM',
        kind: 'visibility',
        detail: 'The test page became hidden; the latest saved answer remains protected.',
        synthetic: false,
      })
      saveExamSession(applicationId, next)
      setState(next)
      navigatePortal(`/mp/application/${applicationId}/test-interruption`)
    }
    document.addEventListener('visibilitychange', pauseForVisibility)
    return () => document.removeEventListener('visibilitychange', pauseForVisibility)
  }, [applicationId, state])

  useEffect(() => {
    if (state.stage !== 'exam' || state.exam.status !== 'active' || guided) return
    const reason = media.snapshot.blockingReason
    if (!reason && media.snapshot.online) return
    const kind: InterruptionKind = !media.snapshot.online
      ? 'network-real'
      : reason === 'multiple-faces'
      ? 'multiple-faces'
      : 'camera'
    const detail = !media.snapshot.online
      ? 'The browser reported a real network loss.'
      : reason === 'multiple-faces'
      ? 'More than one face remained visible in the camera field.'
      : 'The live camera signal could not verify one visible face.'
    const next = journeyReducer(state, { type: 'PAUSE_EXAM', kind, detail, synthetic: false })
    saveExamSession(applicationId, next)
    setState(next)
    navigatePortal(`/mp/application/${applicationId}/test-interruption`)
  }, [applicationId, guided, media.snapshot.blockingReason, media.snapshot.online, state])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  if (state.stage !== 'exam' || !question) {
    return (
      <Guard
        applicationId={applicationId}
        language={language}
        title={local(language, 'Open the saved test stage', 'सहेजा परीक्षा चरण खोलें')}
        body={local(language, 'This route follows the persisted exam state.', 'यह पेज सहेजी हुई परीक्षा स्थिति का अनुसरण करता है।')}
        route={routeForSession(applicationId, state)}
        action={local(language, 'Continue saved session', 'सहेजा सत्र जारी रखें')}
      />
    )
  }

  const mediaReady = guided
    ? media.snapshot.started
    : media.snapshot.camera === 'ready' &&
      media.snapshot.microphone === 'ready' &&
      media.snapshot.model === 'ready' &&
      media.snapshot.faceCount === 1 &&
      media.snapshot.framing === 'good' &&
      media.snapshot.online
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
    if (selected !== null) submitAnswer(selected)
  }

  const previewPassingResult = () => {
    media.stop()
    stopAllMediaTracks()
    const next = createPassingJudgeExamSession(applicationId, progress, state)
    setState(next)
    onStageChange(local(language, 'Passing result preview · judge shortcut', 'पास परिणाम पूर्वावलोकन · जज शॉर्टकट'))
    navigatePortal(`/mp/application/${applicationId}/result`)
  }

  const previewSafeRecovery = () => {
    const next = journeyReducer(state, {
      type: 'ANSWER',
      answer: question.correct,
      correct: true,
      isLast: false,
      passThreshold: LL_TEST_CONFIG.passMark,
      triggerDemoInterruption: true,
    })
    media.stop()
    stopAllMediaTracks()
    saveExamSession(applicationId, next)
    setState(next)
    onStageChange(local(language, 'Test paused safely · judge recovery preview', 'टेस्ट सुरक्षित रूप से रुका · जज रिकवरी पूर्वावलोकन'))
    navigatePortal(`/mp/application/${applicationId}/test-interruption`)
  }

  const answers = questionOptions(question, language)
  const savedCount = Object.keys(state.exam.answers).length
  const speechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  const toggleQuestionSpeech = () => {
    if (!speechAvailable) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const spokenOptions = answers.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join('. ')
    const utterance = new SpeechSynthesisUtterance(`${questionPrompt(question, language)}. ${spokenOptions}`)
    utterance.lang = language === 'hi' && question.promptHi ? 'hi-IN' : 'en-IN'
    utterance.rate = 0.92
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const isLastQuestion = state.exam.currentQuestion === paper.length - 1

  return (
    <FocusedAssessmentShell
      mode="exam"
      title={local(language, 'Demo Learner’s Licence Test', 'डेमो लर्नर लाइसेंस परीक्षा')}
      stageBadge={local(
        language,
        `Question ${state.exam.currentQuestion + 1} of ${paper.length}`,
        `प्रश्न ${state.exam.currentQuestion + 1} / ${paper.length}`
      )}
      timerSeconds={secondsLeft}
      online={media.snapshot.online}
      cameraActive={mediaReady}
      cameraGuided={guided}
      statusMap={
        <QuestionStatusMap
          total={paper.length}
          mode="exam"
          currentIndex={state.exam.currentQuestion}
          answers={state.exam.answers}
          language={language}
        />
      }
      language={language}
      onExit={() => navigatePortal(`/mp/application/${applicationId}`)}
      exitLabel={local(language, 'Exit test', 'टेस्ट से बाहर निकलें')}
      bottomBar={
        <div className="focused-bottom-actions">
          <button
            type="button"
            className="button button--primary"
            disabled={selected === null || !mediaReady}
            onClick={saveAnswer}
          >
            {isLastQuestion
              ? local(language, 'Lock answer and finish test', 'उत्तर लॉक करें और टेस्ट पूरा करें')
              : local(language, 'Lock answer and continue', 'उत्तर लॉक करें और आगे बढ़ें')}{' '}
            <ArrowRight size={17} />
          </button>
          <div className="focused-security-note">
            <LockKeyhole size={15} aria-hidden="true" />
            <span>
              {local(
                language,
                'Answers are locked permanently upon clicking continue.',
                'आगे बढ़ने पर उत्तर हमेशा के लिए लॉक हो जाते हैं।'
              )}
            </span>
          </div>
        </div>
      }
    >
      <div className="focused-workspace-container focused-workspace-container--split">
        <div className="focused-question-card" data-tour="test-question-overview">
          <div className="focused-question-heading">
            <div className="focused-question-meta">
              <span className="focused-question-pill">
                {local(
                  language,
                  `Question ${state.exam.currentQuestion + 1} of ${paper.length}`,
                  `प्रश्न ${state.exam.currentQuestion + 1} / ${paper.length}`
                )}
              </span>
              <span className="focused-question-saved-pill">
                <LockKeyhole size={13} aria-hidden="true" />
                {local(language, `${savedCount} locked`, `${savedCount} लॉक`)}
              </span>
            </div>
            <h2>{questionPrompt(question, language)}</h2>
            {speechAvailable && (
              <button
                type="button"
                className="question-speech-button"
                onClick={toggleQuestionSpeech}
                aria-pressed={speaking}
              >
                {speaking ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
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
              {local(language, 'Choose one answer', 'एक उत्तर चुनें')}
            </legend>
            {answers.map((option, index) => {
              const isSelected = selected === index
              return (
                <label
                  key={option}
                  className={`focused-option-card ${
                    isSelected ? 'focused-option-card--selected' : ''
                  } ${!mediaReady ? 'focused-option-card--disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="exam-question-radio"
                    disabled={!mediaReady}
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
        </div>

        {/* Quiet Observation Panel */}
        <aside className="focused-observation-panel" aria-label={local(language, 'System monitoring', 'सिस्टम निगरानी')}>
          <div className={`focused-obs-card ${coaching || needsCameraStart ? 'focused-obs-card--coach' : ''}`}>
            <div className="focused-obs-card__header">
              {coaching || needsCameraStart ? (
                <TriangleAlert size={18} aria-hidden="true" />
              ) : (
                <ShieldCheck size={18} aria-hidden="true" />
              )}
              <strong>
                {needsCameraStart
                  ? local(language, 'Camera check required', 'कैमरा जाँच आवश्यक')
                  : coaching?.title ?? local(language, 'Monitoring quietly', 'निगरानी सक्रिय')}
              </strong>
            </div>
            <p className="focused-obs-card__body">
              {needsCameraStart
                ? local(language, 'Reconnect camera to continue test.', 'टेस्ट जारी रखने के लिए कैमरा जोड़ें।')
                : coaching?.body ?? local(language, 'All systems normal. Face detected and framed.', 'सब कुछ सामान्य है। चेहरा संरेखित है।')}
            </p>
            {needsCameraStart && (
              <button
                type="button"
                className="button button--secondary button--compact"
                onClick={() => void media.start()}
              >
                {local(language, 'Reconnect camera', 'कैमरा फिर जोड़ें')}
              </button>
            )}
          </div>

          <details className="focused-camera-drawer">
            <summary className="focused-camera-drawer__summary">
              <Camera size={15} aria-hidden="true" />
              <span>{local(language, 'View camera preview', 'कैमरा पूर्वावलोकन देखें')}</span>
            </summary>
            <div className="focused-camera-drawer__content">
              <MiniCamera guided={guided} stream={media.stream} language={language} />
            </div>
          </details>

          <div className="focused-status-summary-card">
            <dl>
              <div>
                <dt>{local(language, 'Payment', 'भुगतान')}</dt>
                <dd>✓ {local(language, 'Confirmed', 'पुष्ट')}</dd>
              </div>
              <div>
                <dt>{local(language, 'Progress', 'प्रगति')}</dt>
                <dd>
                  {local(
                    language,
                    `${savedCount} of ${paper.length} saved`,
                    `${paper.length} में से ${savedCount} सहेजे`
                  )}
                </dd>
              </div>
            </dl>
            <JudgePassShortcut language={language} onActivate={previewPassingResult} onRecovery={previewSafeRecovery} compact />
          </div>
        </aside>
      </div>
    </FocusedAssessmentShell>
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
  const { enterFullscreen } = useFocusedFullscreen()
  const paper = resolveQuestionPaper(state.exam.paperQuestionIds)

  if (state.stage !== 'interruption') {
    return (
      <Guard
        applicationId={applicationId}
        language={language}
        title={local(language, 'No active interruption', 'कोई सक्रिय बाधा नहीं')}
        body={local(language, 'Continue from the current saved test stage.', 'वर्तमान सहेजे परीक्षा चरण से जारी रखें।')}
        route={routeForSession(applicationId, state)}
        action={local(language, 'Continue saved session', 'सहेजा सत्र जारी रखें')}
      />
    )
  }

  const integrity = state.exam.interruptionKind === 'multiple-faces'
  const resume = async () => {
    await enterFullscreen()
    const next = journeyReducer(state, { type: 'RESUME_EXAM' })
    saveExamSession(applicationId, next)
    setState(next)
    onStageChange(local(language, 'LL test in progress', 'एलएल परीक्षा जारी'))
    navigatePortal(`/mp/application/${applicationId}/test`)
  }

  return (
    <FocusedAssessmentShell
      mode="interruption"
      title="LicenceFlow"
      stageBadge={local(language, 'Test paused safely', 'परीक्षा सुरक्षित रूप से रुकी')}
      online={state.exam.interruptionKind !== 'network-real'}
      cameraActive={state.exam.interruptionKind !== 'camera'}
      language={language}
      onExit={() => navigatePortal(`/mp/application/${applicationId}`)}
      exitLabel={local(language, 'Application status', 'आवेदन स्थिति')}
      bottomBar={
        <div className="focused-bottom-actions">
          <button type="button" className="button button--primary" onClick={resume} data-tour="interruption-resume">
            {local(language, 'Return to focused mode and resume', 'फ़ोकस्ड मोड में लौटें और टेस्ट जारी रखें')}{' '}
            <RefreshCcw size={17} />
          </button>
          <FlowLink className="button button--secondary" href={`/mp/application/${applicationId}`}>
            <ArrowLeft size={17} /> {local(language, 'Application status', 'आवेदन स्थिति')}
          </FlowLink>
        </div>
      }
    >
      <div className="focused-workspace-container">
        <section className="interruption-card interruption-card--focused" data-tour="interruption-overview">
          <div className="interruption-card__checkpoint-hero">
            <div className="interruption-card__checkpoint-img-wrap">
              <img
                src="/assets/recovery-checkpoint.png"
                alt="Safe Recovery Checkpoint"
                className="interruption-card__checkpoint-img"
              />
            </div>
            <div className="interruption-card__header-text">
              <span className="interruption-card__icon">
                {integrity ? <Camera size={26} /> : <WifiOff size={26} />}
              </span>
              <p className="eyebrow">
                {integrity
                  ? local(language, 'Camera observation · Not a penalty', 'कैमरा संकेत · कोई पेनल्टी नहीं')
                  : local(language, 'Technical checkpoint · Answers preserved', 'तकनीकी चेकपॉइंट · उत्तर सुरक्षित')}
              </p>
              <h1 tabIndex={-1}>
                {integrity
                  ? local(language, 'Multiple faces detected · Session paused safely', 'एक से अधिक चेहरे दिखे · सत्र सुरक्षित रूप से रुका')
                  : local(language, 'The test paused safely without losing progress', 'आपकी प्रगति सुरक्षित रखकर परीक्षा रोकी गई')}
              </h1>
            </div>
          </div>
          <p className="interruption-card__detail">
            {translatedInterruptionDetail(state.exam.interruptionDetail ?? '', language)}
          </p>
          <div className="recovery-facts">
            <div>
              <span>{local(language, 'Latest answer', 'पिछला उत्तर')}</span>
              <strong>{local(language, 'Saved in storage', 'मेमोरी में सुरक्षित')}</strong>
            </div>
            <div>
              <span>{local(language, 'Payment', 'भुगतान')}</span>
              <strong>{local(language, '₹250 Confirmed', '₹२५० पुष्ट')}</strong>
            </div>
            <div>
              <span>{local(language, 'Test progress', 'प्रगति')}</span>
              <strong>{local(language, '0 Answers lost', 'कोई उत्तर नष्ट नहीं')}</strong>
            </div>
            <div>
              <span>{local(language, 'Resume checkpoint', 'यहाँ से जारी करें')}</span>
              <strong>
                {local(
                  language,
                  `Question ${state.exam.currentQuestion + 1} of ${paper.length}`,
                  `प्रश्न ${state.exam.currentQuestion + 1} / ${paper.length}`
                )}
              </strong>
            </div>
          </div>
          <div className="interruption-card__principles">
            <ShieldCheck size={19} />
            <div>
              <strong>{local(language, 'Fair Examination Assurance', 'निष्पक्ष परीक्षा का भरोसा')}</strong>
              <p>
                {local(
                  language,
                  'LicenceFlow treats network dips and temporary camera obstructions as technical pauses, not failures. Return to single-person framing and resume when ready.',
                  'लाइसेंसफ्लो नेटवर्क रुकावटों को विफलता नहीं मानता। कैमरे के सामने अकेले आएं और तैयार होने पर जारी रखें।'
                )}
              </p>
            </div>
          </div>
        </section>
      </div>
    </FocusedAssessmentShell>
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
  else if (detail.includes('correct · LicenceFlow')) detail = `${detail.match(/\d+/)?.[0] ?? '0'} सही · LicenceFlow सिमुलेशन सीमा ${LL_TEST_CONFIG.passMark}`
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
  const [reliabilityStatus, setReliabilityStatus] = useState(() => loadReliabilityStatus(applicationId))

  useEffect(() => {
    stopAllMediaTracks()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeReliabilityStatus(applicationId, setReliabilityStatus)
    void refreshReliabilityReceipt(applicationId).then(setReliabilityStatus)
    return unsubscribe
  }, [applicationId])

  if (state.stage !== 'result') return <Guard applicationId={applicationId} language={language} title={local(language, 'Result not available yet', 'परिणाम अभी उपलब्ध नहीं')} body={local(language, 'Complete the saved synthetic test before opening its outcome.', 'परिणाम खोलने से पहले सहेजी सिंथेटिक परीक्षा पूरी करें।')} route={routeForSession(applicationId, state)} action={local(language, 'Continue saved session', 'सहेजा सत्र जारी रखें')} />
  const passed = state.exam.knowledgeResult === 'passed'
  const paper = resolveQuestionPaper(state.exam.paperQuestionIds)
  const fingerprint = paperFingerprint(state.exam.paperQuestionIds)
  const eligible = isDemonstrationLicenceEligible({
    paymentConfirmed: isPaymentConfirmed(progress.payment),
    tutorialCompleted: progress.tutorial.status === 'completed',
    examCompleted: state.exam.status === 'completed',
    knowledgePassed: passed,
  })
  const draft = loadApplicationDraft(applicationId)
  const holderName = draft
    ? [draft.firstName, draft.middleName, draft.lastName].filter(Boolean).join(' ') || state.application.fullName
    : state.application.fullName
  const completedAt = [...state.events].reverse().find((event) => event.kind === 'EXAM_COMPLETED')?.at ?? progress.updatedAt
  const licenceData: DemonstrationLicenceData = {
    applicationId,
    holderName: holderName || local(language, 'Demo MP applicant', 'डेमो मध्य प्रदेश आवेदक'),
    dateOfBirth: draft?.dateOfBirth,
    vehicleClasses: draft?.vehicleClasses.length ? draft.vehicleClasses : state.application.vehicleClass.split(/\s*\+\s*/).filter(Boolean),
    completedAt,
    paymentReference: progress.payment.reference,
  }
  const holderAge = licenceData.dateOfBirth ? ageOnDate(licenceData.dateOfBirth, completedAt) : null
  const receiptData: JourneyReceiptData = {
    ...licenceData,
    correctAnswers: state.exam.correctAnswers,
    totalQuestions: paper.length,
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
    <div className="result-dashboard">
      <Breadcrumbs
        applicationId={applicationId}
        current={local(language, 'Test result', 'परीक्षा परिणाम')}
        language={language}
      />

      {/* Unified Outcome Hero */}
      <section className={`result-dashboard-hero ${passed ? 'result-dashboard-hero--passed' : 'result-dashboard-hero--failed'}`} data-tour="result-overview">
        <div className="result-dashboard-hero__main">
          <div className="result-dashboard-hero__icon" aria-hidden="true">
            {passed ? <CheckCircle2 size={36} /> : <Flag size={36} />}
          </div>
          <div className="result-dashboard-hero__title-wrap">
            <p className="eyebrow">
              {passed
                ? local(language, 'Assessment Passed · Prototype Complete', 'परीक्षा उत्तीर्ण · प्रोटोटाइप पूर्ण')
                : local(language, 'Assessment Result · Retest Available', 'परीक्षा परिणाम · पुनः प्रयास उपलब्ध')}
            </p>
            <h1 tabIndex={-1}>
              {passed
                ? local(language, 'Congratulations! You passed the demo test', 'बधाई हो! आपने डेमो टेस्ट पास कर लिया')
                : local(language, 'You did not pass the demo test this time', 'इस बार आप डेमो टेस्ट पास नहीं कर सके')}
            </h1>
            <p className="result-dashboard-hero__score">
              <strong>{state.exam.correctAnswers} / {paper.length}</strong> {local(language, 'correct answers', 'सही उत्तर')}
              <span className="result-dashboard-hero__score-sep">·</span>
              <span>{local(language, `Pass mark is ${LL_TEST_CONFIG.passMark} of ${paper.length}`, `पास अंक ${paper.length} में से ${LL_TEST_CONFIG.passMark} हैं`)}</span>
            </p>
          </div>
        </div>

        <div className="result-dashboard-hero__meta-strip" aria-label={local(language, 'Session summary details', 'सत्र सारांश विवरण')}>
          <div className="result-meta-chip">
            <small>{local(language, 'Attempt', 'प्रयास')}</small>
            <strong>#{state.exam.attemptNumber}</strong>
          </div>
          <div className="result-meta-chip">
            <small>{local(language, 'Paper Fingerprint', 'प्रश्नपत्र फिंगरप्रिंट')}</small>
            <strong>{fingerprint}</strong>
          </div>
          <div className="result-meta-chip">
            <small>{local(language, 'Technical Status', 'तकनीकी स्थिति')}</small>
            <strong>{state.exam.interruptionSeen ? local(language, 'Recovered safely', 'सुरक्षित वापसी') : local(language, 'Normal session', 'सामान्य सत्र')}</strong>
          </div>
          <div className="result-meta-chip">
            <small>{local(language, 'Monitoring Status', 'निगरानी स्थिति')}</small>
            <strong>{state.exam.integrityStatus === 'observation-recorded' ? local(language, 'Observation recorded', 'अवलोकन दर्ज') : local(language, 'No flags recorded', 'कोई समस्या नहीं')}</strong>
          </div>
          <div className="result-meta-chip">
            <small>{local(language, 'Recovery Receipt', 'रिकवरी रसीद')}</small>
            <strong>
              {reliabilityStatus.state === 'server-confirmed'
                ? local(language, `${reliabilityStatus.checkpointCount} server checkpoints`, `${reliabilityStatus.checkpointCount} सर्वर चेकपॉइंट`)
                : reliabilityStatus.state === 'pending'
                  ? local(language, 'Confirming safely…', 'सुरक्षित पुष्टि जारी…')
                  : local(language, 'Browser cache fallback', 'ब्राउज़र कैश बैकअप')}
            </strong>
          </div>
        </div>
      </section>

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="result-dashboard-grid">
        {/* Primary Left Column */}
        <div className="result-dashboard-grid__main">
          {/* Answer Review Callout Card */}
          <section className="result-card result-card--review-hero">
            <div className="result-card__header">
              <div className="result-card__icon-badge" aria-hidden="true">
                <BookOpenCheck size={26} />
              </div>
              <div>
                <p className="eyebrow">{local(language, 'Comprehensive Review', 'विस्तृत समीक्षा')}</p>
                <h2>{local(language, 'Review all 15 answers and explanations', 'सभी 15 उत्तरों और स्पष्टीकरणों की समीक्षा करें')}</h2>
              </div>
            </div>
            <p className="result-card__body">
              {local(
                language,
                `Examine all ${paper.length} questions, your selected choices, correct answers, and road-safety explanations with interactive filter tabs.`,
                `सभी ${paper.length} प्रश्नों, अपने चुने हुए उत्तरों, सही उत्तरों और विस्तृत सड़क सुरक्षा स्पष्टीकरणों की फ़िल्टर सहित समीक्षा करें।`
              )}
            </p>
            <div className="result-card__actions">
              <FlowLink
                className="button button--primary"
                href={`/mp/application/${applicationId}/result/review`}
                dataTour="result-open-review"
              >
                <BookOpenCheck size={18} />{' '}
                {local(language, 'Open 15-Question Answer Review', '15-प्रश्नों की उत्तर समीक्षा खोलें')}{' '}
                <ArrowRight size={18} />
              </FlowLink>
            </div>
          </section>

          {/* Next Steps / Certificate Actions */}
          {!passed ? (
            <section className="result-card result-card--retest">
              <div className="result-card__header">
                <div className="result-card__icon-badge result-card__icon-badge--amber" aria-hidden="true">
                  <RefreshCcw size={24} />
                </div>
                <div>
                  <p className="eyebrow">{local(language, 'Next Attempt', 'अगला प्रयास')}</p>
                  <h2>{local(language, 'Ready to try again?', 'क्या आप दोबारा प्रयास करने के लिए तैयार हैं?')}</h2>
                </div>
              </div>
              <p className="result-card__body">
                {local(
                  language,
                  'In this prototype simulation, you can immediately start a fresh test attempt or revisit the video tutorial to reinforce rules.',
                  'इस प्रोटोटाइप में आप तुरंत नया प्रयास शुरू कर सकते हैं या नियमों को दोहराने के लिए वीडियो ट्यूटोरियल फिर से देख सकते हैं।'
                )}
              </p>
              <div className="result-card__actions lf-actions--stack-mobile">
                <button type="button" className="button button--primary" onClick={reset}>
                  <RefreshCcw size={17} /> {local(language, 'Start a new prototype attempt', 'नया प्रोटोटाइप प्रयास शुरू करें')} <ArrowRight size={17} />
                </button>
                <FlowLink
                  className="button button--secondary"
                  href={`/mp/application/${applicationId}/tutorial`}
                >
                  <BookOpenCheck size={17} /> {local(language, 'Revisit road-safety tutorial', 'सड़क सुरक्षा ट्यूटोरियल फिर देखें')}
                </FlowLink>
              </div>
            </section>
          ) : (
            <section className="result-card result-card--licence-pass">
              <div className="result-card__header">
                <div className="result-card__icon-badge result-card__icon-badge--green" aria-hidden="true">
                  <FileCheck2 size={24} />
                </div>
                <div>
                  <p className="eyebrow">{local(language, 'Demonstration Credential', 'डेमो दस्तावेज़')}</p>
                  <h2>{local(language, 'Download your demonstration documents', 'अपने डेमो दस्तावेज़ डाउनलोड करें')}</h2>
                </div>
              </div>
              <p className="result-card__body">
                {local(
                  language,
                  'Your synthetic Learner’s Licence and Journey Receipt PDFs are ready to download. Both documents are generated securely in your browser.',
                  'आपका सिंथेटिक लर्नर लाइसेंस और जर्नी रसीद PDF डाउनलोड के लिए तैयार हैं। ये दस्तावेज़ आपके ब्राउज़र में सुरक्षित रूप से बनाए गए हैं।'
                )}
              </p>
              <div className="result-card__actions lf-actions--stack-mobile">
                <button
                  type="button"
                  className="button button--primary"
                  disabled={busy}
                  onClick={() => void downloadLicence()}
                >
                  <Download size={18} />{' '}
                  {documentStatus === 'licence'
                    ? local(language, 'Preparing LL PDF…', 'एलएल PDF तैयार हो रहा है…')
                    : local(language, 'Download Demo Learner’s Licence (PDF)', 'डेमो लर्नर लाइसेंस डाउनलोड करें (PDF)')}
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  disabled={busy}
                  onClick={() => void downloadReceipt()}
                >
                  <ClipboardCheck size={18} />{' '}
                  {documentStatus === 'receipt'
                    ? local(language, 'Preparing receipt…', 'रसीद तैयार हो रही है…')
                    : local(language, 'Download Journey Receipt (PDF)', 'जर्नी रसीद डाउनलोड करें (PDF)')}
                </button>
              </div>
              <details className="result-licence-preview-accordion">
                <summary>{local(language, 'View demonstration Form 3 card preview', 'डेमो फॉर्म ३ कार्ड पूर्वावलोकन देखें')}</summary>
                <div className="demo-licence demo-licence--compact" aria-label={local(language, "Demonstration Learner's Licence, not valid", 'डेमो लर्नर लाइसेंस, मान्य नहीं')}>
                  <div className="demo-licence__watermark">{local(language, 'DEMO · NOT VALID', 'डेमो · मान्य नहीं')}</div>
                  <header className="demo-licence__header">
                    <div className="demo-licence__brand">
                      <img
                        src="/assets/licenceflow-brand-logo.png"
                        alt="LicenceFlow"
                        className="demo-licence__logo"
                      />
                      <div>
                        <p className="demo-licence__state">{local(language, 'LicenceFlow prototype · Madhya Pradesh demo journey', 'LicenceFlow प्रोटोटाइप · मध्य प्रदेश डेमो यात्रा')}</p>
                        <h3 className="demo-licence__form-title">{local(language, "DEMONSTRATION LEARNER'S LICENCE · NOT VALID", 'डेमो लर्नर लाइसेंस · मान्य नहीं')}</h3>
                      </div>
                    </div>
                    <div className="demo-licence__ll-number">
                      <small>{local(language, 'Demo licence number', 'डेमो लाइसेंस संख्या')}</small>
                      <strong>{demonstrationLicenceNumber(applicationId)}</strong>
                    </div>
                  </header>

                  <div className="demo-licence__body">
                    <div className="demo-licence__photo-col">
                      <div className="demo-licence__photo-wrap">
                        <img
                          src="/assets/demo-applicant-photo.jpg"
                          alt={licenceData.holderName}
                          width={819}
                          height={1024}
                          className="demo-licence__photo-img"
                        />
                        <span>{local(language, 'DIGITAL PHOTO', 'डिजिटल फोटो')}</span>
                      </div>
                      <div className="demo-licence__qr-wrap">
                        <svg className="demo-licence__qr-svg" viewBox="0 0 100 100" role="img" aria-label={local(language, 'Decorative demo verification pattern; not scannable', 'सजावटी डेमो सत्यापन पैटर्न; स्कैन योग्य नहीं')}>
                          <rect width="100" height="100" fill="white" rx="4" />
                          <rect x="8" y="8" width="26" height="26" fill="#071a34" rx="2" />
                          <rect x="12" y="12" width="18" height="18" fill="white" rx="1" />
                          <rect x="16" y="16" width="10" height="10" fill="#1d4ed8" rx="1" />
                          <rect x="66" y="8" width="26" height="26" fill="#071a34" rx="2" />
                          <rect x="70" y="12" width="18" height="18" fill="white" rx="1" />
                          <rect x="74" y="16" width="10" height="10" fill="#1d4ed8" rx="1" />
                          <rect x="8" y="66" width="26" height="26" fill="#071a34" rx="2" />
                          <rect x="12" y="70" width="18" height="18" fill="white" rx="1" />
                          <rect x="16" y="74" width="10" height="10" fill="#1d4ed8" rx="1" />
                          <rect x="40" y="12" width="6" height="6" fill="#071a34" rx="1" />
                          <rect x="50" y="12" width="8" height="6" fill="#1d4ed8" rx="1" />
                          <rect x="40" y="24" width="8" height="8" fill="#071a34" rx="1" />
                          <rect x="52" y="22" width="6" height="8" fill="#1d4ed8" rx="1" />
                          <rect x="12" y="42" width="8" height="6" fill="#1d4ed8" rx="1" />
                          <rect x="24" y="42" width="6" height="8" fill="#071a34" rx="1" />
                          <rect x="42" y="42" width="16" height="16" fill="#071a34" rx="3" />
                          <circle cx="50" cy="50" r="5" fill="#2563eb" />
                          <rect x="66" y="42" width="8" height="6" fill="#1d4ed8" rx="1" />
                          <rect x="78" y="42" width="12" height="8" fill="#071a34" rx="1" />
                          <rect x="40" y="66" width="8" height="8" fill="#071a34" rx="1" />
                          <rect x="52" y="68" width="8" height="6" fill="#1d4ed8" rx="1" />
                          <rect x="66" y="66" width="8" height="10" fill="#071a34" rx="1" />
                          <rect x="78" y="66" width="12" height="6" fill="#1d4ed8" rx="1" />
                          <rect x="40" y="80" width="10" height="8" fill="#1d4ed8" rx="1" />
                          <rect x="54" y="80" width="6" height="8" fill="#071a34" rx="1" />
                          <rect x="66" y="82" width="14" height="6" fill="#071a34" rx="1" />
                          <rect x="84" y="80" width="6" height="8" fill="#1d4ed8" rx="1" />
                        </svg>
                        <small>{local(language, 'Decorative demo pattern · not scannable', 'सजावटी डेमो पैटर्न · स्कैन योग्य नहीं')}</small>
                      </div>
                    </div>

                    <div className="demo-licence__info-col">
                      <dl className="demo-licence__grid">
                        <div>
                          <dt>{local(language, 'Licence Holder Name', 'अनुज्ञप्ति धारक का नाम')}</dt>
                          <dd><strong>{licenceData.holderName}</strong></dd>
                        </div>
                        <div>
                          <dt>{local(language, 'Application Number', 'आवेदन संख्या')}</dt>
                          <dd>{applicationId}</dd>
                        </div>
                        <div>
                          <dt>{local(language, 'Date of Birth / Age', 'जन्म तिथि / आयु')}</dt>
                          <dd>{licenceData.dateOfBirth ? `${licenceData.dateOfBirth}${holderAge === null ? '' : ` (${holderAge} yrs)`}` : local(language, 'Synthetic date not supplied', 'सिंथेटिक जन्मतिथि उपलब्ध नहीं')}</dd>
                        </div>
                        <div>
                          <dt>{local(language, 'Issue Date', 'जारी दिनांक')}</dt>
                          <dd>{new Date(licenceData.completedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
                        </div>
                        <div className="demo-licence__grid-full">
                          <dt>{local(language, 'Authorized Vehicle Classes', 'अधिकृत वाहन श्रेणियाँ')}</dt>
                          <dd>
                            <div className="demo-licence__classes">
                              {(licenceData.vehicleClasses.length ? licenceData.vehicleClasses : ['MCWG', 'LMV']).map((cov) => (
                                <span key={cov} className="demo-licence__class-pill">
                                  <strong>{cov}</strong>
                                  <small>{cov === 'MCWOG' ? 'Motorcycle Without Gear' : cov === 'MCWG' ? 'Motorcycle With Gear' : cov === 'LMV' ? 'Light Motor Vehicle (Car)' : cov}</small>
                                </span>
                              ))}
                            </div>
                          </dd>
                        </div>
                      </dl>

                      <div className="demo-licence__auth-row">
                        <div className="demo-licence__signature-box">
                          <small>{local(language, 'Holder Signature', 'धारक के हस्ताक्षर')}</small>
                          <img
                            src="/assets/demo-applicant-signature.jpg"
                            alt={local(language, 'Synthetic holder signature', 'सिंथेटिक धारक हस्ताक्षर')}
                            width={1024}
                            height={768}
                            className="demo-licence__signature-img"
                          />
                        </div>
                        <div className="demo-licence__seal-box">
                          <small>{local(language, 'Prototype seal', 'प्रोटोटाइप मुहर')}</small>
                          <span className="demo-licence__seal-badge">
                            <ShieldCheck size={16} /> DEMO · NOT VALID
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <footer className="demo-licence__footer">
                    <p>{local(language, 'Synthetic Demonstration Document · All citizen profiles, photos, signatures and credentials are AI-generated demo samples for prototype evaluation. Any resemblance to real persons, living or dead, is purely coincidental.', 'सिंथेटिक डेमो दस्तावेज़ · सभी प्रोफ़ाइल, फ़ोटो, हस्ताक्षर और क्रेडेंशियल प्रोटोटाइप मूल्यांकन हेतु AI जनरेटेड हैं। किसी वास्तविक व्यक्ति से समानता मात्र संयोग है।')}</p>
                  </footer>
                </div>
              </details>
            </section>
          )}
        </div>

        {/* Sidebar Column: Session Integrity & Event Audit */}
        <aside className="result-dashboard-grid__sidebar">
          <section className="result-card result-card--audit-summary">
            <div className="result-card__header">
              <div className="result-card__icon-badge result-card__icon-badge--blue" aria-hidden="true">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="eyebrow">{local(language, 'Technical Audit', 'तकनीकी ऑडिट')}</p>
                <h2>{local(language, 'Session Integrity Log', 'सत्र अखंडता विवरण')}</h2>
              </div>
            </div>

            <div className="result-audit-stats-grid">
              <div className="result-audit-stat">
                <small>{local(language, 'Questions', 'कुल प्रश्न')}</small>
                <strong>{paper.length} {local(language, 'total', 'कुल')}</strong>
              </div>
              <div className="result-audit-stat">
                <small>{local(language, 'Pass Threshold', 'पासिंग सीमा')}</small>
                <strong>{LL_TEST_CONFIG.passMark} {local(language, 'correct', 'सही')}</strong>
              </div>
              <div className="result-audit-stat">
                <small>{local(language, 'Checkpoints', 'चेकपॉइंट्स')}</small>
                <strong>15 / 15 {local(language, 'saved', 'सुरक्षित')}</strong>
              </div>
              <div className="result-audit-stat">
                <small>{local(language, 'Camera Stream', 'कैमरा स्ट्रीम')}</small>
                <strong>{local(language, 'Released after test', 'परीक्षा के बाद बंद')}</strong>
              </div>
            </div>

            {/* Compact Scrollable Journey Timeline */}
            <div className="result-events-container">
              <div className="result-events-container__header">
                <strong>{local(language, 'Journey Timeline', 'यात्रा समयरेखा')}</strong>
                <span className="result-events-badge">{state.events.length} {local(language, 'events', 'घटनाएँ')}</span>
              </div>
              <ol className="result-events-list">
                {state.events.map((event) => {
                  const translated = eventText(event, language)
                  return (
                    <li key={event.id} className="result-event-item">
                      <span className="result-event-item__dot" aria-hidden="true">
                        <Check size={11} strokeWidth={2.5} />
                      </span>
                      <div className="result-event-item__content">
                        <div className="result-event-item__top">
                          <strong>{translated.title}</strong>
                          <time>{eventTime(event.at, language)}</time>
                        </div>
                        <p>{translated.detail}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {!eligible && (
              <div className="result-audit-receipt-action">
                <button
                  type="button"
                  className="button button--secondary button--full"
                  disabled={busy}
                  onClick={() => void downloadReceipt()}
                >
                  <ClipboardCheck size={16} />{' '}
                  {documentStatus === 'receipt'
                    ? local(language, 'Preparing receipt…', 'रसीद तैयार हो रही है…')
                    : local(language, 'Download Journey Receipt (PDF)', 'जर्नी रसीद डाउनलोड करें (PDF)')}
                </button>
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* Device Data Clear Confirmation Modal */}
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

      {/* Compact Utility Actions Bar */}
      <div className="result-utility-bar">
        <div className="result-utility-bar__left">
          <button type="button" className="button button--secondary button--compact" onClick={() => window.print()}>
            <Printer size={16} /> {local(language, 'Print Result', 'परिणाम प्रिंट करें')}
          </button>
          {passed && (
            <button type="button" className="button button--secondary button--compact" onClick={reset}>
              <RotateCcw size={16} /> {local(language, 'Try Demo Again', 'डेमो दोबारा दें')}
            </button>
          )}
        </div>
        <div className="result-utility-bar__right">
          <button type="button" className="result-utility-link result-utility-link--danger" onClick={() => setConfirmClear(true)} data-tour="reset-demo">
            <Eraser size={15} aria-hidden="true" /> {local(language, 'Reset demo data', 'डेमो डेटा रीसेट करें')}
          </button>
          <FlowLink className="result-utility-link" href={`/mp/application/${applicationId}`}>
            <ArrowLeft size={15} aria-hidden="true" /> {local(language, 'Application status', 'आवेदन स्थिति')}
          </FlowLink>
        </div>
      </div>
    </div>
  )
}

export function ResultReviewPage({
  applicationId,
  onStageChange,
  language,
}: {
  applicationId: string
  onStageChange: StageChange
  language: Language
}) {
  const progress = loadJourneyProgress(applicationId)
  const [state, setState] = useState(() => loadExamSession(applicationId, progress))
  const [activeFilter, setActiveFilter] = useState<'all' | 'incorrect' | 'unanswered' | 'correct'>('all')
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null)

  useEffect(() => {
    stopAllMediaTracks()
  }, [])

  if (state.stage !== 'result') {
    return (
      <Guard
        applicationId={applicationId}
        language={language}
        title={local(language, 'Result review not available yet', 'परिणाम समीक्षा अभी उपलब्ध नहीं')}
        body={local(language, 'Complete the saved test before opening answer explanations.', 'उत्तर स्पष्टीकरण देखने से पहले सहेजी गई परीक्षा पूरी करें।')}
        route={routeForSession(applicationId, state)}
        action={local(language, 'Continue saved session', 'सहेजा सत्र जारी रखें')}
      />
    )
  }

  const paper = resolveQuestionPaper(state.exam.paperQuestionIds)
  const correctMap: Record<number, number> = {}
  paper.forEach((q, i) => {
    correctMap[i] = q.correct
  })

  const reset = () => {
    const next = resetExamSession(applicationId, progress)
    setState(next)
    onStageChange(local(language, 'LL test entry', 'एलएल परीक्षा प्रवेश'))
    navigatePortal(`/mp/application/${applicationId}/test-entry`)
  }

  const allItems = paper.map((question, index) => {
    const chosenAnswer = state.exam.answers[index] ?? -1
    const isUnanswered = chosenAnswer === -1
    const isCorrect = chosenAnswer === question.correct
    const status: 'correct' | 'incorrect' | 'unanswered' = isCorrect
      ? 'correct'
      : isUnanswered
      ? 'unanswered'
      : 'incorrect'
    return {
      question,
      index,
      chosenAnswer,
      status,
    }
  })

  const correctCount = allItems.filter((item) => item.status === 'correct').length
  const incorrectCount = allItems.filter((item) => item.status === 'incorrect').length
  const unansweredCount = allItems.filter((item) => item.status === 'unanswered').length

  const filteredItems = allItems.filter((item) => {
    if (selectedQuestionIndex !== null) {
      return item.index === selectedQuestionIndex
    }
    if (activeFilter === 'correct') return item.status === 'correct'
    if (activeFilter === 'incorrect') return item.status === 'incorrect'
    if (activeFilter === 'unanswered') return item.status === 'unanswered'
    return true
  })

  const handleSelectFromMap = (index: number) => {
    setSelectedQuestionIndex(index)
    const el = document.getElementById(`review-question-${index}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
    }
  }

  return (
    <>
      <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'पथ')}>
        <ol>
          <li>
            <FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink>
          </li>
          <li>
            <FlowLink href={`/mp/application/${applicationId}`}>
              {local(language, 'Application status', 'आवेदन स्थिति')}
            </FlowLink>
          </li>
          <li>
            <FlowLink href={`/mp/application/${applicationId}/result`}>
              {local(language, 'Test result', 'परीक्षा परिणाम')}
            </FlowLink>
          </li>
          <li>
            <span aria-current="page">{local(language, 'Answer review', 'उत्तर समीक्षा')}</span>
          </li>
        </ol>
      </nav>

      <section className="page-title" data-tour="result-review-overview">
        <div>
          <p className="eyebrow">
            {local(language, 'Comprehensive assessment review', 'विस्तृत परीक्षा समीक्षा')}
          </p>
          <h1 tabIndex={-1}>
            {local(language, 'Review all 15 answers and explanations', 'सभी 15 उत्तरों और स्पष्टीकरणों की समीक्षा करें')}
          </h1>
          <p>
            {local(
              language,
              `${correctCount} of ${paper.length} correct. Select any question to view the correct answer and its road-safety explanation.`,
              `${paper.length} में से ${correctCount} सही। आधिकारिक नियम, सही उत्तर और विस्तृत स्पष्टीकरण देखने के लिए कोई भी प्रश्न चुनें।`
            )}
          </p>
        </div>
      </section>

      <section
        className="review-status-map-section"
        aria-label={local(language, 'Question correctness grid', 'प्रश्न परिणाम ग्रिड')}
      >
        <div className="review-status-map-header">
          <h2>{local(language, 'Question Overview Grid', 'प्रश्न स्थिति अवलोकन')}</h2>
          <div className="review-map-legend">
            <span className="review-map-legend__item">
              <span className="focused-status-cell focused-status-cell--correct">
                <Check size={12} aria-hidden="true" />
              </span>
              <span>{local(language, `Correct (${correctCount})`, `सही (${correctCount})`)}</span>
            </span>
            <span className="review-map-legend__item">
              <span className="focused-status-cell focused-status-cell--incorrect">
                <X size={12} aria-hidden="true" />
              </span>
              <span>{local(language, `Incorrect (${incorrectCount})`, `गलत (${incorrectCount})`)}</span>
            </span>
            <span className="review-map-legend__item">
              <span className="focused-status-cell focused-status-cell--unanswered">
                <Slash size={10} aria-hidden="true" />
              </span>
              <span>{local(language, `Unanswered (${unansweredCount})`, `अनुत्तरित (${unansweredCount})`)}</span>
            </span>
          </div>
        </div>
        <QuestionStatusMap
          total={paper.length}
          mode="review"
          answers={state.exam.answers}
          correctAnswers={correctMap}
          activeIndex={selectedQuestionIndex}
          onSelectQuestion={handleSelectFromMap}
          language={language}
        />
      </section>

      <div className="review-filter-tabs" role="tablist" aria-label={local(language, 'Filter review questions', 'समीक्षा प्रश्न फ़िल्टर')}>
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'all' && selectedQuestionIndex === null}
          className={`review-filter-tab ${
            activeFilter === 'all' && selectedQuestionIndex === null ? 'review-filter-tab--active' : ''
          }`}
          onClick={() => {
            setActiveFilter('all')
            setSelectedQuestionIndex(null)
          }}
        >
          {local(language, `All Questions (${paper.length})`, `सभी प्रश्न (${paper.length})`)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'incorrect' && selectedQuestionIndex === null}
          className={`review-filter-tab review-filter-tab--incorrect ${
            activeFilter === 'incorrect' && selectedQuestionIndex === null ? 'review-filter-tab--active' : ''
          }`}
          onClick={() => {
            setActiveFilter('incorrect')
            setSelectedQuestionIndex(null)
          }}
        >
          {local(language, `Incorrect (${incorrectCount})`, `गलत (${incorrectCount})`)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'unanswered' && selectedQuestionIndex === null}
          className={`review-filter-tab review-filter-tab--unanswered ${
            activeFilter === 'unanswered' && selectedQuestionIndex === null ? 'review-filter-tab--active' : ''
          }`}
          onClick={() => {
            setActiveFilter('unanswered')
            setSelectedQuestionIndex(null)
          }}
        >
          {local(language, `Unanswered (${unansweredCount})`, `अनुत्तरित (${unansweredCount})`)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === 'correct' && selectedQuestionIndex === null}
          className={`review-filter-tab review-filter-tab--correct ${
            activeFilter === 'correct' && selectedQuestionIndex === null ? 'review-filter-tab--active' : ''
          }`}
          onClick={() => {
            setActiveFilter('correct')
            setSelectedQuestionIndex(null)
          }}
        >
          {local(language, `Correct (${correctCount})`, `सही (${correctCount})`)}
        </button>
        {selectedQuestionIndex !== null && (
          <button
            type="button"
            className="review-filter-tab review-filter-tab--clear"
            onClick={() => setSelectedQuestionIndex(null)}
          >
            {local(language, 'Clear focus', 'फ़िल्टर हटाएं')}
          </button>
        )}
      </div>

      <div className="review-questions-list">
        {filteredItems.map(({ question, index, chosenAnswer, status }) => {
          const options = questionOptions(question, language)
          const prompt = questionPrompt(question, language)
          const explanation = questionExplanation(question, language)

          return (
            <article
              key={question.id}
              id={`review-question-${index}`}
              className={`review-question-card review-question-card--${status}`}
              tabIndex={-1}
            >
              <header className="review-question-card__header">
                <div className="review-question-card__tags">
                  <span className="review-question-card__num">
                    {local(language, `Question ${index + 1} of ${paper.length}`, `प्रश्न ${index + 1} / ${paper.length}`)}
                  </span>
                  <span
                    className={`review-status-badge review-status-badge--${status}`}
                  >
                    {status === 'correct' ? (
                      <>
                        <Check size={14} aria-hidden="true" />
                        {local(language, 'Correct', 'सही')}
                      </>
                    ) : status === 'incorrect' ? (
                      <>
                        <X size={14} aria-hidden="true" />
                        {local(language, 'Incorrect', 'गलत')}
                      </>
                    ) : (
                      <>
                        <Slash size={12} aria-hidden="true" />
                        {local(language, 'Unanswered', 'अनुत्तरित')}
                      </>
                    )}
                  </span>
                </div>
                <h2>{prompt}</h2>
              </header>

              <div className="review-question-card__answers">
                <div
                  className={`review-answer-box ${
                    status === 'correct'
                      ? 'review-answer-box--correct'
                      : status === 'unanswered'
                      ? 'review-answer-box--unanswered'
                      : 'review-answer-box--incorrect'
                  }`}
                >
                  <small>{local(language, 'Your Answer', 'आपका उत्तर')}</small>
                  <strong>
                    {chosenAnswer < 0
                      ? local(
                          language,
                          'Not answered before time expired',
                          'समय समाप्त होने से पहले उत्तर नहीं दिया'
                        )
                      : options[chosenAnswer]}
                  </strong>
                </div>

                {status !== 'correct' && (
                  <div className="review-answer-box review-answer-box--correct">
                    <small>{local(language, 'Correct Answer', 'सही उत्तर')}</small>
                    <strong>{options[question.correct]}</strong>
                  </div>
                )}
              </div>

              <div className="review-explanation-box">
                <strong>{local(language, 'Official Rule & Explanation:', 'आधिकारिक नियम और स्पष्टीकरण:')}</strong>
                <p>{explanation}</p>
              </div>
            </article>
          )
        })}
      </div>

      <div className="lf-actions lf-actions--stack-mobile">
        <FlowLink
          className="button button--primary"
          href={`/mp/application/${applicationId}/result`}
          dataTour="result-review-back"
        >
          <ArrowLeft size={18} /> {local(language, 'Return to test result', 'परीक्षा परिणाम पर लौटें')}
        </FlowLink>
        <FlowLink
          className="button button--secondary"
          href={`/mp/application/${applicationId}/tutorial`}
        >
          <BookOpenCheck size={18} /> {local(language, 'Revisit road-safety tutorial', 'सड़क सुरक्षा ट्यूटोरियल फिर देखें')}
        </FlowLink>
        {state.exam.knowledgeResult !== 'passed' && (
          <button type="button" className="button button--secondary" onClick={reset}>
            <RefreshCcw size={18} /> {local(language, 'Start a new prototype attempt', 'नया प्रोटोटाइप प्रयास शुरू करें')}
          </button>
        )}
      </div>
    </>
  )
}

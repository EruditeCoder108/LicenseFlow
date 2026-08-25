import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpenCheck, Camera, Check, CheckCircle2, CircleHelp, Clock3,
  ClipboardCheck, Download, Eraser, FastForward, FileCheck2, FileText, Flag, Info, LockKeyhole, Network, Printer,
  RefreshCcw, RotateCcw, ShieldCheck, Signal, TriangleAlert, UserRound, Volume2, VolumeX, WifiOff,
} from 'lucide-react'
import type { Question } from '../content/questions'
import { paperFingerprint, resolveQuestionPaper } from '../content/questionPaper'
import { LL_TEST_CONFIG, OFFICIAL_QUESTION_BANK, ROAD_SAFETY_VIDEO } from '../content/testConfig'
import { journeyReducer, type InterruptionKind, type JourneyEvent, type JourneyState } from '../domain/journey'
import { useDeviceReadiness } from '../hooks/useDeviceReadiness'
import { clearLicenceFlowDeviceData } from './devicePrivacy'
import { loadApplicationDraft } from './application'
import { ageOnDate, createDemonstrationLicencePdf, createJourneyReceiptPdf, demonstrationLicenceNumber, downloadPdf, isDemonstrationLicenceEligible, type DemonstrationLicenceData, type JourneyReceiptData } from './downloadDocuments'
import { createPassingJudgeExamSession, loadExamSession, resetExamSession, saveExamSession } from './examSession'
import { isPaymentConfirmed } from './payment'
import { completeTutorial, loadJourneyProgress, saveJourneyProgress, startTutorial, updateTutorialWatch } from './progress'
import { navigatePortal } from './router'
import { loadYouTubeIframeApi, type YouTubePlayer, type YouTubePlayerStateEvent } from './youtubeIframeApi'

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
      <section className="page-title">
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
              <button type="button" className="button button--secondary" onClick={skipTutorialForJudgeDemo} disabled={completed}>
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

function JudgePassShortcut({ language, onActivate, compact = false }: { language: Language; onActivate: () => void; compact?: boolean }) {
  return (
    <aside className={`judge-result-shortcut${compact ? ' judge-result-shortcut--compact' : ''}`} aria-label={local(language, 'Judge result preview control', 'जज परिणाम पूर्वावलोकन नियंत्रण')}>
      <span className="judge-result-shortcut__icon"><ClipboardCheck size={20} aria-hidden="true" /></span>
      <div>
        <strong>{local(language, 'Judge review controls', 'जज समीक्षा नियंत्रण')}</strong>
        <p>{local(language, 'Generate a passing prototype attempt through the normal scoring flow and open the result, receipt and demo licence.', 'सामान्य स्कोरिंग प्रवाह से पासिंग प्रोटोटाइप प्रयास बनाएँ और परिणाम, रसीद तथा डेमो लाइसेंस खोलें।')}</p>
      </div>
      <button type="button" className="button button--secondary" onClick={onActivate}>
        <FastForward size={17} aria-hidden="true" /> {local(language, 'Preview passing result', 'पास परिणाम देखें')}
      </button>
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
  }, [guided, media])

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
  const previewPassingResult = () => {
    const next = createPassingJudgeExamSession(applicationId, progress)
    setSession(next)
    onStageChange(local(language, 'Passing result preview · judge shortcut', 'पास परिणाम पूर्वावलोकन · जज शॉर्टकट'))
    navigatePortal(`/mp/application/${applicationId}/result`)
  }
  return (
    <>
      <Breadcrumbs applicationId={applicationId} current={local(language, 'Online test instructions', 'ऑनलाइन टेस्ट निर्देश')} language={language} />
      <section className="page-title">
        <div>
          <p className="eyebrow">{local(language, 'Demo test', 'डेमो टेस्ट')}</p>
          <h1 tabIndex={-1}>{local(language, 'Instructions for the online test', 'ऑनलाइन टेस्ट के नियम और निर्देश')}</h1>
          <p>{local(language, 'This prototype uses a configurable 15-question knowledge test. Exact official rules remain state-controlled.', 'यह प्रोटोटाइप 15 प्रश्नों की कॉन्फ़िगर की जा सकने वाली ज्ञान परीक्षा उपयोग करता है। सटीक आधिकारिक नियम राज्य के नियंत्रण में रहते हैं।')}</p>
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
          <button className="button button--primary" disabled={!accepted || (!guided && !preTestReady)} onClick={start}>
            {local(language, `Start ${LL_TEST_CONFIG.questionCount}-question test`, `${LL_TEST_CONFIG.questionCount} प्रश्नों का टेस्ट शुरू करें`)} <ArrowRight size={18} />
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
    const next = journeyReducer(state, { type: 'ANSWER', answer, correct: answer === question.correct, isLast: state.exam.currentQuestion === paper.length - 1, passThreshold: LL_TEST_CONFIG.passMark, triggerDemoInterruption: state.exam.currentQuestion === LL_TEST_CONFIG.interruptionAfterQuestion - 1 })
    saveExamSession(applicationId, next); setState(next); setSelected(null)
    if (next.stage === 'interruption') navigatePortal(`/mp/application/${applicationId}/test-interruption`)
    if (next.stage === 'result') { onStageChange(local(language, 'View result and receipt', 'परिणाम और रसीद देखें')); navigatePortal(`/mp/application/${applicationId}/result`) }
  }

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
  }, [guided, media])
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
  useEffect(() => () => window.speechSynthesis?.cancel(), [])
  if (state.stage !== 'exam' || !question) return <Guard applicationId={applicationId} language={language} title={local(language, 'Open the saved test stage', 'सहेजा परीक्षा चरण खोलें')} body={local(language, 'This route follows the persisted exam state.', 'यह पेज सहेजी हुई परीक्षा स्थिति का अनुसरण करता है।')} route={routeForSession(applicationId, state)} action={local(language, 'Continue saved session', 'सहेजा सत्र जारी रखें')} />

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
  const saveAnswer = () => { if (selected !== null) submitAnswer(selected) }
  const previewPassingResult = () => {
    const next = createPassingJudgeExamSession(applicationId, progress)
    setState(next)
    onStageChange(local(language, 'Passing result preview · judge shortcut', 'पास परिणाम पूर्वावलोकन · जज शॉर्टकट'))
    navigatePortal(`/mp/application/${applicationId}/result`)
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
              <p className="eyebrow">{local(language, `Question ${state.exam.currentQuestion + 1} of ${paper.length}`, `प्रश्न ${state.exam.currentQuestion + 1} / ${paper.length}`)}</p>
              <h1 tabIndex={-1}>{questionPrompt(question, language)}</h1>
              <button className="question-speech-button" type="button" onClick={toggleQuestionSpeech} disabled={!speechAvailable} aria-pressed={speaking}>
                {speaking ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
                {speaking ? local(language, 'Stop reading', 'पढ़ना बंद करें') : local(language, 'Read question aloud', 'प्रश्न सुनें')}
              </button>
            </div>
            <div className="test-question-timing"><span className={secondsLeft <= 10 ? 'test-timer test-timer--urgent' : 'test-timer'}><Clock3 size={16} />{secondsLeft}s</span><span>{local(language, `${savedCount} saved`, `${savedCount} सहेजे`)}</span></div>
          </div>
          <fieldset className="test-answer-fieldset">
            <legend className="visually-hidden">{local(language, 'Choose one answer', 'एक उत्तर चुनें')}</legend>
            {answers.map((option, index) => (
              <label className={`${selected === index ? 'selected' : ''} ${!mediaReady ? 'disabled' : ''}`} key={option}>
                <input type="radio" name="test-answer" disabled={!mediaReady} checked={selected === index} onChange={() => setSelected(index)} />
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
            {state.exam.currentQuestion === paper.length - 1 ? local(language, 'Save answer and finish', 'उत्तर सहेजें और पूरा करें') : local(language, 'Save answer and continue', 'उत्तर सहेजें और आगे बढ़ें')} <ArrowRight size={18} />
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
          <JudgePassShortcut language={language} onActivate={previewPassingResult} compact />
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
  const paper = resolveQuestionPaper(state.exam.paperQuestionIds)
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
        <div className="interruption-card__checkpoint-hero">
          <div className="interruption-card__checkpoint-img-wrap">
            <img
              src="/assets/recovery-checkpoint.png"
              alt="Safe Recovery Checkpoint"
              className="interruption-card__checkpoint-img"
            />
          </div>
          <div className="interruption-card__header-text">
            <span className="interruption-card__icon">{integrity ? <Camera size={26} /> : <WifiOff size={26} />}</span>
            <p className="eyebrow">{integrity ? local(language, 'Camera observation · Not a penalty', 'कैमरा संकेत · कोई पेनल्टी नहीं') : local(language, 'Technical checkpoint · Answers preserved', 'तकनीकी चेकपॉइंट · उत्तर सुरक्षित')}</p>
            <h1 tabIndex={-1}>{integrity ? local(language, 'Multiple faces detected · Session paused safely', 'एक से अधिक चेहरे दिखे · सत्र सुरक्षित रूप से रुका') : local(language, 'The test paused safely without losing progress', 'आपकी प्रगति सुरक्षित रखकर परीक्षा रोकी गई')}</h1>
          </div>
        </div>
        <p className="interruption-card__detail">{translatedInterruptionDetail(state.exam.interruptionDetail ?? '', language)}</p>
        <div className="recovery-facts">
          <div><span>{local(language, 'Latest answer', 'पिछला उत्तर')}</span><strong>{local(language, 'Saved in storage', 'मेमोरी में सुरक्षित')}</strong></div>
          <div><span>{local(language, 'Payment', 'भुगतान')}</span><strong>{local(language, '₹250 Confirmed', '₹२५० पुष्ट')}</strong></div>
          <div><span>{local(language, 'Test progress', 'प्रगति')}</span><strong>{local(language, '0 Answers lost', 'कोई उत्तर नष्ट नहीं')}</strong></div>
          <div><span>{local(language, 'Resume checkpoint', 'यहाँ से जारी करें')}</span><strong>{local(language, `Question ${state.exam.currentQuestion + 1} of ${paper.length}`, `प्रश्न ${state.exam.currentQuestion + 1} / ${paper.length}`)}</strong></div>
        </div>
        <div className="interruption-card__principles">
          <ShieldCheck size={19} />
          <div>
            <strong>{local(language, 'Fair Examination Assurance', 'निष्पक्ष परीक्षा का भरोसा')}</strong>
            <p>{local(language, 'LicenceFlow treats network dips and temporary camera obstructions as technical pauses, not failures. Return to single-person framing and resume when ready.', 'लाइसेंसफ्लो नेटवर्क रुकावटों को विफलता नहीं मानता। कैमरे के सामने अकेले आएं और तैयार होने पर जारी रखें।')}</p>
          </div>
        </div>
        <div className="lf-actions">
          <button className="button button--primary" onClick={resume}>
            {local(language, 'Resume test now', 'अभी टेस्ट जारी रखें')} <RefreshCcw size={18} />
          </button>
          <FlowLink className="button button--secondary" href={`/mp/application/${applicationId}`}>
            <ArrowLeft size={18} /> {local(language, 'Application status', 'आवेदन स्थिति')}
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
  const reviewItems = paper.map((question, index) => ({ question, index, answer: state.exam.answers[index] ?? -1 })).filter(({ question, answer }) => answer !== question.correct)
  return (
    <>
      <Breadcrumbs applicationId={applicationId} current={local(language, 'Test result', 'परीक्षा परिणाम')} language={language} />
      <section className={`result-hero ${passed ? 'result-hero--passed' : ''}`}>
        <span>{passed ? <CheckCircle2 size={34} /> : <Flag size={34} />}</span>
        <div>
          <p className="eyebrow">{passed ? local(language, 'Application complete', 'आवेदन पूरा हुआ') : local(language, 'Demo test result', 'डेमो टेस्ट परिणाम')}</p>
          <h1 tabIndex={-1}>{passed ? local(language, 'Congratulations! You passed the demo test', 'बधाई हो! आपने डेमो टेस्ट पास कर लिया') : local(language, 'You did not pass the demo test this time', 'इस बार आप डेमो टेस्ट पास नहीं कर सके')}</h1>
          <p>{local(language, `${state.exam.correctAnswers} of ${paper.length} answers correct · prototype pass mark is ${LL_TEST_CONFIG.passMark}.`, `${paper.length} में से ${state.exam.correctAnswers} उत्तर सही · प्रोटोटाइप पास अंक ${LL_TEST_CONFIG.passMark} हैं।`)}</p>
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
      <aside className="paper-audit-strip" aria-label={local(language, 'Assessment paper audit details', 'परीक्षा प्रश्नपत्र ऑडिट विवरण')}>
        <ClipboardCheck size={20} aria-hidden="true" />
        <div><small>{local(language, 'Attempt', 'प्रयास')}</small><strong>#{state.exam.attemptNumber}</strong></div>
        <div><small>{local(language, 'Paper fingerprint', 'प्रश्नपत्र फिंगरप्रिंट')}</small><strong>{fingerprint}</strong></div>
        <div><small>{local(language, 'Difficulty blueprint', 'कठिनाई संरचना')}</small><strong>{local(language, '6 easy · 7 medium · 2 applied', '६ आसान · ७ मध्यम · २ अनुप्रयोग')}</strong></div>
      </aside>
      <section className="answer-review" id="answer-review" aria-labelledby="answer-review-title">
        <div className="section-heading">
          <div><p className="eyebrow">{local(language, 'Learning review', 'सीखने की समीक्षा')}</p><h2 id="answer-review-title">{reviewItems.length ? local(language, 'Review answers that need attention', 'जिन उत्तरों पर ध्यान देना है उनकी समीक्षा करें') : local(language, 'Every answer was correct', 'हर उत्तर सही था')}</h2></div>
          <BookOpenCheck size={24} />
        </div>
        {reviewItems.length ? <div className="answer-review__list">{reviewItems.map(({ question, index, answer }) => {
          const options = questionOptions(question, language)
          return <details key={question.id} open={!passed && index === reviewItems[0]?.index}>
            <summary><span>{local(language, `Question ${index + 1}`, `प्रश्न ${index + 1}`)}</span><strong>{questionPrompt(question, language)}</strong></summary>
            <div>
              <p><b>{local(language, 'Your answer:', 'आपका उत्तर:')}</b> {answer < 0 ? local(language, 'Not answered before time expired', 'समय समाप्त होने से पहले उत्तर नहीं दिया') : options[answer]}</p>
              <p><b>{local(language, 'Correct answer:', 'सही उत्तर:')}</b> {options[question.correct]}</p>
              <p>{questionExplanation(question, language)}</p>
            </div>
          </details>
        })}</div> : <p>{local(language, 'No corrections are needed. You may still revisit the learning material at any time.', 'किसी सुधार की जरूरत नहीं है। आप फिर भी कभी भी सीखने की सामग्री दोबारा देख सकते हैं।')}</p>}
      </section>
      {!passed && <section className="retest-guidance"><RefreshCcw size={24} /><div><p className="eyebrow">{local(language, 'Next attempt', 'अगला प्रयास')}</p><h2>{local(language, 'Review first, then try again', 'पहले समीक्षा करें, फिर दोबारा प्रयास करें')}</h2><p>{local(language, 'This prototype allows an immediate retest after review. In a real service, waiting periods, fees and appointments are controlled by the current state rules.', 'यह प्रोटोटाइप समीक्षा के बाद तुरंत दोबारा टेस्ट देता है। वास्तविक सेवा में प्रतीक्षा अवधि, शुल्क और अपॉइंटमेंट वर्तमान राज्य नियमों से नियंत्रित होते हैं।')}</p></div><div className="lf-actions"><FlowLink className="button button--secondary" href={`/mp/application/${applicationId}/tutorial`}>{local(language, 'Revisit learning material', 'सीखने की सामग्री फिर देखें')}</FlowLink><button className="button button--primary" onClick={reset}>{local(language, 'Start a new prototype attempt', 'नया प्रोटोटाइप प्रयास शुरू करें')} <ArrowRight size={18} /></button></div></section>}
      {eligible ? (
        <>
          <section className="demo-licence" aria-label={local(language, "Demonstration Learner's Licence, not valid", 'डेमो लर्नर लाइसेंस, मान्य नहीं')}>
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
                    <dt>{local(language, 'Demo workflow region', 'डेमो कार्यप्रवाह क्षेत्र')}</dt>
                    <dd>{local(language, 'Simulated Bhopal RTO workflow', 'सिमुलेटेड भोपाल आरटीओ कार्यप्रवाह')}</dd>
                  </div>
                  <div>
                    <dt>{local(language, 'Issue Date', 'जारी दिनांक')}</dt>
                    <dd>{new Date(licenceData.completedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
                  </div>
                  <div>
                    <dt>{local(language, 'Valid Up To (6 Months)', 'वैधता अवधि (६ माह)')}</dt>
                    <dd>{new Date(new Date(licenceData.completedAt).setMonth(new Date(licenceData.completedAt).getMonth() + 6)).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
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
        {passed && <button className="button button--secondary" onClick={reset}>
          <RotateCcw size={18} /> {local(language, 'Try demo test again', 'डेमो टेस्ट दोबारा दें')}
        </button>}
        <button className="text-button" onClick={() => setConfirmClear(true)}>
          <Eraser size={17} /> {local(language, 'Reset demo and return home', 'डेमो रीसेट करें और होम पर जाएँ')}
        </button>
        <FlowLink className="text-button" href={`/mp/application/${applicationId}`}>
          {local(language, 'Application status', 'आवेदन स्थिति')}
        </FlowLink>
      </div>
    </>
  )
}

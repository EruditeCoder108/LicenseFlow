import {
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  Camera,
  Check,
  Circle,
  Clock3,
  Maximize2,
  Minimize2,
  Signal,
  WifiOff,
  X,
  Slash,
} from 'lucide-react'

type Language = 'en' | 'hi'

const copy = (language: Language, en: string, hi: string) =>
  language === 'en' ? en : hi

export function useFocusedFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const supported = Boolean(
      document.fullscreenEnabled ||
        (document as unknown as { webkitFullscreenEnabled?: boolean })
          .webkitFullscreenEnabled
    )
    setIsFullscreenSupported(supported)

    const updateStatus = () => {
      const activeElement =
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element })
          .webkitFullscreenElement
      setIsFullscreen(Boolean(activeElement))
    }

    updateStatus()
    document.addEventListener('fullscreenchange', updateStatus)
    document.addEventListener('webkitfullscreenchange', updateStatus)
    return () => {
      document.removeEventListener('fullscreenchange', updateStatus)
      document.removeEventListener('webkitfullscreenchange', updateStatus)
    }
  }, [])

  const enterFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return
    const element = document.documentElement
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (
        (element as unknown as { webkitRequestFullscreen?: () => Promise<void> })
          .webkitRequestFullscreen
      ) {
        await (
          element as unknown as { webkitRequestFullscreen: () => Promise<void> }
        ).webkitRequestFullscreen()
      }
    } catch {
      // Non-blocking fallback if browser denies or user cancels fullscreen
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (
        (document as unknown as { webkitFullscreenElement?: Element })
          .webkitFullscreenElement &&
        (document as unknown as { webkitExitFullscreen?: () => Promise<void> })
          .webkitExitFullscreen
      ) {
        await (
          document as unknown as { webkitExitFullscreen: () => Promise<void> }
        ).webkitExitFullscreen()
      }
    } catch {
      // Ignore exit errors
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen()
    } else {
      await enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  return {
    isFullscreen,
    isFullscreenSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}

export type QuestionMapCellState =
  | 'answered'
  | 'current'
  | 'remaining'
  | 'correct'
  | 'incorrect'
  | 'unanswered'

export interface QuestionStatusMapProps {
  total: number
  mode: 'exam' | 'review'
  currentIndex?: number
  answers?: Record<number, number>
  correctAnswers?: Record<number, number>
  activeIndex?: number | null
  onSelectQuestion?: (index: number) => void
  language: Language
}

export function QuestionStatusMap({
  total,
  mode,
  currentIndex = 0,
  answers = {},
  correctAnswers = {},
  activeIndex,
  onSelectQuestion,
  language,
}: QuestionStatusMapProps) {
  const getCellState = (index: number): QuestionMapCellState => {
    if (mode === 'exam') {
      if (index === currentIndex) return 'current'
      if (answers[index] !== undefined) return 'answered'
      return 'remaining'
    } else {
      const ans = answers[index]
      const correct = correctAnswers[index]
      if (ans === undefined || ans === -1) return 'unanswered'
      if (ans === correct) return 'correct'
      return 'incorrect'
    }
  }

  const getCellLabel = (index: number, state: QuestionMapCellState): string => {
    const qNum = index + 1
    if (mode === 'exam') {
      if (state === 'current') {
        return copy(
          language,
          `Question ${qNum}, current`,
          `प्रश्न ${qNum}, वर्तमान प्रश्न`
        )
      }
      if (state === 'answered') {
        return copy(
          language,
          `Question ${qNum}, answered and locked`,
          `प्रश्न ${qNum}, उत्तर सहेजा और लॉक किया गया`
        )
      }
      return copy(
        language,
        `Question ${qNum}, remaining`,
        `प्रश्न ${qNum}, शेष प्रश्न`
      )
    } else {
      if (state === 'correct') {
        return copy(
          language,
          `Question ${qNum}, correct answer`,
          `प्रश्न ${qNum}, सही उत्तर`
        )
      }
      if (state === 'incorrect') {
        return copy(
          language,
          `Question ${qNum}, incorrect answer`,
          `प्रश्न ${qNum}, गलत उत्तर`
        )
      }
      return copy(
        language,
        `Question ${qNum}, unanswered`,
        `प्रश्न ${qNum}, अनुत्तरित प्रश्न`
      )
    }
  }

  return (
    <div
      className={`focused-status-map ${
        mode === 'review' ? 'focused-status-map--review' : ''
      }`}
      role="region"
      aria-label={copy(
        language,
        mode === 'exam' ? 'Question progress' : 'Question review grid',
        mode === 'exam' ? 'प्रश्न प्रगति' : 'प्रश्न समीक्षा ग्रिड'
      )}
    >
      <ol className="focused-status-map__grid" role="list">
        {Array.from({ length: total }, (_, index) => {
          const state = getCellState(index)
          const isSelected = activeIndex === index
          const label = getCellLabel(index, state)

          const icon =
            state === 'answered' ? (
              <Check size={12} strokeWidth={2.5} aria-hidden="true" />
            ) : state === 'current' ? (
              <Circle size={7} fill="currentColor" aria-hidden="true" />
            ) : state === 'correct' ? (
              <Check size={13} strokeWidth={2.5} aria-hidden="true" />
            ) : state === 'incorrect' ? (
              <X size={13} strokeWidth={2.5} aria-hidden="true" />
            ) : state === 'unanswered' ? (
              <Slash size={11} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Circle size={5} strokeWidth={2} aria-hidden="true" />
            )

          if (mode === 'review' && onSelectQuestion) {
            return (
              <li key={index} role="listitem">
                <button
                  type="button"
                  className={`focused-status-cell focused-status-cell--${state} ${
                    isSelected ? 'focused-status-cell--active' : ''
                  }`}
                  onClick={() => onSelectQuestion(index)}
                  aria-label={label}
                  aria-pressed={isSelected}
                >
                  <span className="focused-status-cell__icon">{icon}</span>
                  <span className="focused-status-cell__label">{index + 1}</span>
                </button>
              </li>
            )
          }

          return (
            <li key={index} role="listitem">
              <div
                className={`focused-status-cell focused-status-cell--${state}`}
                aria-label={label}
                tabIndex={0}
              >
                <span className="focused-status-cell__icon">{icon}</span>
                <span className="focused-status-cell__label">{index + 1}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export interface FocusedAssessmentShellProps {
  mode: 'rehearsal' | 'exam' | 'interruption'
  title: string
  stageBadge?: string
  timerSeconds?: number
  timerUrgentThreshold?: number
  online?: boolean
  cameraActive?: boolean
  cameraGuided?: boolean
  cameraLabel?: string
  statusMap?: ReactNode
  topActions?: ReactNode
  bottomBar?: ReactNode
  children: ReactNode
  language: Language
  onExit?: () => void
  exitLabel?: string
  showFullscreenToggle?: boolean
}

export function FocusedAssessmentShell({
  mode,
  title,
  stageBadge,
  timerSeconds,
  timerUrgentThreshold = 10,
  online = true,
  cameraActive = true,
  cameraGuided = false,
  cameraLabel,
  statusMap,
  topActions,
  bottomBar,
  children,
  language,
  onExit,
  exitLabel,
  showFullscreenToggle = true,
}: FocusedAssessmentShellProps) {
  const {
    isFullscreen,
    isFullscreenSupported,
    toggleFullscreen,
  } = useFocusedFullscreen()

  const isTimerUrgent =
    typeof timerSeconds === 'number' && timerSeconds <= timerUrgentThreshold

  return (
    <div
      className={`focused-assessment-shell focused-assessment-shell--${mode}`}
      role="main"
      aria-label={title}
    >
      {/* Focused Assessment Top Bar */}
      <header className="focused-assessment-shell__header">
        <div className="focused-assessment-shell__identity">
          <div className="focused-assessment-shell__brand">
            <img
              src="/assets/licenceflow-logo.webp"
              alt="LicenceFlow Logo"
              className="focused-assessment-shell__logo"
              width={32}
              height={32}
            />
            <strong className="focused-assessment-shell__title">{title}</strong>
          </div>
          {stageBadge && (
            <span className="focused-assessment-shell__badge">{stageBadge}</span>
          )}
        </div>

        {/* Central Controls: Timer / Status */}
        <div className="focused-assessment-shell__center">
          {typeof timerSeconds === 'number' && (
            <div
              className={`focused-timer ${
                isTimerUrgent ? 'focused-timer--urgent' : ''
              }`}
              role="timer"
              aria-live="polite"
              aria-label={copy(
                language,
                `${timerSeconds} seconds remaining`,
                `${timerSeconds} सेकंड शेष`
              )}
            >
              <Clock3 size={16} aria-hidden="true" />
              <span>{timerSeconds}s</span>
            </div>
          )}
        </div>

        {/* Right Status Indicators & Tools */}
        <div className="focused-assessment-shell__right">
          <div className="focused-status-pills" role="status" aria-live="polite">
            <span
              className={`focused-status-pill ${
                online
                  ? 'focused-status-pill--good'
                  : 'focused-status-pill--warning'
              }`}
              title={
                online
                  ? copy(language, 'Internet connected', 'इंटरनेट कनेक्टेड')
                  : copy(language, 'Network offline', 'इंटरनेट डिस्कनेक्टेड')
              }
            >
              {online ? (
                <Signal size={14} aria-hidden="true" />
              ) : (
                <WifiOff size={14} aria-hidden="true" />
              )}
              <span className="focused-status-pill__text">
                {online
                  ? copy(language, 'Connected', 'चालू')
                  : copy(language, 'Offline', 'ऑफलाइन')}
              </span>
            </span>

            <span
              className={`focused-status-pill ${
                cameraActive
                  ? 'focused-status-pill--good'
                  : 'focused-status-pill--warning'
              }`}
            >
              <Camera size={14} aria-hidden="true" />
              <span className="focused-status-pill__text">
                {cameraLabel ??
                  (cameraGuided
                    ? copy(language, 'Demo Camera', 'डेमो कैमरा')
                    : cameraActive
                    ? copy(language, 'Camera Active', 'कैमरा सक्रिय')
                    : copy(language, 'Camera Check', 'कैमरा जाँच'))}
              </span>
            </span>
          </div>

          {topActions}

          {showFullscreenToggle && isFullscreenSupported && (
            <button
              type="button"
              className="focused-icon-btn"
              onClick={toggleFullscreen}
              aria-label={
                isFullscreen
                  ? copy(language, 'Exit fullscreen mode', 'पूर्ण स्क्रीन से बाहर निकलें')
                  : copy(language, 'Enter fullscreen mode', 'पूर्ण स्क्रीन मोड चालू करें')
              }
              title={
                isFullscreen
                  ? copy(language, 'Exit fullscreen', 'फुलस्क्रीन बंद')
                  : copy(language, 'Fullscreen mode', 'फुलस्क्रीन मोड')
              }
            >
              {isFullscreen ? (
                <Minimize2 size={16} aria-hidden="true" />
              ) : (
                <Maximize2 size={16} aria-hidden="true" />
              )}
            </button>
          )}

          {onExit && (
            <button
              type="button"
              className="focused-exit-btn"
              onClick={onExit}
              aria-label={
                exitLabel ??
                copy(language, 'Exit assessment', 'मूल्यांकन से बाहर निकलें')
              }
            >
              <X size={16} aria-hidden="true" />
              <span>
                {exitLabel ?? copy(language, 'Exit', 'बाहर निकलें')}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Optional Status Map Strip */}
      {statusMap && (
        <section
          className="focused-assessment-shell__status-bar"
          aria-label="Progress bar"
        >
          {statusMap}
        </section>
      )}

      {/* Central Content Area with Safe Overflow */}
      <main className="focused-assessment-shell__body">{children}</main>

      {/* Bottom Docked Action Bar */}
      {bottomBar && (
        <footer className="focused-assessment-shell__footer">
          <div className="focused-assessment-shell__footer-inner">
            {bottomBar}
          </div>
        </footer>
      )}
    </div>
  )
}

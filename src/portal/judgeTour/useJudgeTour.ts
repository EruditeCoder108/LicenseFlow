import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { JUDGE_TOUR_STEPS } from './tourSteps'
import type { JudgeTourStep, TargetRect } from './types'
import { navigatePortal } from '../router'

export const STORAGE_KEY_ACTIVE = 'mp-portal-judge-tour-active'
export const STORAGE_KEY_STEP = 'mp-portal-judge-tour-step'
export const STORAGE_KEY_DISMISSED = 'mp-portal-judge-tour-dismissed'
const FORM_SHOWCASE_PREFIX = 'application-showcase-'

function routeMatchesPattern(pattern: string, pathname: string): boolean {
  const expression = pattern
    .split('/')
    .map((segment) => segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('/')
  return new RegExp(`^${expression}$`).test(pathname)
}

function resolveTourRoute(pattern: string, applicationId?: string): string {
  return pattern.replace(':id', applicationId ?? 'MP-LL-DEMO-2408')
}

function readStorageBool(key: string, defaultVal: boolean): boolean {
  try {
    const val = localStorage.getItem(key)
    if (val === null) return defaultVal
    return val === 'true'
  } catch {
    return defaultVal
  }
}

function readStorageNumber(key: string, defaultVal: number): number {
  try {
    const val = localStorage.getItem(key)
    if (val === null) return defaultVal
    const parsed = parseInt(val, 10)
    return Number.isNaN(parsed) ? defaultVal : parsed
  } catch {
    return defaultVal
  }
}

function saveStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // safe fallback
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // safe fallback
  }
}

export function useJudgeTour(pathname: string, activeApplicationId?: string) {
  const [isActive, setIsActive] = useState<boolean>(() => readStorageBool(STORAGE_KEY_ACTIVE, false))
  const [stepIndex, setStepIndex] = useState<number>(() => {
    const step = readStorageNumber(STORAGE_KEY_STEP, 0)
    return Math.max(0, Math.min(step, JUDGE_TOUR_STEPS.length - 1))
  })
  const [isDismissed, setIsDismissed] = useState<boolean>(() => readStorageBool(STORAGE_KEY_DISMISSED, false))
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [targetFound, setTargetFound] = useState<boolean>(false)
  const [isFormShowcasePlaying, setIsFormShowcasePlaying] = useState(false)
  const [isUserExploring, setIsUserExploring] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  const explorationTimerRef = useRef<number | null>(null)

  // Sync state to localStorage only when active/dismissed
  useEffect(() => {
    if (isActive) {
      saveStorage(STORAGE_KEY_ACTIVE, 'true')
    } else {
      removeStorage(STORAGE_KEY_ACTIVE)
    }
  }, [isActive])

  useEffect(() => {
    saveStorage(STORAGE_KEY_STEP, String(stepIndex))
  }, [stepIndex])

  useEffect(() => {
    if (isDismissed) {
      saveStorage(STORAGE_KEY_DISMISSED, 'true')
    } else {
      removeStorage(STORAGE_KEY_DISMISSED)
    }
  }, [isDismissed])

  const currentStep: JudgeTourStep = useMemo(() => {
    return JUDGE_TOUR_STEPS[stepIndex] ?? (JUDGE_TOUR_STEPS[0] as JudgeTourStep)
  }, [stepIndex])

  // The application section is a calm, automatic showcase: fill once, then
  // reveal each real form route long enough to understand it.
  useEffect(() => {
    if (!isActive || !currentStep.id.startsWith(FORM_SHOWCASE_PREFIX)) return
    setIsFormShowcasePlaying(true)
  }, [currentStep.id, isActive])

  useEffect(() => {
    if (!isActive || isUserExploring || !isFormShowcasePlaying || !currentStep.id.startsWith(FORM_SHOWCASE_PREFIX)) return

    const isFinalShowcaseStep = currentStep.id === 'application-showcase-review'
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const contentTimer = window.setTimeout(() => {
      document.querySelector<HTMLElement>('[data-tour="application-step-content"]')?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
        inline: 'nearest',
      })
    }, 550)

    const advanceTimer = window.setTimeout(() => {
      if (isFinalShowcaseStep) {
        setIsFormShowcasePlaying(false)
        setStepIndex((current) => Math.min(current + 1, JUDGE_TOUR_STEPS.length - 1))
        return
      }

      const continueButton = document.querySelector<HTMLButtonElement>('[data-tour="application-continue"]')
      if (!continueButton || continueButton.disabled) {
        setIsFormShowcasePlaying(false)
        return
      }
      continueButton.click()
      setStepIndex((current) => Math.min(current + 1, JUDGE_TOUR_STEPS.length - 1))
    }, 2200)

    return () => {
      window.clearTimeout(contentTimer)
      window.clearTimeout(advanceTimer)
    }
  }, [currentStep.id, isActive, isFormShowcasePlaying, isUserExploring])

  // Yield the screen whenever the evaluator chooses to explore independently.
  // Wheel, touch, keyboard scrolling and scrollbar drags all restart the same
  // short quiet timer. The guide state itself is preserved.
  useEffect(() => {
    if (!isActive) return

    const scheduleResume = (delay = 480) => {
      if (explorationTimerRef.current !== null) window.clearTimeout(explorationTimerRef.current)
      explorationTimerRef.current = window.setTimeout(() => {
        explorationTimerRef.current = null
        setIsUserExploring(false)
      }, delay)
    }

    const pauseForExploration = () => {
      setIsUserExploring(true)
      scheduleResume(520)
    }

    const resumeAfterScroll = () => {
      scheduleResume(480)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('button, a, input, select, textarea, [contenteditable="true"]')) return
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
        pauseForExploration()
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      const scrollbarEdge = Math.max(document.documentElement.clientWidth, window.innerWidth) - 24
      if (event.clientX >= scrollbarEdge) pauseForExploration()
    }

    window.addEventListener('wheel', pauseForExploration, { passive: true })
    window.addEventListener('touchmove', pauseForExploration, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('scrollend', resumeAfterScroll, { passive: true })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('wheel', pauseForExploration)
      window.removeEventListener('touchmove', pauseForExploration)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('scrollend', resumeAfterScroll)
      document.removeEventListener('keydown', handleKeyDown)
      if (explorationTimerRef.current !== null) {
        window.clearTimeout(explorationTimerRef.current)
        explorationTimerRef.current = null
      }
    }
  }, [isActive])

  // Locate and track bounding rect of target element
  const updateTargetPosition = useCallback(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null)
      setTargetFound(false)
      return
    }

    const element = document.querySelector<HTMLElement>(currentStep.targetSelector)
    if (element) {
      const rect = element.getBoundingClientRect()
      const intersectsViewport = rect.bottom > 0
        && rect.top < window.innerHeight
        && rect.right > 0
        && rect.left < window.innerWidth
      // Do not draw a misleading box when its target has been scrolled away.
      if (rect.width > 0 && rect.height > 0 && intersectsViewport) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        })
        setTargetFound(true)
        return
      }
    }

    setTargetRect(null)
    setTargetFound(false)
  }, [isActive, currentStep])

  // Locate lazily rendered route content, then scroll only once for this step.
  useEffect(() => {
    if (!isActive || !currentStep) return

    let timer: number | undefined
    let attempts = 0
    const locateAndScroll = () => {
      const element = document.querySelector<HTMLElement>(currentStep.targetSelector)
      if (element) {
        const prefersReducedMotion =
          typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (currentStep.scrollMode === 'top') {
          window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
        } else {
          element.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'center',
            inline: 'nearest',
          })
        }
        window.requestAnimationFrame(updateTargetPosition)
        return
      }
      attempts += 1
      if (attempts < 30) timer = window.setTimeout(locateAndScroll, 80)
      else updateTargetPosition()
    }
    timer = window.setTimeout(locateAndScroll, 80)

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [isActive, stepIndex, currentStep, updateTargetPosition])

  // Set up listeners for scroll, resize, DOM mutations
  useEffect(() => {
    if (!isActive) return

    const handleUpdate = () => {
      if (animationFrameRef.current !== null) return
      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null
        updateTargetPosition()
      })
    }

    window.addEventListener('scroll', handleUpdate, { passive: true })
    window.addEventListener('resize', handleUpdate, { passive: true })

    const observer = new MutationObserver(handleUpdate)
    observer.observe(document.body, { childList: true, subtree: true })
    const resizeObserver = new ResizeObserver(handleUpdate)
    resizeObserver.observe(document.documentElement)

    updateTargetPosition()

    return () => {
      window.removeEventListener('scroll', handleUpdate)
      window.removeEventListener('resize', handleUpdate)
      observer.disconnect()
      resizeObserver.disconnect()
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isActive, updateTargetPosition])

  // Escape key handler
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsActive(false)
        setIsDismissed(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  const startTour = useCallback(() => {
    setIsUserExploring(false)
    setIsFormShowcasePlaying(false)
    setIsActive(true)
    setStepIndex(0)
    setIsDismissed(false)
    if (pathname !== '/') {
      navigatePortal('/')
    }
  }, [pathname])

  const dismissPrompt = useCallback(() => {
    setIsUserExploring(false)
    setIsFormShowcasePlaying(false)
    setIsDismissed(true)
    setIsActive(false)
  }, [])

  const skipTour = useCallback(() => {
    setIsUserExploring(false)
    setIsFormShowcasePlaying(false)
    setIsActive(false)
    setIsDismissed(true)
  }, [])

  const replayTour = useCallback(() => {
    setIsUserExploring(false)
    setIsFormShowcasePlaying(false)
    setIsActive(true)
    setIsDismissed(false)

    if (stepIndex === 0) {
      if (pathname !== '/') navigatePortal('/')
      return
    }

    if (routeMatchesPattern(currentStep.routePattern, pathname)) return

    const matchingIndex = JUDGE_TOUR_STEPS.findIndex((step) => routeMatchesPattern(step.routePattern, pathname))
    if (matchingIndex >= 0) {
      setStepIndex(matchingIndex)
      return
    }

    navigatePortal(resolveTourRoute(currentStep.routePattern, activeApplicationId))
  }, [activeApplicationId, currentStep.routePattern, pathname, stepIndex])

  const nextStep = useCallback(() => {
    if (stepIndex < JUDGE_TOUR_STEPS.length - 1) {
      setStepIndex((curr) => curr + 1)
    } else {
      setIsActive(false)
    }
  }, [stepIndex])

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((curr) => curr - 1)
    }
  }, [stepIndex])

  const performStepAction = useCallback(() => {
    if (currentStep.action === 'finish') {
      setIsActive(false)
      setIsDismissed(true)
      setStepIndex(0)
      return
    }

    if (currentStep.action === 'advance') {
      setStepIndex((current) => Math.min(current + 1, JUDGE_TOUR_STEPS.length - 1))
      return
    }

    if (currentStep.action === 'autoplay-forms') {
      const quickFillButton = document.querySelector<HTMLElement>('[data-tour="application-quick-fill"]')
      if (!quickFillButton) return
      quickFillButton.click()
      setIsFormShowcasePlaying(true)
      setStepIndex((current) => Math.min(current + 1, JUDGE_TOUR_STEPS.length - 1))
      return
    }

    const target = document.querySelector<HTMLElement>(currentStep.targetSelector)
    if (!target) return
    target.click()

    if (currentStep.action === 'smart-start') {
      setStepIndex((current) => Math.min(current + 1, JUDGE_TOUR_STEPS.length - 1))
      window.setTimeout(() => {
        document.querySelector<HTMLElement>('[data-tour="confirm-fresh-application"]')?.click()
      }, 120)
      return
    }

    setStepIndex((current) => Math.min(current + 1, JUDGE_TOUR_STEPS.length - 1))
  }, [currentStep])

  // Context-aware replay pill visibility rule:
  // Visible ONLY on: '/', '/mp/services', '/mp/ll/start', '/mp/service/application-status', '/mp/service/fee-payment', '/mp/application/:id', '/mp/application/:id/result'
  // Hidden during: readiness, rehearsal, payment, gateway, tutorial, active test, test interruption
  const shouldShowReplayPill = useMemo(() => {
    if (isActive) return false

    // Explicitly hide on all assessment, payment, learning, and interruption screens
    const isExcludedScreen =
      pathname.includes('/readiness') ||
      pathname.includes('/rehearsal') ||
      pathname.includes('/payment') ||
      pathname.includes('/gateway') ||
      pathname.includes('/receipt') ||
      pathname.includes('/tutorial') ||
      pathname.includes('/test-entry') ||
      pathname.includes('/test') ||
      pathname.includes('/test-interruption') ||
      pathname.includes('/uploads') ||
      pathname.includes('/submitted')

    if (isExcludedScreen) return false

    const isAllowedScreen =
      pathname === '/' ||
      pathname === '/mp/services' ||
      pathname === '/mp/ll/start' ||
      pathname === '/mp/service/application-status' ||
      pathname === '/mp/service/fee-payment' ||
      /^\/mp\/application\/[^/]+$/.test(pathname) ||
      pathname.includes('/result')

    return isAllowedScreen
  }, [isActive, pathname])

  // Show hero prompt on homepage when not active and not dismissed
  const shouldShowHeroPrompt = useMemo(() => {
    return pathname === '/' && !isActive && !isDismissed
  }, [pathname, isActive, isDismissed])

  const isResumable = !isActive && stepIndex > 0

  return {
    isActive,
    stepIndex,
    isDismissed,
    isFormShowcasePlaying,
    isUserExploring,
    isResumable,
    currentStep,
    totalSteps: JUDGE_TOUR_STEPS.length,
    targetRect,
    targetFound,
    shouldShowReplayPill,
    shouldShowHeroPrompt,
    startTour,
    dismissPrompt,
    skipTour,
    replayTour,
    nextStep,
    prevStep,
    performStepAction,
  }
}

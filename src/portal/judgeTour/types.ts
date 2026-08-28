import type { Language } from '../i18n'
export type { Language }

export type RaahiPose =
  | 'welcome'
  | 'pointing'
  | 'thinking'
  | 'working'
  | 'celebrate'
  | 'confident'

export type JudgeTourPhase = 'discover' | 'apply' | 'verify' | 'pay' | 'learn-test' | 'result'
export type JudgeTourAction = 'advance' | 'click' | 'smart-start' | 'autoplay-forms' | 'finish'
export type JudgeTourScrollMode = 'top' | 'target'
export type JudgeTourStepId = string

export interface JudgeTourStep {
  id: JudgeTourStepId
  stepNumber: number
  phase: JudgeTourPhase
  targetSelector: string
  routePattern: string
  pose: RaahiPose
  action: JudgeTourAction
  scrollMode: JudgeTourScrollMode
  title: { en: string; hi: string }
  dialogue: { en: string; hi: string }
  actionLabel: { en: string; hi: string }
  fallbackNotice: { en: string; hi: string }
}

export interface TargetRect {
  top: number
  left: number
  width: number
  height: number
  bottom: number
  right: number
}

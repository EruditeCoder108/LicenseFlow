import type { PresentedQuestion } from '../content/questions'

// Public wire contract only. No marking keys, paper seed or private bank imports.
export type ProtectedPhase = 'ready' | 'waiting' | 'active' | 'paused' | 'completed'
export type ProtectedPauseReason = 'network' | 'visibility' | 'camera' | 'camera-stopped' | 'no-face' | 'multiple-faces' | 'phone' | 'fullscreen-exit' | 'exit'
export type ProtectedObservationSource = 'live' | 'judge-simulation'
export interface ProtectedIntegritySummary {
  technicalInterruptions: number
  attentionEvents: number
  integrityObservations: number
  manualPauses: number
  simulatedEvents: number
  status: 'clear' | 'observations-recorded' | 'review-recommended'
  lastReason: ProtectedPauseReason | null
  lastSource: ProtectedObservationSource | null
}
export interface ProtectedExamEvent {
  id: string
  kind: string
  at: number
  detail: string
}
export interface ProtectedExamSnapshot {
  authority: 'server'
  synthetic: true
  attemptId: string
  applicationId: string
  attemptNumber: number
  revision: number
  phase: ProtectedPhase
  currentIndex: number
  totalQuestions: number
  passMark: number
  answers: Record<number, number>
  fingerprint: string
  bankRevision: string
  serverNow: number
  expiresAt: number
  deadlineAt: number | null
  remainingMs: number | null
  pauseBudgetRemainingMs: number
  pauseReason: ProtectedPauseReason | null
  integritySummary: ProtectedIntegritySummary
  leaseExpiresAt: number | null
  ownsLease: boolean
  question: (PresentedQuestion & { token: string; index: number }) | null
  result: { score: number; passed: boolean; completedAt: number; reason: 'answered' | 'expired' } | null
  events: ProtectedExamEvent[]
}
export interface ProtectedReviewItem extends PresentedQuestion {
  index: number
  selected: number
  correct: number
  explanation: string
  explanationHi?: string
  timedOut: boolean
}
export interface ProtectedExamReview {
  attempt: ProtectedExamSnapshot
  review: ProtectedReviewItem[]
}

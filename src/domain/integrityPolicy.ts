import type { ProtectedIntegritySummary, ProtectedObservationSource, ProtectedPauseReason } from '../portal/protectedExamTypes'

export type IntegrityEventCategory = 'technical' | 'attention' | 'integrity' | 'manual'

export const EMPTY_INTEGRITY_SUMMARY: ProtectedIntegritySummary = {
  technicalInterruptions: 0,
  attentionEvents: 0,
  integrityObservations: 0,
  manualPauses: 0,
  simulatedEvents: 0,
  status: 'clear',
  lastReason: null,
  lastSource: null,
}

export function classifyPauseReason(reason: ProtectedPauseReason): IntegrityEventCategory {
  if (reason === 'network' || reason === 'camera-stopped' || reason === 'camera') return 'technical'
  if (reason === 'multiple-faces' || reason === 'phone') return 'integrity'
  if (reason === 'exit') return 'manual'
  return 'attention'
}

export function normalizeIntegritySummary(summary?: Partial<ProtectedIntegritySummary> | null): ProtectedIntegritySummary {
  return {
    technicalInterruptions: Math.max(0, Number(summary?.technicalInterruptions) || 0),
    attentionEvents: Math.max(0, Number(summary?.attentionEvents) || 0),
    integrityObservations: Math.max(0, Number(summary?.integrityObservations) || 0),
    manualPauses: Math.max(0, Number(summary?.manualPauses) || 0),
    simulatedEvents: Math.max(0, Number(summary?.simulatedEvents) || 0),
    status: summary?.status === 'review-recommended'
      ? 'review-recommended'
      : summary?.status === 'observations-recorded'
        ? 'observations-recorded'
        : 'clear',
    lastReason: summary?.lastReason ?? null,
    lastSource: summary?.lastSource === 'judge-simulation' ? 'judge-simulation' : summary?.lastSource === 'live' ? 'live' : null,
  }
}

export function recordIntegrityEvent(
  current: Partial<ProtectedIntegritySummary> | null | undefined,
  reason: ProtectedPauseReason,
  source: ProtectedObservationSource = 'live',
): ProtectedIntegritySummary {
  const next = normalizeIntegritySummary(current)
  if (source === 'judge-simulation') {
    next.simulatedEvents += 1
    next.lastReason = reason
    next.lastSource = source
    return next
  }
  const category = classifyPauseReason(reason)
  if (category === 'technical') next.technicalInterruptions += 1
  if (category === 'attention') next.attentionEvents += 1
  if (category === 'integrity') next.integrityObservations += 1
  if (category === 'manual') next.manualPauses += 1
  next.lastReason = reason
  next.lastSource = source
  next.status = next.integrityObservations > 0
    ? 'review-recommended'
    : next.attentionEvents > 0
      ? 'observations-recorded'
      : 'clear'
  return next
}

export function pauseEventDetail(reason: ProtectedPauseReason, source: ProtectedObservationSource = 'live'): string {
  const category = classifyPauseReason(reason)
  const description: Record<ProtectedPauseReason, string> = {
    network: 'the connection became unavailable',
    visibility: 'the exam tab became hidden',
    camera: 'the camera check became unavailable',
    'camera-stopped': 'the camera stream stopped',
    'no-face': 'no face remained visible beyond the allowed grace period',
    'multiple-faces': 'more than one face remained visible beyond the allowed grace period',
    phone: 'a phone remained visible beyond the allowed grace period',
    'fullscreen-exit': 'fullscreen was exited after the assessment entered it',
    exit: 'the applicant requested a pause or left the assessment',
  }
  if (source === 'judge-simulation') {
    return `Judge simulation reported that ${description[reason]}. Server preserved the remaining time and stored this separately from real integrity evidence.`
  }
  return `Client reported that ${description[reason]}. Server recorded a ${category} event and preserved the remaining time; this is not an automatic cheating verdict.`
}

import type { MediaBlockingReason, MediaCoachingReason } from '../hooks/useDeviceReadiness'

export interface MonitoringObservationDurations {
  noFaceMs: number
  multipleFacesMs: number
  phoneMs: number
  framingIssueMs: number
  lightingIssueMs: number
}

export interface MonitoringDecision {
  coachingReason: MediaCoachingReason
  blockingReason: MediaBlockingReason
}

export const MONITORING_THRESHOLDS_MS = {
  coachMultipleFaces: 1_000,
  coachPhone: 1_200,
  coachNoFace: 1_500,
  coachFraming: 2_000,
  coachLighting: 2_500,
  pauseMultipleFaces: 2_500,
  pausePhone: 3_000,
  pauseNoFace: 4_000,
} as const

export function decideMonitoringAction(durations: MonitoringObservationDurations): MonitoringDecision {
  const coachingReason: MediaCoachingReason =
    durations.phoneMs > MONITORING_THRESHOLDS_MS.coachPhone
      ? 'phone'
      : durations.multipleFacesMs > MONITORING_THRESHOLDS_MS.coachMultipleFaces
      ? 'multiple-faces'
      : durations.noFaceMs > MONITORING_THRESHOLDS_MS.coachNoFace
        ? 'no-face'
        : durations.framingIssueMs > MONITORING_THRESHOLDS_MS.coachFraming
          ? 'framing'
          : durations.lightingIssueMs > MONITORING_THRESHOLDS_MS.coachLighting
            ? 'lighting'
            : null

  const blockingReason: MediaBlockingReason =
    durations.phoneMs > MONITORING_THRESHOLDS_MS.pausePhone
      ? 'phone'
      : durations.multipleFacesMs > MONITORING_THRESHOLDS_MS.pauseMultipleFaces
      ? 'multiple-faces'
      : durations.noFaceMs > MONITORING_THRESHOLDS_MS.pauseNoFace
        ? 'no-face'
        : null

  return { coachingReason, blockingReason }
}

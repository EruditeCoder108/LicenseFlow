import type { MediaBlockingReason, MediaCoachingReason } from '../hooks/useDeviceReadiness'

export interface MonitoringObservationDurations {
  noFaceMs: number
  multipleFacesMs: number
  framingIssueMs: number
  lightingIssueMs: number
}

export interface MonitoringDecision {
  coachingReason: MediaCoachingReason
  blockingReason: MediaBlockingReason
}

export const MONITORING_THRESHOLDS_MS = {
  coachMultipleFaces: 1_000,
  coachNoFace: 1_500,
  coachFraming: 2_000,
  coachLighting: 2_500,
  pauseMultipleFaces: 2_500,
  pauseNoFace: 4_000,
} as const

export function decideMonitoringAction(durations: MonitoringObservationDurations): MonitoringDecision {
  const coachingReason: MediaCoachingReason =
    durations.multipleFacesMs > MONITORING_THRESHOLDS_MS.coachMultipleFaces
      ? 'multiple-faces'
      : durations.noFaceMs > MONITORING_THRESHOLDS_MS.coachNoFace
        ? 'no-face'
        : durations.framingIssueMs > MONITORING_THRESHOLDS_MS.coachFraming
          ? 'framing'
          : durations.lightingIssueMs > MONITORING_THRESHOLDS_MS.coachLighting
            ? 'lighting'
            : null

  const blockingReason: MediaBlockingReason =
    durations.multipleFacesMs > MONITORING_THRESHOLDS_MS.pauseMultipleFaces
      ? 'multiple-faces'
      : durations.noFaceMs > MONITORING_THRESHOLDS_MS.pauseNoFace
        ? 'no-face'
        : null

  return { coachingReason, blockingReason }
}

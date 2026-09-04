import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FaceLandmarker, NormalizedLandmark, ObjectDetector } from '@mediapipe/tasks-vision'
import { decideMonitoringAction } from '../domain/monitoringDecision'

const WASM_ROOT = '/assets/mediapipe/vision-wasm'
const FACE_MODEL = '/assets/mediapipe/face_landmarker.task'
const OBJECT_MODEL = '/assets/mediapipe/efficientdet_lite0_uint8.tflite'
const OBJECT_DETECTION_INTERVAL_MS = 1_200

export type MediaStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'error'
export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'
export type FramingStatus = 'idle' | 'good' | 'adjust'
export type LightingStatus = 'idle' | 'good' | 'dim' | 'bright'
export type MediaBlockingReason = 'no-face' | 'multiple-faces' | 'phone' | 'camera-stopped' | null
export type MediaCoachingReason = 'no-face' | 'multiple-faces' | 'phone' | 'framing' | 'lighting' | null
export type HeadTurnStep = 'center_waiting' | 'turn_requested' | 'turning' | 'passed'
export type HeadTurnDirection = 'left' | 'right'

export interface DeviceReadinessSnapshot {
  started: boolean
  guided: boolean
  camera: MediaStatus
  microphone: MediaStatus
  model: ModelStatus
  objectModel: ModelStatus
  faceCount: number | null
  phoneDetected: boolean | null
  phoneConfidence: number | null
  framing: FramingStatus
  lighting: LightingStatus
  brightness: number | null
  headTurnComplete: boolean
  headTurnStep: HeadTurnStep
  headTurnDirection: HeadTurnDirection
  headTurnProgress: number
  audioLevel: number
  online: boolean
  storage: boolean
  secureContext: boolean
  coachingReason: MediaCoachingReason
  blockingReason: MediaBlockingReason
  analysisLatencyMs: number | null
  objectAnalysisLatencyMs: number | null
  error?: string
}

const initialSnapshot: DeviceReadinessSnapshot = {
  started: false,
  guided: false,
  camera: 'idle',
  microphone: 'idle',
  model: 'idle',
  objectModel: 'idle',
  faceCount: null,
  phoneDetected: null,
  phoneConfidence: null,
  framing: 'idle',
  lighting: 'idle',
  brightness: null,
  headTurnComplete: false,
  headTurnStep: 'center_waiting',
  headTurnDirection: 'left',
  headTurnProgress: 0,
  audioLevel: 0,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  storage: false,
  secureContext: typeof window === 'undefined' ? true : window.isSecureContext,
  coachingReason: null,
  blockingReason: null,
  analysisLatencyMs: null,
  objectAnalysisLatencyMs: null,
}

function testLocalStorage(): boolean {
  try {
    const key = 'licenceflow.readiness.test'
    window.localStorage.setItem(key, 'ok')
    const value = window.localStorage.getItem(key)
    window.localStorage.removeItem(key)
    return value === 'ok'
  } catch {
    return false
  }
}

function getFaceMetrics(landmarks: NormalizedLandmark[]) {
  const xs = landmarks.map((point) => point.x)
  const ys = landmarks.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = maxX - minX
  const height = maxY - minY
  const centerX = minX + width / 2
  const centerY = minY + height / 2

  const nose = landmarks[1]
  const leftCheek = landmarks[234]
  const rightCheek = landmarks[454]
  const leftSpan = nose && leftCheek ? Math.abs(nose.x - leftCheek.x) : 0
  const rightSpan = nose && rightCheek ? Math.abs(rightCheek.x - nose.x) : 0
  const spanTotal = leftSpan + rightSpan
  const signedYaw = spanTotal > 0 ? (rightSpan - leftSpan) / spanTotal : 0
  const isCentered = spanTotal > 0 && Math.abs(signedYaw) < 0.12

  return {
    framing:
      width >= 0.16 &&
      width <= 0.88 &&
      height >= 0.18 &&
      height <= 0.85 &&
      centerX >= 0.18 &&
      centerX <= 0.82 &&
      centerY >= 0.15 &&
      centerY <= 0.85,
    isCentered,
    signedYaw,
    magnitude: spanTotal > 0 ? Math.abs(signedYaw) : 0,
  }
}

export function matchesRequestedHeadTurn(
  direction: HeadTurnDirection,
  signedYaw: number,
  threshold = 0.15,
): boolean {
  // MediaPipe is analysed in raw camera coordinates while the applicant sees
  // a mirrored selfie preview. Keep this mapping in applicant-relative terms.
  return direction === 'left' ? signedYaw < -threshold : signedYaw > threshold
}

function measureBrightness(video: HTMLVideoElement, canvas: HTMLCanvasElement): number | null {
  if (video.readyState < 2 || video.videoWidth === 0) return null
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  canvas.width = 40
  canvas.height = 30
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  let luminance = 0
  for (let index = 0; index < pixels.length; index += 4) {
    luminance +=
      (pixels[index] ?? 0) * 0.2126 +
      (pixels[index + 1] ?? 0) * 0.7152 +
      (pixels[index + 2] ?? 0) * 0.0722
  }
  return Math.round(luminance / (pixels.length / 4))
}

function measureAudio(analyser: AnalyserNode | null, buffer: Float32Array<ArrayBuffer> | null): number {
  if (!analyser || !buffer) return 0
  analyser.getFloatTimeDomainData(buffer)
  let sum = 0
  for (const sample of buffer) sum += sample * sample
  return Math.min(1, Math.sqrt(sum / buffer.length) * 8)
}

export function stopAllMediaTracks() {
  if (typeof document !== 'undefined') {
    document.querySelectorAll('video, audio').forEach((el) => {
      const mediaEl = el as HTMLMediaElement
      if (mediaEl.srcObject instanceof MediaStream) {
        mediaEl.srcObject.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch {
            // ignore
          }
        })
        mediaEl.srcObject = null
      }
      try {
        mediaEl.pause()
      } catch {
        // ignore
      }
    })
  }
}

export function useDeviceReadiness() {
  const [snapshot, setSnapshot] = useState<DeviceReadinessSnapshot>(initialSnapshot)
  const isMountedRef = useRef(true)
  const lifecycleGenerationRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const objectDetectorRef = useRef<ObjectDetector | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioBufferRef = useRef<Float32Array<ArrayBuffer> | null>(null)
  const noFaceSinceRef = useRef<number | null>(null)
  const multipleFaceSinceRef = useRef<number | null>(null)
  const framingIssueSinceRef = useRef<number | null>(null)
  const lightingIssueSinceRef = useRef<number | null>(null)
  const phoneSinceRef = useRef<number | null>(null)
  const lastObjectAnalysisRef = useRef(0)
  const phoneDetectedRef = useRef<boolean | null>(null)
  const phoneConfidenceRef = useRef<number | null>(null)
  const objectAnalysisLatencyRef = useRef<number | null>(null)
  const headTurnStepRef = useRef<HeadTurnStep>('center_waiting')
  const headTurnDirectionRef = useRef<HeadTurnDirection>('left')
  const centeredFramesRef = useRef<number>(0)
  const turnFramesRef = useRef<number>(0)

  const releaseResources = useCallback(() => {
    lifecycleGenerationRef.current += 1
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {
          // ignore
        }
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause()
        videoRef.current.srcObject = null
      } catch {
        // ignore
      }
      videoRef.current = null
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
    audioBufferRef.current = null
    try {
      landmarkerRef.current?.close()
    } catch {
      // ignore
    }
    landmarkerRef.current = null
    try {
      objectDetectorRef.current?.close()
    } catch {
      // ignore
    }
    objectDetectorRef.current = null
    noFaceSinceRef.current = null
    multipleFaceSinceRef.current = null
    framingIssueSinceRef.current = null
    lightingIssueSinceRef.current = null
    phoneSinceRef.current = null
    lastObjectAnalysisRef.current = 0
    phoneDetectedRef.current = null
    phoneConfidenceRef.current = null
    objectAnalysisLatencyRef.current = null
    headTurnStepRef.current = 'center_waiting'
    headTurnDirectionRef.current = Math.random() < 0.5 ? 'left' : 'right'
    centeredFramesRef.current = 0
    turnFramesRef.current = 0
    stopAllMediaTracks()
  }, [])

  const start = useCallback(async () => {
    releaseResources()
    const generation = lifecycleGenerationRef.current
    const isCurrentGeneration = () =>
      isMountedRef.current && lifecycleGenerationRef.current === generation
    const storage = testLocalStorage()
    setSnapshot({
      ...initialSnapshot,
      started: true,
      camera: 'requesting',
      microphone: 'requesting',
      model: 'loading',
      objectModel: 'loading',
      online: navigator.onLine,
      storage,
      secureContext: window.isSecureContext,
    })

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setSnapshot((current) => ({
        ...current,
        camera: 'error',
        microphone: 'error',
        model: 'error',
        objectModel: 'error',
        error: 'Camera checks require HTTPS or localhost and a supported browser.',
      }))
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      if (!isCurrentGeneration()) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch {
            // ignore
          }
        })
        return
      }

      streamRef.current = stream

      const analysisVideo = document.createElement('video')
      analysisVideo.muted = true
      analysisVideo.playsInline = true
      analysisVideo.srcObject = stream
      await analysisVideo.play()

      if (!isCurrentGeneration()) {
        stream.getTracks().forEach((track) => track.stop())
        analysisVideo.pause()
        analysisVideo.srcObject = null
        return
      }

      videoRef.current = analysisVideo
      canvasRef.current = document.createElement('canvas')

      const videoTrack = stream.getVideoTracks()[0]
      const audioTrack = stream.getAudioTracks()[0]
      videoTrack?.addEventListener('ended', () => {
        if (!isCurrentGeneration()) return
        setSnapshot((current) => ({
          ...current,
          camera: 'error',
          coachingReason: 'no-face',
          blockingReason: 'camera-stopped',
          error: 'The camera stream stopped. Reconnect the camera before continuing.',
        }))
      })

      if (audioTrack) {
        const audioContext = new AudioContext()
        await audioContext.resume()
        if (!isCurrentGeneration()) {
          void audioContext.close().catch(() => {})
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]))
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 1024
        source.connect(analyser)
        audioContextRef.current = audioContext
        analyserRef.current = analyser
        audioBufferRef.current = new Float32Array(analyser.fftSize)
      }

      setSnapshot((current) => ({
        ...current,
        camera: videoTrack ? 'ready' : 'error',
        microphone: audioTrack ? 'ready' : 'error',
      }))

      const { FaceLandmarker, FilesetResolver, ObjectDetector } = await import('@mediapipe/tasks-vision')
      const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT)
      const landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numFaces: 2,
        minFaceDetectionConfidence: 0.45,
        minFacePresenceConfidence: 0.45,
        minTrackingConfidence: 0.45,
      })
      if (!isCurrentGeneration()) {
        try {
          landmarker.close()
        } catch {
          // ignore late MediaPipe teardown errors
        }
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      landmarkerRef.current = landmarker
      setSnapshot((current) => ({ ...current, model: 'ready' }))

      try {
        const objectDetector = await ObjectDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: OBJECT_MODEL, delegate: 'CPU' },
          runningMode: 'VIDEO',
          displayNamesLocale: 'en',
          maxResults: 3,
          scoreThreshold: 0.55,
          categoryAllowlist: ['cell phone'],
        })
        if (!isCurrentGeneration()) {
          try {
            objectDetector.close()
          } catch {
            // ignore late MediaPipe teardown errors
          }
          return
        }
        objectDetectorRef.current = objectDetector
        setSnapshot((current) => ({ ...current, objectModel: 'ready' }))
      } catch {
        if (!isCurrentGeneration()) return
        setSnapshot((current) => ({
          ...current,
          objectModel: 'error',
          error: 'Phone detection could not start. Retry before beginning the test.',
        }))
      }
    } catch (error) {
      if (!isCurrentGeneration()) return
      const permissionDenied =
        error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')
      setSnapshot((current) => ({
        ...current,
        camera: permissionDenied ? 'denied' : current.camera === 'ready' ? 'ready' : 'error',
        microphone: permissionDenied ? 'denied' : current.microphone === 'ready' ? 'ready' : 'error',
        model: current.camera === 'ready' ? 'error' : current.model,
        objectModel: current.camera === 'ready' ? 'error' : current.objectModel,
        error: permissionDenied
          ? 'Camera or microphone permission was not allowed. Nothing was recorded.'
          : 'The private camera analysis could not start. You can retry or use the labelled guided scenario.',
      }))
    }
  }, [releaseResources])

  const useGuidedSignals = useCallback(() => {
    releaseResources()
    headTurnStepRef.current = 'passed'
    centeredFramesRef.current = 3
    turnFramesRef.current = 3
    setSnapshot({
      ...initialSnapshot,
      started: true,
      guided: true,
      camera: 'ready',
      microphone: 'ready',
      model: 'ready',
      objectModel: 'ready',
      faceCount: 1,
      phoneDetected: false,
      phoneConfidence: null,
      framing: 'good',
      lighting: 'good',
      brightness: 128,
      headTurnComplete: true,
      headTurnStep: 'passed',
      headTurnDirection: 'left',
      headTurnProgress: 1,
      audioLevel: 0.12,
      online: navigator.onLine,
      storage: testLocalStorage(),
      secureContext: window.isSecureContext,
      coachingReason: null,
      blockingReason: null,
    })
  }, [releaseResources])

  const reset = useCallback(() => {
    releaseResources()
    setSnapshot({
      ...initialSnapshot,
      online: navigator.onLine,
      secureContext: window.isSecureContext,
    })
  }, [releaseResources])

  useEffect(() => {
    const onOnline = () => setSnapshot((current) => ({ ...current, online: true }))
    const onOffline = () => setSnapshot((current) => ({ ...current, online: false }))
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (snapshot.model !== 'ready' || snapshot.objectModel !== 'ready' || snapshot.guided) return

    const timer = window.setInterval(() => {
      const video = videoRef.current
      const landmarker = landmarkerRef.current
      const objectDetector = objectDetectorRef.current
      const canvas = canvasRef.current
      if (!video || !landmarker || !objectDetector || !canvas || video.readyState < 2) return

      try {
        const analysisStartedAt = performance.now()
        const result = landmarker.detectForVideo(video, analysisStartedAt)
        const analysisLatencyMs = performance.now() - analysisStartedAt
        const faceCount = result.faceLandmarks.length
        const brightness = measureBrightness(video, canvas)
        const lighting: LightingStatus =
          brightness === null ? 'idle' : brightness < 40 ? 'dim' : brightness > 235 ? 'bright' : 'good'
        const onlyFace = result.faceLandmarks[0]
        const metrics = faceCount === 1 && onlyFace ? getFaceMetrics(onlyFace) : null
        const now = performance.now()

        if (now - lastObjectAnalysisRef.current >= OBJECT_DETECTION_INTERVAL_MS) {
          const objectAnalysisStartedAt = performance.now()
          const objectResult = objectDetector.detectForVideo(video, objectAnalysisStartedAt)
          objectAnalysisLatencyRef.current = performance.now() - objectAnalysisStartedAt
          lastObjectAnalysisRef.current = now
          const phoneConfidence = objectResult.detections.reduce((highest, detection) => {
            const phoneCategory = detection.categories.find((category) => category.categoryName === 'cell phone')
            return Math.max(highest, phoneCategory?.score ?? 0)
          }, 0)
          phoneDetectedRef.current = phoneConfidence >= 0.55
          phoneConfidenceRef.current = phoneConfidence > 0 ? phoneConfidence : null
        }

        if (phoneDetectedRef.current) {
          phoneSinceRef.current ??= now
        } else {
          phoneSinceRef.current = null
        }

        if (faceCount === 0) {
          noFaceSinceRef.current ??= now
        } else {
          noFaceSinceRef.current = null
        }

        if (faceCount > 1) {
          multipleFaceSinceRef.current ??= now
        } else {
          multipleFaceSinceRef.current = null
        }

        if (metrics && !metrics.framing) {
          framingIssueSinceRef.current ??= now
        } else {
          framingIssueSinceRef.current = null
        }

        if (lighting === 'dim' || lighting === 'bright') {
          lightingIssueSinceRef.current ??= now
        } else {
          lightingIssueSinceRef.current = null
        }

        // Multi-frame head turn challenge
        let currentTurnStep = headTurnStepRef.current
        let currentTurnDirection = headTurnDirectionRef.current
        let headTurnProgress = 0

        if (currentTurnStep === 'center_waiting') {
          if (metrics && metrics.isCentered && metrics.framing && faceCount === 1) {
            centeredFramesRef.current++
            headTurnProgress = Math.min(0.5, (centeredFramesRef.current / 3) * 0.5)
            if (centeredFramesRef.current >= 3) {
              currentTurnStep = 'turn_requested'
              headTurnStepRef.current = 'turn_requested'
              currentTurnDirection = Math.random() < 0.5 ? 'left' : 'right'
              headTurnDirectionRef.current = currentTurnDirection
              turnFramesRef.current = 0
            }
          } else {
            centeredFramesRef.current = Math.max(0, centeredFramesRef.current - 1)
            headTurnProgress = 0
          }
        } else if (currentTurnStep === 'turn_requested' || currentTurnStep === 'turning') {
          headTurnProgress = 0.5
          if (metrics && metrics.framing && faceCount === 1) {
            const isTargetTurn = matchesRequestedHeadTurn(currentTurnDirection, metrics.signedYaw)

            if (isTargetTurn) {
              turnFramesRef.current++
              currentTurnStep = 'turning'
              headTurnStepRef.current = 'turning'
              headTurnProgress = 0.5 + (turnFramesRef.current / 3) * 0.5
              if (turnFramesRef.current >= 3) {
                currentTurnStep = 'passed'
                headTurnStepRef.current = 'passed'
                headTurnProgress = 1
              }
            } else {
              turnFramesRef.current = Math.max(0, turnFramesRef.current - 1)
            }
          }
        } else if (currentTurnStep === 'passed') {
          headTurnProgress = 1
        }

        const isHeadTurnPassed = currentTurnStep === 'passed'

        const { coachingReason, blockingReason } = decideMonitoringAction({
          noFaceMs: noFaceSinceRef.current ? now - noFaceSinceRef.current : 0,
          multipleFacesMs: multipleFaceSinceRef.current ? now - multipleFaceSinceRef.current : 0,
          framingIssueMs: framingIssueSinceRef.current ? now - framingIssueSinceRef.current : 0,
          lightingIssueMs: lightingIssueSinceRef.current ? now - lightingIssueSinceRef.current : 0,
          phoneMs: phoneSinceRef.current ? now - phoneSinceRef.current : 0,
        })

        setSnapshot((current) => ({
          ...current,
          faceCount,
          phoneDetected: phoneDetectedRef.current,
          phoneConfidence: phoneConfidenceRef.current,
          framing: metrics ? (metrics.framing ? 'good' : 'adjust') : 'idle',
          lighting,
          brightness,
          headTurnComplete: current.headTurnComplete || isHeadTurnPassed,
          headTurnStep: currentTurnStep,
          headTurnDirection: currentTurnDirection,
          headTurnProgress,
          audioLevel: measureAudio(analyserRef.current, audioBufferRef.current),
          coachingReason,
          blockingReason,
          analysisLatencyMs,
          objectAnalysisLatencyMs: objectAnalysisLatencyRef.current,
        }))
      } catch {
        setSnapshot((current) => ({
          ...current,
          model: 'error',
          error: 'Face analysis stopped unexpectedly. Retry the device check.',
        }))
      }
    }, 350)

    return () => window.clearInterval(timer)
  }, [snapshot.guided, snapshot.model, snapshot.objectModel])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      releaseResources()
    }
  }, [releaseResources])

  const ready = useMemo(
    () =>
      snapshot.camera === 'ready' &&
      snapshot.microphone === 'ready' &&
      snapshot.model === 'ready' &&
      snapshot.objectModel === 'ready' &&
      snapshot.faceCount === 1 &&
      snapshot.phoneDetected === false &&
      snapshot.framing === 'good' &&
      snapshot.lighting === 'good' &&
      snapshot.headTurnComplete &&
      snapshot.storage &&
      snapshot.secureContext &&
      snapshot.online,
    [snapshot],
  )

  return {
    snapshot,
    stream: streamRef.current,
    ready,
    start,
    useGuidedSignals,
    reset,
    stop: releaseResources,
  }
}

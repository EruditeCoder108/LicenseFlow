import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'

const WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

export type MediaStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'error'
export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'
export type FramingStatus = 'idle' | 'good' | 'adjust'
export type LightingStatus = 'idle' | 'good' | 'dim' | 'bright'
export type MediaBlockingReason = 'no-face' | 'multiple-faces' | 'camera-stopped' | null

export interface DeviceReadinessSnapshot {
  started: boolean
  guided: boolean
  camera: MediaStatus
  microphone: MediaStatus
  model: ModelStatus
  faceCount: number | null
  framing: FramingStatus
  lighting: LightingStatus
  brightness: number | null
  headTurnComplete: boolean
  audioLevel: number
  online: boolean
  storage: boolean
  secureContext: boolean
  blockingReason: MediaBlockingReason
  error?: string
}

const initialSnapshot: DeviceReadinessSnapshot = {
  started: false,
  guided: false,
  camera: 'idle',
  microphone: 'idle',
  model: 'idle',
  faceCount: null,
  framing: 'idle',
  lighting: 'idle',
  brightness: null,
  headTurnComplete: false,
  audioLevel: 0,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  storage: false,
  secureContext: typeof window === 'undefined' ? true : window.isSecureContext,
  blockingReason: null,
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
  const yawSignal = spanTotal > 0 ? Math.abs(leftSpan - rightSpan) / spanTotal : 0

  return {
    framing:
      width >= 0.24 &&
      width <= 0.78 &&
      height >= 0.3 &&
      centerX >= 0.27 &&
      centerX <= 0.73 &&
      centerY >= 0.25 &&
      centerY <= 0.72,
    turned: yawSignal >= 0.18,
  }
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

export function useDeviceReadiness() {
  const [snapshot, setSnapshot] = useState<DeviceReadinessSnapshot>(initialSnapshot)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioBufferRef = useRef<Float32Array<ArrayBuffer> | null>(null)
  const noFaceSinceRef = useRef<number | null>(null)
  const multipleFaceSinceRef = useRef<number | null>(null)

  const releaseResources = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    videoRef.current = null
    landmarkerRef.current?.close()
    landmarkerRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null
    analyserRef.current = null
    audioBufferRef.current = null
  }, [])

  const start = useCallback(async () => {
    releaseResources()
    const storage = testLocalStorage()
    setSnapshot({
      ...initialSnapshot,
      started: true,
      camera: 'requesting',
      microphone: 'requesting',
      model: 'loading',
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
      streamRef.current = stream

      const analysisVideo = document.createElement('video')
      analysisVideo.muted = true
      analysisVideo.playsInline = true
      analysisVideo.srcObject = stream
      await analysisVideo.play()
      videoRef.current = analysisVideo
      canvasRef.current = document.createElement('canvas')

      const videoTrack = stream.getVideoTracks()[0]
      const audioTrack = stream.getAudioTracks()[0]
      videoTrack?.addEventListener('ended', () => {
        setSnapshot((current) => ({
          ...current,
          camera: 'error',
          blockingReason: 'camera-stopped',
          error: 'The camera stream stopped. Reconnect the camera before continuing.',
        }))
      })

      if (audioTrack) {
        const audioContext = new AudioContext()
        await audioContext.resume()
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

      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT)
      const landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numFaces: 2,
        minFaceDetectionConfidence: 0.45,
        minFacePresenceConfidence: 0.45,
        minTrackingConfidence: 0.45,
      })
      landmarkerRef.current = landmarker
      setSnapshot((current) => ({ ...current, model: 'ready' }))
    } catch (error) {
      const permissionDenied =
        error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')
      setSnapshot((current) => ({
        ...current,
        camera: permissionDenied ? 'denied' : current.camera === 'ready' ? 'ready' : 'error',
        microphone: permissionDenied ? 'denied' : current.microphone === 'ready' ? 'ready' : 'error',
        model: current.camera === 'ready' ? 'error' : current.model,
        error: permissionDenied
          ? 'Camera or microphone permission was not allowed. Nothing was recorded.'
          : 'The private camera analysis could not start. You can retry or use the labelled guided scenario.',
      }))
    }
  }, [releaseResources])

  const useGuidedSignals = useCallback(() => {
    releaseResources()
    setSnapshot({
      ...initialSnapshot,
      started: true,
      guided: true,
      camera: 'ready',
      microphone: 'ready',
      model: 'ready',
      faceCount: 1,
      framing: 'good',
      lighting: 'good',
      brightness: 128,
      headTurnComplete: true,
      audioLevel: 0.12,
      online: navigator.onLine,
      storage: testLocalStorage(),
      secureContext: window.isSecureContext,
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
    if (snapshot.model !== 'ready' || snapshot.guided) return

    const timer = window.setInterval(() => {
      const video = videoRef.current
      const landmarker = landmarkerRef.current
      const canvas = canvasRef.current
      if (!video || !landmarker || !canvas || video.readyState < 2) return

      try {
        const result = landmarker.detectForVideo(video, performance.now())
        const faceCount = result.faceLandmarks.length
        const brightness = measureBrightness(video, canvas)
        const lighting: LightingStatus =
          brightness === null ? 'idle' : brightness < 55 ? 'dim' : brightness > 220 ? 'bright' : 'good'
        const onlyFace = result.faceLandmarks[0]
        const metrics = faceCount === 1 && onlyFace ? getFaceMetrics(onlyFace) : null
        const now = performance.now()

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

        const blockingReason: MediaBlockingReason =
          multipleFaceSinceRef.current && now - multipleFaceSinceRef.current > 1400
            ? 'multiple-faces'
            : noFaceSinceRef.current && now - noFaceSinceRef.current > 3000
              ? 'no-face'
              : null

        setSnapshot((current) => ({
          ...current,
          faceCount,
          framing: metrics ? (metrics.framing ? 'good' : 'adjust') : 'idle',
          lighting,
          brightness,
          headTurnComplete: current.headTurnComplete || Boolean(metrics?.turned),
          audioLevel: measureAudio(analyserRef.current, audioBufferRef.current),
          blockingReason,
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
  }, [snapshot.guided, snapshot.model])

  useEffect(() => releaseResources, [releaseResources])

  const ready = useMemo(
    () =>
      snapshot.camera === 'ready' &&
      snapshot.microphone === 'ready' &&
      snapshot.model === 'ready' &&
      snapshot.faceCount === 1 &&
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

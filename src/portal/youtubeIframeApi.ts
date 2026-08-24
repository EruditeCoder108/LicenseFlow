export type YouTubePlayer = {
  destroy: () => void
  getCurrentTime: () => number
  getDuration: () => number
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setPlaybackRate?: (rate: number) => void
}

export type YouTubePlayerEvent = {
  target: YouTubePlayer
}

export type YouTubePlayerStateEvent = YouTubePlayerEvent & {
  data: number
}

export type YouTubeApi = {
  Player: new (
    element: string | HTMLElement,
    options: {
      videoId: string
      playerVars?: Record<string, string | number>
      events?: {
        onReady?: (event: YouTubePlayerEvent) => void
        onStateChange?: (event: YouTubePlayerStateEvent) => void
        onError?: () => void
      }
    },
  ) => YouTubePlayer
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: unknown
  }
}

const scriptSelector = 'script[data-licenceflow-youtube-api]'
let apiPromise: Promise<YouTubeApi> | null = null

export function loadYouTubeIframeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    let settled = false
    let timeoutId: ReturnType<typeof setTimeout>
    const previousReady = typeof window.onYouTubeIframeAPIReady === 'function'
      ? window.onYouTubeIframeAPIReady as () => void
      : null

    const finish = () => {
      if (settled || !window.YT?.Player) return
      settled = true
      clearTimeout(timeoutId)
      resolve(window.YT)
    }

    const fail = () => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      apiPromise = null
      reject(new Error('The YouTube player could not be loaded.'))
    }

    window.onYouTubeIframeAPIReady = () => {
      try {
        previousReady?.()
      } catch {
        // Another integration's callback must not break this player.
      }
      finish()
    }

    let script = document.querySelector<HTMLScriptElement>(scriptSelector)
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.dataset.licenceflowYoutubeApi = 'true'
      document.head.appendChild(script)
    }
    script.addEventListener('error', fail, { once: true })

    timeoutId = setTimeout(fail, 15_000)
    queueMicrotask(finish)
  })

  return apiPromise
}

export function resetYouTubeIframeApiLoaderForTests(): void {
  apiPromise = null
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadYouTubeIframeApi, resetYouTubeIframeApiLoaderForTests, type YouTubeApi } from './youtubeIframeApi'

afterEach(() => {
  resetYouTubeIframeApiLoaderForTests()
  vi.unstubAllGlobals()
})

describe('YouTube IFrame API loader', () => {
  it('deduplicates reload-safe requests and tolerates a non-function global callback', async () => {
    const listeners = new Map<string, () => void>()
    const script = {
      async: false,
      dataset: {} as Record<string, string>,
      src: '',
      addEventListener: vi.fn((name: string, listener: () => void) => listeners.set(name, listener)),
    }
    const appendChild = vi.fn()
    const fakeWindow: { YT?: YouTubeApi; onYouTubeIframeAPIReady?: unknown } = {
      onYouTubeIframeAPIReady: 'corrupted callback from an earlier mount',
    }
    vi.stubGlobal('window', fakeWindow)
    vi.stubGlobal('document', {
      querySelector: vi.fn(() => null),
      createElement: vi.fn(() => script),
      head: { appendChild },
    })

    const first = loadYouTubeIframeApi()
    const second = loadYouTubeIframeApi()
    expect(second).toBe(first)
    expect(appendChild).toHaveBeenCalledTimes(1)

    const api = { Player: class {} } as unknown as YouTubeApi
    fakeWindow.YT = api
    expect(typeof fakeWindow.onYouTubeIframeAPIReady).toBe('function')
    ;(fakeWindow.onYouTubeIframeAPIReady as () => void)()

    await expect(first).resolves.toBe(api)
    expect(listeners.has('error')).toBe(true)
  })
})

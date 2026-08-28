import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestRaahiReply } from './chatClient'

afterEach(() => {
  vi.unstubAllGlobals()
})

const request = {
  sessionId: 'session-client-test',
  context: { pathname: '/mp/services', language: 'en' as const, applicationStage: 'Not started' },
  messages: [{ role: 'user' as const, content: 'What do I do next?' }],
}

describe('Raahi chat client', () => {
  it('posts the safe assistant request to the same-origin server endpoint', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ answer: 'Choose Learner’s Licence.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(requestRaahiReply(request)).resolves.toEqual({ answer: 'Choose Learner’s Licence.', requestId: undefined })
    expect(fetchMock).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }))
    const init = fetchMock.mock.calls[0]?.[1]
    expect(JSON.parse(String(init?.body))).toEqual(request)
  })

  it('preserves the server error code for helpful UI recovery', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      error: 'Do not share personal details.',
      code: 'sensitive_data_detected',
    }), { status: 400, headers: { 'Content-Type': 'application/json' } })))

    await expect(requestRaahiReply(request)).rejects.toMatchObject({
      code: 'sensitive_data_detected',
      status: 400,
    })
  })

  it('treats a local HTML 404 as an assistant that is not configured yet', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<!doctype html>', {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    })))

    await expect(requestRaahiReply(request)).rejects.toMatchObject({
      code: 'assistant_not_configured',
      status: 404,
    })
  })
})

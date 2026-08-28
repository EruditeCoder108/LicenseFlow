import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleChatRequest } from './index.js'

const requestFor = (body, headers = {}) => new Request('https://licenceflow.example/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'https://licenceflow.example', ...headers },
  body: JSON.stringify(body),
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Raahi server boundary', () => {
  it('keeps the assistant disabled when no server-side key is configured', async () => {
    const response = await handleChatRequest(requestFor({
      sessionId: 'session-missing-key',
      context: { pathname: '/', language: 'en' },
      messages: [{ role: 'user', content: 'What can I do here?' }],
    }), {})

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ code: 'assistant_not_configured' })
  })

  it('rejects personal data before contacting an AI provider', async () => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const response = await handleChatRequest(requestFor({
      sessionId: 'session-sensitive-data',
      messages: [{ role: 'user', content: 'My Aadhaar is 1234 5678 9012. What next?' }],
    }), { OPENAI_API_KEY: 'server-secret' })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ code: 'sensitive_data_detected' })
    expect(upstream).not.toHaveBeenCalled()
  })

  it('sends only bounded chat and safe page context with storage disabled', async () => {
    let upstreamBody
    vi.stubGlobal('fetch', vi.fn(async (_url, init) => {
      upstreamBody = JSON.parse(init.body)
      return new Response(JSON.stringify({
        output: [{ content: [{ type: 'output_text', text: 'Your next step is the device check.' }] }],
      }), { status: 200, headers: { 'x-request-id': 'req_test_123' } })
    }))

    const response = await handleChatRequest(requestFor({
      sessionId: 'session-safe-context',
      context: { pathname: '/mp/application/DEMO/readiness', language: 'en', applicationStage: 'Device check' },
      messages: [{ role: 'user', content: 'What happens here?' }],
    }), { OPENAI_API_KEY: 'server-secret' })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ answer: 'Your next step is the device check.', requestId: 'req_test_123' })
    expect(upstreamBody.model).toBe('gpt-5.4-mini')
    expect(upstreamBody.store).toBe(false)
    expect(upstreamBody.reasoning).toEqual({ effort: 'none' })
    expect(upstreamBody.input).toEqual([{ role: 'user', content: 'What happens here?' }])
    expect(upstreamBody.instructions).toContain('/mp/application/DEMO/readiness')
    expect(upstreamBody.instructions).toContain('Never answer, solve or hint at an active Learner')
  })

  it('does not accept cross-origin browser requests', async () => {
    const request = requestFor({ messages: [{ role: 'user', content: 'Hello' }] }, { Origin: 'https://attacker.example' })
    const response = await handleChatRequest(request, { OPENAI_API_KEY: 'server-secret' })
    expect(response.status).toBe(403)
  })
})

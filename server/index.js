import { handleReliabilityRequest } from './reliability.js'

const DEFAULT_MODEL = 'gpt-5.4-mini'
const MAX_BODY_BYTES = 16_000
const MAX_MESSAGE_LENGTH = 1_200
const MAX_HISTORY_MESSAGES = 8
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_REQUESTS = 12

const rateLimitBuckets = new Map()

const ASSISTANT_KNOWLEDGE = `You are Raahi, the in-product guide for LicenceFlow, an independent Build What Moves India hackathon prototype for the Madhya Pradesh Learner's Licence journey.

Your job is narrow: help a citizen understand the current LicenceFlow screen, what a control means, why a step exists, and what they should do next. Be warm, calm, practical and concise. Prefer two short paragraphs or a short list. Use simple everyday language. Reply in Hindi when language is hi; otherwise use clear Indian English.

Truth and safety boundaries:
- LicenceFlow is an unofficial prototype. All applications, Aadhaar checks, documents, payments, test attempts, licences and applicant records shown in it are synthetic simulations. Never imply that an official application was filed or an official licence was issued.
- Never ask for or accept Aadhaar, PAN, licence, phone, email, address, card, bank, OTP, password, biometric or other personal details. Explain where the prototype expects a field without asking the user to send its value in chat.
- Never answer, solve or hint at an active Learner's Licence test or practice question. You may explain how the test interface, timer, review controls, retests and saved answers work.
- Do not provide legal assurance or invent Madhya Pradesh rules, fees, deadlines or eligibility requirements. If a current official fact is required, say that the citizen should verify it on the official Sarathi/Parivahan or Madhya Pradesh Transport service.
- Stay within LicenceFlow and the Learner's Licence journey. Politely decline unrelated requests.

LicenceFlow journey and product decisions:
1. Home and services: the citizen chooses Driving licence services, Madhya Pradesh, then Apply for Learner's Licence.
2. Application: seven clearly separated parts cover current licence situation, identity route, personal details, address, vehicle class, fitness/accessibility declaration and final review. Progress is saved in this browser in the prototype. Judge-only quick-fill controls use fictional data.
3. Documents: the prototype shows document, portrait and signature attachment. Judge demo files are fictional and remain part of the simulation.
4. Readiness before payment: camera, microphone, connection, lighting and test-environment checks happen before the fee step so a technical incompatibility is found early. The normal route requests device permission. The clearly labelled judge simulation does not open the camera or microphone.
5. Demo question: one rehearsal question confirms that the device can display a question, record a choice and save it. It does not count as an attempt.
6. Payment: the fee and consent are shown before a clearly labelled simulated gateway. Payment can be not started, processing, successful, failed or uncertain. Duplicate-payment protection and a status/receipt path are demonstrated; no real money moves.
7. Learning: tutorial progress is saved and normal citizens must complete the video. The judge shortcut only removes waiting time in the hackathon demonstration.
8. Test: a seeded 15-question paper is drawn from a reviewed bank with a stable difficulty blueprint so retests change questions without becoming unfairly easier or harder. The pass mark shown by the prototype is 9 of 15. Answers are checkpointed before moving on. Questions can be read aloud.
9. Monitoring and recovery: on-device MediaPipe supplies camera context; the prototype does not record or upload video or identify a face. Brief noise gets guidance. A sustained technical interruption pauses safely. A technical anomaly is not automatically called cheating. Knowledge, technical failure and integrity are treated separately.
10. Result: the result shows score, pass threshold, attempt metadata, technical events and monitoring notes. Answer review opens separately with the selected answer, correct answer and explanation. The generated Learner's Licence is a fictional demonstration document. Reset demo clears the prototype's locally stored progress.

Core design principle: technical failure should never become citizen failure. At every stage, answer three questions when useful: What happened? What does it mean for me? What should I do next?`

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  },
})

const hasSensitiveData = (value) => {
  const compactDigits = value.replace(/[\s-]/g, '')
  return /\b[A-Z]{5}\d{4}[A-Z]\b/i.test(value)
    || /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(value)
    || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)
    || /(?:\+?91[\s-]?)?[6-9]\d{9}\b/.test(compactDigits)
    || /\b(?:\d[ -]*?){13,19}\b/.test(value)
}

const safeContext = (raw) => {
  const pathname = typeof raw?.pathname === 'string' && raw.pathname.startsWith('/')
    ? raw.pathname.slice(0, 180)
    : '/'
  const language = raw?.language === 'hi' ? 'hi' : 'en'
  const applicationStage = typeof raw?.applicationStage === 'string'
    ? raw.applicationStage.replace(/[^\p{L}\p{N} &/().-]/gu, '').slice(0, 80)
    : 'Not started'
  return { pathname, language, applicationStage }
}

const normalizeMessages = (raw) => {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
    .map((message) => ({ role: message.role, content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH) }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES)
}

const getRateLimitKey = (request, sessionId) => {
  const ip = request.headers.get('CF-Connecting-IP') || 'local'
  const safeSession = typeof sessionId === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(sessionId) ? sessionId : 'anonymous'
  return `${ip}:${safeSession}`
}

const consumeRateLimit = (key, now = Date.now()) => {
  for (const [bucketKey, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(bucketKey)
  }

  const bucket = rateLimitBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }

  if (bucket.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }

  bucket.count += 1
  return { allowed: true, retryAfter: 0 }
}

const readOutputText = (response) => {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) return response.output_text.trim()
  if (!Array.isArray(response?.output)) return ''
  return response.output
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter((content) => content?.type === 'output_text' && typeof content.text === 'string')
    .map((content) => content.text)
    .join('\n')
    .trim()
}

export async function handleChatRequest(request, env) {
  const requestUrl = new URL(request.url)
  const origin = request.headers.get('Origin')
  if (origin && origin !== requestUrl.origin) {
    return json({ error: 'Request origin is not allowed.', code: 'origin_not_allowed' }, 403)
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.', code: 'method_not_allowed' }, 405, { Allow: 'POST' })
  }

  if (!(request.headers.get('Content-Type') || '').toLowerCase().includes('application/json')) {
    return json({ error: 'Send a JSON request.', code: 'invalid_content_type' }, 415)
  }

  const declaredLength = Number(request.headers.get('Content-Length') || '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json({ error: 'Message is too large.', code: 'request_too_large' }, 413)
  }

  let body
  try {
    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return json({ error: 'Message is too large.', code: 'request_too_large' }, 413)
    }
    body = JSON.parse(rawBody)
  } catch {
    return json({ error: 'The request could not be read.', code: 'invalid_json' }, 400)
  }

  const messages = normalizeMessages(body?.messages)
  if (!messages.length || messages.at(-1)?.role !== 'user') {
    return json({ error: 'Add a question for Raahi.', code: 'missing_message' }, 400)
  }

  if (messages.some((message) => hasSensitiveData(message.content))) {
    return json({
      error: 'For your safety, do not share identity, contact or payment details in chat.',
      code: 'sensitive_data_detected',
    }, 400)
  }

  const rateLimit = consumeRateLimit(getRateLimitKey(request, body?.sessionId))
  if (!rateLimit.allowed) {
    return json({ error: 'Raahi has received several messages. Please try again shortly.', code: 'rate_limited' }, 429, {
      'Retry-After': String(rateLimit.retryAfter),
    })
  }

  if (!env?.OPENAI_API_KEY) {
    return json({ error: 'AI guidance is not configured yet.', code: 'assistant_not_configured' }, 503)
  }

  const context = safeContext(body?.context)
  const contextualInstructions = `${ASSISTANT_KNOWLEDGE}\n\nCurrent safe page context (not authoritative user data):\n- Route: ${context.pathname}\n- Interface language: ${context.language}\n- Broad saved journey stage: ${context.applicationStage}`
  const model = typeof env.OPENAI_CHAT_MODEL === 'string' && env.OPENAI_CHAT_MODEL.length <= 80
    ? env.OPENAI_CHAT_MODEL
    : DEFAULT_MODEL

  let upstreamResponse
  try {
    upstreamResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions: contextualInstructions,
        input: messages,
        max_output_tokens: 400,
        reasoning: { effort: 'none' },
        text: { verbosity: 'low' },
        store: false,
      }),
    })
  } catch {
    return json({ error: 'Raahi could not connect. Please try again.', code: 'upstream_unavailable' }, 502)
  }

  const requestId = upstreamResponse.headers.get('x-request-id') || undefined
  if (!upstreamResponse.ok) {
    return json({
      error: upstreamResponse.status === 429
        ? 'Raahi is busy right now. Please try again shortly.'
        : 'Raahi could not answer right now. Please try again.',
      code: upstreamResponse.status === 429 ? 'upstream_rate_limited' : 'upstream_error',
      requestId,
    }, upstreamResponse.status === 429 ? 429 : 502)
  }

  let responseData
  try {
    responseData = await upstreamResponse.json()
  } catch {
    return json({ error: 'Raahi returned an unreadable response.', code: 'invalid_upstream_response', requestId }, 502)
  }

  const answer = readOutputText(responseData)
  if (!answer) {
    return json({ error: 'Raahi did not return an answer. Please try again.', code: 'empty_upstream_response', requestId }, 502)
  }

  return json({ answer, requestId })
}

const withSiteHeaders = (response, path) => {
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Cache-Control', path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/chat') return handleChatRequest(request, env)
    if (url.pathname.startsWith('/api/reliability/')) return handleReliabilityRequest(request, env)

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
    }

    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404) return withSiteHeaders(response, url.pathname)

    const acceptsHtml = (request.headers.get('accept') || '').includes('text/html')
    if (!acceptsHtml) return withSiteHeaders(response, url.pathname)

    const indexUrl = new URL('/index.html', request.url)
    const indexRequest = new Request(indexUrl, request)
    const indexResponse = await env.ASSETS.fetch(indexRequest)
    return withSiteHeaders(indexResponse, '/index.html')
  },
}

export type AssistantLanguage = 'en' | 'hi'
export type AssistantRole = 'user' | 'assistant'

export interface AssistantMessageInput {
  role: AssistantRole
  content: string
}

export interface AssistantPageContext {
  pathname: string
  language: AssistantLanguage
  applicationStage?: string
}

interface ChatRequest {
  messages: AssistantMessageInput[]
  context: AssistantPageContext
  sessionId: string
}

interface ChatResponse {
  answer?: string
  error?: string
  code?: string
  requestId?: string
}

export class RaahiChatError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code = 'unknown_error', status = 0) {
    super(message)
    this.name = 'RaahiChatError'
    this.code = code
    this.status = status
  }
}

export async function requestRaahiReply(request: ChatRequest, signal?: AbortSignal) {
  let response: Response
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new RaahiChatError('Raahi could not connect. Check your connection and try again.', 'network_error')
  }

  let data: ChatResponse = {}
  try {
    data = await response.json() as ChatResponse
  } catch {
    if (response.status === 404 || response.status === 405) {
      throw new RaahiChatError('AI guidance is not configured yet.', 'assistant_not_configured', response.status)
    }
    throw new RaahiChatError('Raahi returned an unreadable response.', 'invalid_response', response.status)
  }

  if (!response.ok || !data.answer) {
    throw new RaahiChatError(data.error || 'Raahi could not answer right now.', data.code || 'request_failed', response.status)
  }

  return { answer: data.answer, requestId: data.requestId }
}

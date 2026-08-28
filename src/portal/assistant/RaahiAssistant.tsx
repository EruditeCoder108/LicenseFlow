import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { BookOpenCheck, Info, LoaderCircle, RotateCcw, Send, X } from 'lucide-react'
import { RAAHI_ASSETS, type Language } from '../judgeTour'
import type { AssistantMessageInput } from './chatClient'
import { containsSensitiveDetails, getLocalRaahiReply } from './localGuide'
import { translate as copy } from '../i18n'

interface RaahiAssistantProps {
  pathname: string
  language: Language
  applicationStage?: string
  hidden?: boolean
}

interface DisplayMessage extends AssistantMessageInput {
  id: string
}

const createId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const replyDelay = (question: string) => 850 + Math.min(550, question.length * 9)

const welcomeMessage = (language: Language): DisplayMessage => ({
  id: createId(),
  role: 'assistant',
  content: copy(
    language,
    'Hello, I’m Raahi. Ask how to apply, what this page means, or what to do next.',
    'नमस्ते, मैं राही हूँ। पूछें कि आवेदन कैसे करें, यह पेज क्या बताता है, या आगे क्या करना है।',
  ),
})

function suggestionsFor(pathname: string, language: Language) {
  const choose = (english: string[], hindi: string[]) => english.map((item, index) => copy(language, item, hindi[index] ?? item))
  if (pathname.includes('/mp/services')) {
    return choose(['What should I do next?', 'How does LicenceFlow protect my progress?', 'Is this an official government site?'], ['अब मुझे क्या करना है?', 'LicenceFlow मेरी प्रगति कैसे बचाता है?', 'क्या यह आधिकारिक सरकारी वेबसाइट है?'])
  }
  if (pathname.includes('/readiness')) {
    return choose(['Why check my device before payment?', 'Will the camera video be uploaded?', 'What should I do next?'], ['भुगतान से पहले डिवाइस की जाँच क्यों?', 'क्या कैमरा वीडियो अपलोड होगा?', 'अब मुझे क्या करना है?'])
  }
  if (pathname.includes('/payment')) {
    return choose(['What happens if payment is uncertain?', 'Can I be charged twice?', 'What should I do next?'], ['भुगतान की स्थिति साफ़ न हो तो क्या होगा?', 'क्या दो बार शुल्क लग सकता है?', 'अब मुझे क्या करना है?'])
  }
  if (pathname.includes('/tutorial')) {
    return choose(['Why is the tutorial required?', 'Is my progress saved?', 'What happens after this?'], ['ट्यूटोरियल क्यों ज़रूरी है?', 'क्या मेरी प्रगति सुरक्षित है?', 'इसके बाद क्या होगा?'])
  }
  if (pathname.includes('/result')) {
    return choose(['How do I review my answers?', 'What do the monitoring notes mean?', 'Is this an official licence?'], ['मैं उत्तर कैसे देखूँ?', 'निगरानी नोट्स का क्या अर्थ है?', 'क्या यह आधिकारिक लाइसेंस है?'])
  }
  if (pathname.includes('/application') || pathname.includes('/ll/')) {
    return choose(['What information will I need?', 'Is my progress saved?', 'What should I do next?'], ['मुझे कौन-सी जानकारी चाहिए?', 'क्या मेरी प्रगति सुरक्षित है?', 'अब मुझे क्या करना है?'])
  }
  return choose(['What can I do here?', 'How does LicenceFlow protect my progress?', 'Is this an official government site?'], ['मैं यहाँ क्या कर सकता हूँ?', 'LicenceFlow मेरी प्रगति कैसे बचाता है?', 'क्या यह आधिकारिक सरकारी वेबसाइट है?'])
}

export function RaahiAssistant({ pathname, language, applicationStage, hidden = false }: RaahiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<DisplayMessage[]>(() => [welcomeMessage(language)])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const launcherRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const replyTimerRef = useRef<number | null>(null)
  const suggestions = useMemo(() => suggestionsFor(pathname, language), [pathname, language])

  useEffect(() => {
    setMessages((current) => current.length === 1 ? [welcomeMessage(language)] : current)
  }, [language])

  useEffect(() => {
    if (!hidden) return
    setIsOpen(false)
    if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current)
    replyTimerRef.current = null
    setIsSending(false)
  }, [hidden])

  useEffect(() => () => {
    if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  const close = () => {
    setIsOpen(false)
    window.requestAnimationFrame(() => launcherRef.current?.focus({ preventScroll: true }))
  }

  const reset = () => {
    if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current)
    replyTimerRef.current = null
    setMessages([welcomeMessage(language)])
    setInput('')
    setError('')
    setIsSending(false)
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  const send = (question: string) => {
    const content = question.trim()
    if (!content || isSending) return

    if (containsSensitiveDetails(content)) {
      setInput('')
      setError(copy(language, 'For your safety, remove Aadhaar, phone, email or payment numbers before asking. Nothing was sent or saved.', 'आपकी सुरक्षा के लिए आधार, फोन, ईमेल या भुगतान नंबर हटाकर पूछें। कुछ भी भेजा या सहेजा नहीं गया।'))
      return
    }

    const userMessage: DisplayMessage = { id: createId(), role: 'user', content: content.slice(0, 1200) }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setError('')
    setIsSending(true)

    replyTimerRef.current = window.setTimeout(() => {
      const answer = getLocalRaahiReply(content, { pathname, language, applicationStage })
      setMessages((current) => [...current, { id: createId(), role: 'assistant', content: answer }])
      setIsSending(false)
      replyTimerRef.current = null
    }, replyDelay(content))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send(input)
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send(input)
    }
  }

  if (hidden) return null

  return (
    <aside className={`raahi-chat ${isOpen ? 'raahi-chat--open' : ''}`}>
      {isOpen && (
        <section
          id="raahi-chat-panel"
          className="raahi-chat__panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="raahi-chat-title"
          onKeyDown={(event) => { if (event.key === 'Escape') close() }}
        >
          <header className="raahi-chat__header">
            <div className="raahi-chat__identity">
              <span className="raahi-chat__avatar" aria-hidden="true">
                <img
                  src={RAAHI_ASSETS.thinking.src}
                  srcSet={`${RAAHI_ASSETS.thinking.smallSrc} 240w, ${RAAHI_ASSETS.thinking.src} 400w`}
                  sizes="40px"
                  alt=""
                  width="40"
                  height="53"
                />
              </span>
              <div>
                <span className="raahi-chat__kicker"><BookOpenCheck size={13} /> {copy(language, 'Built-in demo guide', 'अंतर्निहित डेमो गाइड')}</span>
                <h2 id="raahi-chat-title">{copy(language, 'Ask Raahi', 'राही से पूछें')}</h2>
              </div>
            </div>
            <div className="raahi-chat__header-actions">
              <button type="button" className="raahi-chat__icon-button" onClick={reset} aria-label={copy(language, 'Start a new chat', 'नई चैट शुरू करें')} title={copy(language, 'New chat', 'नई चैट')}>
                <RotateCcw size={18} />
              </button>
              <button type="button" className="raahi-chat__icon-button" onClick={close} aria-label={copy(language, 'Close Raahi', 'राही बंद करें')}>
                <X size={20} />
              </button>
            </div>
          </header>

          <div className="raahi-chat__notice"><Info size={15} /> <span>{copy(language, 'Built-in demo guidance—OpenAI API is not connected. Do not share Aadhaar, phone, email or payment details.', 'अंतर्निहित डेमो सहायता—OpenAI API जुड़ा नहीं है। आधार, फोन, ईमेल या भुगतान की जानकारी साझा न करें।')}</span></div>

          <div className="raahi-chat__messages" aria-live="polite" aria-busy={isSending}>
            {messages.map((message) => (
              <div key={message.id} className={`raahi-chat__message raahi-chat__message--${message.role}`}>
                {message.role === 'assistant' && <span className="raahi-chat__message-name">Raahi</span>}
                <p>{message.content}</p>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="raahi-chat__suggestions" aria-label={copy(language, 'Suggested questions', 'सुझाए गए सवाल')}>
                {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>)}
              </div>
            )}
            {isSending && (
              <div className="raahi-chat__message raahi-chat__message--assistant raahi-chat__typing" role="status">
                <LoaderCircle size={17} className="raahi-chat__spinner" />
                <span>{copy(language, 'Raahi is checking this page…', 'राही यह पेज देख रहा है…')}</span>
              </div>
            )}
            {error && <div className="raahi-chat__error" role="alert">{error}</div>}
          </div>

          <form className="raahi-chat__composer" onSubmit={submit}>
            <label className="raahi-chat__sr-only" htmlFor="raahi-chat-input">{copy(language, 'Ask Raahi about this page', 'इस पेज के बारे में राही से पूछें')}</label>
            <textarea
              ref={inputRef}
              id="raahi-chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 1200))}
              onKeyDown={onInputKeyDown}
              placeholder={copy(language, 'Ask what to do next…', 'पूछें कि आगे क्या करना है…')}
              rows={2}
              maxLength={1200}
              disabled={isSending}
            />
            <button type="submit" disabled={!input.trim() || isSending} aria-label={copy(language, 'Send question', 'सवाल भेजें')}>
              {isSending ? <LoaderCircle size={19} className="raahi-chat__spinner" /> : <Send size={19} />}
            </button>
          </form>
          <p className="raahi-chat__disclaimer">{copy(language, 'Built-in prototype guidance · Not an official transport service', 'अंतर्निहित प्रोटोटाइप सहायता · आधिकारिक परिवहन सेवा नहीं')}</p>
        </section>
      )}

      <button
        ref={launcherRef}
        type="button"
        className="raahi-chat__launcher"
        aria-expanded={isOpen}
        aria-controls="raahi-chat-panel"
        onClick={() => isOpen ? close() : setIsOpen(true)}
      >
        <span className="raahi-chat__launcher-icon" aria-hidden="true">
          <img
            src={RAAHI_ASSETS.working.src}
            srcSet={`${RAAHI_ASSETS.working.smallSrc} 240w, ${RAAHI_ASSETS.working.src} 400w`}
            sizes="52px"
            alt=""
            width="52"
            height="48"
          />
        </span>
        <span className="raahi-chat__launcher-label">{copy(language, 'Ask Raahi', 'राही से पूछें')}</span>
      </button>
    </aside>
  )
}

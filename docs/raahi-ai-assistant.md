# Raahi guided help — current demo and optional AI upgrade

Raahi is a page-aware guide for the LicenceFlow prototype. It explains the current screen, why a step exists and what the citizen should do next. It is separate from the judge walkthrough: the walkthrough demonstrates the product, while Raahi answers questions.

## Current hackathon mode

The published demo does **not** use an OpenAI API key and does not call an external AI service. Raahi matches the citizen's question to reviewed LicenceFlow topics, combines that with the current route and returns a deterministic answer in Hindi or English.

```text
Question + current route + selected language
                    |
                    v
Sensitive-data check in the browser
                    |
                    v
Reviewed topic matching + route-aware next step
                    |
                    v
Concise built-in answer (no network request)
```

The chat panel states this boundary directly: “Demo mode: OpenAI API is not connected.” It must not be described as generative AI in the current submission.

Built-in coverage includes application steps, saved progress, documents, device readiness, camera privacy, payment states, the learning step, test rules, technical recovery, result review, accessibility and the judge demonstration. Unknown questions receive a narrow fallback explaining what Raahi can answer.

## Product safeguards

- Aadhaar-like numbers, PAN, email addresses, Indian mobile numbers and payment-card-like numbers are rejected before they enter chat history.
- Raahi never solves or hints at a test question.
- It identifies LicenceFlow as an unofficial prototype and never implies that an official application, payment or licence is real.
- It does not invent current government fees, rules or deadlines.
- It is hidden during the focused rehearsal, active examination and interruption screens.
- Chat history exists only in React memory and disappears on reload or reset.

## Optional future OpenAI mode

The repository retains a server-side `/api/chat` worker as a ready, tested upgrade path. If OpenAI-powered conversation is enabled later, the architecture keeps the key outside browser code:

```text
Browser chat -> POST /api/chat -> Sites Worker -> OpenAI Responses API
```

The worker validates origin and request size, blocks sensitive data, applies a rate limit, provides a curated LicenceFlow knowledge boundary and calls the Responses API with `store: false`.

The browser must never receive the key. If this mode is intentionally enabled in the future, store `OPENAI_API_KEY` as a server-side Sites secret. Never create a `VITE_OPENAI_API_KEY`, commit a real key or place one in `.openai/hosting.json`.

Optional server-only model override:

```text
OPENAI_CHAT_MODEL=gpt-5.4-mini
```

## Verification

Local-guide tests cover route-aware help, payment uncertainty, camera privacy, Hindi output, unknown questions, examination-answer refusal and sensitive-data detection. The retained server tests prove that missing configuration fails closed, personal data is rejected before any provider call, response storage is disabled, page context is limited and cross-origin requests are rejected.

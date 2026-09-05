# LicenceFlow durable reliability layer

## What this adds

LicenceFlow now has a small server-backed reliability boundary for the hackathon prototype. Browser storage remains the fast, offline-friendly working copy, while the deployed Site can also write non-personal journey milestones to Cloudflare D1.

This is intentionally narrower than a production licensing backend. It proves four concrete behaviors:

1. **Append-only recovery checkpoints** — retries create idempotent milestones instead of silently replacing the only record.
2. **Server-owned sandbox payment attempts** — the Worker creates one attempt and one reference for a stable idempotency key; repeating the request returns the existing record.
3. **Status-before-retry reconciliation** — a lost, pending or timed-out return blocks a second attempt until the same server record is reconciled. Confirmed, declined and cancelled outcomes cannot be rewritten.
4. **Honest degradation** — ordinary journey checkpoints can continue from browser cache if D1 is unavailable, but a new payment attempt is not silently confirmed by the browser.

## Privacy boundary

The durable record may contain:

- opaque prototype session and application IDs;
- broad journey stage and completion statuses;
- attempt number, answered count and question count;
- final score only after completion;
- whether an interruption was recovered;
- a factual integrity-status category;
- synthetic payment key, amount and reference.

It deliberately does **not** contain:

- applicant name, address, phone, email or identity numbers;
- documents, photograph or signature;
- camera frames, audio, face landmarks or biometric templates;
- question text, option text or the applicant's selected answers;
- an OpenAI API key or chat transcript.

## Request flow

```text
Application / tutorial / exam reducer
              │
              ├── immediate browser checkpoint (full recoverable prototype state)
              │
              ├── debounced server checkpoint (minimal non-personal milestone)
              │
              └── blocking sandbox payment command (attempt / resolve / check)
                              │
                              ├── Sites Worker validation
                              ├── append-only D1 checkpoint
                              └── result-page recovery receipt
```

The client never waits for the server before saving locally. A temporary network failure therefore cannot erase or block the citizen's current step.

## API boundary

All routes are same-origin, JSON-only, size-bounded and return `Cache-Control: no-store`.

- `POST /api/reliability/checkpoints` validates and appends an idempotent milestone.
- `POST /api/reliability/payments/attempts` creates or retrieves one synthetic attempt by idempotency key. The server issues its reference.
- `POST /api/reliability/payments/attempts/:key/resolve` applies a labelled sandbox outcome without allowing a final outcome to be rewritten.
- `GET /api/reliability/payments/attempts/:key` returns the server's current status for the owning anonymous session.
- `POST /api/reliability/payments/attempts/:key/reconcile` resolves only an uncertain attempt to confirmed or declined.
- `POST /api/reliability/payments/confirm` remains only as a compatibility route for older browser-only demo receipts.
- `GET /api/reliability/sessions/:sessionId` returns the latest minimal checkpoint and recovery-receipt count.

Unknown fields are not persisted. Identifiers and enum values are allowlisted before reaching storage.

## Storage and deployment

- Logical Sites D1 binding: `DB`
- Type-level schema boundary: `db/schema.ts`
- Persistent migrations: `drizzle/0000_reliability.sql` and `drizzle/20260905161500_sandbox_payment_attempts.sql`
- Worker storage adapter and request handler: `server/reliability.js`
- Browser synchronizer: `src/portal/reliability.ts`

The migration creates only indexes used by actual session and chronological-receipt queries.

## What remains future work

A production licensing service would still need authenticated identity, a real gateway/treasury contract, signed callbacks, reconciliation jobs, refunds, operational audit access and government authorization. This slice moves no money, stores no payment credentials and creates no official entitlement. It demonstrates the lifecycle and failure rules against a real server record without pretending that the sandbox is a financial integration.

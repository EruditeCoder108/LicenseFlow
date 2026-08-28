# LicenceFlow durable reliability layer

## What this adds

LicenceFlow now has a small server-backed reliability boundary for the hackathon prototype. Browser storage remains the fast, offline-friendly working copy, while the deployed Site can also write non-personal journey milestones to Cloudflare D1.

This is intentionally narrower than a production examination backend. It proves three concrete behaviors:

1. **Append-only recovery checkpoints** — retries create idempotent milestones instead of silently replacing the only record.
2. **Idempotent mock payment confirmation** — repeating the same payment key returns the same synthetic confirmation and cannot create a second record.
3. **Honest degradation** — if the server or D1 is unavailable, the journey continues from browser cache and the result labels that state as a fallback rather than claiming server confirmation.

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
              └── debounced server checkpoint (minimal non-personal milestone)
                              │
                              ├── Sites Worker validation
                              ├── append-only D1 checkpoint
                              └── result-page recovery receipt
```

The client never waits for the server before saving locally. A temporary network failure therefore cannot erase or block the citizen's current step.

## API boundary

All routes are same-origin, JSON-only, size-bounded and return `Cache-Control: no-store`.

- `POST /api/reliability/checkpoints` validates and appends an idempotent milestone.
- `POST /api/reliability/payments/confirm` records or retrieves one synthetic confirmation by idempotency key.
- `GET /api/reliability/sessions/:sessionId` returns the latest minimal checkpoint and recovery-receipt count.

Unknown fields are not persisted. Identifiers and enum values are allowlisted before reaching storage.

## Storage and deployment

- Logical Sites D1 binding: `DB`
- Type-level schema boundary: `db/schema.ts`
- Persistent migration: `drizzle/0000_reliability.sql`
- Worker storage adapter and request handler: `server/reliability.js`
- Browser synchronizer: `src/portal/reliability.ts`

The migration creates only indexes used by actual session and chronological-receipt queries.

## What remains future work

A production licensing examination would still move question delivery, timer authority, scoring, attempt entitlement, identity binding and evidence review behind authenticated government services. This slice does not claim that browser state is tamper-proof and does not turn a synthetic application into an official record.


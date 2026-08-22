# LicenceFlow product cut

> **Superseded planning draft.** The implemented Round 1 scope is frozen in
> [`round-1-build-contract.md`](round-1-build-contract.md) only as historical context.
> The complete-portal direction is defined in
> [`portal-blueprint.md`](portal-blueprint.md).

## Product promise

LicenceFlow protects a citizen's money, attempt, and progress when the technology around an online Learner's Licence test fails.

The product is understood through one contrast:

- Existing failure path: pay → discover a technical problem → lose context → recover alone.
- LicenceFlow: check → rehearse → pay → checkpoint → recover → complete.

## Primary reviewer journey

The prototype uses five chapters rather than twelve disconnected screens:

1. **Application** — a short synthetic applicant summary and clearly simulated identity check.
2. **Readiness** — browser-level checks plus a deterministic simulated proctor-window failure before payment.
3. **Payment** — an unmistakably fake ₹250 transaction after readiness succeeds.
4. **Test** — a short examination that checkpoints every answer and safely pauses on a deterministic network interruption.
5. **Outcome** — a synthetic licence and an auditable journey receipt showing that no extra payment or attempt was consumed.

The Journey Receipt remains visible throughout the flow. It is the durable transaction state made legible, not an end-screen decoration.

## Deliberate cuts

- No admin dashboard.
- No generic AI chatbot.
- No live government system, identity, payment, or proctoring integration.
- No full statutory application form.
- No fifteen-question demo that slows judging; the prototype proves the mechanism with a short synthetic test.
- No automatic AI misconduct verdicts.

## Architecture

- React + TypeScript + Vite for a small, fast browser build.
- Explicit reducer-based state machine for legal transitions.
- Local storage checkpoints for refresh/resume in the prototype.
- Structured system events form the Journey Receipt.
- Browser capability checks are labelled **real**; government/proctor compatibility is labelled **simulated**.
- An optional server-side OpenAI triage endpoint can later map Hindi, English, and Hinglish symptom descriptions into a constrained issue taxonomy. Recovery policy remains deterministic.

## Acceptance criteria for the first vertical slice

- Complete the journey on a 375 px viewport without horizontal scrolling.
- Trigger and recover from the same readiness failure every time in demo mode.
- Save each exam answer before advancing.
- Resume after the simulated network interruption with the prior answers intact.
- Refresh and continue from the last safe checkpoint.
- Every synthetic/mock integration is disclosed at the point of use.

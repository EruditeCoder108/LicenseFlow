# LicenceFlow MP — rebuild milestones

**Status:** Historical milestone summary. The detailed current execution order is maintained in `roadmap-to-final.md`.

## What the audit established

The current prototype proves the core logic, but it does not yet feel like a real public service. The main causes are:

1. Hackathon and prototype explanations dominate normal citizen tasks.
2. Headings, cards, badges and paragraphs are too large and too numerous.
3. Several real journey states visible in the supplied screenshots are missing or compressed.
4. The payment page is only a receipt-writing shortcut, not a believable gateway journey.
5. Help is generic instead of explaining the current page and action in naive language.
6. Hindi mode translates only a minority of the interface.
7. Browser security checks exist, but their UI still behaves like a visible technical demonstration rather than a quiet secure-test environment.

## Evidence boundary

- The live official Madhya Pradesh Sarathi portal currently exposes this initial LL sequence: application details, document upload, photo/signature, fee payment, payment-status verification and receipt printing, followed by the road-safety tutorial/test journey.
- The supplied screenshots provide detailed interaction references for application, uploads, payment gateway, receipt, SmartLock launch, test authentication, instructions, questions and result.
- Many supplied screenshots visibly belong to Bihar or Uttar Pradesh. They may guide interaction structure, but they must not be presented as proof of current Madhya Pradesh rules, fee amounts or wording.

## Milestone 1 — professional foundation reset

**Goal:** Make the existing portal feel quiet, credible and task-focused before adding more screens.

Deliverables:

- Add a professional Parivahan-style national homepage that provides the broader portal context before the citizen enters the working driving-licence journey.
- Use restrained transport imagery and a wider responsive desktop shell so the portal makes appropriate use of standard 100% browser zoom without becoming a marketing landing page.
- Remove the promotional blue problem banner, “winning feature” language and repeated synthetic/demo messaging from task pages.
- Consolidate prototype honesty into one compact “Prototype details” surface, plus a restrained contextual disclosure only where synthetic identity or payment data is entered. Do not turn citizen screens into a judge-facing pitch.
- Reduce heading sizes, border radius, card count, badge count, shadows and repeated explanatory paragraphs.
- Replace the dashboard’s wall of equal cards with a compact, recognizable service directory and a separate current-application area.
- Introduce a thin journey-stage indicator that shows where the citizen is and what comes next.
- Create a real route-aware bilingual content system. A language switch must translate the full visible page, navigation, buttons, statuses, validation and help—not only service names.
- Replace the generic help dialog with route-aware help in simple language:
  - what this page is;
  - what the citizen must do;
  - what information is needed;
  - what happens after Continue;
  - common problems and fixes.
- Establish the approved almost-monochrome visual system and restrained typography/spacing tokens.

**Acceptance:** National homepage, dashboard, LL start, application tracker and one form step look and read like one professional service at desktop and phone widths in both English and Hindi.

## Milestone 2 — authentic application and post-submission journey

**Status:** Implemented and verified on 22 August 2026.

**Goal:** Restore the important official-shaped steps currently missing or compressed.

Deliverables:

- Application-submission instruction screen with the complete visible stage list.
- Applicant category screen.
- Synthetic Aadhaar/document authentication route with consent, OTP behavior and clear recovery states.
- Detailed applicant, address, vehicle and Form 1 screens using plain-language framing.
- Vehicle-first selection cards, class-code explanation, comparison/help and a selected-class summary.
- Submission acknowledgement with application reference.
- Application-status page split into “What’s next” and “What happened.”
- Captcha-shaped verification only where needed, using a safe prototype interaction.
- Document/photo/signature upload selection, requirements, preview, replace and confirmation states.
- Separate payment-status verification and receipt-print destinations.

**Acceptance:** A citizen can follow the supplied reference journey without encountering a missing major application/upload/status page, while every unverified MP detail remains configurable or clearly bounded.

## Milestone 3 — pre-payment compatibility gate and believable payment-gateway sandbox

**Status:** Implemented and verified on 23 August 2026. The complete compatibility-failure, guided recovery, rehearsal, gateway, authorization, persistence and receipt path passed desktop and 375 px browser acceptance; G1 is closed.

**Goal:** Prove that the exam environment can launch before money is taken, then reproduce the shape and recovery behavior of a real redirect-based payment journey without charging money or collecting real financial data.

Deliverables:

- A short pre-payment launcher-compatibility rehearsal using the existing camera, microphone and liveness engine—not a static checklist.
- A deterministic “simulate exam-window issue” path for the judge demo: detect the issue, pause payment, preserve the application and explain exactly how to fix and recheck it.
- Lazy-load the MediaPipe/browser-vision code only when the readiness rehearsal begins, with a guided fallback if the model cannot load.
- Itemized fee review sourced from a configuration object; exact MP amounts remain blocked until verified.
- Payment remains locked until the current device has passed the compatibility rehearsal; a saved pass can be rechecked when conditions change.
- Transaction confirmation screen and gateway choice.
- Redirect interstitial explaining that the citizen is leaving the portal for the secure gateway.
- Separate gateway route with payment-method choice, fictional/test-only fields and authorization step.
- Explicit sandbox marker in one restrained location; remove the awkward repeated phrase “demo payment.”
- Success, declined, cancelled, timed-out and pending/unknown states.
- Duplicate-payment protection: pending or confirmed attempts suppress a new Pay action until status reconciliation.
- Return-to-department flow, payment acknowledgement, downloadable/printable receipt and payment-status verification.
- Human-readable payment activity trail feeding the Journey Receipt.

**Acceptance:** The citizen cannot first discover an incompatible exam environment after payment. The payment experience feels operational and includes redirect, method selection, authorization and reconciliation, but cannot charge money or accept real payment credentials.

## Milestone 4 — Secure Test Mode, not a fake SmartLock clone

**Goal:** Turn the existing browser checks into a calm mobile-capable secure-test experience and accurately define what still requires native software.

Already implemented underneath:

- real camera and microphone streams;
- MediaPipe face landmarks and face count;
- framing and lighting checks;
- head-turn response;
- microphone stream health;
- local answer checkpoints;
- network and page-visibility observations;
- safe pause/resume with separate technical and integrity outcomes.

Still required:

- Ready Room before Question 1.
- Randomized left/right active-liveness prompt rather than a fixed challenge.
- Temporal smoothing and deterministic ignore/coach/pause thresholds.
- Camera UI hidden during healthy testing; reveal coaching only when correction is needed.
- Calm three-zone exam canvas with stable controls and select → confirm → save → advance behavior.
- Clear authentication, instructions, helper-mode exit and exact checkpoint-resume screens.
- Mobile camera testing across supported Android/iOS browsers.
- Optional local voice-activity detection only if stable; fall back to current microphone-health measurement.
- Defer research-heavy presentation-attack detection, gaze policing, object detection and “deepfake-proof” claims unless a later measured prototype proves they are accurate, fair and fast enough on ordinary phones.
- A written production boundary: an ordinary browser cannot guarantee screenshot blocking, app-switch prevention, overlay prevention or uncompromised device state. Those require a native/managed assessment client and platform attestation.

**Acceptance:** The test runs credibly on mobile and desktop, catches/coaches browser-visible problems, recovers without data loss and never claims SmartLock-equivalent lockdown.

## Milestone 5 — full product QA and final polish

**Goal:** Make the entire journey consistent and presentation-ready without changing its logic during visual polish.

Deliverables:

- End-to-end route audit against the screenshot inventory.
- English/Hindi content completeness audit.
- Keyboard, screen-reader semantics, focus, contrast and 200% text-size checks.
- Phone, tablet, desktop and landscape checks.
- Slow-network, refresh, back-navigation, camera denial and pending-payment recovery tests.
- Shared-computer safe-finish/reset option.
- Freeze functionality and claims.
- Prepare a concise government-handoff explanation covering what would integrate with Sarathi, what would require a native/managed test client and how the browser prototype could be piloted safely.
- Keep the final judge story focused on two proofs: incompatibility caught before payment, and an answer recovered correctly after a technical interruption.
- Produce the tightly constrained prompt for the separate UI-polish model.

**Acceptance:** No dead ends, missing transaction state, mixed-language page, accidental horizontal overflow, duplicate payment path or unsupported SmartLock claim.

## Immediate decision

Milestones 1 and 2 are complete. Continue with **Milestone 3 only** and use the G1 acceptance gate in `roadmap-to-final.md` before beginning the Secure Test Mode redesign.

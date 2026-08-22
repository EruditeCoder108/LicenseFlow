# LicenceFlow Round 1 build contract

> **SUPERSEDED — 22 August 2026.** This file describes the earlier small technical
> demo and is retained only as implementation history. It is not the current product
> scope, information architecture or visual direction. Use
> [`portal-blueprint.md`](portal-blueprint.md) as the canonical authority.

Status: **historical record of the implemented Round 1 prototype**.

## Product promise

Technology should protect a citizen's payment, attempt, and progress—not consume them. LicenceFlow therefore uses this order:

`apply → prepare → check device → rehearse → demo payment → test → recover → outcome`

## Implemented judge route

1. Choose a 90-second guided demo or a full 15-question simulation.
2. Complete three compressed synthetic application sections.
3. Read a preparation pack and answer one explained practice question.
4. Run readiness before payment:
   - real camera and microphone permission/stream checks;
   - on-device MediaPipe face count and face landmarks;
   - framing, brightness, and head-turn signals;
   - real browser storage, secure-context, and connection checks;
   - a clearly labelled guided fallback when live media cannot be used.
5. Rehearse the save-before-next pattern without consuming an attempt.
6. Record an unmistakably synthetic ₹250 payment only after readiness.
7. Take either the 5-question judge demo or the 15-question simulation.
8. In the judge demo, pause deterministically after Question 3 and resume at Question 4 with answers and payment preserved.
9. Show knowledge, technical, and integrity outcomes separately, plus an invalid demonstration LL or retest path.
10. Inspect the Journey Receipt at any point.

## Recovery promise

- Every chosen exam answer is written to versioned `localStorage` before navigation.
- A refresh or reopen resumes from the latest saved stage and question when the app is reachable.
- A network loss while the app is open pauses the test; reconnect enables resume.
- A technical interruption never creates a knowledge failure or another demo payment.
- This build does not claim full offline operation, cross-device synchronization, signed event receipts, or browser-level lockdown.

## Trust boundaries

- No Aadhaar, UIDAI, Sarathi, SmartLock, bank, treasury, or transport-department connection exists.
- No official MP fee, question bank, scoring rule, retest rule, or licence is claimed.
- Camera and microphone are not recorded by LicenceFlow. Signals are processed in the browser for readiness only.
- Face count and movement are conditions, not proof of identity or cheating.
- Test help explains technical recovery only and never reveals answers.

## Technical shape

- React 19, TypeScript, and Vite.
- One reducer controls legal journey transitions.
- A typed event receipt explains real versus simulated behavior.
- `@mediapipe/tasks-vision` supplies the browser face-landmark model.
- Responsive CSS supports 375 px mobile through desktop with 44–48 px controls, strong focus states, high contrast, and reduced-motion support.
- Five reducer tests protect payment ordering, application consent, checkpointing, interruption recovery, and separated outcomes.

## Deliberately deferred

- Service Worker/full offline mode.
- Backend sync, admin console, signed receipts, and audit export.
- Aadhaar, payment, Sarathi, or official test integration.
- Production PAD/anti-spoofing, speaker verification, WebGPU, native device attestation, or SmartLock-equivalent lockdown.
- A generic AI chatbot. Contextual bilingual help is deterministic for this round.

## Round 1 acceptance evidence

- TypeScript check passes.
- Five automated reducer tests pass.
- Production build passes.
- npm reports zero known dependency vulnerabilities.
- Desktop guided journey passes end to end in a real browser.
- Refresh after Question 1 reopens Question 2 with one saved answer.
- Guided interruption after Question 3 reopens Question 4 with three saved answers and the payment still recorded.
- 375 × 812 browser pass has zero horizontal overflow.
- English/Hindi contextual help, Escape-to-close, and icon-only accessible names are verified.
- Browser console contains no errors or warnings during the tested flow.

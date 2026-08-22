# Madhya Pradesh Learner's Licence — Round 1 canonical scope

**Status:** Sole product and implementation authority for Round 1  
**Date:** 22 August 2026  
**Product surface:** A failure-safe redesign of the Madhya Pradesh Sarathi Learner's Licence citizen journey

## Product decision

Round 1 is **Madhya Pradesh only** and **Learner's Licence only**.

It is not a startup landing page, a national multi-state simulator, a permanent-DL product, or a redesign of every Parivahan service. The interface remains recognizably a modernized government portal, but all implementation effort goes into one complete citizen journey.

The guiding rule is:

> Recreate enough of the Madhya Pradesh Sarathi experience to make the journey authentic, then go exceptionally deep on preventing and recovering from LL test failures.

## Why one state

- The originating citizen incident happened in Madhya Pradesh.
- Official Parivahan guidance confirms that service availability and process details can depend on state customization.
- A state selector would imply verified support for states we have not researched.
- State choice adds nothing to the core demonstration of readiness, transaction safety, checkpointing, and recovery.
- Removing it eliminates a factual and demonstration liability without reducing citizen value.

Do not claim that every state runs an entirely unrelated software stack or database. The defensible statement is that Sarathi uses state selection and state-customized availability/workflows, so this prototype deliberately models only Madhya Pradesh.

## Evidence labels

Every consequential rule, screen, and message must have one of these internal sources:

| Label | Meaning | Allowed use |
|---|---|---|
| `OFFICIAL_CURRENT` | Verified from a current MP government, MoRTH, Parivahan, NIC, statute, or rule source | May be presented as current guidance with source/date recorded |
| `PERSONAL_OBSERVATION` | Part of the creator's genuine MP incident | May be described as personal experience, not universal current behavior |
| `REFERENCE_PATTERN` | Observed in the supplied Bihar/UP screenshots or third-party walkthrough | May inspire structure; must not be presented as verified MP behavior |
| `SYNTHETIC_PROTOTYPE` | Deliberately invented mock identity, fee, record, gateway, question configuration, result, or licence | Must be disclosed at the point of use |
| `INNOVATION_PROPOSAL` | New LicenceFlow behavior such as mobile browser proctoring or failure-safe recovery | Present as the proposed improved experience, not existing MP policy |
| `UNVERIFIED` | Current authoritative answer not yet established | Do not hard-code; show neutral configurable or research-pending copy |

Personal experience is evidence for the problem, not automatic evidence for every current MP rule.

## Complete working journey

```text
MP Sarathi citizen-services entry
→ LL instructions and requirements
→ applicant category
→ synthetic Aadhaar/document identity route
→ detailed applicant, address, vehicle-class and Form 1 sections
→ review, declaration and synthetic application number
→ photo/signature/document completion
→ application stage tracker
→ device and environment readiness before payment
→ detected problem, explanation, correction and recheck
→ test rehearsal
→ itemized synthetic fee and mock payment
→ road-safety tutorial and practice
→ secure-test sign-in and randomized active liveness
→ LL knowledge test
→ deterministic technical interruption
→ answer/application/payment recovery
→ resumed completion
→ separate knowledge, technical and integrity outcomes
→ invalid synthetic LL and journey receipt
```

No stage may end in a dead button or unexplained status.

## Authentic portal surface

The first screen is the Madhya Pradesh licence-services portal, not a marketing page.

It includes:

- Government/transport context and a small independent-prototype disclosure;
- fixed Madhya Pradesh context with no state selector;
- Learner's Licence service navigation;
- application status, uploads, payment status, tutorial, mock test and LL-print utilities;
- a compact service catalogue sufficient to resemble the real portal;
- a prominent current/demo application action so reviewers reach the core story immediately;
- English/Hindi controls, accessibility controls, help, contact and grievance routes.

Permanent DL and unrelated services may be listed only when needed for portal authenticity. They receive a concise “Outside this MP LL prototype” information page, not a fake workflow and not implementation effort.

## Innovation that must be visible

### Before payment

- Real camera and microphone permission/stream checks.
- Network/request health, local persistence, secure context and browser capability checks.
- Face presence, multiple visible faces, framing, lighting, blur/obstruction and device performance observations.
- Randomized head-turn/blink challenge-response.
- A rehearsal proving the citizen can enter, save and recover from the test experience.
- A reproducible demo issue tied to the personal incident without inventing its unknown root cause.

### During the test

- Every answer checkpointed before navigation.
- Real visibility, media-stream and connectivity observations.
- Local buffering and idempotent synchronization behavior.
- Explicit pause/recheck/recovery states.
- Technical failure never silently becomes knowledge failure or a second payment.
- Integrity observations remain separate from score and require uncertainty-aware handling.

### Guidance and privacy

- Contextual `?` help for forms, terms, permissions, payments and errors.
- Reviewed English/Hindi content plus Hinglish search/interpretation where useful.
- Technical-only assistance during the live test; no answer help.
- Raw camera/audio processed ephemerally and locally by default.
- Observations such as multiple faces or voice activity are not automatic cheating verdicts.
- Accessible alternatives/review paths for unreliable blink, pose or audio signals.

## Technology decisions

Implement where feasible and demonstrable:

- React + TypeScript + Vite.
- MediaPipe face detector/landmarker.
- Web Audio with local Silero VAD after performance validation.
- ONNX Runtime Web only for selected small, legally usable models.
- IndexedDB/versioned persistence and service-worker caching.
- Deterministic mock adapters for Aadhaar, Sarathi, payment, notification and examination authority.

Do not claim SmartLock equivalence. Browser code cannot guarantee screenshot prevention, app-switch blocking, overlay suppression, physical-camera provenance, or uncompromised device state. Native Play Integrity/App Attest/assessment controls belong in the production path, not the Round 1 browser claim.

## Explicit Round 1 exclusions

- Multi-state support or a state dropdown.
- Full permanent Driving Licence journey.
- Vehicle registration, challans, insurance, conductor licence, driving-school workflows or an RTO super-app.
- Admin/proctor dashboards.
- Live Aadhaar, payment, Sarathi, RTO or SmartLock integration.
- Production biometric identity claims.
- Automatic cheating verdicts.
- Continuous audio/video recording.
- Every researched GitHub model; only evaluated components that strengthen the visible story.
- Decorative AI, 3D, cinematic or startup-marketing presentation.

## Judge journey

The application opens directly in the MP portal context. A one-click “Continue demo application” path uses synthetic data and deterministically demonstrates:

```text
problem understood
→ readiness issue caught before payment
→ citizen fixes/rechecks it
→ rehearsal succeeds
→ mock payment succeeds
→ test starts
→ connection interruption occurs
→ answer and transaction survive
→ test resumes
→ citizen completes the LL journey
```

The full detailed form remains available for exploration, but the two-minute path uses a prepared synthetic draft so completeness does not make the demonstration slow.

## Definition of complete

Round 1 is complete when a reviewer can use the entire synthetic MP LL journey on desktop and at 375 px, understand the improvement within 15 seconds, encounter and recover from the intended failures reliably, distinguish real browser checks from mocked government behavior, and finish without lost data, duplicate payment, dead ends, factual claims about other states, or developer narration.

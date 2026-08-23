# LicenceFlow MP — roadmap from the current build to the final submission

**Status:** Canonical execution roadmap from 23 August 2026 onward  
**Product:** A professional redesign of the Parivahan/Sarathi citizen experience, with one complete working Madhya Pradesh Learner's Licence journey  
**Rule:** Finish and approve one release gate before starting the next major milestone

This file is the practical answer to “what happens next?” It combines the valid parts of the earlier research, scope decisions, screenshot audit, milestone notes and UI-polish plan. If an older planning document conflicts with this roadmap, use this roadmap for execution and use `round-1-canonical-scope.md` for the product boundary.

---

## 1. What the final product will be

The final prototype will open like a modern national Parivahan government portal, not a startup landing page and not an LL advertisement. It will show the broader transport-service context through professional, image-led sections. Most national services will be honest information-only destinations.

The fully working product will begin when the citizen enters **Driving Licence Services** and continues into the **Madhya Pradesh Learner's Licence** journey. That journey will cover sign-in, application, identity simulation, uploads, status, device compatibility, payment sandbox, tutorial, secure test, interruption recovery, result and receipt.

The experience must feel:

- official and trustworthy;
- easy to understand without a YouTube tutorial;
- complete on desktop and mobile;
- fully usable in English and Hindi;
- safe when the network, camera, microphone or payment flow fails;
- honest about what is real browser functionality and what is simulated;
- technically impressive through working recovery and readiness behavior, not promotional copy.

### The four visible innovations

1. **Compatibility before payment:** the citizen proves that the intended exam device can open the camera, microphone, face check and recovery rehearsal before money is accepted.
2. **Failure-safe examination:** every confirmed answer is checkpointed; a technical interruption pauses the session and resumes from the correct point without becoming a knowledge failure.
3. **Mobile-capable Secure Test Mode:** ordinary phone and computer browsers get real camera/microphone, presence, framing and active-liveness observations, with an honest boundary for controls that require a native managed client.
4. **Help that explains the current page:** every important route answers what this page is, what to do, what is needed, what happens next and how to fix common problems.

---

## 2. Frozen product boundary

### We will complete

- A broad, polished national Parivahan-style homepage.
- A complete Madhya Pradesh Learner's Licence citizen journey.
- Official-shaped prototype sign-in with fixed judge credentials.
- Synthetic identity, application and payment adapters that never request real secrets.
- Responsive desktop, tablet and mobile behavior.
- Complete visible English/Hindi translation of the core journey.
- Contextual help, accessibility and recovery behavior.
- A believable gateway redirect sandbox and transaction reconciliation.
- A browser-based Secure Test Mode with clearly measured capabilities.
- A deterministic short judge journey and the full explorable journey.
- Public deployment and the required submission package.

### We will not build in this round

- Multi-state transactional support or a state selector.
- A complete permanent Driving Licence transaction.
- Vehicle registration, challan, permits, conductor licence, driving-school or RTO administration workflows.
- Real Aadhaar, Sarathi, RTO, SmartLock, bank, UPI or payment-gateway integration.
- Production biometric identity or automatic cheating verdicts.
- Claims that a normal web browser can block screenshots, other apps, overlays or a compromised device.
- Research-heavy “deepfake-proof,” gaze-policing or object-detection features without measured evidence on ordinary phones.
- Decorative AI features, a chatbot with unverified answers, or innovation labels spread across citizen screens.

Secondary services may exist for portal authenticity, but they must open a useful information page rather than a broken button or fake workflow.

---

## 3. Current baseline — already built

This is the starting point, not work to repeat.

### Portal and application

- National Parivahan-style homepage at `/`.
- Madhya Pradesh licence-service directory at `/mp/services`.
- Seven-step LL application: category, synthetic identity, personal details, address, vehicle class, fitness and review.
- Consent and demonstration OTP verification.
- Submission acknowledgement and saved synthetic application.
- Document, photograph and signature preview/replace/confirm states.
- Application lookup, stage tracker, payment-status page and printable receipt.
- Route-aware English/Hindi content and help on the completed surfaces.

### Authentication

- Official-shaped sign-in route at `/login`.
- Fixed judge credentials in `docs/judge-access.md`.
- Captcha refresh, validation, password help, saved local session, account summary and sign-out.

### Innovation engine already underneath

- Camera and microphone streams.
- MediaPipe face landmarks, face count, framing and lighting observations.
- Head-turn response and microphone stream health.
- Network and page-visibility observations.
- Local answer checkpoints and refresh recovery.
- Separate knowledge, technical and integrity outcomes.
- Tutorial, practice, test, deterministic interruption, result and Journey Receipt.

### Baseline gate before new feature work

Before Milestone 3 begins, preserve this green baseline:

- TypeScript check passes.
- All existing automated tests pass.
- Production build passes.
- Desktop and 375 px layouts have no horizontal overflow.
- Existing user changes remain intact.

### Ideas traceability

Every proposal from `ideas_updated_3.md` now has an explicit decision in `ideas-traceability.md`: built, assigned to a milestone, submission-only, deferred, or rejected. That matrix is reviewed at G1, G2 and G5 so approved ideas cannot disappear and deferred research cannot quietly expand the scope.

---

## 4. Execution order and release gates

| Gate | Milestone | Outcome required before approval |
|---|---|---|
| G0 | Baseline freeze | Existing journeys, tests and build are green; scope is unchanged |
| G1 | Payment and compatibility | A citizen cannot pay before a successful real readiness rehearsal; all transaction outcomes recover safely |
| G2 | Secure Test Mode | Mobile and desktop test flows coach, pause, checkpoint and resume credibly |
| G3 | Content and portal completeness | Screenshot inventory, help and English/Hindi content are complete for every core route |
| G4 | UI polish freeze | The external polishing pass improves presentation without changing logic, routes or claims |
| G5 | QA and release candidate | End-to-end, accessibility, responsive, recovery and performance checks pass |
| G6 | Submission ready | Public build, judge access, demo video, summary and fallback materials are verified |

At every gate, we will run the build, use the product in the browser at desktop and phone sizes, record remaining defects, and ask for the user's visual approval before the next major milestone.

---

## 5. Milestone 3 — compatibility before payment and a believable gateway

**Gate status:** G1 passed on 23 August 2026 after automated, desktop, 375 px, persistence and English/Hindi acceptance checks.

### Goal

Replace the current synthetic “pay and write a receipt” shortcut with an authentic redirect-shaped sandbox. The most important product proof is that a device problem is found **before** payment.

### 3A. Refactor and configuration foundation

- Move payment rules, fee rows and synthetic gateway behavior into dedicated domain/configuration modules.
- Keep exact MP fee amounts configurable until supported by current authoritative evidence.
- Add explicit transaction types: `not_started`, `ready`, `redirecting`, `pending`, `confirmed`, `declined`, `cancelled`, `timed_out` and `unknown`.
- Give every attempt a stable transaction ID and idempotency key.
- Store only test values and transaction state; never store card, UPI PIN or bank secrets.
- Route-split heavy camera/MediaPipe code so it loads only when readiness or the test requires it.

### 3B. Pre-payment compatibility gate

- Add a short launcher rehearsal that actually requests and uses the selected device's camera and microphone.
- Check secure context, browser capability, storage, connection, stream health, face presence, multiple faces, framing, lighting and active head movement.
- Show one task at a time in naive language rather than a technical diagnostics wall.
- Add a deterministic judge control that simulates the original exam-window problem.
- When the problem occurs:
  - preserve the application;
  - keep payment locked;
  - explain the problem in simple English/Hindi;
  - provide exact correction steps;
  - recheck only the affected requirements;
  - record the result in the Journey Receipt.
- Save a compatibility pass with timestamp and device/browser fingerprint hints that contain no identifying secrets.
- Recheck when permissions, camera availability or relevant environment state changes.
- Provide a clearly labelled guided fallback only when real hardware/model access is unavailable during judging.

### 3C. Fee review and gateway routes

Add or refine this route sequence:

```text
application status
→ compatibility check
→ rehearsal passed
→ itemized fee review
→ transaction confirmation
→ gateway selection
→ redirect interstitial
→ separate test gateway
→ authorization result
→ return to department
→ reconciliation
→ acknowledgement / receipt
```

Gateway behavior:

- Offer realistic method categories such as UPI, card and net banking, but accept only fictional test inputs.
- Show the sandbox warning once, exactly where a payment secret would normally be entered.
- Do not use “demo payment” as a citizen-facing method name.
- Support success, pending, declined, cancelled, timeout and lost-return scenarios.
- Disable duplicate Pay actions while a previous attempt is pending or confirmed.
- Reconcile a pending/unknown attempt from Payment Status before allowing a retry.
- Return to the same application and preserve the application number, transaction ID and amount.
- Generate a printable/downloadable synthetic receipt and human-readable payment activity trail.

### 3D. Milestone 3 automated tests

- Payment is impossible before readiness and rehearsal pass.
- Repeated submission with the same idempotency key produces one receipt.
- Pending/confirmed payment suppresses a second payment.
- Cancelled/declined attempts do not mark the application paid.
- Unknown return state reconciles correctly.
- Refresh on every payment route preserves safe state.
- Back navigation cannot bypass the readiness gate.
- Hindi and English validation/status messages exist for every state.

### G1 acceptance

- The full path works at desktop and 375 px.
- The deterministic compatibility failure always appears before payment and always recovers.
- No field can collect real payment credentials.
- No duplicate receipt can be created.
- Pending, cancellation and timeout are understandable and recoverable.
- Tests, typecheck and production build pass.
- User approves the flow in the browser.

---

## 6. Milestone 4 — Secure Test Mode and mobile examination

### Goal

Turn the existing technical test prototype into a calm, credible exam product. The test must feel normal when conditions are healthy and helpful when something goes wrong.

### 4A. Ready Room

- Explain supported devices and the browser/native security boundary before permission prompts.
- Show camera and microphone permission recovery for denied, blocked, missing and busy devices.
- Run connection, storage, secure-context, camera, microphone, face count, framing and lighting checks.
- Replace the fixed liveness action with randomized left/right head-turn prompts.
- Add temporal smoothing so a single noisy frame does not trigger a warning.
- Use three response levels:
  - ignore brief noise;
  - coach a correctable issue;
  - pause only a sustained test-threatening condition.
- Allow an accessible review path when pose/audio signals are unreliable.

### 4B. Authentication and instructions

- Provide an official-shaped synthetic test sign-in/check-in screen.
- Show clear rules, duration, question controls, technical-help boundary and privacy behavior.
- Require the citizen to acknowledge instructions before Question 1.
- End general helper mode during the knowledge test; retain technical-only assistance.

### 4C. Exam canvas

- Use a stable three-zone layout:
  - progress/time and quiet technical status;
  - question and options;
  - Previous, Confirm/Save and Next controls.
- Preserve the sequence `select → confirm → checkpoint → advance`.
- Hide the camera preview and technical diagnostics while conditions are healthy.
- Reveal one short coaching panel only when the citizen must act.
- Keep touch targets, question text and options usable on a narrow portrait phone.
- Handle accidental refresh, route reload and intermittent connection without losing a confirmed answer.

### 4D. Interruption and recovery proof

- Keep the deterministic interruption after the prepared judge question.
- Pause the timer/session safely.
- State whether the interruption is technical, integrity-related or a knowledge outcome.
- Show the last confirmed answer and next question number without revealing correctness.
- Re-run only required checks, resume at the exact checkpoint and prevent a second payment.
- Record interruption, recheck and resume events in the Journey Receipt.

### 4E. Result and privacy

- Keep score separate from technical and integrity observations.
- Never turn an uncertain face/audio signal directly into a cheating verdict.
- Show a visibly invalid synthetic LL/document only for a successful configured demonstration result.
- Add a clear shared-computer finish/reset action.
- Process raw camera/audio locally and ephemerally by default; do not imply recording or government storage.
- Document the production upgrade path: native assessment client, device attestation and approved integrations.

### 4F. Mobile test matrix

Test at minimum:

- Android Chrome portrait and landscape.
- iPhone Safari portrait where available.
- Windows Chrome desktop.
- Narrow 375 px viewport and a tablet-sized viewport.
- Camera denied, microphone denied, no face, multiple faces, poor framing, page hidden and offline/online recovery.

Optional local voice-activity detection will only ship if it is fast, stable and fair on the tested phones. Microphone stream health remains the safe fallback.

### G2 acceptance

**Browser acceptance status (2026-08-23): passed for the submission path.** At 375 px and 1440 px, healthy monitoring stays quiet, every confirmed answer survives the deterministic Question 3 interruption and a full reload, resume returns to Question 4, payment remains confirmed once, and the final page separates knowledge, technical and integrity outcomes. Physical Android/iOS camera testing remains a Milestone 5 device-matrix item.

- The citizen can complete the test on a supported phone without layout failure.
- Healthy conditions do not display a distracting diagnostics dashboard.
- Short signal noise does not pause the exam.
- Sustained problems coach or pause deterministically.
- Every confirmed answer survives refresh and the prepared interruption.
- Technical failure, integrity review and knowledge result are clearly separate.
- No SmartLock-equivalence or impossible browser-security claim appears.
- Tests, typecheck and production build pass.
- User approves the flow in the browser.

---

## 7. Milestone 5A — content, screenshot and portal completeness

### Goal

Make the portal feel complete and researched without expanding the working product beyond MP LL.

### Work

- Re-audit all supplied screenshots in chronological/functional order.
- Maintain a screen registry containing:
  - source screenshot;
  - intended route;
  - implemented interaction;
  - evidence label;
  - omitted reason where not applicable to MP.
- Check every important reference state: instructions, category, identity, forms, application number, uploads, fee review, gateway, return, receipt, tutorial, test check-in, instructions, questions, interruption, result and printing.
- Improve the national homepage using the useful structure from the official site—visual transport sections, service areas, public information and quick links—without copying its broken spacing or overwhelming navigation.
- Keep secondary services useful but information-only.
- Complete route-aware Help for every core route in five parts:
  - what this page is;
  - what to do;
  - what is needed;
  - what happens after Continue;
  - common problems and fixes.
- Audit all visible English/Hindi strings, including errors, captcha, account state, receipts, payment outcomes, camera prompts and test recovery.
- Review official terminology and keep unsupported MP-specific claims configurable or labelled internally.

### G3 acceptance

**Status (2026-08-23): passed for the submission scope.** `screen-registry.md` accounts for all 68 references with evidence labels and defensible exclusions. The complete tutorial/test/recovery/result journey, including questions and event history, is bilingual. Route Help now covers uploads, tutorial, test, result, payment and receipt accurately. The national homepage and secondary information services remain intentionally broader than the working MP LL transaction.

- Every screenshot-relevant core step is implemented or has a recorded reason for exclusion.
- No important button is dead.
- No core page contains mixed English/Hindi in Hindi mode, except unavoidable proper names/codes.
- Help accurately explains the current route in simple language.
- The national homepage feels like the entrance to a government transport portal, not the LL pitch.
- User approves the content and route inventory.

---

## 8. Milestone 5B — architecture and performance hardening

This work happens before external visual polish so the polishing model receives stable code.

**Status (2026-08-23): complete.** Citizen routes are split into independently loaded bundles, MediaPipe remains isolated from the homepage/forms, browser persistence now fails safely and validates the locally displayed application record, model failure retains retry and guided-fallback paths, and the production trust boundary is recorded in `docs/production-security-boundary.md`. The current UI was deliberately left unchanged for the owner's polish pass.

### Code structure

- Keep routing and shell composition in `src/PortalApp.tsx`, but extract any oversized page groups before they become difficult to review.
- Keep application logic in `src/portal/application.ts` and application screens in `ApplicationFlow.tsx`.
- Keep auth, readiness, payment and exam state in separate domain modules with pure transition functions.
- Centralize route-aware bilingual content; do not scatter new literal UI strings through components.
- Keep evidence-sensitive rules and synthetic fee/question data in configuration.
- Version persisted browser state and migrate or safely reset incompatible old versions.

### Performance

- Lazy-load camera/MediaPipe and optional model code.
- Keep the homepage and application forms free from the vision bundle.
- Compress generated imagery and provide responsive sizes.
- Check production bundle chunks and remove accidental duplicate dependencies.
- Provide a loading, retry and guided fallback state for model download failure.
- Avoid long main-thread work during the test.

### Security and privacy hygiene

- Never log passwords, OTPs, payment fields or raw media.
- Use fixed synthetic judge values only.
- Escape/validate all user-visible stored values.
- Make prototype disclosure reachable but restrained.
- Add a one-action “Clear this device” flow for shared computers.
- Document what a real deployment would move server-side.

---

## 9. Milestone 5C — constrained UI-polish handoff

The second AI is used only after routes, behavior, translations and claims are frozen.

### What we give it

- The running screenshots at desktop, tablet and phone widths.
- `docs/ui-polish-handoff.md`.
- The approved visual tokens and current CSS/components.
- A list of exact visual defects, not a request to redesign the product.
- Hard constraints: preserve routes, state machines, accessibility, text meaning, government tone, mobile behavior and evidence boundaries.

### What it may improve

- spacing and visual rhythm;
- type scale and line length;
- alignment and responsive composition;
- card density, borders and shadows;
- image crops and restrained illustration use;
- consistent form, table, receipt and status styling;
- subtle accessible transitions.

### What it may not change

- product scope or route hierarchy;
- payment/readiness/test logic;
- validation, persistence or test behavior;
- English/Hindi meaning;
- government/prototype claims;
- “showcase” headlines or startup marketing copy;
- large new dependencies without review.

### G4 review gate

When the polished code returns, we will review the diff rather than accept it wholesale. We will restore any changed logic, verify every core route again and keep only improvements that pass accessibility and responsive checks.

---

## 10. Milestone 6 — complete QA and release candidate

### Functional journeys

Test both paths:

1. **Full citizen path:** empty application through final result and receipt.
2. **Prepared judge path:** synthetic draft through compatibility failure, fix, payment, interruption, recovery and completion.

Also verify direct application lookup, login/logout, uploads, payment status, receipt print and secondary service information.

### Recovery matrix

- Refresh and browser Back on every major route.
- Close/reopen after each application checkpoint.
- Camera/microphone denied and later allowed.
- Model load failure and guided fallback.
- Offline during rehearsal, payment return and exam.
- Payment pending/unknown and reconciliation.
- Repeated Pay and repeated Continue clicks.
- Hidden page/app switch observation.
- Shared-device clear/reset.
- Stale persisted version.

### Accessibility

- Keyboard-only completion.
- Visible focus and correct focus after navigation/errors/dialogs.
- Semantic headings, labels, field errors and status announcements.
- Screen-reader-friendly progress and payment/test state.
- Contrast, target size and reduced-motion behavior.
- 200% text zoom without clipped content or horizontal page scrolling.
- English/Hindi reading order and glyph rendering.

### Responsive and visual

- 375 px phone portrait.
- Phone landscape.
- Tablet portrait/landscape.
- Common laptop and 1920 px desktop at 100% browser zoom.
- 110% and 125% zoom sanity checks.
- Print layouts for receipt/result where applicable.
- No accidental overflow, overlapping controls, huge empty gutters or unreadably long lines.

### Quality and performance

- TypeScript check, unit/component tests and production build.
- Browser console free of unexpected errors.
- Route-level end-to-end smoke tests for the two main paths.
- Initial homepage/application load does not fetch the vision model.
- Slow-network loading and retry copy is understandable.
- No unsupported factual/security claim in visible UI or submission copy.

### G5 acceptance

- Zero release-blocking defects.
- No dead end, lost confirmed answer, duplicate payment or broken recovery path.
- No mixed-language core screen.
- No critical accessibility failure.
- No accidental exposure of real credentials or personal information.
- A release-candidate commit/tag is created only after user approval.

---

## 11. Milestone 7 — deployment and hackathon submission

### Public deployment

- Choose the final hosting target supported by the hackathon.
- Configure SPA route fallback so direct links work.
- Use HTTPS because camera/microphone browser APIs require a secure context outside localhost.
- Verify the deployed build on a phone using mobile data as well as desktop.
- Confirm there are no local-only asset paths, CORS failures or blocked model files.
- Keep one fallback local build and one recorded walkthrough in case the live network fails.

### Judge package

- `docs/judge-access.md` with fixed login, captcha/OTP guidance and safe test data.
- A one-page judge runbook with the exact prepared route and expected checkpoints.
- Concise project summary within the current official limit.
- Short demo video within the current official duration limit.
- Architecture diagram showing browser app, local checks/persistence, synthetic adapters and production integration boundaries.
- Evidence/claim sheet distinguishing current official guidance, personal incident, reference patterns, prototype simulation and proposed innovation.
- Government handoff note explaining:
  - what can integrate with Sarathi;
  - what needs server/payment/Aadhaar adapters;
  - what requires a native managed assessment client;
  - how a limited MP pilot could be measured safely.
- Repository README with setup, test, build, route and privacy instructions.

### Demo story

The demonstration should prove two things, not tour every screen:

```text
MP LL application is ready
→ device incompatibility is found before payment
→ citizen fixes it and passes the rehearsal
→ sandbox payment completes once
→ secure test starts
→ a technical interruption occurs
→ the confirmed answer and payment survive
→ test resumes and reaches a separated result
```

The full application and homepage remain available for exploration after the main story.

### Final checks at T-48h and T-24h

- Re-read the official submission brief and confirm the current deadline, video length, text limit, hosting and credential requirements.
- Freeze features at T-48h; after that, fix only release-blocking defects.
- Record the final video from the deployed build.
- Test judge credentials in a fresh/private browser profile.
- Download/archive the submission text, video and build evidence.
- Submit before the final hour and save confirmation proof.

### G6 acceptance

- Public URL opens in a fresh browser and direct routes work.
- Judge credentials and prepared path work without developer intervention.
- Video and summary match the actual product and contain no inflated claim.
- All required fields/assets are submitted and confirmation is saved.

---

## 12. Working method from now on

For each milestone we will use the same small cycle:

1. **Inspect:** compare the current route with screenshots, research and existing logic.
2. **Specify:** write the state transitions, failure cases and acceptance checks before UI work.
3. **Implement:** build domain logic first, then the professional citizen interface.
4. **Automate:** add tests for invariants, refresh recovery and failure paths.
5. **Use it:** click through desktop and phone layouts in English and Hindi.
6. **Review together:** show the actual browser result and collect the user's corrections.
7. **Freeze the gate:** update this roadmap/build log and proceed only after approval.

This prevents us from adding an enormous idea list at once and keeps every milestone independently usable.

---

## 13. Priority when time becomes tight

If time must be cut, protect work in this order:

1. No data/payment/answer loss and no duplicate transaction.
2. Compatibility before payment.
3. Clear mobile Secure Test Mode and interruption recovery.
4. Complete core MP LL route and English/Hindi help.
5. Accessibility and deployed reliability.
6. Visual polish.
7. Extra homepage content and secondary information pages.
8. Optional voice activity or additional research models.

Never cut honesty, recovery behavior, the mobile core journey or basic accessibility to add a flashier feature.

---

## 14. Immediate next action

G1 and the browser portion of G2 are complete. The next implementation is **Milestone 5A**:

1. re-audit the supplied screenshot inventory against the route registry;
2. make secondary portal options intentionally complete-looking without inventing unsupported transactions;
3. close English/Hindi content gaps in the tutorial, secure test and result journey;
4. add the shared-computer reset and final privacy controls;
5. run the full accessibility, device and failure-state matrix;
6. freeze logic before the separate constrained visual-polish pass.

# LicenceFlow — Final Product and Implementation Specification

> **SUPERSEDED — 22 August 2026.** This draft incorrectly scopes the product as a
> separate, compressed LicenceFlow experience. The project now improves the complete
> existing Sarathi/Parivahan portal. Use [`portal-blueprint.md`](portal-blueprint.md).

**Status:** Historical planning draft  
**Date:** 22 August 2026  
**Product:** Mobile-first synthetic redesign of the Madhya Pradesh Learner's Licence journey  
**Round-one surface:** Public React + TypeScript browser application/PWA  

## 1. The product in plain language

LicenceFlow lets a citizen complete a clear, guided Learner's Licence journey without discovering a device, camera, payment, or examination problem too late. It checks the citizen's device and environment before payment, teaches and rehearses the secure-test behavior, saves every important step, pauses safely when technology fails, and explains exactly what happened. It demonstrates real browser capabilities without pretending to be Parivahan, SmartLock, or a government licence system.

The core promise is:

> **Secure against avoidable misuse, safe against technical failure.**

The product improves the journey in this order:

```text
Understand → Apply → Prepare → Prove readiness → Pay → Take test → Recover → Receive outcome
```

The permanent Driving Licence is not rebuilt in Round 1. After the synthetic LL outcome, LicenceFlow provides a clear next-step guide for the future permanent-licence journey.

## 2. What is frozen

### In scope

- Complete meaningful Learner's Licence citizen journey.
- Aadhaar e-KYC simulation and non-Aadhaar document-verification simulation.
- Applicant, address, vehicle-class, fitness-declaration, upload, review, and application-receipt concepts.
- Learning pack, official-topic-based practice, and secure-test rehearsal.
- Real browser camera, microphone, network, storage, visibility, fullscreen, and media-stream checks.
- Real face presence, visible multiple-face, framing, head-position, lighting, exposure, blur, and challenge-response observations.
- Real local voice-activity observation, without identifying a speaker or interpreting speech.
- Readiness before synthetic payment.
- Full 15-question LicenceFlow simulation and accelerated judge-demo mode.
- Answer checkpointing, refresh recovery, temporary network recovery, and camera/interruption recovery.
- Separate knowledge outcome and integrity status.
- Contextual help plus a constrained English/Hindi/Hinglish assistant.
- Journey Receipt and conspicuously invalid synthetic LL document.
- Responsive mobile and desktop experiences using the same state and services.
- An honest future-native production architecture.

### Out of scope

- Live Aadhaar, UIDAI, Sarathi, Parivahan, RTO, payment, SmartLock, or NIC PBOX integration.
- Real licence issuance, eligibility decision, identity decision, or cheating verdict.
- Full permanent Driving Licence application and practical driving test.
- Admin/proctor dashboard.
- Browser claims of screenshot blocking, app-switch prevention, overlay protection, device attestation, or tamper-proof storage.
- Production-grade passive anti-spoofing, deepfake detection, gaze-based misconduct, whisper attribution, or speaker identification.
- Continuous video or audio recording.
- Hard-coded claims about MP question count, pass threshold, retry wait, attempt limit, fee, or secure-test device eligibility.

## 3. Truth and disclosure model

Every important capability is classified in the UI and documentation as one of:

| Label | Meaning |
|---|---|
| **Real browser check** | The prototype actually observes a browser/device condition. |
| **LicenceFlow simulation** | The interaction is synthetic and demonstrates a proposed workflow. |
| **Official configuration required** | The real value or policy must come from an authorized government integration. |
| **Native production capability** | A browser cannot provide the required security boundary. |

A persistent, quiet header disclosure says **“Prototype · Synthetic data · Not a government service.”** The final document says **“DEMO — NOT A GOVERNMENT LICENCE — NOT VALID FOR DRIVING.”** Government seals, official logos, or imitation branding are not used.

## 4. Users and key situations

### Primary user

A first-time applicant using an ordinary Android phone, possibly on unstable mobile data, who may be unfamiliar with government terminology and uncertain about permissions, payment, or exam rules.

### Secondary users

- A citizen using a desktop or laptop.
- A citizen who cannot use Aadhaar e-KYC and needs a document route.
- A citizen with limited English who prefers Hindi or Hinglish explanations.
- A citizen with a motor, visual, hearing, or speech limitation who needs an alternative readiness path.
- A reviewer who needs to understand the solution in under one minute.

### Demonstrated failure situations

- Camera or microphone permission denied.
- Poor lighting, blur, bad framing, no visible face, or more than one visible face.
- Challenge-response retry required.
- Page becomes hidden or fullscreen is lost.
- Camera stream ends.
- Network becomes degraded or temporarily unavailable.
- Payment status becomes pending or uncertain.
- Test stops technically without becoming a knowledge-test failure.
- Refresh/reopen occurs during a saved journey.

## 5. Experience principles

1. **Check before charging.** Required device and rehearsal checks happen before payment.
2. **Explain before asking.** Camera, microphone, identity, storage, and device requests have a plain-language “Why?” explanation before permission.
3. **Name the condition, not the citizen.** Say “Face not visible,” never “Cheating detected.”
4. **Preserve progress by default.** Long forms, answers, and recovery state are checkpointed.
5. **One primary action per screen.** Secondary help never competes with the next required action.
6. **Help is contextual.** “Explain this step” opens a bottom sheet or side panel with the answer for the current task.
7. **Security is proportional.** Brief or low-confidence signals coach; persistent corroborated signals pause or request review.
8. **Accessibility is not suspicion.** Inability to blink, turn, speak, or hold a phone steadily triggers an alternative path.
9. **Mobile first, desktop complete.** Mobile is the base layout; desktop adds space and context, not different rules.
10. **No dead ends.** Every error offers retry, alternative, saved-exit, or support guidance.

## 6. Final journey

### Chapter 0 — Welcome and resume

**Screens**

1. Welcome
2. Language and accessibility preferences
3. Resume saved application, if present

**Welcome content**

- What LicenceFlow demonstrates.
- Synthetic-prototype disclosure.
- “Start a demo application” primary action.
- “Resume saved journey” when a checkpoint exists.
- English/Hindi selector; Hinglish is an explanation style, not a separate legal-language mode.
- Compact “How your data is handled” explanation.

### Chapter 1 — Application

The application reproduces meaningful concepts without requesting real sensitive data.

**Steps**

1. Application instructions and eligibility overview.
2. Applicant category and synthetic state/RTO selection.
3. Identity route:
   - Aadhaar e-KYC simulation, or
   - document/photo/signature upload simulation.
4. Applicant and contact details.
5. Present/permanent address.
6. Vehicle class selection.
7. Fitness self-declaration.
8. Photo/signature or mock-document review.
9. Review, declarations, and synthetic submission.
10. Application acknowledgement with reference number and next steps.

**Behavior**

- All fields have visible labels, examples, and on-blur validation.
- Demo data can be filled with one action; users can still edit it.
- Draft saves after each logical section.
- Identity e-KYC and face monitoring are explained as separate concepts.
- Upload components use generated/synthetic assets; real documents are neither required nor encouraged.

### Chapter 2 — Prepare for the test

**Screens**

1. Test Ready Pack home.
2. Road-sign and road-rule learning cards.
3. Official-topic-based practice questions.
4. Secure-test behavior tutorial.
5. Readiness checklist preview.

**Content taxonomy**

- Traffic signs and signals.
- Driver duties after an accident.
- Documents required while driving.
- Core road-safety and priority rules represented in the official question-bank research.

**Modes**

- **Full simulation:** 15 questions, configurable timing and threshold, explicitly not presented as an MP statutory configuration.
- **Judge demo:** five representative questions and an accelerated deterministic interruption.

The assistant may teach and explain in this chapter. It cites whether an answer comes from official research, a LicenceFlow design decision, or an unresolved configuration.

### Chapter 3 — Device qualification and rehearsal

This chapter must complete before payment.

**Step 1: Explain permissions**

- Camera: face presence, framing, and challenge-response demonstration.
- Microphone: local speech-activity demonstration.
- Storage: recovery checkpoints on the current device.
- Network: session and checkpoint communication.

**Step 2: Capability checks**

- Browser/media API availability.
- Camera permission and healthy stream.
- Microphone permission and healthy stream.
- Local IndexedDB write/read/delete test.
- Service Worker availability.
- Application heartbeat, latency, and temporary-loss handling.
- Fullscreen availability where supported.
- Page-visibility monitoring.
- Memory/performance tier based on actual inference timings.

**Step 3: Environment checks**

- Exactly one visible face in the camera field.
- Face size and position.
- Lighting and overexposure.
- Blur and likely obstruction.
- Local speech-activity pipeline health.

**Step 4: Challenge-response**

- A randomized accessible sequence such as turn right → center → blink.
- The result is “challenge completed,” “retry required,” or “inconclusive.”
- Alternatives are offered when blink/head movement is unavailable.

**Step 5: Interruption rehearsal**

- Answer one sample question.
- Simulate a short network loss.
- Demonstrate that the answer remains saved.
- Explain what happens after a call, app switch, camera loss, or reconnect.

**Step 6: Readiness report**

The report distinguishes:

- **Ready for the LicenceFlow prototype**
- **Ready with reduced capability**
- **Needs a fix before payment**
- **This device cannot run the secure-test demonstration**
- **Official test compatibility unknown**

Tier D users can continue through a clearly labelled non-proctored product tour, but cannot enter the secure-test simulation as if qualified.

### Chapter 4 — Fee and payment

**Screens**

1. Configurable fee breakdown.
2. Synthetic payment method and confirmation.
3. Payment processing.
4. Success, pending, failed, and status-unknown recovery states.
5. Payment receipt.

**Rules**

- No historical or screenshot-derived fee is presented as the current MP amount.
- All amounts are labelled synthetic/configured for the demo.
- Double submission is prevented.
- A pending or unknown payment is checked before offering another payment action.
- Payment success creates a durable journey event and checkpoint receipt.

### Chapter 5 — Secure test simulation

**Entry sequence**

1. Instructions, language, timing, and simulation disclosure.
2. Technical and privacy summary.
3. Optional experimental identity-similarity check.
4. Camera/microphone recheck.
5. Start confirmation.

**Test interface**

- One question at a time.
- Large answer targets and visible selection.
- Question count, timer, connection state, save state, camera state, and technical-help action.
- Answers are saved before moving forward.
- Back navigation follows the configured test rule; the prototype default permits review before final submission.
- No learning answer or chatbot knowledge response is available during the active test.
- Technical help can explain and repair camera, microphone, network, or visibility problems.

**Integrity observations**

- No visible face.
- More than one visible face.
- Poor light/framing/blur.
- Camera stream stopped.
- Speech activity observed.
- Page hidden/fullscreen lost.
- Network degraded/offline/restored.
- Challenge retry/inconclusive after a major recovery.

**Response ladder**

```text
Brief condition → quiet coach
Persistent condition → pause and correct
Repeated corroborated condition → continue with review status
Capability lost → technical stop with preserved progress
Authorized policy termination → separate state, never inferred by the prototype alone
```

**Recovery overlays**

- “We lost the active test view.”
- “We cannot verify the camera right now.”
- “More than one face is visible.”
- “Your connection is temporarily offline. Your latest answer is saved on this device.”
- “The secure environment could not be restored.”

Each overlay contains the detected condition, what was saved, what to do, and what happens if recovery fails.

### Chapter 6 — Outcome and receipt

Knowledge and integrity are never collapsed into one misleading status.

**Knowledge outcomes**

- Passed.
- Not passed.
- Not completed.
- Result unavailable.

**Integrity statuses**

- No review required.
- Pending review.
- Cleared.
- Inconclusive.
- Technical interruption.
- Policy termination, only when explicitly injected as a synthetic authorized-policy scenario.

**Outcome screens**

- Passed + clear integrity: synthetic LL document.
- Passed + pending review: knowledge passed, issuance pending review.
- Not passed: configurable retest fee and availability guidance; no invented wait period.
- Technical interruption: attempt is not shown as knowledge failure; preserved receipt and official-support explanation.
- Result unavailable: status check rather than repeat test/payment.

**Journey Receipt**

The receipt contains:

- Synthetic application reference.
- Completed stages.
- Identity route and verification simulation outcome.
- Readiness results and capability tier.
- Permission purposes and consent timestamps.
- Synthetic payment reference/status.
- Test start, answer checkpoints, interruptions, recoveries, submission, knowledge outcome, and integrity status.
- Clear distinction between locally saved, server-acknowledged, simulated, and official-configuration-required events.

The receipt can be viewed throughout the journey and exported as a clearly labelled demonstration artifact.

### Chapter 7 — Permanent licence next step

After the LL outcome, a concise guide explains:

- That the permanent licence is a later journey.
- The official waiting/eligibility concept as supported by current sources.
- Practical driving-test and RTO concepts.
- Documents and preparation checklist.
- Which facts require current state/RTO confirmation.

This chapter does not simulate permanent licence issuance in Round 1.

## 7. Contextual help and assistant

### Interaction design

- Every complex step has a visible **“Why?”**, **“What happens next?”**, or **“Explain this step”** action.
- Mobile uses a bottom sheet; desktop uses a side panel.
- The panel preserves the current form/test context and never resets progress.
- Frequently asked questions are searchable without opening a conversational interface.
- Answers are short first, with expandable detail and source/status.

### Knowledge design

Every knowledge item has:

```ts
type KnowledgeItem = {
  id: string
  topic: string
  languages: Array<'en' | 'hi' | 'hinglish'>
  answer: string
  sourceType: 'official' | 'licenceflow-design' | 'unresolved'
  sourceUrl?: string
  reviewedAt: string
  allowedDuringExam: boolean
}
```

### Assistant boundaries

- May explain application steps, permissions, privacy, readiness, payment recovery, technical errors, road-safety learning, and post-test actions.
- During an active exam, may only provide technical-process help.
- Must not answer the current test question.
- Must not decide eligibility, identity, misconduct, retest policy, fee, or licence issuance.
- Must answer from the curated knowledge base; if uncertain, say so and show the relevant official route.
- A deterministic retrieval answer is always available when an AI endpoint is unavailable.

## 8. Integrity engine

The integrity engine observes conditions; it does not classify a person as dishonest.

### Five layers

1. **Observation:** raw measurable value, such as `faceCount = 2`.
2. **Signal:** time-aware interpretation, such as `MULTIPLE_FACES`.
3. **Risk:** persistence, recurrence, quality, confidence, corroboration, and accessibility context.
4. **Response:** continue, coach, retry, pause, review, or technical stop.
5. **Review:** not required, pending, cleared, escalated, or inconclusive.

### Event contract

```ts
type IntegrityEvent = {
  eventId: string
  sessionId: string
  sequence: number
  code: IntegrityEventCode
  source:
    | 'camera'
    | 'face-detector'
    | 'face-landmarker'
    | 'image-quality'
    | 'vad'
    | 'browser'
    | 'network'
    | 'storage'
  observedAt: string
  durationMs?: number
  confidence?: number
  quality?: 'good' | 'borderline' | 'poor'
  capabilityTier: 'A' | 'B' | 'C' | 'D'
  response: 'continue' | 'coach' | 'retry' | 'pause' | 'review' | 'technical-stop'
  synthetic: boolean
  modelVersion?: string
}
```

No raw frame, face crop, audio segment, or landmark array belongs in the journey receipt.

## 9. Technical architecture

### Frontend

- React + TypeScript + Vite.
- PWA manifest and Service Worker.
- Semantic HTML and custom token-based CSS.
- Lucide icons.
- Typed reducer/state-machine modules rather than UI-owned business logic.
- Route guards derived from journey state.
- IndexedDB repositories for journey, answer, event, and receipt checkpoints.
- Heavy ML modules lazy-loaded only at readiness/test entry.

### Processing pipelines

```text
Camera → Vision Worker → compact observations ┐
Microphone → AudioWorklet/VAD → observations  ├→ Integrity Engine → UX response
Browser/network/storage sensors → observations┘                         ↓
                                                              IndexedDB + sync
```

- MediaPipe Face Detector: visible face count and boxes.
- MediaPipe Face Landmarker: landmarks, head movement, and blink-like challenge signals.
- Canvas/ImageData: lighting, exposure, blur, and obstruction-like quality signals.
- ONNX Runtime Web with WASM baseline; WebGPU is optional acceleration only.
- Browser Silero VAD for speech activity.
- React never owns the continuous inference loop.

### Optional experimental identity module

- SFace INT8 through ONNX Runtime Web.
- Runs once before the test and optionally after major recovery.
- Output is **experimental identity similarity**, never “identity verified.”
- Disabled if performance, model provenance, or accuracy checks are unsatisfactory.

### Minimal TypeScript backend

The public demo may use serverless functions for:

```text
POST /api/demo/session       create synthetic session and configuration
GET  /api/demo/heartbeat     return authenticated reachability/server time
POST /api/demo/checkpoint    acknowledge sequence + digest with server signature
POST /api/help               optional grounded explanation adapter
```

The server stores no raw biometric media. A signed checkpoint receipt means only that the server acknowledged a digest; it is not described as proof that the browser was uncompromised. If a real signing endpoint is not deployed, the UI says **local checkpoint**, not **server-verified checkpoint**.

### Configuration boundary

These values come from typed demo configuration and remain replaceable by an authorized integration:

- Fee and fee breakdown.
- Test question count.
- Pass threshold.
- Per-question/session timer.
- Back/review behavior.
- Retry fee and availability.
- Attempt limit or waiting period.
- Mobile/device eligibility.
- Integrity escalation thresholds.
- Retention policy.

## 10. State architecture

Use four cooperating state domains:

### Journey state

`welcome → application → preparation → readiness → payment → exam-entry → exam → outcome → next-step`

### Payment state

`not-started → processing → succeeded | failed | pending | unknown → reconciled`

### Exam state

`not-started → authorizing → active → paused-recoverable → submitting → submitted → result`

Separate terminal operational states:

`technical-stop | policy-terminated | result-unavailable`

### Synchronization state

`local-only → queued → syncing → acknowledged | conflict | retry-required`

Knowledge result and integrity status are separate fields. UI routes may request transitions, but reducers/services validate whether the transition is legal.

## 11. Persistence and recovery

- IndexedDB replaces the premature draft's `localStorage` journey store.
- Each answer has session ID, question ID, selected answer, revision, sequence, local timestamp, previous digest, and sync status.
- Writes are transactional and complete before the “Next” action advances.
- Synchronization is idempotent.
- `navigator.onLine` is only a hint; heartbeat/fetch results determine application connectivity.
- Foreground retry is the baseline; Background Sync is optional.
- Service Worker caches only the shell, help content, and permitted synthetic assets—not a claim of an authorized offline government examination.
- Recovery after reload verifies session state, last safe checkpoint, media permissions, and integrity context before continuing.

## 12. Capability tiers and fallbacks

| Tier | Available experience |
|---|---|
| **A** | Detector, landmarker, challenge-response, VAD, quality checks, optional identity experiment, interruption monitoring. |
| **B** | Core MediaPipe, challenge-response, VAD, quality; optional identity/PAD disabled. |
| **C** | Reduced face-analysis frequency, simplified challenge, RMS audio fallback, no identity/PAD. |
| **D** | Secure-test simulation blocked before payment; guided non-proctored product tour available. |

The product never silently drops to a weaker tier during payment/test. It pauses, explains the change, and requires an explicit recovery or exit.

## 13. Design system direction

### Brand feeling

Premium, calm, trustworthy, humane, and technically competent. It should resemble a high-quality private financial/health service more than a legacy government portal, without becoming flashy or exclusive.

### Visual rules

- Light-first neutral surfaces with deep ink and restrained blue/teal actions.
- No government imitation, patriotic decoration, 3D scenes, glass-heavy cards, or purple “AI” gradients.
- Semantic status colors always paired with an icon and text.
- One Lucide icon family and consistent stroke weight.
- 4/8px spacing system; 16px minimum body text.
- 48px primary touch targets and at least 8px between adjacent targets.
- Visible 3px focus treatment, full keyboard operation, and logical screen-reader focus.
- Mobile bottom action bar respects safe-area insets; desktop uses a centered task column with contextual side information.
- Motion communicates state/recovery in 150–300ms and respects reduced-motion settings.
- Long explanations use progressive disclosure, not dense walls of text.
- Latin and Devanagari font coverage must be tested; typography cannot rely only on a Latin font.

### Responsive composition

- **Mobile:** single task column, sticky safe-area-aware primary action, bottom-sheet help.
- **Tablet:** wider task column with receipt/help summary.
- **Desktop:** task column plus optional journey/help rail; no stretched forms.
- Test interface stays distraction-free on every size.

## 14. Accessibility and inclusion

- WCAG AA contrast minimum.
- Zoom is never disabled.
- 375px portrait and small landscape are first-class targets.
- Keyboard and screen-reader operation for the entire non-camera journey.
- Large-text layout does not truncate instructions or actions.
- Captions/transcript for video/tutorial content.
- Audio playback of learning questions where useful, but not required for completion.
- Alternative challenge paths for limited blinking/head movement.
- No integrity penalty for using accessibility features in the prototype.
- Permission denials provide a route to retry, learn why, or continue the non-proctored tour.
- English and Hindi use reviewed strings; Hinglish is helpful explanatory copy, not machine-translated legal text.

## 15. Privacy and security

### Default data minimization

Do not retain:

- Continuous camera video.
- Raw camera frames.
- Microphone recordings.
- Liveness clips.
- Raw landmarks.
- Face crops.

Retain only what is necessary for the synthetic journey:

- Event type, time, duration, quality/coarse confidence, model version, challenge outcome, and response.
- Synthetic application/test/payment data.
- Answer/checkpoint state.

Identity embeddings, if the experiment uses them, are treated as sensitive biometric-derived data and discarded after the comparison. The prototype's exact local/server behavior is explained before permission. It never invents a government retention promise.

### Security controls

- HTTPS deployment.
- Strict Content Security Policy compatible with self-hosted WASM/models/workers.
- No API keys in the browser.
- Input/schema validation at client and server boundaries.
- Rate limits for public assistant/session endpoints.
- Server checkpoint receipts signed with a server-held secret if implemented.
- Synthetic data only; no request for real Aadhaar number or identity document.

## 16. Technical gates before full implementation

These are small disposable proofs, not parallel product builds.

### Gate A — Vision worker on mobile

Prove camera preview, MediaPipe worker inference, face count, framing, head movement, and stable UI on at least one low/mid-range Android device. Record inference p50/p95, dropped frames, memory behavior, and fallback tier.

### Gate B — Combined media stability

Run camera, periodic landmarks, quality checks, local VAD, IndexedDB writes, and heartbeat together. Confirm that the phone remains usable and does not accumulate worker backlog.

### Gate C — Recovery

Save answers, simulate offline state, reload the application, restore the last safe checkpoint, re-check media, and continue without duplicating events or consuming a second synthetic payment.

**Gate decision:** pass and proceed, tune and reduce frequency, use fallback tier, or remove the optional feature. SFace and passive PAD experiments cannot block the core build.

## 17. Implementation phases

### Phase 0 — Preserve and reset the premature draft

- Keep useful visual/state ideas, but treat the current `src` flow and `docs/product-plan.md` as superseded.
- Establish version control and a clean baseline before overlapping edits.
- Install only approved dependencies.

### Phase 1 — Technical gates

- Build isolated camera/worker, VAD, and recovery probes.
- Record device results and freeze capability thresholds/fallbacks.

### Phase 2 — Product foundation

- Route shell, design tokens, localization framework, disclosure, error boundary.
- Typed demo configuration.
- Journey, payment, exam, integrity, and sync reducers/services.
- IndexedDB repositories and Service Worker.
- Journey Receipt event model.

### Phase 3 — Complete citizen journey

- Welcome/resume.
- Application routes and acknowledgements.
- Learning pack, practice, tutorial, contextual help.
- Payment and reconciliation states.
- Permanent-licence next-step guide.

### Phase 4 — Readiness and integrity

- Permission explanations.
- Capability/environment checks.
- Vision/audio workers.
- Challenge-response state machine.
- Rehearsal and readiness report.
- Capability tiers and accessibility alternatives.

### Phase 5 — Examination and recovery

- Full and demo question modes.
- Transactional answer checkpointing.
- Test integrity responses and technical help mode.
- Network/camera/visibility interruption recovery.
- Separate result and integrity outcomes.
- Synthetic licence and exportable receipt.

### Phase 6 — Validation, polish, and submission

- Unit, integration, browser, accessibility, and real-device tests.
- Performance/bundle audit and optional-feature removal if needed.
- External AI visual-polish pass under locked behavioral contracts.
- Public HTTPS deployment.
- Two-minute demonstration and submission copy.

## 18. Priority cut line

### Must be real and working

- Complete primary journey.
- Synthetic identity/application/payment disclosures.
- Pre-payment readiness.
- Camera/microphone permissions and stream health.
- Face presence/count/framing and basic quality.
- Challenge-response demonstration.
- Voice activity observation or explicit reduced-tier fallback.
- IndexedDB answer checkpointing and reload/network recovery.
- Separate technical interruption, knowledge result, and integrity status.
- Context help, Journey Receipt, responsive layout, and accessibility basics.

### Should be working

- Minimal server heartbeat/checkpoint receipt.
- Hindi core journey and Hinglish help.
- Grounded assistant with deterministic fallback.
- Full 15-question mode plus five-question judge mode.

### Optional only after the core is stable

- SFace experimental similarity.
- Passive PAD experiment.
- WebGPU acceleration.
- Rich export/PDF presentation.
- Expanded learning library.

### Explicitly excluded from deadline pressure

- Native app.
- Production biometric vendor integration.
- Deepfake/mask guarantees.
- Full permanent DL flow.
- Admin/proctor tools.

## 19. Test strategy

### Unit tests

- Legal/illegal state transitions.
- Payment pending/reconciliation.
- Exam answer revisions and scoring configuration.
- Integrity persistence/response thresholds.
- Receipt ordering and deduplication.
- Assistant exam-mode restrictions.

### Integration tests

- Application autosave/resume.
- Preflight blocked before payment.
- Permission denial and retry.
- Readiness tiers.
- Payment status unknown then reconciled.
- Answer saved before advancing.
- Network interruption and restore.
- Camera/visibility pause and re-entry check.
- Passed, not-passed, pending-review, and technical-stop outcomes.

### Browser/accessibility tests

- Chromium desktop and Android.
- Safari/iOS sanity path with WASM/reduced tiers.
- 375, 768, 1024, and 1440px layouts; mobile landscape.
- Keyboard, visible focus, screen-reader names, zoom, large text, reduced motion, and contrast.
- Media tests use controlled mocks in automation and real consenting-device tests separately.

### Acceptance outcomes

- No horizontal scrolling or hidden fixed-bar content.
- No user can pay before readiness is resolved.
- No answer is lost after the demonstrated interruption/reload.
- No technical interruption is labelled as a knowledge failure.
- No browser signal is presented as proof of cheating.
- No real sensitive identity data is required.
- Every mock/simulation is disclosed at the point of use.

## 20. Judge demonstration

### First minute — citizen experience

1. Start/resume synthetic application.
2. Show contextual “Why?” help.
3. Run readiness before payment; expose and fix one deterministic condition.
4. Complete randomized challenge-response.
5. Make synthetic payment.
6. Answer questions, trigger network interruption, and recover from the saved checkpoint.
7. Show separated outcome and Journey Receipt.

### Second minute — product and engineering reasoning

1. Explain the real incident and failure-safe principle.
2. Show local-first vision/audio observations and capability tiers.
3. Explain that browser signals observe conditions, not cheating.
4. Show IndexedDB/checkpoint recovery and privacy minimization.
5. State the authorized native/government-integration path for production.
6. Show where Codex materially supported research, architecture, implementation, testing, and documentation.

## 21. External visual-polish boundary

The separate frontend-polish model may change:

- CSS/design tokens within approved accessibility rules.
- Spacing, typography, responsive composition, icons, and presentational markup.
- Non-blocking micro-interactions.

It must not change:

- Reducers/state machines.
- Integrity policy or event semantics.
- IndexedDB/synchronization behavior.
- API contracts.
- Route guards.
- Mock/real disclosures.
- Accessibility semantics and keyboard behavior.
- Test IDs or acceptance-test behavior.
- Exam assistant restrictions.

Visual polish begins only after the functional contracts and main responsive layouts are stable.

## 22. Final configuration still intentionally open

The following are integration configuration, not blockers to building the UX:

- Current MP secure-test mobile/device matrix.
- Live question count and pass threshold.
- Live fee/retest fee.
- Waiting period or attempt rules after a failed LL test.
- Official violation thresholds and wording.
- SmartLock/PBOX camera, microphone, liveness, and face-artifact retention.

The prototype never fills these gaps with guesses.

## 23. Approval decision

Approval of this document authorizes implementation of the specification in phases, beginning with the three technical gates. Any later request that materially expands the product—such as a full permanent DL journey, admin dashboard, native application, or production biometric integration—requires an explicit scope decision rather than silently entering the build.

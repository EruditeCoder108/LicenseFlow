# LicenceFlow MP — ideas traceability

**Source:** `ideas_updated_3.md`  
**Decision date:** 23 August 2026  
**Purpose:** Ensure that every useful idea is either implemented, scheduled, or consciously deferred instead of being silently forgotten.

## Decision labels

| Label | Meaning |
|---|---|
| `BUILT` | Present in the current repository; later QA/polish may still improve it |
| `M3` | Build during compatibility and payment milestone |
| `M4` | Build during Secure Test Mode milestone |
| `M5` | Add during content/completeness, hardening, or visual polish |
| `SUBMISSION` | Belongs in the video, judge material, or government-handoff explanation—not ordinary citizen UI |
| `DEFER` | Useful future work, but not worth Round 1 risk or time |
| `REJECT` | Conflicts with the product boundary, honesty, privacy, or reliability |

## Core and application ideas

| Idea | Decision | Implementation decision |
|---|---|---|
| 1. “Can I finish this today?” pre-start summary | `BUILT` | LL entry now shows the four journey phases and device need through progressive disclosure without promising an unverified completion time |
| 2. Optional quick device check before application | `M5` | Add a lightweight capability preview that does not replace the mandatory M3 pre-payment check |
| 3. Guided plain-language form steps | `BUILT` | Retain human chapter names and progressively improve remaining technical wording |
| 4. Inline “Why are we asking this?” | `M5` | Add targeted inline disclosures for confusing fields and permissions; route Help remains the broader explanation |
| 5. Persistent Journey Health card | `M3` | Implement once as a state-derived Journey Contract, not as another decorative card on every screen |
| 6. Strong payment safety gate | `M3` | Required: compatibility and rehearsal must pass before payment |
| 7. “Test-drive your test” rehearsal | `M3` | Upgrade the existing answer rehearsal to include deterministic interruption and recovery proof |
| 8. Pre-test “What if?” explainer | `M4` | Add concise technical FAQs before the test; never provide answer assistance |
| 9. Calm test-health strip | `M4` | Healthy state remains compact; reveal diagnostics only when action is required |
| 10. Two-part warning pattern | `M3` + `M4` | Every major error says what happened and what remains safe/uncertain |
| 11. Technical failure as first-class outcome | `BUILT` | Preserve separate knowledge, technical and integrity outcomes |
| 12. Powerful Journey Receipt | `BUILT` + `M3` | Existing exam ledger remains; M3 adds complete payment and reconciliation events |
| 13. “What changed?” comparison | `SUBMISSION` | Use in video/architecture material, not as promotional citizen-page content |
| 14. Human-language step framing | `BUILT` | Preserve and audit during M5 |
| 15. Save-state reassurance on every step | `M5` | Add restrained state-derived autosave text; do not repeat inaccurate “no payment” copy |
| 16. Visual vehicle selection | `BUILT` | Visual vehicle-first cards and selected summary are present |
| 17. Visual explanation for confusing categories | `BUILT` + `M5` | Existing cards cover key categories; add only instructional visuals that reduce confusion |
| 18. Contextual examples and microcopy | `M5` | Add examples to confusing fields during the form-content audit |
| 19. Review screen with direct missing-item recovery | `M5` | Improve completeness summary and links/focus to the exact blocking section |

## Vehicle selection additions

| Idea | Decision | Implementation decision |
|---|---|---|
| V1. Visual vehicle cards | `BUILT` | Keep official codes secondary to recognizable vehicle types |
| V3. “What can I drive with this?” | `BUILT` + `M5` | Existing explanation remains; legal coverage copy requires verified definitions |
| V4. Ask citizen intent first | `BUILT` | Present “what do you want to drive?” before codes |
| V5. Compare similar classes | `M5` | Add only for verified distinctions; no guessed legal comparison |
| V6. Guided class selector | `M5` | A short wheels/gears/use helper is approved if its mapping is verified |
| V7. Real-world vehicle-model search | `DEFER` | Curated catalogue cost and accuracy risk do not strengthen the main failure-safe story enough |
| V9. Visual consequence preview | `BUILT` + `M5` | Reuse the selection summary and carry it into review/result where useful |
| V10. “Your licence” basket | `BUILT` + `M5` | Selected summary exists; improve edit/remove explanations during polish |

## Payment and money-confidence additions

| Idea | Decision | Implementation decision |
|---|---|---|
| P1. Itemized fee explanation | `M3` | Fee rows come from configuration; unverified MP amounts remain synthetic/configurable |
| P2. Accurate “no payment yet” reassurance | `M3` | Derive message from transaction state; never use static reassurance after an attempt begins |
| P3. Payment readiness lock | `M3` | Enforce in domain logic and UI route guards |
| P4. “What if payment fails?” | `M3` | Explain close, network loss, delayed confirmation and status checking before authorization |
| P5. Pending/uncertain payment | `M3` | Make pending and unknown first-class recoverable states |
| P6. Payment activity trail | `M3` | Human-readable by default with optional technical IDs/details |
| P7. Duplicate-payment protection | `M3` | Reconcile pending/unknown and suppress repeat payment |
| P8. Exit safely around payment | `M3` | State exactly what is saved and what must be checked before returning |
| P9. Payment consequence preview | `M3` | Explain the next unlocked prototype stage without implying government policy |
| P10. Money-safety status strip | `M3` | Show exact confirmed/pending/not-started state; never promise a refund or financial guarantee |

## Approved visual and interaction direction

| Direction | Decision | Implementation decision |
|---|---|---|
| Almost-monochrome institutional system | `BUILT` + `M5` | Preserve neutral surfaces, deep navy/blue and semantic colors only |
| Containers must earn borders | `BUILT` + `M5` | Remove decorative card walls during final polish |
| Premium restrained typography | `BUILT` + `M5` | Keep accessible local fonts and restrained hierarchy; no external font dependency is required |
| One dominant task per screen | `M3` + `M4` + `M5` | New payment/test pages get one primary action and receding secondary detail |
| Journey-based progress | `BUILT` + `M3` | Existing stages remain; add precise payment/recovery states |
| Consistent bottom action area | `M5` | Add only after keyboard, validation and safe-area testing; do not obscure content |
| Contextual help, not floating AI | `BUILT` + `M5` | Extend route/inline help; reject a generic chatbot in Round 1 |
| Context-aware UI | `M3` + `M4` | Controls and truth statements must derive from saved state |
| Restrained purposeful motion | `M5` | 150–300 ms state transitions, reduced-motion support, no decorative animation |
| 3D/instructional visuals only where useful | `M5` | Vehicle, framing and upload guidance only; no decorative 3D |

## Application status and Journey Contract

| Idea | Decision | Implementation decision |
|---|---|---|
| Separate “What’s next” and “What happened” | `BUILT` | Keep current action visually dominant and history quieter |
| Human-readable statuses | `BUILT` + `M3` | Map internal payment codes to clear citizen states |
| Show who owns the next step | `M3` | Use “Your action,” “System check,” or “No action needed” where ambiguity exists |
| Explain blocked future stages | `M3` | Every disabled/locked stage states what unlocks it and why |
| Resume exact saved point | `BUILT` | Preserve application step and test checkpoint behavior |
| Explicit “Recovered successfully” | `M3` + `M4` | Confirm restored application/payment/answer state after recovery |
| Citizen event history + technical details | `BUILT` + `M3` | Expand ledger for payment attempts and reconciliation |
| State-derived Journey Contract | `M3` | Unify Journey Health, money status and recovery facts into one truthful component |

## Exam interface and flow

| Idea | Decision | Implementation decision |
|---|---|---|
| Calm three-zone exam interface | `M4` | Strip ordinary portal chrome during active test |
| Select → confirm → checkpoint → advance | `BUILT` + `M4` | Rename/refine current save action and add visible saved acknowledgement |
| Stable controls/layout | `M4` | Keep primary controls fixed across image/text lengths and phone sizes |
| Hide healthy proctoring UI | `M4` | Camera preview and raw diagnostics appear only for correction |
| Compact question map | `M4` | Configuration-driven and only if review/navigation is enabled |
| Calm timer | `M4` | Configuration-driven; no alarmist animation |
| Listen/read-aloud | `M4` | Approved accessibility feature using selected-language browser speech where stable |
| Graceful offline degradation | `M4` | Continue locally only while safe; pause when submission/dependency requires it |
| Proportional camera/integrity response | `M4` | Temporal ignore → coach → pause policy |
| Exact checkpoint recovery | `BUILT` + `M4` | Improve recovery presentation without changing the invariant |
| Final review and “test received” confirmation | `M4` | Configuration-driven review, then receipt acknowledgement before result |

## Pre-exam readiness and integrity

| Idea | Decision | Implementation decision |
|---|---|---|
| Calm permission/consent before prompts | `BUILT` | Retain just-in-time explanation |
| Parallel automatic checks | `BUILT` + `M3` | Existing checks run together; simplify the visible progression |
| Live positioning coach | `M3` + `M4` | Human instructions and silhouette; never raw boxes/confidence scores |
| Fix before fail | `M3` + `M4` | Auto-recheck corrected conditions instead of repetitive failure pages |
| Randomized active liveness | `M4` | Random left/right turn after a live session begins |
| Adaptive assurance ladder | `M4` | Clear → one extra check → coached retry/review; deterministic rather than black-box risk scoring |
| Identity vs ongoing presence | `M4` | Make the conceptual and copy distinction explicit |
| Never hard-fail one uncertain result | `M4` | Require temporal evidence and provide alternative/review paths |
| Multiple-person guidance, not accusation | `M4` | Coach, persistently pause if necessary, then allow recovery |
| Ready Room | `M4` | Final applicant-only transition before timer starts |

## Microphone, camera and privacy decisions

| Idea | Decision | Implementation decision |
|---|---|---|
| Web Audio stream health/RMS | `BUILT` | Treat as technical readiness, not cheating detection |
| Local voice-activity detection | `DEFER` | Add only after the core build is frozen and ordinary-phone testing proves it stable |
| Camera/microphone signal correlation | `M4` | Deterministic observation rules only; no automatic verdict |
| Duration/repetition thresholds | `M4` | Ignore transient noise; coach/pause only persistent combined conditions |
| Neutral event vocabulary | `M4` | Use technical/observation codes, never `CHEATING_DETECTED` |
| Local ephemeral media analysis | `BUILT` + `M4` | Structured signals only; no continuous recording/upload |
| Extend existing MediaPipe stack | `M4` | Prefer current face landmarks/count/pose before adding libraries |
| Temporal camera evidence | `M4` | Rolling windows prevent single-frame blocking decisions |
| Passive presentation-attack detection | `DEFER` | Experimental only after release candidate; remove if slow or biased |
| Layered replay resistance | `M4` | Random active liveness + temporal continuity; no “deepfake-proof” claim |
| Gaze-based guilt | `REJECT` | Too ambiguous and unfair for misconduct decisions |
| Heavy object/phone detection | `DEFER` | Low Round 1 value and high false-positive/performance risk |
| Page visibility observation | `BUILT` + `M4` | Contextual observation, never proof of cheating |
| SmartLock-equivalent browser claim | `REJECT` | Screenshot/app/overlay/device integrity controls require native/managed tooling |

## Accessibility, Indian context, demo and stretch ideas

| Idea | Decision | Implementation decision |
|---|---|---|
| Helper mode | `M4` | Acknowledge application assistance and clearly end it before the test |
| Shared-computer/kiosk finish | `M4` + `M5` | Clear local data and return to the welcome page |
| Natural English/Hindi | `BUILT` + `M5` | Complete the remaining route audit; Hinglish search is optional, not core |
| Large targets/low-digital-literacy design | `BUILT` + `M5` | Maintain 44 px minimum targets, clear progress and one primary action |
| One-click prepared judge path | `BUILT` + `M3` | Keep deterministic while extending it through payment outcomes |
| Full journey behind prepared path | `BUILT` | Retain empty and prepared application journeys |
| Side-by-side value explanation | `SUBMISSION` | Use in video/briefing rather than citizen UI |
| Device handoff by code/QR | `DEFER` | Valuable production extension, but it introduces cross-device/server state not needed for Round 1 |
| Visual guidance layer | `M4` + `M5` | Add only for camera framing, head turn, photo/signature and verified vehicle meaning |
| Smart support assistant | `DEFER` | Contextual deterministic help is safer; no unverified general chatbot in Round 1 |

## Final decision summary

The roadmap deliberately protects the strongest ideas: readiness before money, failure-safe testing, truthful state, calm mobile proctoring, contextual help, bilingual clarity and accessible recovery. The deferred items are not forgotten; they are excluded because they add infrastructure, privacy, model-reliability or factual-accuracy risk without improving the Round 1 proof enough.

This matrix must be reviewed at G1, G2 and G5. A status may move forward only when its dependencies and evidence are ready; it must never silently move from `DEFER` into visible product scope.

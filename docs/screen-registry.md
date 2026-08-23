# LicenceFlow screenshot-to-route registry

This registry closes Milestone 5A against the 68 chronologically ordered reference screenshots in `images/`. The screenshots document interaction patterns from multiple state portals and videos; they are not treated as verified Madhya Pradesh policy.

Evidence labels:

- `IMPLEMENTED`: working in the Madhya Pradesh prototype.
- `REFERENCE`: interaction informs the design, but the exact state-specific screen is not copied.
- `INFORMATION`: visible service destination with no invented transaction.
- `EXCLUDED`: browser/creator/native-software chrome that is not a portal screen.

| Screenshots | Reference state | Current route or surface | Implemented interaction | Evidence / omission reason |
|---|---|---|---|---|
| 1–5 | National/state entry, catalogue and dashboard | `/`, `/mp/services`, `/mp/service/:id` | National transport homepage, searchable MP licence catalogue, current application and informative secondary services | `IMPLEMENTED`; state selector omitted because Round 1 is verified only for MP |
| 6–10 | LL instructions, applicant category and identity routes | `/mp/ll/start`, `/mp/ll/application/category`, `/identity` | Task-first start/resume, expandable process, applicant status and synthetic identity route | `IMPLEMENTED`; Aadhaar outage text remains recoverable guidance, not a claim of live UIDAI integration |
| 11–14 | Aadhaar/VID, OTP, consent and eKYC summary | `/mp/ll/application/identity`, `/personal` | Labelled synthetic identity verification, reviewed consent and editable summary | `REFERENCE`; no real Aadhaar, OTP or eKYC call is made |
| 15–20 | Personal/address/vehicle/Form 1 and declaration success | `/personal`, `/address`, `/vehicles`, `/fitness`, `/review` | Validated multi-step form, bilingual fields, autosave, vehicle selection, Form 1 and review | `IMPLEMENTED` |
| 21–25 | Submission acknowledgement, application number and tracker | `/mp/ll/submitted`, `/mp/service/application-status`, `/mp/application/:id` | Printable acknowledgement, lookup and state-derived next action | `IMPLEMENTED` |
| 26–31 | Photo, signature and document upload | `/mp/application/:id/uploads` | Prepared synthetic previews, per-item confirmation and completion gate | `IMPLEMENTED`; real identity files are intentionally rejected by product copy |
| 32–36 | Tracker-to-fee transition and itemized fee review | `/mp/application/:id`, `/payment` | Compatibility gate before payment, configurable prototype fee, method choice and declaration | `IMPLEMENTED`; amount is not asserted as the current official MP fee |
| 37–48 | Redirect, treasury/gateway, method, OTP, return and receipt | `/payment/redirect`, `/sandbox-gateway/:id`, `/payment/return`, `/payment-status`, `/receipt` | Separate sandbox gateway, deterministic outcomes, idempotent confirmation, reconciliation and printable receipt | `IMPLEMENTED`; bank OTP and treasury integration excluded because no real financial system is connected |
| 49–53 | Post-payment dashboard, tutorial and LL menu | `/mp/services`, `/mp/application/:id`, `/tutorial`, service catalogue | Saved-stage tracker, active learning tutorial and useful LL service destinations | `IMPLEMENTED` / `INFORMATION` for non-core services |
| 54–60 | Test sign-in, SmartLock/native launcher, credentials and authentication | `/login`, `/readiness`, `/test-entry` | Judge login, device readiness, explicit instructions, synthetic acknowledgement and browser/native boundary | `IMPLEMENTED`; SmartLock launcher and native chrome are `EXCLUDED` because the prototype is browser-based |
| 61–65 | Rules, language, PIN, face/mic checks and timed questions | `/test-entry`, `/test` | Full English/Hindi instructions, local camera-derived checks, quiet coaching and checkpointed questions | `IMPLEMENTED`; official PIN/password validation and official MP timing are not claimed |
| 66 | Pass/fail and performance | `/result` | Separate knowledge, technical and integrity outcomes plus ordered Journey Receipt | `IMPLEMENTED` |
| 67–68 | LL menu and Form 3 print | `/result`, `/mp/service/print-ll` | Clearly invalid demonstration LL and print action; service destination remains discoverable | `IMPLEMENTED` demonstration document; official Form 3 generation is `INFORMATION` only |

## Completion finding

Every screenshot-relevant core step is either implemented or explicitly excluded for one of three defensible reasons: it belongs to another state's unverified configuration, it requires a real government/financial/native integration, or it is video/browser chrome rather than portal UI. No excluded screen creates a dead end in the working MP Learner's Licence path.

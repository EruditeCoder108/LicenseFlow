# Modern Sarathi/Parivahan Portal — canonical product blueprint

> **ROUND 1 SCOPE OVERRIDE — 22 August 2026.** This is now a future expansion and
> screenshot-reference document. It is not the Round 1 implementation authority.
> Round 1 is Madhya Pradesh-only, Learner's-Licence-only, and is governed by
> [`round-1-canonical-scope.md`](round-1-canonical-scope.md). In particular, do not
> build state selection, multi-state configuration or the permanent-DL journey for
> Round 1.

**Status:** Future portal vision and screenshot reference  
**Date:** 22 August 2026  
**Supersedes:** the small LicenceFlow landing-page demo, the Round 1 demo contract, and any earlier specification that treats this as a separate startup  
**Evidence base:** 68 chronologically ordered screenshots in `images/`, the official hackathon material, and the project research reports

## 1. Product definition

This project is a comprehensive, state-aware redesign of the existing Sarathi/Parivahan citizen portal. It is not a new licensing company, a marketing website, or a short showcase detached from the real process.

The finished prototype must:

- look and behave like a credible modern Government of India/state transport service;
- retain the real service catalogue, terminology, information and recognizable workflow;
- make the full Learner's Licence journey functional from state selection through LL printing;
- make the permanent Driving Licence journey functional after its current screens and state rules are researched;
- keep all other visible services discoverable through meaningful placeholder destinations until implemented;
- improve fluency, clarity, accessibility, mobile usability, error recovery and technical robustness;
- disclose that it is an independent hackathon prototype without visually turning the product into a separate brand.

The correct transformation is:

```text
Existing Sarathi coverage and government context
                       +
clear navigation + progressive forms + contextual explanations
                       +
autosave + status visibility + safe recovery + modern device readiness
                       =
a complete, recognizable and significantly improved government portal
```

## 2. Non-negotiable boundaries

- No marketing hero, startup tagline, conversion funnel, pricing-style presentation or “90-second demo” entry page.
- No invented official fee, waiting period, test threshold, eligibility rule or state requirement.
- No claim of live Aadhaar, Sarathi, treasury, RTO or SmartLock integration.
- No dead dashboard cards. An unimplemented service opens a useful service-information destination.
- No automatic cheating verdict based on one camera, microphone or behavior signal.
- No removal of a real field, declaration, option, stage or service merely to make the UI look cleaner.
- No pixel-for-pixel recreation of obsolete layout defects, browser alerts, unreadable tables or creator/video overlays.
- No final visual-polish model may modify business rules, validation, routes, data contracts or recovery behavior.

## 3. Evidence interpretation

The screenshot set is a video-derived walkthrough, not a clean design file:

- Screens 1–2 include video/browser context and are reference material rather than citizen-flow pages.
- The application flow is primarily from the Bihar state portal.
- The secure-test flow is primarily from the Uttar Pradesh portal.
- Several screenshots contain creator annotations, a presenter overlay, video controls or browser permission chrome; these are not portal elements.
- Madhya Pradesh and the current permanent-DL path still require targeted verification.
- The portal must therefore use state configuration rather than hard-coding Bihar or Uttar Pradesh as universal rules.

## 4. Canonical information architecture

```text
State selection
└── State transport service portal
    ├── Services dashboard
    │   ├── Learner's Licence
    │   ├── Driving Licence
    │   ├── Conductor Licence
    │   ├── Driving School Licence
    │   ├── Appointments
    │   ├── Upload documents
    │   ├── Fee payments
    │   ├── Application status
    │   ├── Grievances
    │   └── Other services
    ├── Learner's Licence journey
    │   ├── Instructions and eligibility
    │   ├── Applicant category
    │   ├── Identity route and authentication
    │   ├── Application details
    │   ├── Address and vehicle classes
    │   ├── Physical fitness self-declaration
    │   ├── Review and submit
    │   ├── Reference acknowledgement
    │   ├── Photo/signature or document completion
    │   ├── Readiness before financial/attempt commitment
    │   ├── Fee calculation and payment
    │   ├── Application stage tracker
    │   ├── Mandatory road-safety tutorial
    │   ├── Secure-test sign-in and authentication
    │   ├── Test instructions and device/environment checks
    │   ├── LL test with safe recovery
    │   ├── Separate outcome details
    │   └── Print/download LL
    ├── Permanent Driving Licence journey
    │   ├── Validate LL and eligibility configuration
    │   ├── Application and vehicle class
    │   ├── Documents and declarations
    │   ├── Fee and appointment
    │   ├── Practical test status
    │   └── Result/download/status
    └── Citizen utilities
        ├── Continue pending application
        ├── Check payment status
        ├── Print forms/receipts
        ├── Update mobile number
        └── Track or withdraw a service
```

## 5. Route blueprint

Routes are stable implementation contracts. Browser back/forward, refresh and direct links must work.

| Route | Purpose | Delivery status |
|---|---|---|
| `/` | National/state selection entry—not a landing page | Functional |
| `/:state/services` | State-aware service dashboard and global search | Functional |
| `/:state/service/:serviceId` | Reusable service-information destination for secondary services | Functional placeholder pattern |
| `/:state/ll/start` | LL overview, eligibility, documents and expected stages | Functional |
| `/:state/ll/category` | Applicant category and special-condition selection | Functional |
| `/:state/ll/identity` | Aadhaar or document-assisted route | Functional mock |
| `/:state/ll/identity/aadhaar` | Aadhaar/VID, consent, OTP and retry states | Functional mock |
| `/:state/ll/application/personal` | Personal and relation details | Functional |
| `/:state/ll/application/address` | Present/permanent address and duration | Functional |
| `/:state/ll/application/vehicles` | Vehicle classes and driving-school declaration | Functional |
| `/:state/ll/application/fitness` | Form 1 physical-fitness self-declaration | Functional |
| `/:state/ll/application/review` | Complete review, unresolved fields and declarations | Functional |
| `/:state/ll/submitted` | Application number and acknowledgement | Functional mock |
| `/:state/application/:id` | Unified application status and stage tracker | Functional |
| `/:state/application/:id/uploads` | Photo, signature and documents | Functional mock |
| `/:state/application/:id/readiness` | Device compatibility before payment/attempt commitment | Functional real + guided fallback |
| `/:state/application/:id/fees` | Itemized state-configured fees and confirmation | Functional mock |
| `/:state/application/:id/payment` | Government-gateway simulation | Functional mock |
| `/:state/application/:id/receipt` | Payment acknowledgement and printable receipt | Functional mock |
| `/:state/application/:id/tutorial` | Road-safety course, progress and knowledge checks | Functional |
| `/:state/ll-test/sign-in` | Application number/DOB/password entry | Functional mock |
| `/:state/ll-test/authenticate` | Face/device/environment authentication | Functional real + guided fallback |
| `/:state/ll-test/instructions` | Rules, language, declarations and rehearsal | Functional |
| `/:state/ll-test/exam` | Secure knowledge-test simulation | Functional |
| `/:state/ll-test/interruption` | Recoverable network/camera/visibility/integrity state | Functional |
| `/:state/ll-test/result` | Knowledge, technical and integrity outcomes | Functional |
| `/:state/application/:id/learner-licence` | Invalid prototype LL preview, print and download | Functional mock |
| `/:state/dl/start` | Permanent-DL overview and LL validation | Functional after research |
| `/:state/dl/*` | Permanent-DL form, appointment, practical-test and result routes | Functional after research |

## 6. Screenshot-to-screen registry

Every screenshot is accounted for below. “Reference only” means it informs content or behavior but is not reproduced as a page.

| Screenshot(s) | Observed content | Canonical destination |
|---|---|---|
| 1 | Video page with mobile-number update announcement | Research/reference only; relevant notice becomes dashboard notification content |
| 2 | National Parivahan information-services mega-menu | National shell/service taxonomy reference |
| 3 | Sarathi state selection | `/` |
| 4 | Contactless licence-services catalogue modal | Service search/catalogue overlay on `/:state/services` |
| 5 | State service dashboard with primary service icons | `/:state/services` |
| 6 | LL submission instructions and mandatory road-safety tutorial note | `/:state/ll/start` |
| 7–8 | Applicant status/category and special-category dropdown | `/:state/ll/category` |
| 9 | Aadhaar versus non-Aadhaar routes and consequences | `/:state/ll/identity` |
| 10 | Changed-mobile-number alert | Inline recoverable notice on Aadhaar route, never a browser alert |
| 11–13 | State, Aadhaar/VID, OTP generation, consent, resend and timer | `/:state/ll/identity/aadhaar` |
| 14 | eKYC identity/address summary | Personal-data prefill/review state |
| 15 | General applicant and relation details | `/:state/ll/application/personal` |
| 16 | Present/permanent address and vehicle selection | Address + vehicle steps |
| 17 | Multi-select vehicle classes, declarations and CAPTCHA | Vehicle/review steps; CAPTCHA represented as a prototype verification control |
| 18–19 | Form 1 physical-fitness questions in English/Hindi | `/:state/ll/application/fitness` with language support |
| 20 | Self-declaration submitted successfully | Inline success confirmation |
| 21 | Application-submitted browser alert | `/submitted` success page, not a browser alert |
| 22 | Application reference slip, address, RTO and requested service | `/submitted` and printable acknowledgement |
| 23 | Application-number/DOB/CAPTCHA status lookup | Application lookup entry |
| 24–25 | Status detail, requested service and stage checklist | `/:state/application/:id` |
| 26–31 | Photo/signature instructions, preview, warning and upload success | `/:state/application/:id/uploads` |
| 32–35 | Status lookup and fee-payment stage transition | Unified application tracker and fee route |
| 36 | Itemized application fees, gateway choice, declaration and CAPTCHA | `/:state/application/:id/fees` |
| 37 | Payment redirect/loading | Payment transition state with timeout/retry guidance |
| 38 | Ministry payment gateway and terms | Government-gateway simulation shell |
| 39–42 | OGRAS purpose, payer, receipt and payment-method details | Payment simulation substeps |
| 43 | Bank OTP | Synthetic OTP verification state |
| 44–48 | Payment acknowledgement, branch receipt and return to portal | Receipt/download/return routes |
| 49 | State dashboard after payment | `/:state/services` with active-application card |
| 50–52 | Pending application lookup, completed stages, mandatory tutorial and processing stage | Application tracker + tutorial route |
| 53 | Learner Licence menu including edit, print, tutorial, online test, mock and samples | Learner-service menu and service catalogue |
| 54 | Screen Test Aid sign-in by LL application number | `/:state/ll-test/sign-in` |
| 55 | SmartLock download requirement | Replaced by platform-aware readiness page; desktop/native requirement remains a configurable official-policy notice |
| 56 | SmartLock/PROX desktop launcher | Reference for secure-session transition, not copied visually |
| 57–58 | DOB/password login, camera prompt, attempts, OTP/password SMS | Sign-in + authentication routes |
| 59–60 | Applicant instructions, authenticate/proceed/exit and live credential validation | Authentication route |
| 61–62 | Applicant details, language, PIN, do/don't rules, declarations and tutorial-watched confirmation | Test instructions route |
| 63–64 | Face-authentication progress and microphone permission | Authentication/device-check states |
| 65 | Timed LL test, question image, localized options and confirm | Test route |
| 66 | Pass/fail result and performance link | Result route |
| 67–68 | Learner Licence menu and Print Learner Licence (Form 3) | LL document route/service catalogue |

## 7. Complete service catalogue behavior

### Fully working in the main delivery

- Apply for Learner's Licence.
- Continue a pending LL application.
- Application status and stage tracking.
- Upload photo, signature and required documents.
- Fee calculation, mock gateway, payment status and receipts.
- Road-safety tutorial, sample questions and mock test.
- Device readiness and secure-test authentication.
- Online LL test, recovery, result and LL print/download.
- Apply for permanent Driving Licence after current official research is complete.

### Functional utility destinations

- Print application forms.
- Check payment status.
- Update mobile number.
- Book/view appointments.
- Withdraw a service request.
- Find a registered doctor.
- File/track a grievance.

These may use synthetic records, but navigation, forms, success/error states and return paths must work.

### Structured placeholder destinations

The following remain visible from day one and open a reusable service-information page:

- DL renewal, duplicate DL, address change, lost/replacement DL and DL extract.
- International Driving Permit.
- Add class of vehicle.
- Change name, DOB, address, photo or signature.
- Hazardous-material and hill-region endorsements.
- Conductor Licence services.
- Driving School Licence services.
- Duplicate/renewal/extract services for other licence categories.

A placeholder destination contains:

1. the exact service name;
2. who generally uses it;
3. indicative documents with an “official configuration required” label;
4. a clear “Not implemented in this prototype yet” status;
5. links back to the catalogue, application status and help;
6. no fake submission button.

## 8. Learner's Licence application behavior

### Instructions and eligibility

- Show the full process, expected documents, identity-route differences and state dependency before form entry.
- Provide an interactive checklist that persists.
- Every uncertain term has contextual help in English and Hindi; future state languages are configuration.
- The applicant can resume an existing application instead of accidentally creating another.

### Applicant category

- Preserve the three observed applicant-status choices and special categories.
- Explain how a selected category changes evidence or processing.
- Never hide a required field without explaining the dependency.

### Aadhaar and alternative identity

- Mock Aadhaar/VID and OTP without accepting or storing real numbers.
- Model resend cooldown, invalid OTP, expired OTP, changed mobile number and alternative-route recovery.
- Consent statements are readable, individually selectable and printable.
- Non-Aadhaar route explains which verification steps become in-person.

### Long application form

- Preserve all observed personal, relation, contact, identification-mark, address, duration, vehicle-class and declaration fields.
- Split the form by meaningful sections rather than one enormous page.
- Autosave on blur and at navigation boundaries.
- Validate inline after interaction; a submit summary links to every unresolved field.
- “Same as present address” is reversible and never overwrites permanent-address data without confirmation.
- Vehicle classes use searchable multi-select with plain-language explanations.
- Form 1 preserves every declaration, localized content and explicit applicant confirmation.

### Submission and acknowledgement

- Replace browser alerts with persistent success pages and accessible status messages.
- Generate a synthetic application number, printable acknowledgement and QR-like prototype reference.
- Show exactly what is complete, exempt, pending, blocked or failed.

## 9. Upload, payment and post-submission behavior

### Photo/signature/documents

- Show accepted type, dimensions, size, crop requirements and examples before selection.
- Preview and validate before committing.
- For eKYC, explain why the photo is prefilled and why a current signature may still be required.
- Do not overwrite a previous upload until the new one passes validation.
- Provide retry and support guidance for device/file errors.

### Readiness before commitment

- Run storage, secure-context, connection, camera, microphone, face count, framing, lighting and challenge-response checks before the relevant fee/attempt is committed.
- Keep the real browser checks already implemented, but present them inside the government portal.
- Clearly distinguish real browser observations from guided/synthetic fallback signals.
- Passing readiness does not claim SmartLock equivalence, identity proof or cheating prevention.

### Fee and payment

- Fees come from state/service configuration; screenshots provide structure, not universal amounts.
- Show an itemized table, total in figures and words, refund/cancellation policy link and selected gateway.
- Simulate redirect, timeout, uncertain status, OTP, success, failure and return-to-portal states.
- Never ask for real card, bank or Aadhaar information.
- A gateway timeout leads to “Check payment status” before permitting another payment.

### Application tracker

- The tracker is the citizen's home for an active application.
- Each stage has status, timestamp, explanation and next action.
- Allowed states: `not-started`, `in-progress`, `completed`, `exempt`, `needs-action`, `blocked`, `failed`.
- Status is communicated with icon and text, never color alone.

## 10. Tutorial and examination behavior

### Road-safety learning

- Replace the passive mandatory-video dead end with chapters, captions, transcript and short checks.
- Record genuine completion within the prototype; never allow a button that skips required content silently.
- Provide sample questions and a mock test separate from the official-test simulation.
- During learning, explanations are complete. During the active test, answer assistance is disabled.

### Platform policy

- Desktop SmartLock requirements are represented as configurable official-policy content.
- The prototype may demonstrate a robust browser/mobile test path, but it must label that as an innovation requiring production security validation and government approval.
- Mobile portal pages must be fully supported even if the official secure test remains restricted on a particular state/platform.

### Authentication and readiness

- Sign-in supports the observed application number, DOB/password and resend path using synthetic data.
- Camera/microphone permission is requested only when required and after a plain-language explanation.
- Authentication states include permission denied, no camera, dim light, face outside frame, more than one face, challenge incomplete, connection loss and model unavailable.
- Multiple-face/no-face/gaze/head signals pause or request correction; they do not automatically declare misconduct.

### Test

- Preserve applicant summary, language, question number, remaining time, score/result policy configuration, image-based questions, options and explicit confirmation.
- Save every answer before navigation.
- Restore the question, answers, payment/application status and remaining permitted time after a supported refresh/reconnect.
- Detect real online/offline and document-visibility events.
- Provide separate screens for recoverable interruption, human-review observation and irrecoverable session expiry.

### Result and LL document

- Show knowledge result, technical incidents and integrity observations separately.
- Provide performance review only after the test is complete.
- State-configured retest guidance is never invented.
- The generated LL is unmistakably an invalid prototype document while preserving the structure of a real downloadable/printable service.

## 11. Permanent Driving Licence workstream

Permanent DL is a required major journey, not a decorative dashboard card. It cannot be implemented responsibly from the current screenshot set alone.

Before implementation we must verify:

- current national/state eligibility timing after LL issuance;
- LL validation and vehicle-class carryover;
- application fields and required documents;
- fee calculation;
- appointment/slot booking;
- practical-test workflow and status;
- pass/fail/retest states;
- DL document/download status;
- Madhya Pradesh versus other state variations;
- desktop and mobile layouts.

Until that research is complete, `/dl/start` clearly shows “research in progress” rather than inventing rules. Once mapped, permanent DL becomes the second complete journey.

## 12. Government portal shell

### Desktop

- Slim independent-prototype notice.
- Government/ministry and Sarathi service identity area.
- Selected state/transport department context and Change State action.
- Language and text-size controls.
- Primary service navigation and searchable service catalogue.
- Breadcrumbs on flows deeper than two levels.
- Active application card with next required action.
- Content container optimized for dense forms and tables, not marketing sections.
- Government utility footer: accessibility, contact, grievance, FAQs, sitemap, privacy and prototype disclosure.

### Mobile

- Compact top bar with state, language and accessible menu.
- Searchable service list; no hover-only mega menus.
- One-column forms with 48 px controls and correct keyboards.
- Sticky bottom action bar only where it does not cover content.
- Tables become labelled record cards or allow deliberate contained scrolling with column explanation.
- Progress summary remains available without consuming half the screen.
- No horizontal page overflow at 320/375 px.

## 13. Contextual help system

- Every legal, procedural or technical term may expose a consistent `?`/“Explain this” control.
- Help is attached to field/section/service IDs, not generated freely from the active test.
- English and Hindi are required; Hinglish search can map to the same reviewed answers.
- Each answer includes: what it means, why it is needed, accepted values/evidence, common error and recovery action.
- During the active test, the assistant can explain only technical conditions, saving and recovery.
- Unknown official rules are labelled unresolved and point to state/RTO verification.
- No generic chatbot is needed until the reviewed knowledge base is complete.

## 14. Domain model and integration boundaries

### Core records

- `PortalSession`: selected state, language, accessibility preferences and current citizen context.
- `ServiceDefinition`: catalogue grouping, route, state availability and implementation status.
- `Applicant`: synthetic identity, relations, contact, identification marks and addresses.
- `LicenceApplication`: type, state, RTO, categories, vehicle classes, declarations and timestamps.
- `ApplicationStage`: status, reason, completed time, required action and evidence.
- `UploadRecord`: document type, validation, preview and replacement history.
- `PaymentAttempt`: itemized fees, gateway, status, timestamps and receipt.
- `TutorialProgress`: chapter, viewed percentage, checks and completion.
- `ReadinessReport`: real/guided origin and individual device observations.
- `ExamSession`: language, questions, saved answers, time state, interruptions and results.
- `HelpArticle`: reviewed localized explanation linked to service/field/error IDs.

### Adapters

- `IdentityAdapter`: synthetic Aadhaar/document route now; live authority boundary later.
- `ApplicationRegistryAdapter`: local mock registry now; Sarathi boundary later.
- `PaymentAdapter`: deterministic gateway simulation now; treasury boundary later.
- `MediaReadinessAdapter`: real browser signals now; native/approved platform later.
- `ExamAdapter`: synthetic question/configuration provider now; official provider later.
- `NotificationAdapter`: in-app synthetic OTP/SMS now; actual SMS/email later.

Mock adapters must use synthetic examples and never accept real sensitive identifiers or payment data.

## 15. Technical architecture

- React + TypeScript + Vite remains appropriate.
- Add explicit route-based page modules; the current single large `App.tsx` is not the target architecture.
- Use controlled, schema-validated forms and reusable field groups.
- Keep domain transitions separate from presentation.
- Use versioned local persistence for the hackathon prototype and adapter interfaces for later backend replacement.
- Lazy-load the media/readiness and exam bundles so the services dashboard and forms remain fast.
- Preserve the tested readiness engine and reducer concepts only after moving them behind portal-domain interfaces.
- All key pages require stable test IDs/roles and route-level automated tests.

Suggested module boundaries:

```text
src/
  app/                 routing, providers, portal shell
  config/              states, services, fees/rules marked official or synthetic
  domain/              applications, stages, payments, tutorial, exam
  features/
    service-catalogue/
    learner-licence/
    driving-licence/
    application-status/
    uploads/
    payments/
    tutorial/
    readiness/
    exam/
    help/
  shared/              forms, tables, feedback, layout, accessibility
  mocks/               deterministic adapters and synthetic fixtures
  tests/               route, reducer, form, recovery and responsive checks
```

## 16. State and recovery requirements

- Refresh/reopen restores the last safe route and draft.
- Browser back returns to the prior step without losing data.
- Each long-form section autosaves independently.
- Upload and payment idempotency prevent duplicate commitment.
- Uncertain payment status routes to verification rather than immediate repayment.
- A test answer is persisted before the next question is shown.
- Network/camera/visibility failures create explicit recoverable states.
- A technical failure never silently becomes a failed knowledge result.
- Restart/reset is deliberate, scoped and confirmed; it does not appear as a casual header icon.

## 17. Accessibility and responsive acceptance

- WCAG AA minimum; target stronger contrast for critical text.
- Every input has a programmatic label, helper/error association and correct required state.
- Full keyboard operation and visible focus.
- Route changes move screen-reader focus to the main heading without decorative outlines.
- 44–48 px minimum targets and 8 px target spacing.
- Text remains usable at 200% zoom.
- Reduced-motion mode removes nonessential transitions.
- Tested at 320, 375, 768, 1024 and 1440 px plus phone landscape.
- No icon-only navigation without an accessible name.
- No status expressed only through red/green.

## 18. Testing contract

### Unit/domain tests

- Legal route and stage transitions.
- Applicant-category dependencies.
- Address-copy/reversal safety.
- Declaration completion.
- Fee calculation and state configuration.
- Payment retry/idempotency.
- Tutorial completion.
- Answer-before-next persistence.
- Technical versus knowledge outcome separation.

### Component/form tests

- Labels, validation, error summary and focus.
- OTP timer/resend/expiry.
- Upload type/size/preview/replacement.
- Help content and language switching.
- Placeholder service destinations.

### Browser journeys

- Complete LL route on desktop.
- Complete LL route at 375 px.
- Alternative identity branch.
- OTP invalid/expired/retry branch.
- Refresh during every application section.
- Payment redirect success, failure and uncertain status.
- Tutorial completion.
- Real readiness when permission is available and guided fallback otherwise.
- Exam interruption/resume and refresh recovery.
- Result/receipt/LL print.
- Permanent DL route when research is complete.

## 19. Implementation sequence

1. Replace the startup-style UI with the government portal shell, state selection and complete service catalogue.
2. Add stable routing, shared form primitives, configuration and mock adapters.
3. Build the complete LL application through acknowledgement.
4. Build application tracking, upload and payment journeys.
5. Integrate the tutorial and existing readiness engine into the real portal flow.
6. Build secure-test sign-in, authentication, instructions, exam, recovery, result and print.
7. Research and implement permanent DL.
8. Complete accessibility, responsive, recovery and automated browser testing.
9. Freeze functional behavior and then send the constrained final-polish prompt to the second AI.
10. Review every polish diff here, reject business-logic changes and rerun all checks.

## 20. Final-polish AI boundary

The second AI is a presentation collaborator only.

It may improve:

- spacing, typography, colors and semantic design tokens;
- responsive composition within approved breakpoints;
- consistent icons and government-service visual hierarchy;
- loading, empty, success and error presentation;
- restrained micro-interactions and reduced-motion alternatives;
- CSS/component styling cleanup.

It may not:

- remove or merge routes, services, fields, declarations or state variants;
- change domain types, reducers, adapters, validation schemas or persistence;
- alter synthetic/official disclosures;
- add marketing headlines, testimonials, conversion sections or startup branding;
- replace government service terminology with promotional copy;
- change test logic or delete failing tests;
- add dependencies or assets without listing them for review.

The exact handoff prompt is maintained in `docs/ui-polish-handoff.md`.

## 21. Research still required

- Current Madhya Pradesh LL application and test variations.
- Current permanent Driving Licence end-to-end flow.
- Current official mobile layouts for all non-test portal pages.
- State-by-state fee/rule configuration boundaries.
- Current official reason/platform policy for mobile secure testing.
- Official logos/assets and permitted prototype usage.
- Hindi/state-language reviewed copy.

Research gaps do not justify deleting a service. They produce an explicit configuration placeholder until verified.

## 22. Definition of complete

The portal is complete when a reviewer can start from state selection, discover the same meaningful services as Sarathi, finish a detailed synthetic LL application, resolve uploads and payment, complete learning/readiness/authentication, take and recover the test, inspect the result, and print an invalid prototype LL—on desktop and mobile—without encountering a dead end, unexplained field, lost state or misleading integration claim.

Visual polish is the last layer over this completed behavior, not a substitute for it.

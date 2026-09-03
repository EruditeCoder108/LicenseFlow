# LicenceFlow

LicenceFlow is an independent **Build What Moves India** hackathon prototype for the Madhya Pradesh Learner's Licence journey.

[Live prototype](https://licenceflow-mp-demo.eruditespartan108.chatgpt.site/) · [Implementation scope](docs/implementation-scope.md) · [Current roadmap](docs/latest-code-roadmap.md) · [Server-controlled exam](docs/protected-exam-core.md)

Its practical goal is not merely to restyle a government form. It demonstrates how an online public service can discover device problems before payment, preserve progress through interruptions, prevent a duplicate mock payment, issue fair retests, and explain the next action without blaming the citizen for a technical failure.

> **Prototype boundary:** LicenceFlow is not a government website. Every applicant, Aadhaar check, document, payment, test attempt and licence shown here is synthetic. It creates no official record and moves no real money.

## Scope at a glance

| Surface | Current status |
|---|---|
| Madhya Pradesh Learner's Licence | Complete interactive prototype from application to a visibly invalid demonstration LL |
| Camera/microphone readiness | Real browser and on-device checks; the judge shortcut is explicitly simulated |
| Identity, government records, fee approval and issuance | Synthetic only; no department, UIDAI, bank or treasury connection |
| Other transport and permanent-DL services | Discoverable directory/reference pages, not working transactions |
| Judge walkthrough and reliability ledger | Local simulated journey plus minimal server-mirrored milestones; not authoritative grading |
| Server-saved assessment | Separate D1-backed paper, timing, immutable answers, score and review; anonymous prototype session, not verified citizen identity |

The implementation boundary and state-extension seams are documented in [docs/implementation-scope.md](docs/implementation-scope.md).

## Try it

- Public prototype: [licenceflow-mp-demo.eruditespartan108.chatgpt.site](https://licenceflow-mp-demo.eruditespartan108.chatgpt.site/)
- Optional walkthrough: choose **Full Judge Walkthrough** on the homepage.
- Manual route: Driving licence services → Start new application.
- Judge-only shortcuts are visibly labelled and never presented as citizen rules.
- Choose **Open server-saved test** on test entry for the protected assessment, added on 2 September. The owner approved public release on 3 September and will perform the browser checks personally.

## What is implemented

### Complete citizen journey

- seven-part Learner's Licence application with browser autosave;
- fictional e-KYC, document, portrait and signature handling;
- real browser camera/microphone/device checks plus a clearly labelled judge simulation;
- one-question system rehearsal before the fee step;
- synthetic payment gateway with explicit pending, failure, uncertain and confirmed states;
- YouTube learning gate with sequential-watch enforcement and a judge-only time shortcut;
- focused 15-question test interface with timer, narration and interruption recovery;
- result, answer explanations, journey receipt and visibly invalid demonstration licence;
- reviewed English/Hindi reference interfaces plus an accessible 23-language registry; the other 21 scheduled Indian languages remain visibly disabled until machine drafts receive native-language review;
- keyboard behavior, spoken questions and responsive mobile layouts.

### Fair assessment engineering

- server-only runtime bank of 50 English text questions with competency, difficulty and variant-family metadata;
- cryptographically selected 15-question papers and shuffled options using a stable 6 easy / 7 medium / 2 applied blueprint;
- different retests that avoid the previous paper's question families without changing intended difficulty;
- non-personal paper fingerprint and attempt metadata;
- frozen paper and rules in D1; server-owned deadlines, immutable answers and server grading;
- a separate small set of public judge samples with deterministic local scoring; the passing-preview shortcut cannot alter protected results.

### Failure-safe engineering

- local application, tutorial, payment and exam checkpoints survive refreshes;
- camera and microphone tracks are deterministically released on transitions and async-unmount races;
- monitoring rules are deterministic and proportionate: observe, guide, pause, record—never auto-accuse;
- MediaPipe model and WASM assets are self-hosted and camera inference stays on-device;
- a Sites Worker can mirror **minimal, non-personal milestones** to an append-only D1 ledger;
- repeated mock-payment confirmation uses the same idempotency key and returns the original receipt;
- the older milestone mirror reports a browser-cache fallback if unavailable;
- the protected assessment **does not fall back to client scoring**: it offers reconnection, exact answer retries and a server-confirmed result;
- one active attempt and a renewable tab lease per anonymous session; refresh cannot reset a question's timer;
- a two-minute cumulative confirmed-pause allowance and a 30-minute attempt lifetime, clearly disclosed before starting.

The legacy milestone layer excludes questions and selected answers. The **separate protected exam tables** store the paper, answers, scoring and server events, but no applicant identity details, documents, camera frames or audio. Session access expires after seven days; cleanup is opportunistic, not a guaranteed deletion scheduler. See [exam data and recovery boundaries](docs/protected-exam-core.md).

## Architecture

```mermaid
flowchart TD
    Citizen["Citizen journey<br/>React + TypeScript"]
    State["Local demo recovery<br/>Application · payment · tutorial · judge test"]
    Assessment["Protected assessment API<br/>Private runtime bank · timing · grading"]
    Vision["On-device readiness<br/>MediaPipe · no camera upload"]
    Worker["Sites Worker boundary<br/>Validation · size limits · same-origin writes"]
    D1["Cloudflare D1<br/>Exam answers + frozen papers<br/>Separate legacy milestone tables"]

    Citizen --> State
    Citizen --> Assessment
    Assessment --> Worker
    Citizen --> Vision
    State -. "Minimal debounced checkpoint" .-> Worker
    Worker --> D1
    D1 -. "Recovery receipt" .-> Citizen
```

Browser checkpoints remain non-authoritative. Protected exam answers and grades now come from D1 through the Worker, but production citizen authentication, government entitlement, payment authorization and independent evidence review remain unimplemented. The repository and earlier releases contain the original questions; excluding them from the new runtime browser bundle is not a claim that this open-source question content is secret.

## Verified state

Server-core update, 2 September 2026:

- **155 tests across 35 files pass**; TypeScript and the production build pass;
- automated API and client-adapter tests use migrated SQLite and real handlers, including races, expired leases, tampered requests and lost responses;
- the production Worker is bundled separately and static output is checked for protected-bank leakage;
- **human browser checks remain owner-run**; public release was approved on 3 September, independently of those checks;
- [verification commands and manual checklist](docs/protected-exam-core.md#human-browser-check--owner-requested).

Historical release baseline, 28 August 2026 (not a claim about browser QA of the new server mode):

- **129 tests across 33 test files pass**;
- **17 applicable Playwright release checks pass** across desktop and Pixel 5 profiles, with three intentionally inapplicable matrix cases skipped;
- TypeScript and the production Sites bundle compile cleanly;
- the built artifact includes the Worker, D1 migration and hosting manifest;
- focused desktop/mobile tests cover the complete judge journey, payment failure, interruption reload/resume, reset, Raahi replay/escape behavior and horizontal-overflow protection.

The latest measured public Lighthouse baseline was 100 accessibility, 100 SEO and 100 agentic browsing. The main performance waste was oversized homepage artwork and an external render-blocking font request. The current source adds responsive WebP candidates and uses the already bundled Atkinson Hyperlegible font; a new score must be measured after deployment rather than guessed locally.

## Run locally

Use Node 24+; local dev/preview use a migrated SQLite database in the ignored `.tmp/` directory. The deployed Site uses D1.

```bash
npm install
npm run dev
```

Verification:

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run test:exam
npm run verify:exam-build
```

Responsive homepage assets can be regenerated with Pillow:

```bash
python scripts/optimize-home-images.py
```

## Repository map

| Area | Purpose |
|---|---|
| `src/PortalApp.tsx` | Portal shell, homepage, routing composition and service catalogue |
| `src/portal/ApplicationFlow.tsx` | Seven-part application and upload journey |
| `src/portal/ReadinessJourney.tsx` | Device checks and system rehearsal |
| `src/portal/PaymentJourney.tsx` | Synthetic gateway and recovery states |
| `src/portal/TestJourney.tsx` | Learning and the separate local judge test/result journey |
| `src/portal/ProtectedExamPage.tsx` | Server-saved assessment, reconnection, result and review |
| `server/exam/` | Protected bank, server state transitions, atomic SQL and APIs |
| `src/content/` | Public rehearsal/judge fixtures and deterministic demo paper generation |
| `src/domain/` | Pure journey and monitoring decision reducers |
| `src/hooks/useDeviceReadiness.ts` | Media lifecycle and on-device MediaPipe observations |
| `src/portal/reliability.ts` | Privacy-bounded browser-to-server checkpoint synchronizer |
| `server/` | Sites Worker, optional Raahi API boundary and D1 reliability handler |
| `drizzle/` | Persistent D1 migration |
| `tests/e2e/` | Desktop/mobile release journey checks |
| `docs/latest-code-roadmap.md` | Current decisions, cut lines and future architecture |
| `docs/implementation-scope.md` | Canonical map of working, simulated and directory-only surfaces |

## Built with ChatGPT and Codex

LicenceFlow was created through a **human-led collaboration with ChatGPT and Codex**. The project's direction came from a real failed Learner's Licence experience: the applicant completed the form and payment, but a technical problem prevented the test from starting. The human creator defined the problem, chose the product principles, challenged weak ideas, tested the journeys on real devices and made the final design and scope decisions. AI accelerated the work; it did not replace that judgement.

| Part of the work | How ChatGPT and Codex helped |
|---|---|
| Research and product reasoning | Compared public-service journeys, organised official references and existing approaches, surfaced feasibility and fairness risks, and helped turn observations into the roadmap and explicit prototype/production boundaries. Claims were kept only when they could be supported or clearly labelled as proposed work. |
| Citizen experience | Helped rewrite bureaucratic language, examine failure states, plan English/Hindi guidance, structure Raahi's judge walkthrough and reason through accessibility, mobile layouts and recovery behavior. |
| Visual design and images | ChatGPT-assisted image generation was used to explore the Raahi mascot and synthetic demonstration artwork. Selected assets were then reviewed, cropped, compressed and integrated as responsive WebP/PNG resources rather than inserted blindly. |
| Engineering with Codex | Codex inspected and edited the React/TypeScript codebase, implemented reducers and UI states, traced browser bugs, integrated local MediaPipe assets, added the Sites Worker/D1 boundary, and kept mock services visibly separate from real integrations. |
| Verification | Codex helped write and run unit, integration and Playwright tests, reproduce refresh/interruption cases, inspect mobile overflow and accessibility behavior, run production builds and Lighthouse checks, and update technical documentation when the implementation changed. |
| Creative and editorial work | ChatGPT helped iterate demo scripts, explanations, question ideas and README structure. The creator selected, rewrote or rejected outputs to keep the final product consistent with the lived problem and hackathon goal. |

This repository intentionally keeps that collaboration inspectable: source code, tests, implementation boundaries, research notes and roadmaps sit together. AI-generated output was treated as a draft to verify—not as evidence, legal guidance, an accessibility audit or a substitute for government-domain expertise. A real deployment would still require native-language review, security testing, policy review, authoritative integrations and field testing with citizens.

## Raahi and OpenAI boundary

Raahi currently answers from reviewed built-in LicenceFlow guidance, so the public demo needs no API key and does not send chat content to a provider. The Worker contains a constrained optional OpenAI Responses API boundary with sensitive-data rejection, limited history, rate limiting and `store: false`; it remains disabled unless a server-side `OPENAI_API_KEY` is configured.

No secret belongs in Vite variables, frontend code, browser storage or the repository.

## Security and honesty

- The browser cannot stop a second phone, another monitor, screen recording or client-state modification.
- MediaPipe supplies context; it does not identify a person or issue a cheating verdict.
- Safe Exam Browser, anti-spoofing and real Aadhaar/payment integrations are future architecture, not hidden prototype claims.
- The protected bank is excluded from the runtime frontend bundle; only public judge fixtures are client-graded. Source history and earlier demo releases still expose the original educational question material.
- Anonymous session ownership and a tab lease are not verified citizen identity or device attestation. Camera observations remain client-reported.
- Synthetic shortcuts and documents are visibly labelled.
- Machine-assisted language drafts require native-speaker and policy review before any official deployment; English and Hindi remain the reviewed reference versions.

The detailed claim boundary is in [docs/production-security-boundary.md](docs/production-security-boundary.md), and the current plan is in [docs/latest-code-roadmap.md](docs/latest-code-roadmap.md).

# LicenceFlow implementation scope

This is the canonical truth map for human reviewers and automated repository analysis.

## What this repository is

LicenceFlow is an independent **Build What Moves India** hackathon prototype for one service: the Madhya Pradesh Learner's Licence journey. It demonstrates a complete, failure-safe citizen experience. It is not a replacement deployment of Sarathi and has no connection to MoRTH, NIC, UIDAI, Madhya Pradesh Transport, a bank or a treasury.

## Status vocabulary

| Label | Meaning |
|---|---|
| Working prototype | Interactive product behavior implemented and tested in this repository |
| Synthetic | Deliberately fictional response used to demonstrate the surrounding journey |
| Directory preview | Helpful discovery or explanation, but no transaction is implemented |
| Production architecture | Documented future boundary, not a capability claimed by the public demo |

## Working prototype

- seven-part Learner's Licence application with browser checkpoints;
- synthetic documents with preview, confirmation and clearly fictional identity data;
- real browser camera, microphone, connection and lighting readiness checks;
- on-device MediaPipe face-presence signals with no recording, recognition or biometric upload;
- a pre-payment system rehearsal question;
- an explicit mock gateway with success, failure, pending and uncertain outcomes;
- learning progress and sequential-watch behavior using temporary YouTube material;
- deterministic balanced question papers, retests, scoring and answer explanations;
- safe interruption pause, refresh recovery and same-attempt resume;
- result dashboard, journey receipt and visibly invalid demonstration Learner's Licence;
- Raahi's built-in, non-API journey guidance;
- reviewed English and Hindi reference interfaces, plus an accessible registry of all 23 scheduled-language choices;
- desktop/mobile, keyboard and critical-journey automated checks.

## Synthetic boundaries

The following never become real in this repository:

- Aadhaar/e-KYC or identity verification;
- applicant records in a government database;
- document validation by an RTO;
- a real fee, payment authorization, refund or treasury receipt;
- official test entitlement or legal attempt consumption;
- official Learner's Licence issuance.

The optional D1 layer stores only minimal non-personal prototype milestones and synthetic payment idempotency. It does not make browser-held answers or applicant data authoritative.

## Directory-only surfaces

The homepage and driving-service directory deliberately show the wider transport ecosystem so a citizen can understand where a service belongs. Permanent Driving Licence, vehicle registration, permits, appointments, renewals and similar cards are not implemented transactions. Their pages now say this explicitly and offer either the working Learner's Licence prototype or the official Sarathi route.

## Madhya Pradesh and other states

The current configured jurisdiction is Madhya Pradesh. Much of the shell is reusable: routing composition, application checkpoints, device readiness, payment-state model, learning, assessment and recovery. Extending it to another state is feasible through configuration and adapters, but it is not a cosmetic state-name change. Before release, each state requires verified rules, fees, eligibility, forms, RTO routing, language review and integration contracts.

## Language boundary

English and Hindi are the reviewed reference versions. The other 21 scheduled languages are listed but deliberately remain unavailable until a machine-draft and native-language review can be completed; the interface never silently substitutes Hindi or English. Every future draft must be reviewed by native speakers and legal/policy teams before public-service use. The interface never claims these drafts are certified government translations.

## Deliberately deferred

- production Aadhaar, payment, Sarathi or RTO integration;
- server-authoritative question delivery, timing, answers and scoring;
- Safe Exam Browser or a custom OS lockdown client;
- face recognition, liveness scoring or experimental anti-spoofing;
- a permanent Driving Licence application flow;
- a live OpenAI-powered Raahi assistant.

See [production-security-boundary.md](production-security-boundary.md), [reliability-layer.md](reliability-layer.md), and [latest-code-roadmap.md](latest-code-roadmap.md) for the corresponding future architecture and cut lines.

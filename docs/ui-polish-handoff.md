# Final UI-polish handoff

**Status:** Prepared for later use; do not send until the functional portal and automated journeys are frozen.

## 1. Collaboration contract

Codex owns:

- route and information architecture;
- state configuration, domain models and adapter boundaries;
- forms, validation, autosave and recovery;
- mock identity, application, payment and notification behavior;
- readiness, tutorial, exam and result behavior;
- accessibility semantics and automated tests;
- the first complete responsive UI implementation.

The second AI owns only the final presentation pass:

- typography, spacing and color-token refinement;
- visual hierarchy for dense government information;
- component styling consistency;
- responsive composition within the approved layouts;
- accessible hover, focus, loading, empty, success and error presentation;
- restrained micro-interactions with reduced-motion alternatives.

Codex reviews every returned change before it enters the product.

## 2. Preconditions

Do not begin the polish pass until all of the following are true:

- every required route in `docs/round-1-canonical-scope.md` exists;
- the full synthetic LL desktop and mobile journeys pass;
- fields, declarations, services and state variants are frozen;
- typecheck, unit tests and production build pass;
- known unfinished permanent-DL research is explicitly labelled;
- the repository contains no temporary marketing/landing page.

## 3. Files the polishing model must receive

1. The complete repository at the frozen commit.
2. `docs/round-1-canonical-scope.md` (Round 1 authority) and `docs/portal-blueprint.md` (screenshot reference only).
3. `design-system/licenceflow/MASTER.md`.
4. The `images/` reference folder.
5. The exact commands for typecheck, tests and build.

If the model cannot inspect these files, it must ask for them instead of inventing a design from the prompt alone.

## 4. Exact prompt to give the second AI

```text
You are the final UI presentation engineer for an independent hackathon redesign of India's existing Sarathi/Parivahan government citizen-service portal.

This is NOT a startup, landing page, SaaS product, marketing site, or a 90-second demo. Do not create a hero banner, tagline, testimonials, pricing-style cards, conversion copy, or a new private licensing brand. The interface must remain recognizably a detailed, trustworthy government service portal—modernized, accessible, responsive, calm, and highly professional.

Before changing anything, read all of:
- docs/round-1-canonical-scope.md (canonical Round 1 authority)
- docs/portal-blueprint.md (reference only; its multi-state/DL expansion is out of scope)
- design-system/licenceflow/MASTER.md (visual and interaction rules)
- README.md (current status and disclosure)
- every supplied reference image in images/ using chronological filename order
- the existing route, component, style and test files

Your task is a presentation-only polish pass over an already functional implementation.

You MAY improve:
- typography, spacing, colors and semantic design tokens;
- responsive composition at 320, 375, 768, 1024 and 1440 px;
- visual hierarchy for dense forms, instructions, service catalogues, tables and status trackers;
- consistent component appearance and icon usage;
- accessible loading, empty, error, warning and success states;
- hover/focus/pressed/disabled states and restrained micro-interactions;
- mobile layout, including contained tables and safe action bars;
- CSS/component style organization when behavior is unchanged.

You MUST preserve exactly:
- every route and navigation destination;
- every service, field, declaration, instruction and state variant;
- all government-service terminology and all prototype/official disclosures;
- domain types, reducers/state machines, adapters and persistence formats;
- validation rules, autosave, recovery, payment safety, readiness and exam behavior;
- accessibility semantics, accessible names and keyboard order;
- all tests and test selectors.

You MUST NOT:
- remove, merge or rename routes, fields, services or workflow stages;
- change business logic, validation, synthetic data contracts or official-policy placeholders;
- introduce a startup identity or replace detailed pages with marketing cards;
- add a chatbot, backend, external API, analytics, tracking, font, icon pack or dependency without listing it and waiting for approval;
- use real Aadhaar, payment, RTO, Sarathi or licence data;
- claim this prototype is an official government service;
- delete, weaken, skip or rewrite tests just to make them pass;
- rewrite the whole repository when targeted visual edits are sufficient.

Visual direction:
- information-dense but calm government service portal;
- navy/blue public-service palette with sparing semantic colors;
- high legibility, strong section hierarchy and obvious next actions;
- restrained borders and elevation; no glassmorphism, neon, gradients, excessive rounded cards or decorative animation;
- desktop navigation suited to a broad service catalogue;
- mobile navigation that never depends on hover and never horizontally overflows;
- visible focus, 44–48 px touch targets, WCAG AA contrast, 200% zoom support and reduced motion.

First return a short audit identifying the exact files you propose to change and why. Do not propose product or behavior changes. After approval, make targeted edits and return:
1. a file-by-file change summary;
2. all new dependencies/assets (ideally none);
3. any unresolved visual decisions;
4. results for `npm run typecheck`, `npm test`, and `npm run build`;
5. screenshots at 375 px and 1440 px for the services dashboard, one long LL form, application tracker, payment, test and result routes.

If polishing would require changing behavior or content coverage, stop and flag the conflict instead of changing it.
```

## 5. Review gate when results return

Reject a returned patch if it:

- recreates a landing page or adds promotional language;
- hides detail to make screenshots cleaner;
- changes routes, form names, required fields or status meaning;
- hard-codes one state's policy as national behavior;
- weakens focus, contrast, mobile reachability or reduced-motion support;
- touches domain/adapters/tests without a clearly identified styling necessity;
- introduces real sensitive data or implies official integration;
- fails any existing verification command.

Accept polish only after a route-by-route diff review and fresh desktop/mobile journey verification.

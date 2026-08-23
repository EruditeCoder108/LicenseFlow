# Canonical Journey State Engine & State Isolation Walkthrough

## Summary of Changes

LicenceFlow's journey architecture has been refactored into **one canonical state engine** that serves as the single source of truth across the entire application, resolving hardcoded completion counts, draft collision risks, and indirect redirect chains.

---

### 1. Fully Isolated Citizen vs. Prepared Demo Storage (`src/portal/application.ts`, `src/PortalApp.tsx`)
- Schema updated to `version: 2` with `mode: 'citizen-journey' | 'prepared-demo'`.
- Drafts are stored in isolated per-application keys: `mp-ll-application-draft-v2:${applicationId}`.
- Active pointers are separated:
  - `mp-ll-active-citizen-id` (active citizen draft)
  - `mp-ll-active-demo-id` (prepared demo draft)
  - Metadata record separation in `PortalApp.tsx`: `mp-ll-citizen-application-v2` vs `mp-ll-demo-application-v2`.
- **Invariance Guarantee:** Creating or loading the prepared demo (`MP-LL-DEMO-2408`) will **never** overwrite or mutate the active citizen application draft (`MP-LL-XXXXXXXX`).

---

### 2. Pure `journeyState.ts` Engine (`deriveJourneyState` & `getRouteAccess`)
- **Deterministic & Pure:** Accepts `{ applicationId, draft, progress, examSession }` with zero side effects, no direct `localStorage` calls, and no mutations.
- **7 Canonical Stages:**
  1. `Application` (7 form sub-steps: Category $\rightarrow$ Identity $\rightarrow$ Details $\rightarrow$ Address $\rightarrow$ Vehicles $\rightarrow$ Form 1 $\rightarrow$ Review)
  2. `Documents & photo`
  3. `Device check & test practice`
  4. `Fee payment`
  5. `Learn road-safety rules`
  6. `Online test`
  7. `Result & licence`
- **Dynamic Completion:** Stage 1 completion strictly requires form submission (`draft.submittedAt`). Progress during editing displays `In progress (X of 7 sections complete)`.
- **Direct Smart Resume:** Computes `resumeHref` pointing directly to the exact incomplete sub-step or stage, bypassing generic trackers on "Resume application" CTAs.
- **Single-Hop Route Guards:** Any attempt to access a downstream route without satisfying prerequisites redirects immediately to `journey.resumeHref` (0 redirect chaining).

---

### 3. Application Flow Sub-step Flexibility (Option B)
- Substeps in `ApplicationProgress` remain clickable for quick review and editing across all 7 steps.
- The `resumeHref` and "Next action" always reliably guide the citizen to the first incomplete required section.
- Stage 1 turns green only upon valid submission.

---

### 4. Direct Single-Hop Route Access Guards (`getRouteAccess`)
- Blocked downstream route attempts (e.g. attempting to jump to `/test` without prior steps) immediately return `redirectHref: journey.resumeHref` instead of intermediate chained redirects.
- Guarantees instant single-hop landing on the true unfinished requirement.

---

### 5. Camera Calibration & Liveness Pass (`src/hooks/useDeviceReadiness.ts`, `ReadinessJourney.tsx`, `TestJourney.tsx`)
- **Multi-Frame Head-Turn State Machine:**
  - `center_waiting` (face centered for ~1s) $\rightarrow$ `turn_requested` (randomly requests LEFT or RIGHT) $\rightarrow$ `turning` (verifies movement across consecutive detection frames) $\rightarrow$ `passed`.
  - Replaced single-frame absolute thresholds with multi-frame sustained yaw verification.
- **Relaxed Framing & Lighting Calibration:**
  - Expanded framing bounding box (width 0.16–0.88, height 0.18–0.85, center bounds 0.18–0.82) to avoid false-positive warnings on varied webcam angles or mobile front cameras.
  - Relaxed lighting range (threshold 40–235) to reliably support normal home lighting.
  - Extended coaching and blocking grace timeouts.
- **Test Entry Camera Pre-Verification:**
  - `TestEntryPage` reacquires and previews the camera stream before question 1.
  - Displays verified camera status card and seamlessly transitions into the active exam.

---

## Verification Results

### Automated Test Suite (`src/portal/journeyState.test.ts`)
- **All 19 test files pass (75/75 tests passing).**
- **Production build (`npm.cmd run build`) passes in ~900ms with 0 errors.**


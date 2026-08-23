# LicenceFlow Ideas Backlog

A living idea bank for the **Madhya Pradesh Learner's Licence** hackathon prototype under **Build What Moves India**.

This file is intentionally broader than Round 1 implementation scope. It contains:
- ideas that may be implemented now,
- ideas that may strengthen the demo/video,
- and ideas that may be useful in a later refinement round.

---

## Product philosophy

LicenceFlow should feel like this:

> **Know before you begin. Verify before you pay. Protect the citizen during the test. Explain everything clearly.**

The current journey often feels like:
- fill forms,
- guess what comes next,
- pay,
- hope the test works,
- panic if something breaks.

LicenceFlow should instead feel like:
- understand the journey,
- check readiness early,
- complete the application clearly,
- confirm the device can work,
- pay only when safe,
- recover safely from interruptions,
- and clearly separate knowledge outcome from technical problems.

---

## Core experience ideas

### 1. "Can I finish this today?" pre-start summary
Before the citizen even begins, show a clean summary card:

- estimated time needed,
- what documents or identity route may be needed,
- whether camera/microphone are required,
- whether the device should be checked first,
- the high-level steps of the journey.

Example sections:
- **You'll need**
- **Your journey today**
- **Check my device first**

This reduces anxiety immediately.

---

### 2. Optional quick device check before the application
Before the long form, let the user do a lightweight device readiness preview.

This should not replace the final official readiness step before payment, but it helps answer:

> "Will this device even work for the test?"

Possible preview checks:
- camera permission,
- microphone permission,
- secure context,
- basic browser capability,
- connection status,
- local storage availability.

This supports the principle:

> **Know before you begin. Verify before you pay.**

---

### 3. Replace government-form feeling with guided plain-language steps
Do not remove important fields, but change how they are explained.

Instead of dense labels and jargon, present questions in citizen language:
- "Are you applying for your first licence?"
- "What do you want to learn to drive?"
- "How would you like to verify your identity?"

The backend can still map these to structured form fields.

---

### 4. "Why are we asking this?" inline explanation pattern
Many confusing fields should have a small **Why?** button.

Examples:
- Identification mark
- Vehicle class
- Aadhaar/demo identity route
- Camera permission
- Microphone permission
- Address duration
- Form 1 self-declaration

Every explanation should answer:
- why the field exists,
- how it is used in the prototype,
- and whether the data is synthetic or local-only.

This can become a signature LicenceFlow trust feature.

---

### 5. Persistent "Journey Health" card
At all major stages, show a small status card that explains the citizen's current state.

Examples:

**Application healthy**
- form saved
- payment not made
- no action required

**Needs attention**
- camera check failed
- application safe
- payment not made

**Test paused safely**
- answers saved
- payment confirmed
- attempt protected

This solves the common fear:

> "Have I messed something up?"

---

### 6. Strong payment safety gate
Before payment, show a clear readiness checkpoint screen.

The user should see exactly what has passed:
- application complete,
- identity step complete,
- camera available,
- microphone available,
- one person visible,
- framing acceptable,
- lighting acceptable,
- rehearsal passed.

If something fails, the screen should say:

**Payment is paused**  
We found something that may prevent your test from working.  
**No payment has been taken.**

This is a major value proposition.

---

### 7. "Test-drive your test" rehearsal flow
Make the rehearsal feel useful and concrete, not like a dry checklist.

Potential rehearsal sequence:
1. start camera,
2. verify face visibility,
3. verify framing,
4. do one active liveness action,
5. answer one sample question,
6. simulate a brief interruption,
7. confirm the answer remains saved,
8. show recovery success.

Then conclude with:

**Your rehearsal succeeded.**  
Your device recovered correctly from an interruption.

---

### 8. Pre-test "What if?" explainer panel
Before the test, offer a simple FAQ for anxious citizens.

Examples:
- What if my internet stops?
- What if my camera stops?
- What if someone walks behind me?
- What if I switch apps?
- What if I fail the knowledge test?

Each answer should be calm and clear, especially emphasizing when:
- answers remain saved,
- payment stays safe,
- technical interruption is not the same as failing the test.

---

### 9. Calm test-health strip during the exam
Show a minimal, non-threatening live status indicator during the test.

Possible items:
- Camera
- Connection
- Answers saved

Do not turn the UI into a surveillance dashboard. Only interrupt the user when a real issue occurs.

---

### 10. Two-part warning pattern
Every warning or error should answer two questions:

1. **What happened?**
2. **What happened to my application/test/payment?**

Example:

**Connection lost**
- What happened: the app could not reach the network for a few seconds.
- Your status: payment is still confirmed, saved answers are preserved, and no question has been marked wrong.

This is much better than generic failure copy.

---

### 11. Technical failure as a first-class outcome
The result page should clearly separate:
- **Knowledge result**
- **Technical result**
- **Integrity observations**

Example:
- Knowledge: Passed
- Technical: Recovered from 1 interruption
- Integrity: No review required

This is one of the key differentiators of LicenceFlow.

---

### 12. Powerful Journey Receipt
The receipt should not be just a boring payment slip.

It should act like a transparent record of the citizen journey:
- application submitted,
- readiness checks passed,
- payment confirmed,
- test started,
- interruption happened,
- recovery succeeded,
- test completed,
- result produced.

It should also summarize impact:
- extra fee charged: no,
- answers lost: 0,
- attempt lost: no,
- technical issue separated from score: yes.

---

### 13. "What changed because of LicenceFlow?" compare screen
Useful for judges and for the final video.

A small comparison panel could show:

**Without failure-safe design**
- device issues discovered too late,
- unclear recovery,
- technical failures cause confusion,
- citizen unsure what remains valid.

**With LicenceFlow**
- issues caught before payment,
- answers checkpointed,
- recovery made explicit,
- payment/application state always visible.

---

## Application-form ideas

### 14. Step framing using human language
Instead of only technical section names, use simple chapter names:
- About you
- Where you live
- What you want to drive
- Health declaration
- Review and submit

This makes the form less intimidating.

---

### 15. Save-state reassurance on every step
Whenever the user moves forward, show subtle confirmation:
- Saved on this device
- You can continue later
- No payment has been made yet

This builds confidence.

---

### 16. Vehicle selection with visual support
For vehicle classes, show each option with a **minimalist 3D-style animated illustration** or clean visual card so citizens are not confused.

Examples:
- motorcycle / scooter,
- car,
- transport vehicle,
- both car + motorcycle.

This can make the vehicle-selection step feel far more intuitive than code-like abbreviations.

Possible treatment:
- soft 3D or semi-3D animated illustrations,
- hover/tap micro-animations,
- plain-language labels,
- official short code shown secondarily (e.g. LMV, MCWG).

This same visual-clarity principle can be applied to other steps too.

---

### 17. Visual explanation for confusing categories
Other places where visual cards or icons may help:
- Aadhaar route vs document route,
- learner's licence vs permanent licence,
- uploaded vs pending documents,
- payment success vs pending payment status,
- ready for test vs not yet ready.

---

### 18. Contextual examples and microcopy
If a field is confusing, show a one-line example.

Examples:
- Identification mark: "Example: small mole on left cheek"
- Relation name: "Example: father's or mother's name, as required"
- Address duration: "How long have you lived at this address?"

This reduces form friction significantly.

---

### 19. Review screen that explains missing items clearly
The review screen should not just show red error text.

It should say:
- what's complete,
- what's missing,
- what still blocks submission,
- and take the user directly back to the exact missing section.

---

## Approved vehicle-selection concepts

These ideas were explicitly approved for the vehicle-class selection experience.

### A. Visual vehicle cards
Start with recognizable vehicle choices rather than licence codes. Show clear cards such as **Car**, **Motorcycle**, **Scooter**, etc., with the official class code secondary. The citizen chooses the thing they understand; LicenceFlow maps it to the bureaucratic classification.

### B. “What can I drive with this?” explainer
Each class gets a quick expandable explanation with familiar visual examples. For instance, selecting an LMV-like class can show representative car/van examples, while motorcycle classes show the corresponding two-wheeler types. Only officially verified category definitions should be stated as legal coverage.

### C. Ask what the citizen wants to drive
Instead of opening with “Select class of vehicle,” ask **“What are you learning to drive?”** The user chooses plain-language vehicle types first, then LicenceFlow explains which official class code(s) those choices correspond to and why.

### D. Compare similar categories
When two classes can easily be confused, provide a **Compare** action. Show the vehicle visuals, plain-language distinction, and official code side-by-side. Populate legal distinctions only from verified official definitions.

### E. “I don’t know which class I need” helper
Offer a short guided helper that asks simple questions such as number of wheels, vehicle type, and whether gears are involved. It recommends a likely class with an explanation rather than forcing the citizen to understand abbreviations first.

### F. Real-world vehicle search — only if implemented carefully
Allow the user to search a familiar vehicle model, e.g. **Activa**, **Classic 350**, or **WagonR**, and map it to a broad vehicle type and likely licence-class guidance. For the prototype, this should use a small curated catalogue and must clearly distinguish guidance from an official eligibility decision.

### G. Visual consequence preview
After selection, show **“You’re applying to learn:”** with the chosen vehicle visual and class code. Reuse the same visual later in the application summary and final synthetic LL so the citizen can see continuity between the choice they made and the class recorded in the journey.

### H. “Your licence” basket
Treat selected classes like a small transparent basket. Show each selected vehicle, class code, why it was added, and a remove/learn-more action. If a class changes requirements, fees, eligibility, or test content, show that consequence only when supported by verified official rules.

---

## Readiness and trust ideas

### 20. Real checks vs guided/simulated checks should always be disclosed
Where checks are real, say so.
Where checks are simulated/guided for demo purposes, say so.

Example labels:
- **Real browser check**
- **Guided demo check**
- **Synthetic gateway simulation**

This supports the honesty criterion in judging.

---

### 21. Readiness result with actionable fixes
If a readiness check fails, the screen should show:
- issue detected,
- why it matters,
- how to fix it,
- and a one-tap recheck.

Examples:
- lighting too dim,
- face out of frame,
- more than one visible person,
- microphone unavailable,
- storage unavailable,
- insecure context.

---

### 22. Show what is processed locally
For trust and privacy, explain:
- video and microphone checks are processed locally where applicable,
- this prototype uses synthetic records,
- no government database is connected,
- observations are not automatic cheating verdicts.

---

## Test experience ideas

### 23. Do not make the test feel hostile
The secure-test experience should be calm, readable, mobile-friendly, and reassuring.

It should communicate seriousness without making the citizen feel attacked.

---

### 24. Explicit interruption-recovery screen
If a problem occurs, move to a dedicated interruption screen.

This screen should explain:
- what happened,
- what was preserved,
- what the user must do next,
- and what will happen after resuming.

---

### 25. Resume should feel safe and precise
When resuming, show:
- last saved question number,
- number of answers already preserved,
- whether payment remains valid,
- that the test continues from the saved checkpoint.

---

### 26. Clear distinction between technical and integrity observations
Not every unusual signal should look like cheating.

Examples:
- multiple visible faces → integrity observation,
- network loss → technical event,
- camera unavailable → technical event,
- tab/app visibility change → observation, not automatic guilt.

This distinction should be visible in copy and result summaries.

---

## Accessibility and Indian-context ideas

### 27. Helper mode
Many users are assisted by a relative or kiosk operator.

Add an optional acknowledgement:

**Is someone helping you complete the application?**

If yes, clarify:
- form assistance is okay,
- but the applicant must take the test themselves.

Before the test starts, show a clean transition:

**Helper mode ends here.**

---

### 28. Shared computer / kiosk completion mode
Since the service may be used in a kiosk/shared environment, offer a secure finish option.

At the end of the session, offer:
- clear synthetic personal info from the browser,
- clear saved local state,
- return to the welcome page.

This is highly relevant for real Indian usage patterns.

---

### 29. Language support that feels natural
Important UX ideas:
- English/Hindi switch should be available globally,
- Hinglish-style help or search interpretation may help non-formal users,
- avoid literal, awkward translation,
- test-time help should remain technical only, never answer assistance.

---

### 30. Large tap targets and low-digital-literacy friendly design
Important visual traits:
- large buttons,
- clear progress indicators,
- large readable text,
- obvious primary action per screen,
- minimal clutter,
- no long dense paragraphs without structure.

---

## Demo / judging ideas

### 31. One-click guided demo path
A judge should be able to open the app and quickly experience the strongest story:
- issue caught before payment,
- citizen fixes it,
- rehearsal passes,
- payment happens,
- interruption occurs,
- answers survive,
- result explains the difference between knowledge and technical issues.

This path should be extremely reliable.

---

### 32. Full journey still available behind the demo path
Even though the demo path is short, the full citizen journey should remain explorable:
- form steps,
- uploads,
- readiness,
- payment,
- tutorial,
- test,
- result,
- final synthetic LL and receipt.

---

### 33. Side-by-side value communication
In the app or video, briefly explain:
- what pain point from the real experience inspired this,
- what exactly LicenceFlow changes,
- why the new version is safer and clearer.

---

## Future/stretch ideas

### 34. Device handoff to another device
If a device is not suitable, allow a synthetic handoff flow.

Example:
- user starts on phone,
- readiness fails,
- app generates a short code or QR,
- user continues the draft on a laptop.

Even if mocked, this is a powerful idea.

---

### 35. Visual guidance layer for certain steps
Potential places where lightweight animation or visual guidance could reduce confusion:
- how to frame the face,
- how to turn the head slightly for liveness,
- how to sign/upload a signature,
- what kind of photo is acceptable,
- what each vehicle class means.

---

### 36. Smart, non-invasive support assistant
The assistant should help with:
- terminology,
- missing steps,
- readiness fixes,
- payment-state clarity,
- recovery guidance,
- process understanding.

It should not:
- answer test questions,
- claim official authority,
- invent unverified rules.

---

## Idea themes worth expanding later

The following can be added to this file later as separate sections:
- Application-tracker ideas
- Payment-state UX ideas
- Tutorial / road-safety content ideas
- Result and receipt ideas
- Judge demo script ideas
- Hindi copy ideas
- Motion/animation ideas
- Mobile-only improvements
- Evidence/provenance ideas

---

## Current shortlist of especially strong ideas

If prioritizing for actual implementation, the strongest candidates are likely:
1. pre-start quick device check,
2. payment safety gate,
3. test-drive rehearsal,
4. journey health card,
5. two-part interruption messaging,
6. separated knowledge/technical/integrity outcome,
7. powerful journey receipt,
8. vehicle selection with visual cards / minimal 3D illustrations,
9. helper mode,
10. kiosk/shared-computer safe completion.

---

## Notes

This file is a live backlog, not a strict implementation contract.

When adding new ideas, prefer the following format:
- idea name,
- citizen problem it solves,
- how it would work,
- whether it is Round 1, Round 2, or future.

---

# Approved additions — Vehicle selection

These ideas were explicitly approved for the backlog.

## V1. Visual vehicle cards
Present recognizable vehicle types first and bureaucratic licence codes second.

Example:
- Car — `LMV`
- Motorcycle — relevant verified class
- Scooter — relevant verified class

The citizen chooses the thing they understand; LicenceFlow translates it into the official class terminology.

**Status:** Approved. Strong Round 1 candidate.

## V3. "What can I drive with this?" drawer
Each licence class can open a compact explanation with visual examples of typical vehicles covered by that class.

Only officially verified definitions should be used. The interaction is intended to eliminate the need to leave the portal and search the web for class codes.

**Status:** Approved.

## V4. Ask "What do you want to drive?" before showing class codes
Lead with citizen intent rather than database terminology.

Example flow:
1. "What are you learning to drive?"
2. Citizen selects visual vehicle choices.
3. LicenceFlow maps those choices to the relevant official class codes.
4. A "Why these classes?" explanation is available.

**Status:** Approved. Strong Round 1 candidate.

## V5. Compare similar vehicle classes
When two classes are commonly confused, provide a clean comparison view showing only verified distinctions such as vehicle type, gear distinction, representative examples, and official code.

**Status:** Approved.

## V6. "I don't know which class I need" guided selector
Offer a short decision helper using plain-language questions instead of expecting the citizen to understand abbreviations.

Possible questions:
- two wheels or four?
- geared or gearless?
- personal or transport use, where applicable and verified?

The result should be phrased as guidance and mapped only using verified rules.

**Status:** Approved. Strong Round 1 candidate.

## V7. Real-world vehicle search — only if done properly
Allow the citizen to search a familiar vehicle model such as a scooter, motorcycle, or car, then use a curated catalogue to explain the likely relevant licence class.

This must not pretend to support every vehicle in India. A limited, accurate catalogue is preferable to broad unreliable matching.

**Status:** Approved conditionally. Implement only if accuracy and UX are strong.

## V9. Visual consequence preview
After a class is selected, show what the choice means in the citizen's journey.

Example:
- "You're applying to learn: Car"
- "Application class: LMV"

Reuse the same vehicle visual later in the application summary and synthetic LL summary so the user sees continuity from selection to outcome.

**Status:** Approved.

## V10. "Your licence" basket
Treat selected vehicle classes like a clear, editable bundle rather than a collection of cryptic checkboxes.

Example:
- Car — LMV — Why added? — Remove
- Motorcycle — verified class — Why added? — Remove

If a selection changes later requirements, show only verified consequences and let the citizen review the change before proceeding.

**Status:** Approved.

---

# Approved additions — Payment and money confidence

These ideas were explicitly approved for the backlog.

## P1. Explain exactly what the citizen is paying for
Before payment, show a simple itemized breakdown and a short explanation for each charge where authoritative/configured data exists.

Do not present guessed or stale amounts as official current MP fees.

**Status:** Approved.

## P2. "No payment yet" reassurance — accuracy-critical
Where useful before payment, explicitly reassure the citizen that no payment has been made yet.

Examples:
- "Application saved. No payment has been made."
- "Readiness check failed. You have not been charged."

**Important guardrail:** this message must be driven by the actual LicenceFlow payment state. Never display it merely as static reassurance. If a payment attempt has started or its status is uncertain, the message must change accordingly.

**Status:** Approved with strict anti-deception requirement.

## P3. Payment readiness lock
Keep the payment action unavailable until required readiness/rehearsal gates are complete.

Example:
- Application complete ✓
- Device ready ✓
- Rehearsal pending ○

When all required conditions pass, enable the payment action with restrained state-change feedback rather than a flashy animation.

**Status:** Approved. Strong Round 1 candidate.

## P4. "What if payment fails?" explanation before payment
Provide a small pre-payment explanation that tells the citizen what will happen if the gateway closes, the network drops, or confirmation is delayed.

Core principle:
> Never ask the citizen to pay again before the prior payment status is checked.

**Status:** Approved.

## P5. Pending / uncertain payment as a first-class state
Support more than success and failure.

Example:
**Payment status: Checking**
"Your bank may have processed the payment, but LicenceFlow has not confirmed the result yet. Do not pay again yet."

Primary action: **Check status**

**Status:** Approved. Strong Round 1 candidate.

## P6. Collapsible payment activity trail
Record a simple human-readable sequence such as:
- payment started,
- gateway contacted,
- authorization returned,
- application payment state updated.

Keep this collapsed during normal success, but expose it under "See what happened" when the citizen needs clarity. It can also feed the Journey Receipt.

**Status:** Approved.

## P7. Duplicate-payment protection
If a completed, pending, or uncertain prior payment attempt exists, do not immediately show a fresh pay button.

Examples:
- Confirmed → "You do not need to pay again."
- Pending/unknown → "Previous payment is still being checked."

The system should reconcile/check the existing state before another attempt is permitted.

**Status:** Approved. Strong Round 1 candidate.

## P8. "Exit safely" around payment
Give the citizen a deliberate safe-exit action explaining exactly what will remain saved.

Examples:
- Before payment: application saved; payment not made.
- After payment: payment confirmed; test not started; safe to return later.
- Unknown payment: status must be checked before attempting another payment.

**Status:** Approved.

## P9. Payment consequence preview
Before the final payment action, explain what becomes available after payment and what LicenceFlow proposes to preserve if technology later fails.

Any statement about future official treatment of fees or attempts must be labelled as LicenceFlow prototype behavior unless supported by verified government policy.

**Status:** Approved.

## P10. "Money safety" status strip
After payment, show a compact, factual money-state indicator when it materially helps the citizen.

Possible states:
- Payment confirmed
- Previous payment attempt pending
- No new payment required in this LicenceFlow recovery flow

During a technical interruption, pair money state with progress state:
- payment confirmed,
- saved answers preserved,
- next action clearly stated.

**Guardrail:** never claim "your money is safe" in a way that implies a government refund/financial guarantee the prototype cannot make. Prefer exact status language over broad reassurance.

**Status:** Approved. Strong Round 1 candidate.

---

# Approved UI Direction — High-Budget, Modern Government Service

**Status:** Approved for LicenceFlow visual direction and future implementation/polish.

The goal is a UI that feels **formal, professional, modern, capable and extremely restrained** — closer to the visual discipline of products like Uber/Linear, while remaining recognizably appropriate for an Indian public-service workflow.

Core principle:

> **If an effect exists primarily to impress the viewer rather than help the citizen understand or act, remove it.**

Structural behavior may take inspiration from modern Indian government-service design patterns such as UX4G, while the execution should use the visual restraint and hierarchy associated with high-budget consumer/product interfaces.

## 1. Almost-monochrome visual system

Use a predominantly neutral visual language:
- near-black primary text,
- white surfaces,
- warm/neutral off-white page backgrounds,
- restrained greys,
- one controlled institutional blue,
- semantic green/amber/red only when meaning requires them.

Avoid using brand blue on every component. The accent should become more meaningful because it is used selectively.

Possible visual direction:
- Primary text: near-black
- Secondary text: medium neutral grey
- Background: warm or neutral off-white
- Surface: white
- Border: soft neutral grey
- Institutional accent: one deep blue
- Success / warning / error: semantic only

The page should feel calm and expensive rather than colorful.

## 2. Containers must earn their borders

Do not turn every piece of information into a rounded card.

Prefer:
- strong typography,
- spacing,
- section dividers,
- alignment,
- subtle grouping,
- whitespace inside the actual task.

Use cards only when the content behaves like a meaningful object, such as:
- a vehicle choice,
- an application,
- a payment summary,
- a readiness result,
- a document,
- a major status object.

Rule:

> **A container must earn its border.**

Avoid the common hackathon/SaaS pattern of many floating rounded rectangles.

## 3. Premium typography system

The typography should look institutional and modern, not generic or oversized.

Explore a UI-oriented English typeface such as Inter/system-ui and a proper Hindi/Devanagari companion such as Noto Sans Devanagari.

Use a restrained hierarchy rather than huge marketing headings.

Indicative hierarchy:
- Page title: ~30–34 px, strong but not oversized
- Section title: ~20 px
- Field label: ~14–15 px, medium/semibold
- Body: ~16 px with generous line-height
- Meta/status: ~13–14 px

Typography should create most of the hierarchy so decoration is unnecessary.

## 4. One dominant thing per screen

Every screen must clearly communicate the user's primary task or state.

Examples:
- Vehicle selection → **What do you want to drive?**
- Payment → amount + primary payment action
- Readiness → **Your device is ready** / **1 thing needs attention**
- Interruption → **Your test is paused safely**
- Result → knowledge outcome first, then technical/integrity detail

Secondary information must visually recede.

Rule:

> **No element should compete for attention it has not earned.**

## 5. Journey-based progress system

Use a professional progress system that represents the citizen's real-world process, not merely a page counter.

Possible desktop structure:
- Application ✓
- Documents ✓
- Device check ●
- Payment
- Preparation
- Test
- Licence

Possible mobile structure:
- Current stage name
- Step x of y
- thin progress line
- short note such as **Payment comes next**

The user should understand both:
- where they are now,
- and what is coming next.

Keep it visually thin and quiet.

## 6. Premium bottom action system

Use a consistent action region for transactional screens.

On mobile, a restrained sticky bottom action area could show:
- autosave status,
- Back,
- Continue / primary action.

Example:

**Saved just now**                 **Back   Continue →**

Requirements:
- must not hide validation errors,
- must behave correctly when the mobile keyboard opens,
- disabled state must explain why,
- loading should happen inside the relevant action rather than with unrelated spinners,
- desktop should use the same predictable action hierarchy at the end of the form.

This gives the whole product consistent interaction muscle memory.

## 7. Contextual help instead of a floating AI chatbot

Do not use a loud floating "AI" button or generic chatbot as the main assistance pattern.

Help should appear exactly where confusion happens.

Examples:
- **What does LMV mean?**
- **Why do you need my camera?**
- **Why isn't my face being detected?**
- **What happens if payment fails?**

The response can open in a clean bottom sheet or inline help panel.

Where AI is used, the interface should communicate the benefit, not advertise the technology.

Example:
- camera is working,
- lighting is low,
- face detector is struggling,
- user taps help,
- response gives a contextual fix rather than generic troubleshooting.

AI should feel like invisible intelligence behind the product.

## 8. Context-aware UI that adapts to state

The interface should change intelligently based on the actual journey state.

Examples:

Before payment:
- Payment — Not started

After payment:
- Payment — Confirmed ✓
- Receipt reference available

Network loss:
- **Offline**
- Your work is still being preserved locally

After recovery:
- **Back online**
- Everything is up to date ✓

During the test:
- help automatically becomes **technical help only**,
- answer-related assistance is unavailable.

The interface should show only the controls and explanations relevant to the current state, while remaining understandable and reversible.

## 9. Extremely restrained motion language

No decorative animation.

Use motion only when it helps explain:
- cause and effect,
- state change,
- hierarchy,
- spatial relationship,
- or completion.

Examples:
- button press: fast, subtle response,
- bottom sheet: smooth 180–220 ms entrance,
- readiness row: small fade/position transition,
- status change: short transition,
- vehicle illustration: slightly richer motion because it helps communicate the physical object.

Avoid:
- confetti,
- bounce,
- overshoot,
- scroll-jacking,
- cinematic page wipes,
- constant animated backgrounds,
- gratuitous 3D motion.

Always respect reduced-motion preferences.

## 10. 3D only where physical understanding helps

Use high-quality minimal 3D/semi-3D illustration sparingly and intentionally.

Good candidates:

### Vehicle selection
- car,
- motorcycle,
- scooter,
- other verified vehicle categories.

Tap/hover may produce a tiny orientation shift or similarly restrained micro-animation.

### Camera framing
A clean instructional head/shoulder visual showing correct positioning.

### Photo/signature guidance
Visual examples of:
- correct framing,
- cropped face,
- dark photo,
- unsuitable signature image.

### Device handoff
Simple phone → laptop illustration.

These visuals are instructional assets, not decoration.

Rule:

> **Depth is allowed only when it improves understanding.**

---

## Combined visual target

LicenceFlow should feel like:

> **A premium modern product team rebuilt a government service without turning it into a startup.**

Desired qualities:
- formal,
- quiet,
- exact,
- trustworthy,
- highly legible,
- confident,
- fast,
- modern,
- intentionally designed,
- non-gimmicky.

Avoid:
- glassmorphism,
- AI gradients,
- neon,
- giant marketing typography,
- excessive pills,
- excessive rounded cards,
- decorative 3D,
- floating chatbot bubbles,
- fake complexity,
- animation for animation's sake.

The product should look expensive because **nothing appears accidental**.

# Application Status / Journey Tracking — Approved Ideas

## 2. Separate "What's next" from "What happened"

Do not force the citizen to decode one long tracker.

Use two distinct concepts:

### What's next
Shows the current stage, next required action, and anything blocking progress.

### What happened
A chronological journey history showing completed actions, timestamps, recoveries, receipts, and important technical events.

The current task should remain visually dominant; completed history should recede.

## 3. Human-readable statuses, never internal system states

Avoid labels such as:
- PENDING,
- PROCESSING,
- FAILED,
- STAGE_04.

Use a deliberately small set of citizen-readable states such as:
- Waiting for you
- Checking
- Completed
- Needs attention
- Paused safely
- Recovered
- No action needed

Internal technical codes may exist underneath but should not be the main citizen-facing language.

## 4. Show who owns the next step

Each stage should clearly indicate whether progress currently depends on:
- **Your action**
- **System check**
- **No action needed**

This prevents the common uncertainty of not knowing whether the citizen should wait, retry, or do something.

Examples:
- Documents — Completed · No action needed
- Device readiness — Your action
- Payment confirmation — System check

## 6. Explain why a future stage is blocked

Do not show disabled steps without explanation.

Example:

**Payment — Not ready yet**  
Complete the device rehearsal first.

A small explanation may clarify why the dependency exists:

> LicenceFlow verifies that the test environment can work before financial commitment.

Blocked stages should always explain:
- what is missing,
- why it matters,
- and what action unlocks them.

## 7. Resume from the exact saved point

The tracker should be a real recovery mechanism, not merely a progress display.

Examples:

**Application — In progress**  
Last saved: Address details  
**Continue where you stopped**

**Test paused**  
7 answers saved  
**Resume from Question 8**

Where technically feasible, restore the precise step/question and saved state rather than only routing to the general section.

## 8. Explicit "Recovered successfully" state

After a frightening technical event, the system should explicitly tell the citizen when normal operation has been restored.

Example:

**Recovered successfully**
- Answers restored ✓
- Payment still confirmed ✓
- No action required ✓

After the citizen has had enough time to understand the recovery, the UI can quietly return to the normal journey state.

Systems often announce failure but never clearly announce recovery; LicenceFlow should do both.

## 9. Citizen-readable event history with optional technical details

The main journey history should use plain language:

**Internet connection interrupted — recovered**

An optional **Technical details** disclosure may show structured information such as:
- event code,
- timestamp,
- checkpoint restored,
- whether the event was real or simulated.

This gives citizens clarity while preserving useful evidence for support, debugging, and hackathon technical evaluation.

## 10. State-derived Journey Contract

This concept substantially overlaps with the existing Journey Health / Money Safety / Journey Receipt approach and should be implemented as one consistent system rather than duplicated.

At important moments LicenceFlow should display only facts derived from the current saved state, for example:

**What is safe right now**
- Application saved ✓
- Payment confirmed ✓
- 7 answers saved ✓
- Test paused

These must never become generic reassuring marketing claims. Every statement must be provably true from the application's actual state.

This is the citizen-facing contract of the service: clearly state what is safe, what is uncertain, and what happens next.

---

# Exam Interface and Flow Ideas

The secure learner-test experience should feel like a **purpose-built examination environment**, not a normal government webpage with multiple-choice questions placed inside it.

The design goal is deliberately restrained:

> **During the exam, the interface should become quieter, simpler, and more focused than the rest of LicenceFlow.**

The exam should minimize distraction, make saving/recovery visible without creating anxiety, and separate technical conditions from integrity observations and knowledge scoring.

## Proposed exam flow

```text
Ready to take test
        ↓
Final environment recheck
        ↓
Applicant-only boundary
        ↓
Language / accessibility settings
        ↓
Very short controls tutorial
        ↓
Enter secure test
        ↓
Question
→ Select answer
→ Confirm answer
→ Save/checkpoint
→ Advance
        ↓
Background technical + integrity observation
        ↓
Problem?
  ↙            ↘
No              Yes
↓                ↓
Continue      Correct / recover
                 ↓
             Resume exactly
        ↓
Final question
        ↓
Review / submit if permitted by configuration
        ↓
Submission received confirmation
        ↓
Knowledge result
+
Technical outcome
+
Integrity status
```

The exact question count, timing rules, ability to navigate backwards, review behavior, and submission rules must remain configuration-driven unless current Madhya Pradesh rules are authoritatively verified.

## 1. Radically calm three-zone exam interface

Once the test begins, remove almost all portal chrome.

The exam interface should have only three stable areas:

### Top zone
- Learner's Licence Test
- question progress
- remaining time if applicable
- compact test-health state

### Main zone
- question image if applicable
- question text
- answer options

### Bottom zone
- confirmation/navigation action
- compact question navigator if permitted
- technical help

Do not show:
- service catalogue,
- large government navigation,
- marketing copy,
- decorative cards,
- unnecessary sidebars,
- AI branding,
- technical telemetry by default.

Example:

```text
Learner's Licence Test                   08:42 remaining
Question 4 of 15                         Test health ✓
─────────────────────────────────────────────────────

                    [ road sign ]

            What does this sign indicate?

            ○ No parking
            ○ No stopping
            ○ Speed restriction
            ○ One way

                                Confirm answer →
─────────────────────────────────────────────────────
Questions                               Technical help
```

The exam should visually communicate seriousness, confidence, and concentration.

## 2. Select first, confirm second

Selecting an answer should **not immediately advance the test**.

Interaction:

1. citizen selects an answer;
2. selected option becomes visually clear;
3. primary action becomes **Confirm answer**;
4. on confirmation, LicenceFlow checkpoints the answer;
5. show a brief **Answer saved ✓** acknowledgement;
6. only then advance to the next question.

This protects against accidental taps and makes the answer-before-navigation guarantee visible to the citizen.

The acknowledgement should be subtle and short, not a modal or blocking animation.

## 3. Stable controls and layout across every question

The position of important exam controls must remain stable even when question content differs.

A question with:
- an image,
- long text,
- short text,
- or no image

must not cause Confirm, Next, timer, progress, or help controls to jump unpredictably.

Use a stable exam canvas and predictable action region so users quickly build muscle memory.

This is especially important for:
- low-digital-literacy citizens,
- older applicants,
- keyboard users,
- mobile users,
- anxious test takers.

## 4. Camera and proctoring UI should disappear when everything is healthy

Do not keep a large live webcam preview or surveillance dashboard visible throughout the test.

Avoid persistent displays such as:
- AI score,
- face confidence,
- microphone waveform,
- network latency,
- "AI Proctor Active",
- continuous webcam tile.

When everything is healthy, show only a restrained state such as:

**Test health ✓**

or a tiny compact row:

**Camera · Connection · Saving**

Only reveal the relevant diagnostic UI when the citizen needs to act.

Example:

**We need a clearer view**

[small temporary camera preview]

Move slightly toward the centre.

**Your saved answers are safe.**

Once the issue is corrected, the camera preview disappears again.

## 5. Compact question map if navigation/review is permitted

If the configured examination allows reviewing or moving among questions, provide a simple question navigator.

Use very few states:
- answered,
- current,
- unanswered,
- marked for review if that capability exists.

Example:

```text
1 ✓   2 ✓   3 ✓   4 ●   5   6   7
8     9     10    11    12  13  14  15
```

Do not create a complicated multi-colour legend.

On mobile, **Questions** can open a bottom sheet rather than permanently consuming screen space.

Important: this behavior must remain configuration-driven and must not be presented as a confirmed Madhya Pradesh rule until verified.

## 6. Calm, accessibility-aware timer

If the configured test uses a time limit, the timer should be visible without dominating the interface.

Example:

**08:42 remaining**

Normal state:
- neutral text.

Approaching a configured warning threshold:
- restrained warning treatment.

Critical threshold:
- one clear warning.

Avoid:
- flashing clocks,
- pulsing red interfaces,
- constant countdown animation,
- unnecessary anxiety-inducing color changes.

If hiding the timer or additional timing accommodations are ever supported, these must come from the authorised exam configuration rather than invented prototype policy.

## 7. Listen to question / read-aloud accessibility

Offer a clearly labelled **Listen** action where appropriate.

It can read:
- the question,
- then each answer option,
- in the selected language.

Potential UI:

**Listen to question**

While speaking, subtly indicate which part is currently being read without creating distracting animation.

This can be especially valuable for:
- lower-literacy users,
- users uncomfortable with dense digital text,
- accessibility needs,
- Hindi-language applicants.

The implementation should be described as a proposed accessibility feature unless its exact availability in the current MP test is verified.

## 8. Graceful network degradation before full interruption

Do not immediately throw the citizen into a blocking failure screen because of a brief connectivity loss.

If required question resources are already available locally and continuing is safe, the interface may temporarily enter:

**Offline · answers saving on this device**

The citizen can continue answering while checkpoints remain local.

When the connection returns:

**Back online · saved answers synchronized ✓**

The message should disappear after confirmation.

Escalate to a dedicated paused state only when:
- the outage persists,
- a required dependency is unavailable,
- submission cannot safely continue,
- or examination policy requires pausing.

Then show:

**Test paused safely**

- latest answer saved,
- payment status preserved,
- no knowledge penalty applied,
- next recovery action clearly stated.

This is one of the most important embodiments of the principle:

> **Technical failure should never become citizen failure.**

## 9. Progressive, proportional response to camera/integrity issues

Raw technical observations should not immediately become accusations or automatic cheating verdicts.

Use a progressive response ladder.

### Brief/transient condition
No disruptive action unless it persists.

### Repeated poor framing
**Please centre your face.**

### Persistent additional person detected
**Test paused**

Another person appears to be visible. Please continue when only the applicant is in view.

**Check again**

### Environment restored
**Environment restored ✓**

Resume the test.

Internally, the system may record a structured integrity observation.

Citizen-facing language should describe the observed condition rather than accuse the person of misconduct.

## 10. Resume exactly from the saved checkpoint

Recovery should be precise and reassuring.

Example recovery screen:

```text
Connection restored ✓

Your test is ready to continue.

7 answers preserved
Last saved: Question 7
Payment confirmed
Technical event recorded separately

                 Resume test
```

After resuming, the citizen should return to the exact next safe state, such as Question 8, rather than being dropped back at the portal dashboard.

If production policy requires reauthentication after a serious interruption, the ideal model is:

**quick re-authentication → exact saved checkpoint**

not:

**restart the complete citizen journey**.

## 11. Final review and submission should feel like a cockpit check

If the configured exam permits reviewing answers before submission, the final screen should clearly summarize what is ready without using alarmist language.

Example:

```text
Ready to submit

15 questions
14 answered
1 unanswered

Question 9                    Not answered
Question 12                   Marked for review

[ Return to Question 9 ]

────────────────────────────────
Saved answers: 14
Connection: Online
Submission ready: Yes

                         Submit test →
```

Then show one restrained confirmation:

**Submit your test?**

You won't be able to change answers after submission.

After successful transmission, show a separate transaction confirmation first:

**Test received ✓**

Only after that should LicenceFlow display or retrieve the result.

This distinction is important:

> First confirm that the test was successfully received. Then explain the outcome.

The same principle already applies to payment: transaction success and consequence should not be conflated.

---

## Exam visual direction

The exam should be even more restrained than the rest of LicenceFlow.

Preferred characteristics:
- white / neutral background,
- near-black typography,
- one institutional accent color,
- thin separators,
- stable layout,
- strong focus states,
- no unnecessary cards,
- no decorative 3D,
- no gradients,
- no gamification,
- no persistent webcam panel,
- no visible AI branding,
- no animated surveillance indicators.

Purposeful motion is still allowed:
- selected answer transition,
- saved acknowledgement,
- bottom-sheet transition,
- recovery status transition,
- brief environment-restored confirmation.

All motion must support understanding and respect reduced-motion preferences.

## Exam implementation principle

The exam interface must never imply that browser-level monitoring is equivalent to production SmartLock/native lockdown.

LicenceFlow may demonstrate real browser-visible signals such as:
- camera stream health,
- face count,
- framing,
- lighting,
- page visibility,
- connectivity,
- local checkpointing.

It must not claim that a browser can guarantee:
- screenshot prevention,
- app-switch prevention,
- overlay prevention,
- uncompromised device state,
- production biometric security.

## Priority within the exam ideas

Especially valuable for Round 1:
- calm three-zone exam canvas,
- select → confirm → checkpoint → advance,
- stable controls,
- hidden-until-needed camera/proctor UI,
- calm timer,
- graceful network degradation,
- proportional integrity responses,
- exact checkpoint recovery,
- test-received confirmation before result.

High-value accessibility/polish:
- Listen to question,
- compact question navigator when configuration permits,
- final review cockpit if review is permitted.

---

# Pre-exam authentication, liveness and readiness ideas

All ten ideas in this section are approved for the LicenceFlow idea backlog.

## 1. Calm permission and consent screen before browser prompts

Do not trigger camera/microphone permissions immediately.

First explain:
- what will be checked,
- why the camera is needed,
- why the microphone is needed,
- what is processed locally,
- what is synthetic in the prototype,
- and what is not stored.

Only after the citizen chooses **Start device check** should the browser permission prompts appear.

The experience should feel like a professional equipment check, not an unexpected surveillance request.

## 2. One parallel auto-check instead of many separate readiness pages

Run camera, microphone, face, lighting, connection, storage and browser checks together where technically possible.

Show a quiet live checklist such as:
- Camera — Checking…
- Microphone — Checking…
- Face position — Waiting for you
- Lighting — Checking…
- Connection — Ready
- Saving — Ready

The citizen should not have to repeatedly press Continue between technical checks.

## 3. Live positioning coach instead of machine-vision boxes

Do not expose raw face bounding boxes, confidence values or computer-vision jargon.

Show a subtle face-position guide and human instructions such as:
- Move slightly closer
- Move a little to the left
- Look straight ahead
- Good distance
- Position looks good

The visual layer may use a clean face silhouette/oval and restrained animation.

## 4. "Fix before fail" readiness philosophy

Borderline conditions should trigger coaching before failure.

Examples:
- low light → “A little more light will help”
- face too far away → “Move slightly closer”
- camera very dark → “Check whether the camera is covered”
- microphone unavailable → “We cannot detect an active microphone yet”

Continue evaluating conditions automatically.

As soon as they improve, convert the message to a positive confirmation.

Avoid repetitive Fail → Retry loops when the system can guide the citizen into a valid state live.

## 5. One simple randomized active-liveness action

After framing/environment checks pass, request one short randomized action, preferably:
- turn slightly left, or
- turn slightly right.

Detect the response from real face landmarks.

Keep the challenge short and understandable.

Head-turn is preferred over blink for the Round 1 path because it is visually obvious, easier to explain and likely more reliable during a live judge demonstration.

## 6. Adaptive liveness / assurance ladder

Do not force every applicant through the maximum number of security challenges.

Use a simple deterministic assurance ladder:
- clear → proceed,
- uncertain → request one more check,
- needs recheck → coach/retry.

Security effort should increase only when uncertainty increases.

For the hackathon this does not require a large ML risk engine. A small set of explicit confidence/recheck states is enough to demonstrate the product principle.

## 7. Separate identity verification from ongoing exam presence

Treat these as separate concepts:

**Identity**
- Is this the applicant associated with the test?

**Exam presence**
- Is the expected single test taker still present in the environment?

Do not repeatedly claim the system is “verifying identity” throughout the whole exam when it is really monitoring presence/environment conditions.

During a healthy exam, collapse the ongoing monitoring into a quiet **Test health** state.

## 8. Never hard-fail on one uncertain face/liveness result

Use a recovery ladder:

Face/liveness uncertain
→ improve positioning/light
→ automatic recheck
→ alternate simple challenge if needed
→ still uncertain
→ explain a retry/review/alternative verification path.

The citizen's application and payment should remain safe while the check is unresolved.

Never turn a single weak model observation into an automatic accusation or irreversible failure.

## 9. Multiple-person detection should trigger guidance, not accusation

If more than one person is consistently detected:

**One more person is visible**

Explain that the secure test environment should contain only the applicant.

Continue checking live.

When the second person leaves:

**Environment ready**

Record the event internally as an observation if needed, but do not present one detection as “cheating detected.”

## 10. Ready Room before the timer starts

After all checks pass, give the citizen one quiet final screen before Question 1.

Example:

**You're ready**
- Applicant — Ready
- Camera — Ready
- Microphone — Ready
- Lighting — Ready
- Connection — Ready
- Answer saving — Ready

Explain:
- the timer has not started yet,
- only the applicant should remain present,
- technical interruptions are handled separately,
- technical help remains available.

If helper mode was used earlier, clearly state:

**Your helper should leave now.**

Only after the citizen presses **Start test** should the timed exam begin.

The transition from portal mode to exam mode should be restrained and professional.

## Pre-exam product rule

Before the exam starts, most technical problems should feel like **setup conditions**, not “errors.”

Examples:
- “Move slightly closer,” not “Face detection failed.”
- “Add a little more light,” not “Lighting test failed.”
- “One more person is visible,” not “Violation detected.”

The interface should coach the citizen toward readiness wherever possible.

## Security honesty boundary

LicenceFlow may genuinely demonstrate browser-visible checks including:
- camera and microphone permission/stream health,
- face presence and multiple-person detection,
- framing,
- basic lighting,
- head-turn response,
- network status,
- page visibility,
- local persistence.

It must not claim browser-level equivalence to production SmartLock/native lockdown or guarantee screenshot prevention, app-switch blocking, overlay suppression, device integrity or production-grade biometric identity verification.

---

# Recommended microphone integrity approach

Only the recommended microphone ideas are included here.

## Keep the existing Web Audio health layer

Continue using the browser Web Audio API for:
- microphone permission,
- audio-track health,
- whether a usable signal exists,
- simple RMS / audio-energy level.

This is a readiness and stream-health signal only. It must not be described as cheating detection.

## Add local voice-activity detection if it is stable

Preferred candidate: a browser-local Silero VAD wrapper such as `@ricky0123/vad-web`.

Use it only to detect:
- likely speech started,
- likely speech continued,
- likely speech ended,
- duration/repetition of speech activity.

Do not transcribe the conversation and do not send raw microphone audio to a server for the Round 1 prototype.

If the VAD model fails to load or is unsupported, fall back to the existing audio-health/RMS layer rather than breaking the exam.

## Correlate microphone observations with camera observations

A speech event should become more meaningful only when combined with other signals.

Examples:
- brief speech-like sound alone → ignore or quietly record;
- sustained speech while one applicant is visible and mouth movement is plausible → low concern;
- sustained speech while the applicant's mouth appears still → possible background/off-camera speech observation;
- sustained speech while the applicant is absent → stronger integrity observation;
- speech while multiple people are visible → stronger integrity observation.

These are observations, not automatic cheating verdicts.

## Use duration and repetition before interrupting

Do not react to one cough, horn, chair movement or brief noise.

Use a proportional progression:
1. ignore transient activity,
2. quietly record repeated speech activity,
3. coach: **Please keep the room quiet**,
4. if persistent and combined with stronger signals, pause the test environment,
5. allow the citizen to restore the environment and resume.

Thresholds are LicenceFlow prototype logic and must not be presented as official MP rules.

## Recommended event vocabulary

Prefer neutral event names such as:
- `AUDIO_STREAM_LOST`
- `SPEECH_ACTIVITY_SHORT`
- `SPEECH_ACTIVITY_PERSISTENT`
- `SPEECH_WITH_MULTIPLE_FACES`
- `SPEECH_WHILE_APPLICANT_ABSENT`

Do not use an event such as `CHEATING_DETECTED` for microphone inference.

## Privacy rule

Where the implementation actually behaves this way, explain:

> Microphone analysis runs on this device. LicenceFlow detects speech activity; it does not transcribe or store your conversation in this prototype.

## Do not add yet

Do not add for Round 1 unless later testing gives a compelling reason:
- speech-to-text / Whisper,
- speaker identification,
- speaker verification,
- speaker diarization,
- dedicated whisper classification,
- heavy acoustic feature libraries such as Meyda.

These add complexity and privacy risk without strengthening the core demo enough.

## Recommended architecture

Microphone
→ Web Audio stream-health + RMS
→ optional local Silero VAD
→ speech activity events

Camera / MediaPipe
→ face count
→ presence
→ mouth movement where available

Both
→ deterministic integrity rules
→ ignore / coach / pause
→ never automatic guilt.

---

# Recommended camera and live-footage integrity approach

The camera system should use narrow, on-device perception and deterministic rules. It must not behave like a black-box “AI cheating detector.”

## 1. Separate camera health, presence and integrity states

Treat these as different classes of events:

**Technical camera state**
- stream healthy,
- stream temporarily interrupted,
- stream ended,
- camera permission denied,
- camera track stopped.

**Environment/presence state**
- one face present,
- no face visible,
- face out of frame,
- lighting unsuitable.

**Integrity observation**
- multiple faces persistently visible,
- applicant absent for a sustained interval,
- suspicious audio/visual combination,
- repeated page-visibility changes.

A camera hardware/stream failure is a technical problem. It must not be recorded as misconduct.

## 2. Analyse frames locally without recording continuous footage

Preferred architecture:

Camera frame
→ local analysis
→ structured signal
→ discard frame.

Derived signals may include:
- face count,
- framing,
- lighting,
- head pose,
- mouth movement,
- blink state,
- active-liveness progress.

Do not continuously record the citizen’s webcam video for the Round 1 prototype.

Use a modest analysis cadence rather than trying to perform inference on every rendered video frame.

## 3. Extend the existing MediaPipe stack before adding more vision libraries

LicenceFlow already uses MediaPipe Face Landmarker.

Prefer extracting more useful signals from the same stack, including where technically stable:
- face landmarks,
- face count,
- facial blendshapes,
- blink state,
- jaw/mouth movement,
- head pose / head-turn response,
- facial transformation information.

Avoid exposing model confidence values or raw landmark visualizations to the citizen.

## 4. Randomized active-liveness challenges

Use short unpredictable actions selected only after the live camera session begins.

Preferred Round 1 challenges:
- turn slightly left,
- turn slightly right.

Optional fallback challenge if needed:
- blink once.

A random challenge is stronger than a fixed challenge because a prerecorded clip cannot know the requested action in advance.

Describe this as **active liveness**, not as “deepfake-proof” or guaranteed spoof prevention.

## 5. Use temporal evidence rather than single-frame decisions

Never make a blocking decision from one frame.

Use rolling windows / persistence thresholds.

Examples:
- one frame with zero faces → ignore;
- sustained no-face condition → coach or pause;
- one second-face detection → ignore;
- repeated/persistent multiple-face detection → integrity observation;
- brief framing loss → coach;
- sustained camera absence → pause safely.

The exact thresholds are LicenceFlow prototype logic, not official MP policy.

## 6. Correlate camera and microphone signals

Use multi-signal reasoning rather than single-sensor accusations.

Examples:
- speech + visible mouth movement → likely applicant speech, low concern;
- sustained speech + little/no visible mouth movement → possible off-camera/background voice observation;
- speech + multiple visible faces → stronger integrity observation;
- speech + applicant absent → stronger observation.

These combinations should only influence **ignore / coach / pause** decisions.

They must never directly produce an automatic cheating verdict.

## 7. Experimental passive presentation-attack detection

After the core Round 1 journey is frozen and stable, optionally experiment with a lightweight passive anti-spoofing model such as MiniFASNet / Silent-Face-Anti-Spoofing converted to ONNX and run locally in the browser.

Test it against:
- a printed photograph,
- a phone displaying a face photo,
- a phone replaying a face video,
- a real face in good light,
- a real face in dim light,
- multiple webcams / Android devices.

Use passive PAD only as a **secondary signal**.

If it is unstable, slow or produces significant false positives, remove it from the Round 1 path.

Never make passive PAD the only reason an applicant is blocked.

## 8. Detect replay attempts through layered evidence

Do not claim to have a magical “replay detector.”

Use multiple independent signals:
- randomized active-liveness,
- natural facial motion over time,
- temporal consistency,
- optional passive PAD score,
- camera/framing continuity.

A fixed blink challenge alone is weak because a prerecorded blinking video may pass it.

## 9. Do not use gaze direction as proof of cheating

Eye direction is highly ambiguous.

The applicant may naturally:
- look at a road-sign image,
- scan answer options,
- look briefly away while thinking,
- glance toward the timer or keyboard.

If eye information is used at all, prefer using it for:
- liveness,
- accessibility,
- interface feedback.

Do not classify ordinary gaze movement as misconduct.

Likewise, do not rush into heavy phone/object detection for Round 1 unless later evidence shows a clear need.

## 10. Keep healthy monitoring almost invisible

During a healthy exam, show only a quiet status such as:

**Test health ✓**

Do not permanently display:
- webcam boxes,
- AI confidence values,
- face rectangles,
- “AI proctor active” banners,
- raw integrity telemetry.

Reveal the camera preview only when the applicant needs to correct something.

Example:

**Your face has moved out of view**

Please return to the centre.

**Your saved answers are safe.**

When the condition is corrected, return to the calm exam interface.

## 11. Page visibility is an observation, not proof of cheating

Where the browser permits it, record page visibility changes such as:
- tab hidden,
- window minimized,
- app/background transition.

Treat these as contextual integrity observations.

Do not claim that a browser can fully prevent:
- app switching,
- screenshots,
- overlays,
- OS-level tampering.

Those controls belong to production lockdown/native tooling rather than an ordinary web page.

## 12. Camera + integrity event vocabulary

Prefer neutral structured events such as:
- `CAMERA_STREAM_INTERRUPTED`
- `CAMERA_STREAM_ENDED`
- `FACE_ABSENT_SHORT`
- `FACE_ABSENT_PERSISTENT`
- `FACE_OUT_OF_FRAME`
- `MULTIPLE_FACES_PERSISTENT`
- `LIVENESS_CHALLENGE_STARTED`
- `LIVENESS_CHALLENGE_PASSED`
- `LIVENESS_RECHECK_REQUIRED`
- `PAGE_VISIBILITY_CHANGED`
- `AUDIO_VISUAL_MISMATCH_OBSERVED`
- `PASSIVE_PAD_UNCERTAIN`

Do not create events such as `CHEATING_DETECTED` from these raw signals.

## Recommended Round 1 camera stack

**Definitely use**
- existing `@mediapipe/tasks-vision`,
- real `getUserMedia` camera stream,
- stream-health detection,
- face count,
- framing,
- lighting,
- temporal smoothing,
- randomized head-turn challenge,
- multiple-face / absence handling,
- camera + microphone correlation,
- page-visibility observations,
- deterministic ignore / coach / pause rules.

**Use if stable**
- MediaPipe blendshapes for blink and mouth/jaw movement.

**Experimental only after the main build is frozen**
- lightweight passive anti-spoof / PAD via MiniFASNet-style ONNX model in-browser.

**Do not add for Round 1**
- cloud live-video analysis,
- continuous video recording,
- automatic cheating verdicts,
- gaze-based guilt,
- heavy generic object detection,
- full production biometric identity matching,
- claims of deepfake-proof or SmartLock-equivalent security.

## Camera privacy rule

Where the implementation actually behaves this way, explain clearly:

> Camera analysis runs on this device for the prototype. LicenceFlow derives readiness and integrity signals from the live feed and does not continuously store the raw webcam video.

## System architecture

Camera
→ stream health
→ MediaPipe face analysis
→ temporal signal engine
→ active liveness
→ optional experimental passive PAD

Microphone
→ Web Audio health
→ optional local VAD

Browser
→ page visibility
→ network state
→ local persistence

All signals
→ deterministic policy layer
→ **ignore / coach / pause**
→ never automatic guilt.


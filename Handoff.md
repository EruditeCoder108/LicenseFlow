\# LICENCEFLOW — PROJECT HANDOFF FOR CODEX



\## 1. What we are building



We are building \*\*LicenceFlow\*\*, a failure-safe redesign of the Indian online Learner's Licence application and test journey.



This is being built for the \*\*Build What Moves India\*\* hackathon.



The central product thesis is:



> \*\*Technical failure should never become citizen failure.\*\*



The project is NOT simply a prettier version of Sarathi/Parivahan.



It specifically addresses the failure path of an online public-service transaction:



\*\*application → payment → device/proctoring/test problem → citizen cannot complete service → confusing recovery / possible additional cost / abandonment\*\*



LicenceFlow redesigns the journey so technical problems are detected before payment where possible, transactions are durable and resumable, and system failures do not automatically consume the citizen's attempt or money.



\---



\# 2. Hackathon context



\## Build What Moves India



The hackathon is an independent builder initiative presented by \*\*Varun Mayya\*\*, in partnership with \*\*OpenAI\*\*.



It is focused on improving Indian public-service digital experiences.



It is NOT an official Government of India hackathon and the project must NOT imply government endorsement or partnership.



\### Submission deadline



\*\*August 28, 2026 — 8:00 PM IST\*\*



No grace period.



Target an internal submission deadline of \*\*August 27 evening\*\* so there is a safety buffer.



\---



\# 3. What the hackathon wants



The official challenge is essentially:



> Pick one real problem you have faced on an Indian public-service website or digital service and build a simpler, clearer and more useful way to solve it.



The prototype must:



\* solve one clearly defined citizen problem;

\* provide a complete main journey from beginning to end;

\* actually work, rather than being a static design;

\* be easier to understand than the current experience;

\* work well for Indian users;

\* consider mobile devices;

\* consider slow connections;

\* consider users with limited digital experience;

\* use mock/synthetic data where Aadhaar, OTP, payment, government accounts or private government systems would otherwise be required;

\* use Codex meaningfully during development;

\* use an OpenAI model where appropriate;

\* clearly disclose what is real and what is mocked.



Reviewers will primarily test the \*\*citizen-facing experience\*\*, not an admin dashboard.



Do not waste time building an elaborate admin panel.



\---



\# 4. Required submission



The final submission requires:



\### Public web application



A live public URL.



It must open without requesting access.



Reviewers will NOT install an APK.



Therefore LicenceFlow must be a responsive web application/PWA.



\### Video



Maximum:



\*\*2 minutes\*\*



Suggested structure:



\*\*0:00–0:06\*\*

Personal problem.



\*\*0:06–0:58\*\*

Citizen journey through LicenceFlow.



\*\*0:58–1:40\*\*

Architecture + Codex + product decisions.



\*\*1:40–1:56\*\*

What is mocked, limitations, production integration path.



\*\*1:56–2:00\*\*

Closing proposition.



Target approximately \*\*1:55–1:58\*\*, not exactly 2:00.



\### Project summary



Maximum:



\*\*250 words\*\*



\### Main judging dimensions



1\. Problem

2\. Working build

3\. Usability

4\. Product thinking

5\. End-to-end thinking

6\. Honesty about mocks/limitations



\---



\# 5. The real personal incident



This part must remain authentic.



Do NOT invent a date, duration or extra details.



The actual experience was approximately:



> I was trying to obtain a Learner's Licence online. I completed the application and paid roughly ₹250. When I reached the online test, a prompt/window appeared that the system said needed to be closed before the test could begin. But the UI did not provide a usable close button / the window could not be dismissed. Because it could not be closed, the test never started. I could not finish the licence process and the money I had already paid was effectively wasted.



That is the origin of LicenceFlow.



The project should open with this story.



The important part is not merely that the interface looked bad.



The important failure was:



\*\*money had already been committed before the citizen discovered that the digital examination environment could not successfully complete the transaction.\*\*



\---



\# 6. Problem statement



A citizen should not lose money, an attempt, or an application because:



\* a popup was blocked;

\* an exam window failed to open;

\* camera permission failed;

\* face authentication stalled;

\* the proctoring handshake failed;

\* browser/device compatibility was poor;

\* internet temporarily disconnected;

\* the exam client crashed;

\* proctoring software incorrectly interpreted a technical event as misconduct.



Current public-service systems are commonly optimized around the happy path.



LicenceFlow asks:



> \*\*What would the Learner's Licence journey look like if the system assumed networks, devices, browsers and software occasionally fail?\*\*



\---



\# 7. Research findings



We researched the current Indian Learner's Licence/Sarathi environment rather than assuming the user's old incident still represented the system.



\## Finding 1 — the service really is meant to be digital



In Madhya Pradesh, the government currently presents the Learner's Licence process as a largely online journey involving:



\* application;

\* Aadhaar/e-KYC where supported;

\* fee payment;

\* online Learner's Licence test;

\* licence issuance/download after passing.



Therefore this is not redesigning an obsolete service.



\---



\# 8. Finding 2 — technical examination/proctoring dependencies are real



Government/NIC documentation around remote Learner's Licence testing describes systems using things such as:



\* webcam monitoring;

\* screen monitoring;

\* AI-assisted proctoring;

\* face authentication;

\* a local/proctoring client or handshake in applicable deployments.



Documentation explicitly describes situations where the examination cannot begin unless the required connection/handshake between the client and examination web application succeeds.



Madhya Pradesh has been among the states using remote/proctored LL testing approaches.



This makes the original personal failure technically plausible and part of a broader failure class.



\---



\# 9. Finding 3 — similar problems still occur in 2026



Recent public complaints and user reports show that the underlying problem has NOT disappeared.



Examples researched during 2026 included users reporting:



\* LL test terminating after only a few questions;

\* face authentication remaining stuck for long periods;

\* webcam/blink detection errors;

\* SmartLock/proctoring difficulties;

\* having to try multiple computers;

\* an examination crash after starting;

\* passing the test but later seeing generic \*\*“LL Test Violations found”\*\*;

\* repeating the process and paying again after ambiguous rejection;

\* inability to understand exactly which alleged violation caused rejection;

\* proctoring software interacting badly with the user's computer environment.



We should NOT claim these anecdotal reports prove the entire Sarathi platform is unreliable.



The defensible statement is:



> Sarathi successfully handles large numbers of transactions, but the minority of citizens who hit technical or proctoring failures can face disproportionately poor recovery experiences.



That is the problem LicenceFlow solves.



\---



\# 10. Finding 4 — generic licence assistance is already crowded



We researched whether someone had already solved this problem.



Existing alternatives include:



\* Sarathi/Parivahan itself;

\* government FAQs;

\* LL mock-test websites;

\* YouTube tutorials;

\* private RTO agents;

\* private licence-application assistance;

\* generic government-service AI assistants;

\* websites explaining common Sarathi errors.



Therefore DO NOT build:



> “AI chatbot that tells you how to get a licence.”



Also do NOT build:



> “A guide explaining the steps required to get an LL.”



Also do NOT build:



> “A nicer Sarathi homepage.”



Those are weak and already covered.



\---



\# 11. Our competitive whitespace



The opportunity that remained relatively underserved was the combination of:



\*\*device qualification before payment\*\*



\*



\*\*realistic exam rehearsal\*\*



\*



\*\*durable transaction state\*\*



\*



\*\*technical-failure recovery\*\*



\*



\*\*clear separation between system failure and citizen misconduct\*\*



\*



\*\*plain-language multilingual troubleshooting\*\*



This is LicenceFlow.



\---



\# 12. Product principle #1 — Preflight Before Payment



The current conceptual ordering can make citizens discover technical incompatibility too late.



LicenceFlow reverses this.



Before payment, run a:



\# Device Readiness Check



Possible tests:



\### Camera



\* permission available;

\* camera initializes;

\* face visible;

\* lighting sufficient.



\### Browser



\* supported browser;

\* JavaScript available;

\* popup/window behavior works;

\* local storage available.



\### Network



\* connection available;

\* latency reasonable;

\* short stability test.



\### Examination environment



\* test window can launch;

\* fullscreen capability where relevant;

\* simulated proctor handshake succeeds;

\* focus-change behavior works.



\### Microphone



Only include if relevant to our simulated workflow.



Results should look like:



\*\*Camera\*\*

✓ Working



\*\*Face visibility\*\*

✓ Good



\*\*Internet\*\*

✓ Stable



\*\*Browser\*\*

✓ Compatible



\*\*Exam window\*\*

✕ Popup blocked



Then:



> \*\*Your test may not start on this device.\*\*

>

> Your application is safe and you have not paid yet.



CTA:



\*\*Fix issue\*\*



After fixing:



\*\*Run again\*\*



\---



\# 13. Product principle #2 — realistic rehearsal



After preflight succeeds:



\# 30-second Practice Test



This should launch using essentially the same frontend mechanisms as the actual simulated exam.



The citizen experiences:



\* camera preview;

\* countdown;

\* exam window;

\* question selection;

\* next-question flow;

\* fullscreen/proctoring indicator;

\* connection indicator.



The point is NOT to teach driving questions.



The point is to prove:



> \*\*If this rehearsal works, the device is likely capable of completing the examination experience.\*\*



After rehearsal:



> \*\*Your device is ready for the Learner's Licence test.\*\*



Then:



\*\*Continue to payment\*\*



\---



\# 14. Product principle #3 — durable transaction state



LicenceFlow should behave like a transaction, not a sequence of fragile webpages.



At all times the system knows exactly what has already been completed.



Possible journey receipt:



\# Your Learner's Licence journey



Application

✓ Completed



Identity verification

✓ Completed



Documents

✓ Completed



Device readiness

✓ Passed



Practice examination

✓ Passed



Payment

✓ ₹250 demo payment



LL Test

⚠ Interrupted



Cause

Technical network interruption



Attempt consumed

\*\*No\*\*



Additional payment required

\*\*₹0\*\*



Next step

\*\*Resume test\*\*



This “Journey Receipt” is one of the product's strongest differentiators.



\---



\# 15. Product principle #4 — failure-safe examination



During the simulated real test:



Question 7/15.



Network disconnects.



Do NOT show:



> Exam failed.



Instead:



\# Connection lost



Your examination has been paused safely.



Answers saved through Question 7.



\*\*This technical interruption will not consume your attempt.\*\*



Reconnecting…



Then:



\# Connection restored



\*\*Resume from Question 8\*\*



For the hackathon demo, this failure must be deterministic and reproducible.



Include a hidden or clearly labeled \*\*Demo Controls / Simulate Issue\*\* mechanism.



Example:



\*\*Simulate issue\*\*



\* Network interruption

\* Camera unavailable

\* Popup blocked

\* Face-auth timeout



Judges should not need an actual network outage to test our feature.



\---



\# 16. Product principle #5 — technical failure is not cheating



Do not propose eliminating proctoring.



Identity and exam integrity are legitimate government requirements.



Instead distinguish:



\### Technical event



Example:



Camera disconnected for 4 seconds while the browser reported a device disconnect.



Possible result:



> Technical interruption detected.

>

> Reconnect camera.



\### Suspicious event



Example:



Repeated person substitution / prolonged face absence.



Possible result:



> Examination requires review.



Do NOT let AI automatically decide:



\*\*CHEATER\*\*



Do NOT let an LLM decide licence eligibility.



Where human review would be appropriate, say so.



\---



\# 17. Memorable product line



The core sentence for this project is:



> \*\*Technical failure should never become citizen failure.\*\*



A secondary framing:



> Government services should be designed for the failure path, not only the happy path.



\---



\# 18. Suggested end-to-end citizen journey



The prototype should support one polished primary journey.



\## Screen 1 — Landing



LicenceFlow



\*\*A safer way to complete your Learner's Licence journey\*\*



Buttons:



\*\*Start application\*\*



\*\*Try demo journey\*\*



Disclosures should be visible but not overwhelming:



> Independent prototype. Not an official government service.



\---



\## Screen 2 — Synthetic applicant



Use entirely fake data.



Example:



Name

Aarav Sharma



State

Madhya Pradesh



Application number

MP-LL-DEMO-260822



Vehicle category

LMV + MCWG



No real Aadhaar/PAN/phone number.



\---



\## Screen 3 — identity



Simulated Aadhaar/e-KYC.



Clearly label:



\*\*Demo identity verification\*\*



Show successful verification.



\---



\## Screen 4 — application details



Minimal LL application form.



Do not reproduce every real government field.



Only enough information to establish a believable journey.



\---



\## Screen 5 — Device Readiness Lab



This is a hero feature.



Run real browser-level checks where safely possible.



Examples that can actually be real:



\* camera API availability;

\* permission status;

\* popup test;

\* viewport;

\* browser;

\* online status;

\* connection speed approximation;

\* local storage;

\* fullscreen API.



Clearly distinguish:



\*\*Real device check\*\*



versus:



\*\*Simulated government-proctor compatibility\*\*



\---



\## Screen 6 — deliberately detected problem



Best primary demo:



\*\*Exam window / popup blocked\*\*



This mirrors the original personal incident.



Show:



> We found a problem that could prevent your LL test from starting.



Then specific instructions.



The reviewer fixes or chooses:



\*\*Simulate fixed\*\*



Recheck.



All green.



\---



\## Screen 7 — practice exam



Run a short rehearsal.



Finish successfully.



\---



\## Screen 8 — mock payment



₹250 or another clearly synthetic fee amount.



Use:



\*\*DEMO PAYMENT\*\*



Never process real payment.



After payment:



> Payment secured

> Your application progress is saved.



\---



\## Screen 9 — real simulated LL test



Approximately 10–15 questions.



Question UI should be polished and believable.



Include indicators such as:



Camera ●



Connection ●



Exam state ●



\---



\## Screen 10 — simulated failure



At question 7 or 8:



\*\*Simulate Network Failure\*\*



The exam pauses.



Progress is preserved.



The app classifies it as:



`NETWORK\_INTERRUPTION`



Then:



\*\*Resume test\*\*



\---



\## Screen 11 — completion



User passes.



Display:



\# You passed



Score:

13 / 15



Then:



\*\*Learner's Licence ready\*\*



Generate a clearly synthetic demo licence card/document.



Watermark:



\*\*DEMO — NOT VALID\*\*



\---



\## Screen 12 — journey receipt



Final state:



Application ✓

Device test ✓

Payment ✓

Test ✓

Licence issued ✓



No personal data.



\---



\# 19. Alternative recovery scenario



A second demo/test scenario can exist without becoming the main video.



Example:



\## Face authentication timeout



Citizen says:



> “Camera chal raha hai but face authenticate hi nahi ho raha.”



OpenAI converts it into:



```text

issue\_type: FACE\_AUTH\_TIMEOUT

camera\_status: WORKING

authentication\_status: STUCK

language: HINGLISH

```



System then presents deterministic troubleshooting.



This makes the OpenAI integration meaningful.



\---



\# 20. OpenAI's role



Do NOT add a generic chatbot just so the project contains AI.



The model should solve ambiguity.



Possible user input:



> “Payment ho gaya but test khul hi nahi raha.”



Model extracts:



```text

payment\_status: PAID

test\_status: NOT\_STARTED

probable\_issue: EXAM\_WINDOW\_FAILED

```



Another:



> “कैमरा चल रहा है लेकिन face verify नहीं हो रहा।”



Model extracts:



```text

camera\_status: WORKING

probable\_issue: FACE\_AUTH\_TIMEOUT

```



Another:



> “Test बीच में बंद हो गया और net चला गया था.”



Model extracts:



```text

probable\_issue: NETWORK\_INTERRUPTION

test\_started: TRUE

```



Then deterministic application logic chooses recovery actions.



\### AI is appropriate for:



\* Hindi/English/Hinglish understanding;

\* symptom extraction;

\* troubleshooting explanations;

\* translating technical errors into simple language;

\* explaining next steps.



\### AI is NOT responsible for:



\* deciding if someone cheated;

\* approving a licence;

\* determining legal identity;

\* making government decisions;

\* determining whether a fee legally must be refunded.



Those should be deterministic, mocked, or explicitly left to an official authority.



\---



\# 21. Suggested internal issue taxonomy



Use structured reason codes.



```text

POPUP\_BLOCKED

EXAM\_WINDOW\_FAILED

CAMERA\_PERMISSION\_DENIED

CAMERA\_UNAVAILABLE

FACE\_NOT\_VISIBLE

POOR\_LIGHTING

FACE\_AUTH\_TIMEOUT

PROCTOR\_HANDSHAKE\_FAILED

NETWORK\_INTERRUPTION

EXAM\_CLIENT\_CRASH

PROCTORING\_WARNING

POSSIBLE\_VIOLATION

USER\_TEST\_FAILURE

SYSTEM\_FAILURE

```



Each should map to:



```text

code

category

user\_message\_en

user\_message\_hi

technical\_description

recoverable

attempt\_consumed

payment\_required

next\_action

```



\---



\# 22. Suggested transaction state machine



Implement the citizen journey as an actual state machine.



```text

APPLICATION\_STARTED

&#x20;       ↓

IDENTITY\_VERIFIED

&#x20;       ↓

APPLICATION\_COMPLETED

&#x20;       ↓

DEVICE\_PREFLIGHT

&#x20;    ↙        ↘

FAILED       PASSED

&#x20; ↓            ↓

FIX\_ISSUE   PRACTICE\_TEST

&#x20;              ↓

&#x20;       PRACTICE\_PASSED

&#x20;              ↓

&#x20;           PAYMENT

&#x20;              ↓

&#x20;         PAYMENT\_SUCCESS

&#x20;              ↓

&#x20;          EXAM\_READY

&#x20;              ↓

&#x20;       EXAM\_IN\_PROGRESS

&#x20;      ↙       ↓        ↘

&#x20;TECH\_FAIL    PASS    REVIEW

&#x20;   ↓          ↓         ↓

&#x20;RECOVER    LL\_ISSUED  DECISION

&#x20;   ↓

&#x20;RESUME

&#x20;   ↓

EXAM\_IN\_PROGRESS

```



The backend should preserve event history.



Example:



```text

09:42 APPLICATION\_STARTED

09:44 IDENTITY\_VERIFIED

09:47 PREFLIGHT\_FAILED: POPUP\_BLOCKED

09:49 PREFLIGHT\_PASSED

09:50 PRACTICE\_PASSED

09:52 PAYMENT\_SUCCESS

09:54 EXAM\_STARTED

09:57 NETWORK\_INTERRUPTION

09:58 EXAM\_RESUMED

10:02 EXAM\_PASSED

10:03 LL\_ISSUED

```



\---



\# 23. Data architecture



Use synthetic data only.



Suggested entities:



\## Applicant



```text

id

name

state

language

vehicle\_classes

```



\## Application



```text

id

applicant\_id

status

created\_at

payment\_status

exam\_status

```



\## PreflightRun



```text

id

application\_id

camera\_status

browser\_status

network\_status

popup\_status

storage\_status

proctor\_handshake\_simulated

overall\_status

```



\## ExamSession



```text

id

application\_id

status

current\_question

answers

score

started\_at

last\_checkpoint

```



\## SystemEvent



```text

id

exam\_session\_id

event\_type

timestamp

metadata

classification

```



\## JourneyState



```text

application\_id

current\_stage

last\_safe\_checkpoint

resume\_available

```



\---



\# 24. Real versus mocked architecture



The submission must be extremely honest.



\## Can be real



\* responsive frontend;

\* browser camera access;

\* popup detection;

\* network status;

\* basic connection tests;

\* practice test;

\* LL test engine;

\* checkpoints;

\* persistent state;

\* failure simulation;

\* Hindi/English UI;

\* OpenAI language understanding;

\* deterministic recovery engine.



\## Must be mocked/simulated



\* Aadhaar authentication;

\* actual Sarathi login;

\* government database access;

\* government API calls;

\* official payment;

\* SmartLock/MoRTH integration;

\* official proctoring decision;

\* official learner licence issuance;

\* real applicant records.



Clearly label them.



Suggested global disclosure:



> \*\*LicenceFlow is an independent hackathon prototype. It is not affiliated with or endorsed by the Government of India, MoRTH, NIC, Sarathi or any state transport department. All identities, payments, applications and licence records shown in this demo are synthetic.\*\*



\---



\# 25. Do NOT do these things



Do not:



\* access live government systems;

\* automate against Sarathi;

\* scrape restricted data;

\* reverse-engineer SmartLock;

\* test vulnerabilities;

\* use undocumented private APIs;

\* enter real Aadhaar numbers;

\* enter real PAN;

\* collect passwords;

\* collect OTPs;

\* collect real payment data;

\* imitate the Government of India logo in a way implying endorsement;

\* present LicenceFlow as an official government product;

\* claim we have a government API integration that we do not have;

\* use real citizen records.



\---



\# 26. Visual/product direction



Design for:



\* mobile first;

\* clear typography;

\* strong accessibility;

\* large tap targets;

\* plain language;

\* low cognitive load;

\* usable on slow connections.



Avoid an overdone futuristic AI aesthetic.



This is a public-service experience.



It should feel:



\*\*calm, trustworthy, modern, simple and resilient.\*\*



Potential visual language:



\* white/off-white background;

\* dark text;

\* restrained green/blue status indicators;

\* simple cards;

\* large status labels;

\* clear progress stepper;

\* minimal animation;

\* accessible contrast.



The user should never wonder:



> “What am I supposed to do now?”



Every state should have one dominant next action.



\---



\# 27. Languages



At minimum:



\*\*English\*\*



\*\*हिन्दी\*\*



The OpenAI troubleshooting input should understand Hinglish.



Examples:



> “test start nahi ho raha”



> “camera working hai but face verify nahi ho raha”



> “payment ho gaya but exam open nahi hua”



Use simple Hindi rather than bureaucratic translation.



\---



\# 28. Slow-connection design



This is directly relevant to the judging criteria.



Important:



\* minimize initial bundle;

\* optimize assets;

\* avoid video backgrounds;

\* lazy load unnecessary components;

\* checkpoint exam state frequently;

\* preserve answers locally;

\* expose connection state;

\* retry gracefully;

\* allow resume after refresh;

\* ensure basic interface remains usable on throttled mobile network.



We should test Chrome DevTools throttling before submission.



\---



\# 29. The most important demo



The two-minute video should NOT show every feature.



Show one story extremely clearly.



\## Demo script concept



\### Opening



> “I paid for my Learner's Licence online. When I reached the test, a broken exam window meant I couldn't start it. There was no safe recovery path.”



Immediately open LicenceFlow.



\### Citizen journey



Applicant already filled enough information.



Reach:



\*\*Device Readiness\*\*



LicenceFlow finds:



\*\*Exam window — Failed\*\*



Explain:



> “This is the problem that originally cost me the transaction. LicenceFlow catches it before payment.”



Fix/simulate fix.



Recheck.



Everything passes.



Run extremely short rehearsal.



Mock payment.



Begin LL test.



At approximately Question 7:



simulate network interruption.



Show:



> \*\*Test paused safely. Your attempt has not been consumed.\*\*



Reconnect.



Resume.



Pass.



Show synthetic LL.



This is the complete citizen journey.



\---



\# 30. Architecture slide for the video



Keep architecture visually simple.



Possible diagram:



```text

Citizen

&#x20;  ↓

Responsive LicenceFlow Web App

&#x20;  ↓

────────────────────────────

Device Readiness Engine

Transaction State Machine

Exam + Checkpoint Engine

Failure Classification

────────────────────────────

&#x20;      ↓             ↓

&#x20;OpenAI Model    Rules Engine

&#x20;Hindi/Hinglish   Recovery logic

&#x20;understanding

&#x20;      ↓             ↓

────────────────────────────

&#x20;  MOCK GOVERNMENT LAYER

────────────────────────────

Aadhaar | Payment | Sarathi

Proctoring | LL issuance

```



Use labels:



\*\*REAL\*\*



and



\*\*SIMULATED\*\*



in the diagram.



\---



\# 31. Codex story



Codex needs to be genuinely involved in development because that is a hackathon requirement.



During development, maintain evidence of Codex being used for things such as:



\* initial architecture;

\* state-machine design;

\* frontend implementation;

\* device preflight utilities;

\* test/checkpoint logic;

\* persistence;

\* OpenAI structured-output integration;

\* accessibility improvements;

\* localization;

\* tests;

\* debugging;

\* performance optimization;

\* deployment configuration.



Maintain a simple file such as:



```text

/docs/build-log.md

```



Record important Codex-driven development decisions there.



This will make the second minute of the submission video easier to produce.



Do NOT manufacture fake activity.



Record genuine milestones during development.



\---



\# 32. Five-day implementation strategy



\## Day 1 — complete skeleton



Goal:



A deployed URL and complete route structure.



Build:



\* project scaffold;

\* mobile shell;

\* state-machine foundation;

\* synthetic applicant;

\* all major screens;

\* deployment;

\* persistent local/demo state.



The whole journey may be ugly, but every screen should exist.



\---



\## Day 2 — complete citizen journey



Implement:



\* application;

\* preflight;

\* practice;

\* mock payment;

\* exam;

\* checkpointing;

\* failure/recovery;

\* pass;

\* synthetic LL;

\* journey receipt.



Hardcoded synthetic data is acceptable.



Completeness > polish.



\---



\## Day 3 — intelligence + resilience



Implement:



\* OpenAI troubleshooting;

\* Hindi/Hinglish;

\* deterministic issue classification;

\* resilient storage;

\* refresh/resume;

\* network failure simulation;

\* camera/popup checks;

\* mock proctor states.



Do NOT spend Day 3 adding random AI features.



\---



\## Day 4 — polish



Focus on:



\* mobile experience;

\* typography;

\* accessibility;

\* animations only where useful;

\* performance;

\* slow-network testing;

\* honesty/disclosure;

\* architecture view;

\* comparison with current failure flow;

\* bug fixing.



Test on an actual phone.



Test over mobile data if possible.



\---



\## Day 5 — submission



\* lock features;

\* run full QA;

\* test deployment in incognito;

\* test on phone;

\* test refresh/resume;

\* test every Demo Mode failure;

\* record video;

\* edit video;

\* finalize 250-word summary;

\* submit early.



Do not introduce major new functionality on the final day.



\---



\# 33. Definition of Done



LicenceFlow is ready to submit when a reviewer can:



1\. Open the URL without authentication.

2\. Start a demo application.

3\. Complete synthetic identity.

4\. Run device preflight.

5\. Encounter a reproducible compatibility failure.

6\. Fix/retry it.

7\. Pass a short rehearsal.

8\. Make a fake payment.

9\. Start the LL examination.

10\. Experience a simulated technical interruption.

11\. Resume without losing progress.

12\. Finish the examination.

13\. Receive a clearly synthetic Learner's Licence.

14\. See a complete Journey Receipt.

15\. Understand what parts are real versus mocked.



No explanation from the developer should be required for this journey to make sense.



\---



\# 34. Success criterion



The judge should understand the idea in approximately 15 seconds:



> Existing journey:

>

> \*\*Pay → discover technical problem → fail → figure out recovery yourself\*\*

>

> LicenceFlow:

>

> \*\*Check → rehearse → pay → checkpoint → recover → complete\*\*



That before/after is the product.



\---



\# 35. Scope discipline



Do NOT expand LicenceFlow into:



\* permanent driving licence;

\* vehicle registration;

\* insurance;

\* challans;

\* every Parivahan service;

\* generic government assistant;

\* an RTO super-app.



Focus entirely on:



\# Learner's Licence application + online test failure recovery



The larger vision can be mentioned only at the end:



> The same failure-safe transaction architecture could later be applied to other digital public services involving payments, identity verification, examinations or irreversible application steps.



But the prototype itself should remain tightly scoped.



\---



\# 36. Current strategic conclusion



After researching several alternatives including:



\* EPFO claim assistance;

\* railway refund/TDR assistance;

\* e-challan disputes;

\* government deadline/escalation tools;

\* generic public-service AI;



LicenceFlow was selected because it combines:



\* a genuine firsthand user problem;

\* evidence that similar technical failures still occur;

\* relatively low direct product competition;

\* a highly understandable before/after;

\* excellent two-minute demo potential;

\* meaningful backend/state-machine work;

\* an appropriate role for OpenAI;

\* a strong role for Codex;

\* clear mobile/accessibility considerations;

\* a realistic scope for the remaining hackathon period.



Proceed with \*\*LicenceFlow\*\* as the primary project.



Do not reopen broad ideation unless research uncovers a fundamental blocker.



The next task is to turn this handoff into an implementation plan and start building the end-to-end skeleton immediately.




# LicenceFlow: Madhya Pradesh Learner’s Licence and SmartLock Research Freeze

## Executive conclusion

The final research pass changes one important assumption in the proposed specification: **“mobile is officially unsupported” cannot currently be stated as a confirmed Madhya Pradesh rule.** A Madhya Pradesh government district service page, last updated **6 August 2026**, expressly tells citizens that the learner-licence online service can be used through a **computer, mobile, or online kiosk** and describes the Aadhaar e-KYC path as including online application, online fee payment, online test, and immediate licence download after passing. citeturn34view0

At the same time, NIC’s official **PBOX** proctoring product documents a security architecture built around a **SmartLock application installed on the candidate machine**, not merely a web page. SmartLock takes control of the examination environment, including screen locking and application/system controls; PBOX also performs face recognition and automated proctoring and allows proctors to act on detected violations. citeturn3search0turn36search0 That architecture strongly supports LicenceFlow’s engineering thesis that **a browser-only experience cannot reproduce production-grade lockdown**, but I found **no current MoRTH, Parivahan, NIC, or Madhya Pradesh publication saying, in explicit terms, that Madhya Pradesh mobile LL testing is disabled because phones cannot prevent app switching, screenshots, overlays, or tampering**.

There is therefore a crucial distinction for the freeze:

> **Confirmed:** production proctoring depends on controls that go beyond ordinary browser capabilities.  
> **Not confirmed:** Madhya Pradesh currently has an official blanket rule that the LL test cannot be taken on a phone.

The browser limitation itself is technically sound. The web Page Visibility standard lets a site **detect** that a document has become hidden; it does not give the site the power to prevent the user from changing apps. Browser fullscreen can also be exited by the user, and changing tabs or applications exits fullscreen. By contrast, Android exposes screenshot blocking through the native `FLAG_SECURE` window mechanism. These platform differences support treating a browser prototype as a simulation of secure-test behavior rather than an equivalent security boundary. citeturn27search1turn27search2turn27search0

The other major freeze findings are:

| Question for LicenceFlow | Research conclusion |
|---|---|
| Is an online LL knowledge test required? | **Yes.** Parivahan identifies the online learner test as STALL, and the Motor Vehicles framework requires the prescribed preliminary knowledge test unless an exemption applies. citeturn26search4turn38search10 |
| Can MP applicants complete the journey online? | **Yes, according to current MP government guidance**, particularly through Aadhaar e-KYC; the same page also describes a non-e-KYC upload-and-verification route. citeturn34view0 |
| Is “15 questions” an official MP requirement? | **Not verified.** No current official MP/MoRTH/Parivahan document located in this pass specifies 15 questions for the live Madhya Pradesh session. |
| Is a 60% pass mark officially confirmed for MP? | **Not verified from an authoritative current MP source in this pass.** Do not hard-code it as an official MP rule merely because commercial LL-test sites report it. |
| Is SmartLock architecture real and official? | **Yes, at NIC PBOX level.** It is an installed lockdown component paired with browser/web examination functionality. citeturn3search0turn35search0 |
| Is PBOX available to an independent private LicenceFlow deployment? | **No, not as an ordinary private customer.** NIC’s PBOX FAQ says it currently serves PSUs and government bodies, not private agencies. citeturn35search0 |
| What happens after LL-test failure? | **Pay the retest fee and take/book a fresh test appointment according to the Sarathi workflow.** citeturn38search2turn38search3turn38search6 |
| Is there an official 7-day LL-test retry delay? | **Not established.** The public learner-licence FAQ does not impose one. The commonly cited seven-day rule belongs to the practical driving test context and should not be imported into LL testing. |
| Can an interrupted exam automatically be treated as failed? | **Do not assume that.** Parivahan tells users whose learner exam stops because of an error to report it to the concerned RTO/examination authority. citeturn38search0turn38search4 |
| Are official violation-screen texts publicly specified? | **No complete authoritative catalogue was located.** The underlying violation/pause/termination behaviors are documented, but exact production copy is not. citeturn36search0 |
| Is webcam/face-data retention publicly specified? | **Not specifically enough.** Sarathi publishes retention periods for LL test history, Aadhaar-authentication logs, images and other records, but I found no official public retention schedule specifically identifying SmartLock/PBOX webcam frames, audio, liveness artifacts, or face templates. citeturn31view0turn33view1 |

**Freeze recommendation:** LicenceFlow can now safely freeze the *journey and recovery architecture*, but it should keep **four production-dependent configuration points** deliberately unfrozen: live question count, live pass threshold, retry waiting period, and whether a particular MP Sarathi test session permits mobile. None should be represented to users as an MP statutory fact until supplied by the live government service or an authoritative integration contract.

## Madhya Pradesh journey and test requirements

### What the present MP service actually says

The strongest current Madhya Pradesh-specific source located is the Government of Madhya Pradesh/District Dhar citizen-service page. It was last updated on **6 August 2026**, making it unusually useful for checking the present digital journey. It says the learner-licence service can be used through a **computer, mobile, or online kiosk**. For applicants using Aadhaar e-KYC, it describes a fully online sequence: application, payment, online test, and, on passing, immediate online licence download. citeturn34view0

It also describes a second route for applicants who cannot use Aadhaar e-KYC. They upload their **documents, photograph and signature**; the Transport Department verifies those items online; once accepted, the applicant can proceed to the fee and online-test stages and subsequently download the learner licence online. citeturn34view0

That is an excellent fit for LicenceFlow’s top-level experience model:

**application → identity/document route → verification → payment → test → result → LL download.** citeturn34view0

However, the MP page is citizen-level guidance rather than a technical STALL specification. It does **not** disclose the proctoring configuration, exact browser/device matrix, number of questions, timer, pass threshold, warning thresholds or SmartLock version. citeturn34view0

Parivahan separately describes the online test as **“Online Learners’ License Test (STALL)”** and directs applicants through Sarathi to the state-specific learner-licence test flow. It also explicitly says that a learner’s licence requires passing the STALL test where that service is applicable. citeturn26search0turn26search4

### What the test legally covers

The official Form 2 implementation of the Central Motor Vehicles Rules records the Rule 11 preliminary test as checking adequate knowledge and understanding of matters including:

traffic signs and signals, the driver’s duties when involved in an accident, and documents that must be carried while driving. The form records the result as **Pass / Fail / Absent / Exempted**. citeturn38search10

That gives LicenceFlow a defensible content taxonomy for practice and explanation. The official Parivahan STALL question bank can supply the research base for practice content rather than commercial “RTO test” websites. citeturn26search2turn38search7

What it **does not** give you is a statutory 15-question interface. The official materials located here establish the subject matter and the requirement to pass, but not a Madhya Pradesh-specific “15 questions, X seconds each, Y correct” configuration. citeturn38search10turn26search2

Accordingly, the LicenceFlow copy should say something like:

> **Practice simulation — 15 questions**  
> Designed to familiarise you with the type of learner-licence knowledge test. The number of questions, timing and pass requirement in the official test may be configured by the Transport Department.

It should **not** say:

> “The Madhya Pradesh learner test has exactly 15 questions”

until that is confirmed through the current MP production service or department documentation.

### The Aadhaar and biometric distinction matters

The MP page confirms **Aadhaar e-KYC** as an online application route. citeturn34view0 That should not be conflated with SmartLock face proctoring.

NIC’s PBOX documentation separately describes face recognition as an examination identification/authentication and proctoring mechanism. citeturn3search0 Nothing located here establishes that a SmartLock webcam face comparison in the Madhya Pradesh LL test constitutes an **Aadhaar biometric authentication transaction**. LicenceFlow should therefore model them as different concepts:

**Identity/e-KYC layer:** “Verify the application identity.”

**Exam-integrity layer:** “Confirm that the authorised test taker remains present during the test.”

This distinction will make the privacy explanation substantially clearer and avoid implying that every webcam frame is being sent to UIDAI.

## SmartLock, mobile support, and the real security boundary

### What SmartLock officially does

NIC describes PBOX as a **Proctoring Based Online eXamination** system designed for secure remote examinations. Its official material describes AI-assisted face recognition and proctoring, including checks such as multiple-person detection, absence detection, eye-related monitoring and audio/whispering indicators. citeturn3search0turn3search1

The critical component for LicenceFlow is SmartLock. NIC describes SmartLock as a lightweight application installed on the candidate machine that controls or protects the examination environment. PBOX material describes screen locking and controls aimed at preventing prohibited applications or malicious activity, with the SmartLock component operating in coordination with the web examination application rather than being merely JavaScript running inside the page. citeturn3search0turn36search1

NIC also says that the examination cannot start without SmartLock in configurations requiring it and describes the lockdown component as taking control of the system environment for examination integrity. citeturn3search0

The proctoring side is not merely passive analytics. The official PBOX site says the examination organisation can map candidates to a proctor, that the proctor can monitor **system-identified violations**, and that the proctoring workflow supports intervention against individual candidates. citeturn36search0

Finally, NIC’s public PBOX FAQ says private agencies cannot currently opt for the service; it is serving **PSUs and government bodies**. citeturn35search0 That strongly validates the boundary you already proposed for LicenceFlow: a private prototype can demonstrate the interaction model, but an authentic production deployment would need an authorised government/NIC relationship or another officially approved proctoring integration.

### The “mobile unsupported” question has to be rewritten

The most defensible result of this research is **not** “we confirmed the official reason mobile is unsupported.”

It is:

> **We confirmed why a browser-only mobile implementation cannot be security-equivalent to SmartLock, but we did not find an official MP statement making that the reason for a blanket mobile prohibition.**

In fact, current Madhya Pradesh citizen guidance expressly lists **mobile** among the ways to access the online learner-licence service. citeturn34view0

There are several plausible explanations for the apparent contradiction: “mobile” may refer to the broader application journey rather than every secure-test configuration; device support may be dynamically enforced at the test stage; MP may have changed its service after older SmartLock documentation; or different applicant/RTO configurations may receive different test modes. Those are **inferences**, not facts established by the public documentation.

LicenceFlow therefore should **not** display a blanket government-attributed message such as:

> “Madhya Pradesh does not allow the learner test on mobile because phones are insecure.”

A freeze-safe version is:

> **Secure-test device check**  
> Device requirements may differ for the official test. A production examination may require approved lockdown software and capabilities that an ordinary mobile browser cannot provide.

That statement accurately reflects the evidence. citeturn3search0turn34view0

### Why your web prototype remains technically honest

A browser can detect many useful conditions. It can request camera and microphone access, monitor connectivity, determine when its document becomes hidden, observe fullscreen changes, persist local progress, and restore a session after connectivity returns. The W3C Page Visibility API specifically provides visibility-state information to web applications. citeturn27search1

What a normal web application cannot do is turn the entire personal phone into a controlled examination device. Fullscreen is not an OS lockdown boundary: browser documentation explicitly notes that users can exit fullscreen and that changing tabs or switching to another application exits fullscreen. citeturn27search2turn27search10

Android illustrates the browser/native difference particularly clearly. Its official security documentation provides the native `FLAG_SECURE` window facility to prevent screenshots and prevent content from appearing on non-secure displays. That is an **application/window-level operating-system feature**, not a privilege ordinary web content can assert against the phone as a whole. citeturn27search0turn27search4

So LicenceFlow’s technical positioning is sound:

**Web prototype can demonstrate:** real camera permissions, microphone permissions, presence/liveness concepts, face framing, connectivity detection, offline answer buffering, tab/app-switch detection where exposed, fullscreen state, interruption recovery, warnings, and secure-looking exam interaction. citeturn27search1turn27search2

**Web prototype must not claim:** inability to switch apps, inability to screenshot, inability to run another device/app, tamper-proof liveness, guaranteed overlay suppression, operating-system integrity, or security equivalence with approved SmartLock/native lockdown.

**Production security:** requires an authorised examination architecture with platform-level controls and official back-end integration. NIC’s own product architecture demonstrates exactly why that distinction exists. citeturn3search0turn35search0

## Retests, interruptions, violations, and recovery

### Failed and missed learner tests

The current Parivahan learner-licence FAQ is clear about the core failure path: when a candidate fails the learner-licence test, the candidate must **pay the retest fee and book a fresh appointment**. The FAQ directs the user to the Sarathi fee-payment/retest flow and then to learner-test appointment booking. citeturn38search2turn38search3turn38search6

If the candidate is absent, the learner-test FAQ likewise directs the candidate to take another appointment; a missed appointment can be rescheduled subject to slot availability. citeturn38search3

The important negative finding is equally significant: the official learner-licence FAQ located in this pass does **not** say “wait seven days.” citeturn38search3

Parivahan does publish a **seven-day** retest answer elsewhere in relation to the **driving skill test**, and the Motor Vehicles framework contains separate provisions governing repeat practical driving tests. That should not be merged into the Rule 11 learner knowledge test. The numerous commercial sites that say “LL retest after 7 days” are therefore not sufficient evidence to encode a seven-day MP LL lockout.

For LicenceFlow, the correct frozen state is:

> **Not passed → Retest required → applicable retest fee → next test availability determined by official portal/state configuration.**

Do **not** render “You can retry tomorrow,” “Try again after 7 days,” “3 attempts maximum,” or “60-day lockout after three failures” as official Madhya Pradesh LL rules unless the actual Sarathi integration provides those values.

This also means the retest fee should be a **configuration/API value**, rather than an immutable number copied from an article.

### Technical interruption is not the same state as failure

Parivahan now has a particularly useful FAQ entry: when the learner’s-licence examination is stopped because of an error while taking the test, the user is instructed to report the matter to the **concerned RTO or examination authority**. citeturn38search0turn38search4

That supports a crucial LicenceFlow product principle:

> **Do not collapse “technical interruption” into “failed exam.”**

Your data model should distinguish at least:

`PASSED`  
`FAILED_KNOWLEDGE_TEST`  
`ABSENT`  
`INTERRUPTED_TECHNICAL`  
`INTERRUPTED_NETWORK`  
`CAMERA_OR_PROCTORING_HOLD`  
`TERMINATED_POLICY_VIOLATION`  
`RESULT_PENDING_REVIEW`

Only the first three correspond directly to result concepts evidenced in official LL documentation; the others are operational states needed to faithfully model proctored testing and recovery. Form 2 itself recognises **Pass / Fail / Absent / Exempted** as distinct preliminary-test outcomes. citeturn38search10

### Network failure should be recoverable

NIC’s PBOX design is explicitly **network resilient**: its published architecture is intended to let a candidate continue through temporary network loss and resynchronise examination state rather than treating every transient outage as an immediate examination failure. citeturn3search0turn36search1

That is unusually strong support for the LicenceFlow recovery concept.

A production-like prototype can therefore reasonably implement:

**Connected → degraded → temporarily offline → answers retained locally → reconnection → integrity check → answer synchronisation → continue.**

Submission should be treated more strictly than ordinary question navigation because a valid final submission must ultimately reach the examination service. This pattern is consistent with PBOX’s documented network-resilience approach. citeturn3search0turn36search1

For privacy and security, the prototype should buffer only the minimum required state—for example question identifier, selected response, timestamps and recovery metadata—and should not invent an official promise that the real MP implementation stores precisely the same fields.

### Calls and app switching

A phone call is best treated as an **interruption event**, not automatically as cheating. A browser/PWA can observe that its document became hidden or lost fullscreen, but the browser standards give it detection rather than OS-level prevention. citeturn27search1turn27search2

The freeze-safe UX is consequently:

> **Test paused — LicenceFlow lost the active exam view.**  
> Return to the test and complete the security check. Your answer progress has been preserved.

After returning, the prototype can re-check camera permission, face presence, connectivity and session integrity.

For a *real* examination, whether the same event produces a warning, automatic termination or manual review must come from the authorised proctoring policy. LicenceFlow should not invent that policy.

### Camera failures

The same principle applies to camera failure. Because proctoring relies on visual identification/presence signals, camera loss is relevant to exam integrity. NIC PBOX documents face recognition, absence detection and other camera-derived proctoring checks. citeturn3search0turn3search1

A good synthetic flow is:

> **We can’t verify your camera right now.**  
> Your test is paused. Keep this screen open while we reconnect the camera.

Then separate the diagnostic:

“Camera permission is off”  
“Camera is in use by another application”  
“No face detected”  
“More than one face detected”  
“Camera stream stopped”  
“Lighting/framing prevents verification”

Those are **LicenceFlow diagnostic messages**, not claimed verbatim SmartLock screens.

### Violations and termination screens

Official PBOX documentation confirms that **system-identified violations** are surfaced to proctors and that proctoring supports intervention against a particular candidate. citeturn36search0 It also documents automated signals such as multiple-person presence, absence and other proctoring indicators. citeturn3search0turn3search1

What is **not** publicly documented is the complete Madhya Pradesh production rulebook translating each signal into:

first warning → second warning → pause → rejection, or immediate termination.

Nor did this research locate an authoritative current catalogue of the precise citizen-facing SmartLock violation messages. Screenshots and reports circulating on third-party sites and forums should therefore be treated as **observational evidence only**, not specification authority.

Freeze the *states*, not unverified official wording:

| State | Recommended LicenceFlow treatment | Official-status caveat |
|---|---|---|
| Face temporarily missing | Pause/check camera | PBOX supports absence detection; threshold not public. citeturn3search0 |
| Additional person visible | Security warning/re-check | Multiple-person detection is documented; exact sanction is not. citeturn3search0 |
| App/tab switch detected | Pause + integrity check | Browser can detect loss of visibility; official MP sanction not public. citeturn27search1 |
| Camera disappears | Pause + reconnect | Relevant to face/absence proctoring; sanction threshold not public. citeturn3search0 |
| Temporary network loss | Preserve and reconnect | Network resilience is a PBOX design characteristic. citeturn3search0turn36search1 |
| Lockdown component stopped | Stop secure environment | PBOX SmartLock architecture treats loss of lockdown as incompatible with continued secure operation. citeturn3search0 |
| Confirmed policy termination | End test + explain next official step | Proctor intervention/termination capability is documented; exact MP copy/rules are not. citeturn36search0 |
| Unexplained technical stop | Preserve reference number + support route | Parivahan tells affected LL candidates to contact the RTO/exam authority. citeturn38search0 |

A particularly important design principle is to **never accuse the user when the evidence only establishes a technical condition**. “Face not visible” is better than “Cheating detected.” “Exam security could not be verified” is better than “Violation committed” until a policy engine or authorised proctor has actually classified the event.

## Camera, face data, Aadhaar, and privacy

### The official transport ecosystem does retain substantial journey data

Parivahan publishes an **Archival and Retention Policy for Transactional Data** that gives unusually concrete Sarathi retention schedules. The policy’s Sarathi table specifies, among other things, retention for learner-licence applications, learner test history, appointments, payment data, Aadhaar-authentication logs, audit trails and licence-holder images. citeturn31view0turn32view1turn33view1

For the categories most relevant to LicenceFlow, the published table specifies:

| Sarathi data category | In-system | Archive | Total stated retention |
|---|---:|---:|---:|
| Approved LL application data | 2 years | 10 years | 12 years |
| LL data after expiry / conversion to DL | 2 years | 4 years | 6 years |
| LL appointment/history data | 2 years | 4 years | 6 years |
| Fee receipts and related data | 2 years | 4 years | 6 years |
| **LL test data and LL test history** | **2 years** | **4 years** | **6 years** |
| OTP/SMS data | 1 month | 6 months | 7 months |
| Applicant attempts for activities such as fee/appointment/upload | 6 months | 4.5 years | 5 years |
| **Aadhaar authentication logs** | **2 years** | **5 years** | **7 years** |
| Licence-holder photo and signature | 50 years | perpetual archive | effectively perpetual under the table |

These periods are shown in the Parivahan-published retention document. citeturn31view0turn33view1

The document further says archived data should be encrypted or locked and continuously safeguarded, and describes systematic review and eventual destruction according to the applicable retention schedule. citeturn31view0

This produces a major specification correction: **do not promise users that “government test data is deleted immediately after the exam” or after 30 days.** The official transport data lifecycle can be much longer. citeturn33view1

### But that table does not answer the webcam-retention question

The retention policy contains a category called **LL Test Data**, but it does not publicly enumerate whether that category contains:

continuous webcam video, selected frames, suspicious-event frames, microphone snippets, raw liveness media, face embeddings/templates, proctor notes, or only test/result/history data. citeturn33view1

Likewise, the “Image’s data” entries refer to licence-holder photo/signature and image history, not explicitly SmartLock webcam captures. citeturn33view1

Therefore the exact answer to **“How long does Madhya Pradesh SmartLock keep camera/biometric data?”** is:

> **No authoritative public retention period specific to SmartLock/PBOX webcam, microphone, liveness or face-template data was located.**

That is a production blocker for any detailed privacy promise, but **not** a blocker for your synthetic prototype. The prototype can adopt a deliberately privacy-preserving policy of its own—for example, process liveness locally wherever practical, avoid recording continuous video, retain only synthetic event metadata, and automatically purge test-session media—but it must label that as **LicenceFlow prototype behavior**, not Government of Madhya Pradesh policy.

### mParivahan provides useful privacy precedent, but it is not the SmartLock policy

NIC’s official NextGen mParivahan privacy policy shows how another transport product describes permissions and personal information. It says registration information is stored on government infrastructure; a UID token and Aadhaar-verification status may be collected if Aadhaar authentication is used, while the Aadhaar number/VID itself is not stored/shared by that app. citeturn34view4

It also says the app can collect device/log information such as IP address, browser/OS, device ID, location, language settings and handset make/model, and says device/connection information may be used for support and suspicious-activity investigation. citeturn34view4

The policy describes user permission requests for features including **taking pictures and recording video**, accessing media/files, and geolocation. It says data is stored on secured government infrastructure and encrypted while in transit, and describes an account-deletion facility for the NextGen mParivahan account. citeturn34view4

Those are useful design precedents, but the document explicitly governs **NextGen mParivahan**, not STALL/PBOX SmartLock. citeturn34view4 LicenceFlow therefore should not copy mParivahan’s deletion language and present it as the LL-test retention rule.

### Data-protection design should already anticipate the new DPDP regime

The final **Digital Personal Data Protection Rules, 2025** were published on 13 November 2025 with staggered commencement. Rules 1, 2 and 17–21 began on publication; Rule 4 is scheduled one year later; and Rules 3, 5–16, 22 and 23 are scheduled eighteen months after publication. As of **22 August 2026**, that means important parts of the detailed Rules are still in their transition period. citeturn31view1turn33view0

Nevertheless, the underlying DPDP framework is a very good design target for LicenceFlow. The Act sets out concepts such as purpose-specific processing, clear notice, consent that is specific and informed where consent is the basis, security safeguards, grievance mechanisms, and rights concerning personal data. citeturn28search0

For the prototype, every camera/microphone stage should therefore answer the user’s “Why?” **before** permission is requested:

> **Camera — why we ask**  
> Used in this prototype to demonstrate face presence and exam-security checks. LicenceFlow does not use your face to decide whether you are eligible for a learner licence.

> **Microphone — why we ask**  
> Used only to demonstrate proctoring-related audio checks during the synthetic test. It is not used to judge your driving knowledge.

> **Identity photo — why we ask**  
> Used to demonstrate comparison between the test taker and the synthetic application identity.

> **Device information — why we ask**  
> Used to check whether this device can demonstrate the security and recovery features required for the test experience.

Those explanations align particularly well with the 2025 Rules’ direction toward a clear, independently understandable notice containing an itemised description of personal data and the specified purposes for processing it. citeturn31view1turn33view0

## Freeze-ready LicenceFlow specification

The research supports freezing the product around **three explicit layers** rather than pretending the prototype is the official MP system.

### Public-service journey layer

LicenceFlow may confidently model the Madhya Pradesh journey as an online learner-licence process supporting Aadhaar e-KYC, online application, fee payment, test and post-pass licence download, while also offering a non-e-KYC document/photo/signature upload and verification path. citeturn34view0

The prototype should use **synthetic personal details only** and display persistent but unobtrusive “Prototype / synthetic data” disclosure. The final synthetic learner licence should say conspicuously:

**DEMO — NOT A GOVERNMENT LICENCE — NOT VALID FOR DRIVING**

The “journey receipt” can include application stages, synthetic payment reference, test start/finish events, interruptions, recovery events, result and issuance event. That closely reflects the existence of official Sarathi histories and audit/transaction records without impersonating the government record itself. citeturn33view1

### Examination-simulation layer

Freeze a **15-question test as a LicenceFlow simulation**, not as an asserted MP requirement.

Use official Rule 11/Form 2 subject areas and the Parivahan STALL question bank as the research base. citeturn38search10turn38search7 The AI assistant should be available before and after the test to explain signs, concepts, application steps, privacy and failures in English, Hindi and Hinglish.

During the secure test, it should switch modes. It may explain **process and technical status**, for example:

> “Your camera connection has stopped. I can help you restore it.”

It should not answer:

> “Which option is correct for question 8?”

This product rule is consistent with the purpose of a proctored knowledge examination and avoids turning an accessibility/help feature into a mechanism for defeating the test.

The result engine should have separate **knowledge outcome** and **integrity outcome** fields. A candidate can therefore have:

`knowledge_result = passed`  
`integrity_status = pending_review`

rather than a misleading single binary “failed.” PBOX’s system-identified violations and proctor intervention model supports separating examination answers from proctoring decisions. citeturn36search0

### Device-preflight layer

The device check should come **before payment**, exactly as LicenceFlow proposes. This is particularly good product design because a secure examination may depend on camera, microphone and environment capabilities that payment alone cannot resolve.

The preflight can genuinely test:

camera permission and stream, microphone permission, network state, local persistence, fullscreen availability, page-visibility events, WebRTC/media capability, approximate bandwidth/latency, recovery from a deliberately simulated disconnect, and sufficient framing/light for prototype liveness. The relevant browser APIs can detect several of these conditions, including page visibility and fullscreen state. citeturn27search1turn27search2

The result should distinguish:

**Ready for LicenceFlow prototype**  
from  
**Official test compatibility unknown**

That is more accurate than a green check saying “This phone is approved for the MP learner test.”

### Recovery layer

Freeze recovery as a first-class journey, not an error afterthought.

A network interruption should preserve local answer state and attempt resynchronisation, reflecting the network-resilient philosophy documented for PBOX. citeturn3search0turn36search1

Camera loss or an incoming-call/app-switch event should pause the prototype and require a security re-check rather than silently continuing. Browser visibility/fullscreen behavior provides enough signals to demonstrate that experience, although it cannot enforce OS lockdown. citeturn27search1turn27search2

An unrecoverable technical stop should produce:

> **Your test did not end normally**  
> We could not restore the secure test environment. Your answers and technical-event history have been preserved in this prototype receipt. In the official service, an exam stopped by an error may require assistance from the concerned RTO or examination authority.

The final sentence is directly grounded in current Parivahan guidance. citeturn38search0turn38search4

### Retest layer

Freeze the post-failure UX around the confirmed rule:

> **Not passed**  
> A retest requires the applicable retest fee and a fresh test booking/availability check.

That reflects Parivahan’s official learner-test FAQ. citeturn38search2turn38search3

Do not display a hard-coded retry date until the official state workflow supplies one.

The same applies to attempt counts. No authoritative public MP source located in this final pass establishes LicenceFlow’s often-circulated “three LL attempts” rule, so the prototype should not enforce it as a government rule.

### Privacy layer

For the synthetic prototype, a much stricter privacy policy than the production-record retention system is appropriate. But state it as LicenceFlow policy.

A freeze-ready disclosure would be:

> **This is a synthetic prototype.** Your camera and microphone are used only to demonstrate the secure-test experience. LicenceFlow does not determine learner-licence eligibility and is not connected to Madhya Pradesh Transport Department, Sarathi or NIC SmartLock. Prototype retention may differ from official government systems.

Then give separate disclosure for each actual implementation choice—whether frames stay on-device, whether any images are uploaded, whether audio is recorded, exactly when session artifacts are deleted, and what is written to the journey receipt.

Do **not** write generic reassurance such as “biometric data is immediately deleted by the government.” Parivahan’s own published retention table shows multi-year retention for LL-test history, Aadhaar-authentication logs and other Sarathi records, while SmartLock-specific webcam retention remains publicly unresolved. citeturn33view1

## Final decision matrix

The research is sufficient to freeze LicenceFlow provided the specification clearly distinguishes **verified government behavior**, **NIC security architecture**, and **LicenceFlow simulation choices**.

| Specification item | Freeze status | What LicenceFlow should implement |
|---|---|---|
| Fully online MP LL journey | **Freeze** | Application → e-KYC/document verification → payment → online test → result → synthetic download. citeturn34view0 |
| Aadhaar e-KYC path | **Freeze** | Explain it as identity/application verification, separate from exam face monitoring. citeturn34view0 |
| Non-Aadhaar path | **Freeze** | Document/photo/signature upload → department-verification simulation. citeturn34view0 |
| STALL learner test concept | **Freeze** | Use official test terminology where explaining the real process. citeturn26search0turn26search4 |
| Knowledge topics | **Freeze** | Traffic signs/signals, accident duties, required driving documents and related official question-bank material. citeturn38search10turn38search7 |
| Exactly 15 questions | **Freeze only as synthetic UX** | Label “15-question LicenceFlow practice/test simulation”; do not call it the confirmed MP count. |
| Pass threshold | **Configuration required** | Do not assert an MP percentage until authoritative state configuration is obtained. |
| Mandatory “desktop only” MP rule | **Do not freeze** | Current MP guidance mentions mobile; exact secure-test device eligibility remains unresolved publicly. citeturn34view0 |
| Browser equivalent to SmartLock | **Explicitly reject** | Browser prototype demonstrates checks; native/approved lockdown required for production-equivalent control. citeturn3search0turn27search0turn27search2 |
| Pre-payment device test | **Freeze** | Excellent LicenceFlow enhancement; test all prototype capabilities before synthetic payment. |
| Temporary network recovery | **Freeze** | Preserve answers, show offline state, resync on recovery. citeturn3search0turn36search1 |
| Incoming call/app switch | **Freeze as recoverable prototype state** | Detect visibility loss, pause, re-check security; do not call it an official MP violation. citeturn27search1turn27search2 |
| Camera interruption | **Freeze** | Pause → diagnose permission/stream/face → recover or technical stop. citeturn3search0 |
| Multiple person / absence signals | **Freeze as proctoring concepts** | Simulate warnings/review; do not invent official sanction thresholds. citeturn3search0 |
| Violation termination | **Freeze as possible state** | “Secure test terminated/pending review”; exact trigger policy remains integration-controlled. citeturn36search0 |
| Failed LL retest | **Freeze** | Retest fee + fresh booking/availability. citeturn38search2turn38search3 |
| Seven-day LL waiting period | **Do not freeze** | No authoritative MP LL basis found in this pass. |
| Three-attempt LL limit | **Do not freeze** | No authoritative MP LL basis found in this pass. |
| Technical test stop | **Freeze separately from fail** | Recovery first; if unresolved, direct to RTO/exam authority in the real-service explanation. citeturn38search0 |
| Exact official SmartLock error copy | **Do not freeze** | Use LicenceFlow’s own calm synthetic copy and label it accordingly. |
| Camera/microphone consent explanation | **Freeze** | Just-in-time “Why?” notice before permission request. citeturn33view0turn34view4 |
| Government webcam retention period | **Do not state** | Public SmartLock-specific retention could not be verified. |
| Sarathi LL test/history retention | **Can document** | Published policy lists 2 years in-system + 4 years archive = 6 years. citeturn33view1 |
| Aadhaar-authentication-log retention | **Can document** | Published Sarathi policy lists 2 years + 5 years = 7 years. citeturn33view1 |
| Journey receipt | **Freeze** | Synthetic audit trail of application, permissions, payment, test, interruptions, recoveries, result and synthetic issuance. |
| AI process assistant | **Freeze** | English/Hindi/Hinglish explanations; no eligibility determination and no live-test answers. |

The resulting product statement can therefore be frozen as:

> **LicenceFlow is a research-grounded, synthetic redesign of the Madhya Pradesh learner-licence journey. It reproduces the documented online application, identity/document, payment, learner-test, recovery and licence-delivery concepts while clearly separating simulated behavior from government rules. Its secure-test prototype uses real browser camera, microphone, visibility, connectivity and recovery capabilities, but does not claim that a web browser provides SmartLock-equivalent device security. Production deployment would require authoritative Madhya Pradesh/Sarathi configuration and an approved examination-security integration.** citeturn34view0turn3search0turn35search0

The remaining uncertainties are narrow and should be treated as **integration configuration, not blockers to UX implementation**: the live Madhya Pradesh question count and scoring threshold; the state’s current test-stage mobile/device matrix; any state-specific waiting period after an LL-test failure; the precise violation escalation policy and production screen copy; and the retention/processing policy specifically applicable to SmartLock webcam, microphone, liveness and facial-comparison artifacts. The public sources examined here do not establish those points strongly enough to encode them as government facts.
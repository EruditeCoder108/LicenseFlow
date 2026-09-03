# Production security boundary

LicenceFlow is a browser prototype using fictional judge credentials, synthetic OTP/payment values and versioned browser storage. It does not connect to Aadhaar, Sarathi, a bank or a government identity system.

The 2 September source adds a separate **server-controlled prototype assessment**. Its paper, timer, answer writes and score are authoritative within an anonymous D1-backed session. This does not make applicant identity, fees, admission, browser monitoring or official issuance real. Its complete data, timing and session limits are documented in [protected-exam-core.md](protected-exam-core.md). Local implementation is not proof of public deployment.

## What must move to trusted services

- Identity, OTP verification, sessions, authorization and rate limiting must run on audited government services.
- Applications, documents, payment attempts, receipts and exam outcomes must be stored server-side with access control, encryption, retention rules and audit trails.
- Payment callbacks must be signed and reconciled server-side; idempotency keys must prevent duplicate charges.
- Every value received from a browser must be schema-validated and escaped again at the service boundary.
- Logs must exclude passwords, OTPs, payment secrets, raw camera/audio and unnecessary personal data.

## Camera and exam integrity

Raw camera and microphone data should remain on the device wherever possible. A production system should transmit only the minimum reviewed signals needed for the assessment, with explicit consent and a defined deletion policy.

An ordinary website cannot guarantee screenshot blocking, app-switch prevention, overlay prevention, an uncompromised device or SmartLock-equivalent lockdown. Those guarantees require a separately assessed native or managed examination client, platform attestation and an accessible human-review path. The browser flow therefore detects and coaches browser-visible conditions without claiming complete cheat prevention.

## Shared devices

The prototype's **Clear this device** action removes only LicenceFlow state. A production deployment must additionally revoke the server session, expire sensitive download links and avoid caching personal documents on shared devices.

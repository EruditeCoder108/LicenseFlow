# LicenceFlow Technology Research Study

**Research date:** August 22, 2026  
**Target:** synthetic mobile-first React + TypeScript + Vite PWA, with a separate future native-mobile architecture  
**Scope boundary:** LicenceFlow is **not** Parivahan, Sarathi, NIC PBOX, SmartLock, UIDAI, or a Madhya Pradesh government system. Nothing proposed below should be represented as reproducing the security guarantees of an official locked-down examination client.

## Executive recommendation and threat model

**Executive recommendation.** The strongest defensible browser architecture is a **local-first integrity-observation system, not a browser proctoring/security system**. Use browser APIs for real readiness and interruption checks; MediaPipe for face presence, multi-face detection, landmarks, framing, head pose and blink-like challenge signals; lightweight local image-quality calculations for light/blur/obstruction; ONNX Runtime Web as the secondary inference runtime; a small, explicitly licensed face-embedding model only for a clearly labelled prototype identity-similarity signal; Silero VAD for local speech-activity indication; and IndexedDB plus service-worker caching for resilience. Browser WebAssembly should be the compatibility baseline, with WebGPU treated as an optional acceleration path rather than a requirement because ONNX Runtime’s own support matrix still excludes or limits WebGPU on important browser/platform combinations. citeturn2search0turn2search6turn0search0turn6search0

The browser should **not** claim to prevent app switching, screenshots, screen recording, overlays, virtual cameras, developer tools, injected JavaScript, or a modified client. `visibilitychange` and `fullscreenchange` expose observable UI state transitions, but those events are notifications rather than enforcement mechanisms; browser media APIs likewise expose streams/devices but do not provide cryptographic proof that a stream originated from an uncompromised physical camera. The latter is an inference from the browser API security model, not an explicit browser guarantee. [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [MDN fullscreenchange](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event), [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [MDN enumerateDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices). citeturn5search0turn5search1turn5search2turn5search3

For the hackathon, **do real active liveness but do not pretend to have production-grade passive PAD**. A randomized sequence such as “turn left → blink → turn right” can establish that the observed landmarks followed a challenge generated after capture started. It is useful against obvious static photographs and unsophisticated prerecorded material, but it can be defeated by sufficiently interactive replay, real-time face swaps, modified clients, or sophisticated presentation attacks. NIST’s independent FATE work specifically shows why passive software-only RGB PAD must be evaluated against individual attack instruments rather than summarized as generic “liveness”; ISO/IEC 30107-3 correspondingly defines attack-specific APCER and bona-fide BPCER. [NIST FATE PAD](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based), [ISO/IEC 30107-3 overview](https://www.iso.org/obp/ui/). citeturn21search7turn21search6

For production native mobile, the recommendation changes substantially: use native camera pipelines plus platform attestation and examination controls, while treating identity verification and PAD as a separately procured biometric security component whose exact model/SDK has explicit deployment rights and independent PAD/verification evidence. Android offers Play Integrity signals for recognized app binaries, device integrity and apps capable of capturing, controlling or overlaying the app; native Android also offers `FLAG_SECURE`, overlay protections and screenshot-detection APIs. Apple provides App Attest, and education/assessment applications may use Automatic Assessment Configuration subject to Apple’s restricted entitlement and platform requirements. [Android Play Integrity](https://developer.android.com/google/play/integrity/overview), [Android sensitive activities](https://developer.android.com/security/fraud-prevention/activities), [Apple App Attest](https://developer.apple.com/documentation/devicecheck/validating-apps-that-connect-to-your-server), [Apple Automatic Assessment Configuration](https://developer.apple.com/documentation/automaticassessmentconfiguration). citeturn15search0turn15search1turn16search0turn16search1

### Threat model

“Reliably detect” below means **the underlying observable condition can usually be measured**, not that cheating has been proved.

| Threat or failure | Browser/PWA assessment | Category | Correct system response |
|---|---|---:|---|
| Camera permission denied, unavailable device, stream ends | `getUserMedia()` errors and `MediaStreamTrack` state can directly reveal capture failure. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) citeturn5search0 | **Reliably detect** | Explain problem, retry permission/device selection; do not infer misconduct. |
| Microphone permission failure | Same permission/capture mechanism. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) citeturn5search0 | **Reliably detect** | Retry or invoke an accessible/no-audio pathway where policy allows. |
| No visible face | Face detector can observe absence inside the captured field of view, but darkness, occlusion and bad cameras create false negatives. MediaPipe explicitly provides face detection on image/video inputs. [MediaPipe Face Detector](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/web_js) citeturn2search6 | **Reliably detect as an observation** | Coach framing; pause after persistence; never call it cheating. |
| Two or more visible faces | Run detector with a multi-face configuration. It cannot discover people outside the camera field of view. [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) citeturn2search0 | **Reliably detect when visible** | Brief warning, then pause/retry if persistent; repeated episodes may be reviewed. |
| Printed static photograph | Randomized head-turn/blink challenges usually make a flat static photo unable to satisfy required temporal motion, but landmark false positives and attack variants remain possible. PAD remains attack-specific. [NIST FATE PAD](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based) citeturn21search7 | **Weakly signal / often catch obvious cases** | Challenge retry; optionally add experimental RGB PAD signal; never automatic cheating verdict. |
| Photo displayed on another phone | Static-display case resembles a printed photograph; screen artifacts are device/camera dependent and therefore not robust evidence. The Silent-FAS project itself warns that RGB liveness robustness depends on camera and scene. [Silent-Face-Anti-Spoofing](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing) citeturn8search0 | **Weakly signal** | Randomized challenge + quality/PAD observation, then retry/review. |
| Prerecorded video replay | An unpredictable post-start challenge raises attack cost, but prerecorded collections or responsive replay can evade it. NIST treats replay as a presentation-attack class requiring empirical evaluation. [NIST PAD evaluation plan](https://pages.nist.gov/frvt/api/FRVT_pad_api.pdf) citeturn21search1 | **Weakly signal** | Randomized multi-step challenge; retain only challenge outcome metadata. |
| Real-time deepfake / face swap | A 2D browser pipeline has no reliable basis to guarantee detection; strong attackers can render challenge-responsive output. | **Only simulate / not reliably detect** | Label any detector demonstration experimental; defer real security decision to validated production PAD/vendor integration. |
| High-quality 3D mask | Commodity RGB alone is an unsafe basis for a strong claim; specialized PAD may use attack-specific cues or additional sensing. [NIST FATE PAD](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based) citeturn21search7 | **Not reliably detect** | Do not advertise mask protection in PWA. |
| Off-camera assistant | The camera only observes its field of view; no browser sensor proves nobody is nearby. | **Not detect** | No claim. |
| Speech/background prompting | VAD can detect likely speech but not reliably identify the speaker, content, intent or whether assistance occurred. Silero is a VAD, not a cheating detector. [Silero VAD](https://github.com/snakers4/silero-vad) citeturn14view0 | **Weakly signal** | Record speech-activity intervals only; repeated unusual episodes can be reviewed. |
| Multiple speakers | Robust speaker diarization is a materially harder task than VAD and typically uses substantially more inference machinery; it should not be treated as a lightweight browser guarantee. [NVIDIA NeMo diarization overview](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/asr/speaker_diarization/intro.html) citeturn13search18 | **Only simulate / limited experiment** | At most label “background speech pattern uncertain”; no identity attribution. |
| Whispering | Low-SNR whispered speech is a known difficult audio condition, and VAD merely estimates speech activity. Silero v6 specifically lists unusual/muted speech among edge cases it has tried to improve. [Silero releases](https://github.com/snakers4/silero-vad/releases) citeturn14view2 | **Weak signal only** | Never use as proof. |
| Tab/app switching | When the document becomes hidden, Page Visibility generally reports the transition; mobile OS/browser lifecycle details can vary. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event) citeturn5search5 | **Reliably detect some transitions, not prevent** | Log `VISIBILITY_LOST`; allow limited recoveries; do not call the event cheating. |
| Fullscreen exited | Browser can notify fullscreen state change where Fullscreen API is supported. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event) citeturn5search2 | **Reliably detect supported event, not prevent** | Warn/re-enter; not evidence by itself. |
| Screenshot | Standard web pages have no general system screenshot-prevention primitive comparable with Android `FLAG_SECURE`. | **Not detect/prevent reliably** | Say so explicitly. |
| Screen recording | Same limitation; browser media/visibility state does not attest to OS recording state. | **Not detect/prevent reliably** | Defer to native controls. |
| Virtual camera / injected stream | Web camera enumeration and capture APIs expose streams/settings, not trustworthy physical-camera provenance. This is an architectural inference from the APIs. [MDN enumerateDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices) citeturn5search3 | **Not reliably detect** | No security claim. |
| Browser developer tools | Client JavaScript is controlled by the client environment. | **Not reliably detect or prevent** | Keep answer keys/critical decisions server-side in any serious deployment. |
| Modified PWA/client | A modified client can fabricate client-generated integrity events; a local hash chain cannot cure that trust problem. | **Not detect reliably** | Server authorization, versioning and receipts limit impact; production needs native attestation. |
| Network interruption | Actual request/WebSocket failures and latency can be measured. `navigator.onLine` is explicitly only a heuristic. [MDN Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) citeturn6search3 | **Reliably detect operational failure** | Checkpoint locally, pause server-required steps, synchronize later. |
| Poor lighting, disability, low-cost camera | These can legitimately trigger face, blink, pose, voice or liveness failures. NIST has found algorithm-dependent demographic effects in face recognition, and RGB PAD projects acknowledge camera/scene dependence. [NIST demographic effects](https://pages.nist.gov/frvt/html/frvt_demographics.html), [Silent-FAS](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing) citeturn21search0turn8search0 | **Known false-positive source** | Coaching → retries → accessible alternative → manual review; never silent automatic accusation. |

The key governance rule is therefore:

> **Observations are not verdicts.** `MULTIPLE_FACES`, `VOICE_ACTIVITY`, `VISIBILITY_LOST`, `IDENTITY_MATCH_UNCERTAIN`, or a failed liveness challenge should describe what the software observed and how confident it was. They should not be serialized as `CHEATING_DETECTED`.

## Browser capability and feature technology comparison

**Browser capability and limitation table.**

| Capability | Recommended mechanism | What LicenceFlow can honestly do | Hard limitation |
|---|---|---|---|
| Readiness before simulated payment | `getUserMedia`, permission test, camera/mic start-stop, resolution/frame-rate inspection | Verify that required devices can be opened and frames/audio arrive before proceeding. [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) citeturn5search0 | Cannot prove device integrity. |
| Face presence | MediaPipe Face Detector | Detect bounding boxes and six detector keypoints locally. [Google AI Edge](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/web_js) citeturn2search6 | Visibility, pose, occlusion and image quality affect results. |
| Face landmarks/framing | MediaPipe Face Landmarker | Obtain 478 3D landmarks, blendshape outputs and optional facial transformation matrices. [Google AI Edge](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) citeturn20search9 | Landmark coordinates are not an authenticated 3D depth measurement. |
| Multiple faces | Face Detector with multiple detections | Count visible faces and measure relative bounding-box sizes. citeturn2search6 | Cannot see outside FOV. |
| Head pose | Landmarks / transformation matrix | Derive yaw/pitch/roll-like challenge state without a second model. MediaPipe exposes transformation matrices. citeturn20search9 | Approximate pose from RGB geometry, not precision head tracking. |
| Blink challenge | Eye landmarks/blendshapes + temporal state machine | Detect eyelid closure/reopening patterns. Landmark-based EAR-style blink detection is established but threshold/user dependent. [PeerJ Computer Science blink study](https://pubmed.ncbi.nlm.nih.gov/35494836/) citeturn20search4 | Glasses, facial anatomy, disability, low FPS and poor light can interfere. |
| Gaze | Landmark geometry at most | Use coarse “looking far away from screen” as optional UX context. | Webcam gaze has substantial cross-user, pose and cross-dataset variation; a 2026 study found unseen-subject error much larger than a naive seen-subject split. [Applied Sciences 2026](https://www.mdpi.com/2076-3417/16/15/7630) citeturn20search3 |
| Lighting | Downsampled frame luminance statistics | Detect extremely dark/overexposed frames and provide coaching. | Exposure control and skin/background composition vary by phone. |
| Blur/obstruction | Laplacian/high-frequency statistic plus frame variance | Detect gross blur and near-uniform covered camera images. | Not a spoof detector; motion blur can be legitimate. |
| Identity similarity | ONNX embedding model, preferably only at enrollment/start | Compare a synthetic ID/reference embedding with a live face and produce a similarity score. | Model threshold is dataset/device/population dependent; not identity proof. |
| Passive RGB PAD | Experimental small ONNX model only | Demonstrate a weak attack-likelihood signal. | No recommended open model in this study has adequate independent evidence to be a production security control. |
| Active liveness | MediaPipe landmarks + server/random challenge nonce | Challenge for unpredictable blink/head movements and check temporal sequence locally. | Sophisticated interactive replay/deepfake and modified clients remain possible. |
| Speech activity | Web Audio + Silero VAD | Emit local speech-start/end probabilities/events without saving audio. [Silero VAD](https://github.com/snakers4/silero-vad), [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) citeturn14view0turn13search1 | Does not identify speaker, words or intent. |
| Low-latency audio processing | `AudioWorklet` | Process small audio windows off the main JS execution path. [MDN AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) citeturn13search4 | Safari/device compatibility still requires testing with chosen VAD packaging. |
| App/tab interruption | Page Visibility | Emit an event when the page becomes hidden. citeturn5search1 | No prevention. |
| Fullscreen loss | Fullscreen API | Emit exit state. citeturn5search2 | Fullscreen availability/UX varies, especially mobile. |
| Local checkpoint | IndexedDB | Persist answers, monotonic sequence and sync state. [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) citeturn6search0 | Data can be altered by a malicious local client. |
| Offline shell | Service Worker | Cache application shell and pre-authorized static resources. [MDN Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) citeturn6search1 | Offline browser code cannot securely hide a bundled answer key from the user. |
| Background sync | Foreground retry first; Background Sync only opportunistically | Resubmit pending checkpoints when conditions permit. | Background Sync is limited/experimental and should not be a correctness dependency. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API) citeturn6search6 |

**Feature-by-feature technology comparison.**

| Feature | Preferred | Alternative/fallback | Decision reasoning |
|---|---|---|---|
| Face detector | **MediaPipe Face Detector** | Face detector inside Face Landmarker | Mobile-oriented, small detector and straightforward web package. Detection functions are synchronous, so Google recommends moving video inference away from the UI thread. [Web guide](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/web_js) citeturn2search6 |
| Landmarks | **MediaPipe Face Landmarker** | No fallback model; degrade to bounding-box framing | 478 landmarks plus expressions/transformation matrix make one model useful for framing, pose, blink and active challenges. citeturn20search9 |
| General model runtime | **ONNX Runtime Web** | TensorFlow.js if a required model exists only there | ORT supports WASM broadly; its docs recommend WebGPU where available and describe WebGL as maintenance-mode. [ORT Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html) citeturn0search0 |
| Acceleration | **WASM baseline; WebGPU optional** | WebGL only when required by a library/model | This avoids making Chrome/WebGPU capability an examination prerequisite. ORT documents significantly narrower WebGPU support than WASM. citeturn0search0 |
| Image quality | **Canvas/ImageData + small worker functions** | OpenCV.js | Mean luminance, clipping ratio, variance and a small blur metric do not justify loading an entire CV runtime. OpenCV.js remains useful for experiments. [OpenCV.js](https://docs.opencv.org/4.10.0/df/d0a/tutorial_js_intro.html) citeturn3search6 |
| Identity embedding | **OpenCV SFace INT8 ONNX for synthetic prototype only** | No identity match / server-authorized production SDK | The OpenCV-distributed INT8 file is about 9.9 MB versus 38.7 MB FP32 and its model directory carries Apache-2.0, but its web-collected training-data heritage and absence of LicenceFlow-specific independent validation make it prototype-only. [Model files](https://huggingface.co/opencv/face_recognition_sface/tree/main), [model license](https://github.com/opencv/opencv_zoo/blob/master/models/face_recognition_sface/LICENSE), [paper](https://arxiv.org/abs/2205.12010). citeturn19search11turn19search19turn19search0 |
| Passive PAD | **No authoritative model** | MiniFASNet/Silent-FAS in disposable experiment | The open MiniFAS implementation is small and reports attractive author-side figures, but repository activity is weak and the published project figures are not independent ISO-style APCER/BPCER evidence. [Repository](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing) citeturn8search0turn8search3 |
| Active liveness | **Custom state machine over MediaPipe landmarks** | Simple head-turn-only challenge | No extra biometric model is necessary. Randomize challenge ordering after capture begins. |
| Speech activity | **Silero VAD v6 ONNX** | RMS/energy threshold | Silero is MIT-licensed, roughly 2 MB in its published JIT form, supports 8/16 kHz and reports sub-millisecond CPU inference for one audio chunk in its own native benchmark; web-phone performance must still be measured. [Silero](https://github.com/snakers4/silero-vad) citeturn14view0 |
| VAD browser wrapper | `ricky0123/vad-web` if device tests pass | Direct ONNX Runtime Web + AudioWorklet | The project explicitly focuses on browser VAD and wraps Silero+ORT, but an open 2025 issue reports model-loading failures on iPhone browsers, so it is not safe to assume universal mobile compatibility. [vad-web repository](https://github.com/ricky0123/vad), [iPhone issue](https://github.com/ricky0123/vad/issues/227) citeturn13search15turn13search28 |
| Multi-speaker detection | None in main PWA | Experimental server/offline research only | Diarization is a separate, much heavier inference task; VAD should not be relabelled speaker identification. citeturn13search18 |
| Gaze | Coarse optional landmark signal | Remove entirely | Reliability is inadequate for a meaningful cheating decision. citeturn20search3 |
| Offline resilience | **IndexedDB + Service Worker + foreground sync** | In-memory checkpoint if storage fails | Uses browser-standard storage rather than introducing security-sensitive custom persistence. citeturn6search0turn6search1 |

A particularly important runtime rule is to keep vision work out of React’s render path. Google’s MediaPipe web documentation states that `detect()`/`detectForVideo()` execute synchronously and can block the UI thread; LicenceFlow should therefore place frame inference in a worker and send only compact observations to React. [Face Detector Web guide](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/web_js), [Face Landmarker Web guide](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js). citeturn2search6turn2search8

## Open-source candidate scorecard and recommended hackathon stack

**Open-source candidate scorecard.** “Government suitable” below means only that the apparent software/model licence does not itself impose a noncommercial restriction; it **does not mean government approval, certification or procurement suitability**.

| Candidate | Activity / licence / weight rights | Platform & local execution | Size and cost | Evidence and limitations | LicenceFlow judgment |
|---|---|---|---|---|---|
| **[MediaPipe Tasks](https://github.com/google-ai-edge/mediapipe)** Face Detector/Landmarker | MediaPipe code is Apache-2.0; repository showed meaningful 2026 activity, and Face Landmarker docs were updated Aug. 17, 2026. [License](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE) citeturn1search3turn4search0turn20search9 | Web, Android and iOS guides exist; fully local inference. citeturn2search1turn2search5turn2search9 | Detector input 192×192; mesh 256×256; landmarker has 478 points. Moderate sustained CPU/GPU cost. citeturn20search9 | BlazeFace authors reported extremely high FPS on then-flagship mobile GPUs, but those author figures are not low-end 2026 browser benchmarks. [BlazeFace paper](https://research.google/pubs/blazeface-sub-millisecond-neural-face-detection-on-mobile-gpus/) citeturn2search2 | **Production-capable for UX/observation signals; preferred.** |
| **[ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)** | Microsoft ONNX Runtime is actively maintained; release page showed v1.28.1 on Aug. 18, 2026. [Releases](https://github.com/microsoft/onnxruntime/releases) citeturn0search1 | Browser WASM widely; WebGPU narrower; same ONNX ecosystem extends to native/mobile runtimes. citeturn0search0turn0search10 | Runtime cost depends entirely on model; WASM is the portability baseline. | Runtime has no accuracy by itself. WebGL is maintenance-mode in ORT documentation. citeturn0search0 | **Production-quality runtime; preferred secondary runtime.** |
| **[TensorFlow.js](https://www.tensorflow.org/js)** | Open TensorFlow ecosystem; project still showed 2026 activity although formal release cadence is slower than ORT’s. [Repo](https://github.com/tensorflow/tfjs), [releases](https://github.com/tensorflow/tfjs/releases) citeturn3search5turn3search1 | Browser-oriented local ML with multiple backends. | Model dependent; adding TFJS alongside MediaPipe+ORT increases duplicate runtime/bundle surface. | Technically valid but offers no unique requirement for this prototype. | **Suitable, but not selected as primary runtime.** |
| **[OpenCV.js](https://docs.opencv.org/4.10.0/df/d0a/tutorial_js_intro.html)** | OpenCV 4.5+ uses Apache-2.0; core project is actively maintained. [OpenCV repo](https://github.com/opencv/opencv) citeturn3search7turn3search23 | Browser/WASM computer vision; native OpenCV separately supports mobile. | Material WASM/runtime footprint compared with a few custom pixel operations. | Excellent general CV toolkit, but LicenceFlow only needs a few quality metrics. | **Prototype utility; avoid as mandatory always-on dependency.** |
| **[OpenCV SFace](https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface)** | Model directory has Apache-2.0. The SFace paper used CASIA-WebFace, VGGFace2 and MS-Celeb-1M-family training sets; provenance/rights therefore deserve legal review despite permissive distributed model licence. [License](https://github.com/opencv/opencv_zoo/blob/master/models/face_recognition_sface/LICENSE), [paper](https://arxiv.org/abs/2205.12010) citeturn19search19turn19search0 | ONNX, so browser via ORT and native via ONNX/OpenCV. Fully local. | FP32 ~38.7 MB; INT8 ~9.9 MB. [Files](https://huggingface.co/opencv/face_recognition_sface/tree/main) citeturn19search11 | Paper reports standard face-recognition benchmarks, but there is no independent LicenceFlow/mobile-browser/Indian-population threshold validation. | **Prototype-only identity similarity.** |
| **MobileFaceNets architecture** | [Paper](https://arxiv.org/abs/1804.07573); architecture publication does not confer clean rights to arbitrary third-party pretrained weights. citeturn9search2 | Designed for mobile; ONNX conversions exist. | Authors reported <1M parameters, ~4 MB and 18 ms on their mobile test configuration. | Authors reported 99.55% on LFW and 92.59% TAR at FAR \(10^{-6}\) on MegaFace; these numbers describe their trained model/protocol, not every “MobileFaceNet” weight found online. citeturn9search2 | **Architecture promising; reject unverified third-party weights.** |
| **[InsightFace](https://github.com/deepinsight/insightface)** | Code is MIT, but InsightFace explicitly states its pretrained model packages require separate commercial licensing; open model use is not simply inherited from the code licence. [Official licensing](https://www.insightface.ai/solutions/face-recognition-licensing) citeturn19search29turn7search1 | Strong face-analysis ecosystem across native runtimes. | Package/model dependent. | Technically high quality, but licensing is decisive here. | **Reject pretrained weights for LicenceFlow unless separately licensed.** |
| **[AuraFace v1](https://huggingface.co/fal/AuraFace-v1)** | Model card says Apache-2.0 and claims commercially/publicly available training data; this is a publisher claim, not independent provenance audit. citeturn11search0 | ONNX-compatible ecosystem. | Main `glintr100.onnx` is ~261 MB, plus detection models. [Files](https://huggingface.co/fal/AuraFace-v1/tree/main) citeturn11search30 | Better licensing posture than many face models, but size is unacceptable for low-cost mobile PWA. Last observed model commit was Aug. 16, 2024. citeturn11search9 | **Unsuitable for browser.** |
| **[PocketNet](https://github.com/fdbtrs/PocketNet)** | CC BY-NC-SA 4.0. citeturn10search1 | Mobile-oriented face representation research. | Lightweight architectures. | Noncommercial licence conflicts with a clean path to commercial/government deployment. | **Reject.** |
| **[Silent-Face-Anti-Spoofing / MiniFASNet](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing)** | Apache-2.0 project; meaningful upstream activity appears to have largely stopped around 2023 and maintenance concerns remain visible in issues. citeturn8search0turn8search3turn8search7 | Python reference; small models can be exported/conveyed to ONNX with additional engineering. | Project reports about 0.43M parameters; author device figures include ~19–25 ms on Kirin/Snapdragon-era devices and ~90 ms on RK3288-class hardware. citeturn8search0 | Author reports TPR 97.8% at FPR \(10^{-5}\) for one model and explicitly warns robustness depends on camera model/scene. These are **not** independent APCER/BPCER/ACER results and must not be compared with ISO/NIST PAD evaluations. citeturn8search0 | **Disposable experiment only; unsuitable as production PAD.** |
| **[Silero VAD](https://github.com/snakers4/silero-vad)** | MIT; v6.2.1 release observed Feb. 24, 2026. citeturn14view0turn14view2 | ONNX/PyTorch; can run fully on-device and in browser through ORT. | JIT model ~2 MB; project reports <1 ms for a 30+ ms audio chunk on one CPU thread under its benchmark. citeturn14view0 | v6 authors report 16% fewer errors on noisy real-life data and 11% fewer on multi-domain validation than prior version, while still noting difficult unusual/high-pitched speech. These are author-reported comparisons. citeturn14view2 | **Preferred VAD, after mobile-browser testing.** |
| **[ricky0123/vad-web](https://github.com/ricky0123/vad)** | Browser-focused open project using Silero and ORT; 258 commits were visible in current repository crawl. citeturn13search15 | Web and React use cases explicitly supported. | Adds ORT/model assets. | Convenient, but open Safari/iPhone failures mean browser matrix testing is mandatory. citeturn13search28 | **Good wrapper candidate, not unquestioned dependency.** |

### Recommended hackathon stack

The preferred implementation stack is:

**UI and orchestration:** React + TypeScript + Vite, with no computer-vision inference in React components. A dedicated integrity worker owns video analysis, and an audio worklet/worker owns VAD. MediaPipe itself cautions that synchronous web video inference can block the main thread. citeturn2search6turn2search8

**Camera pipeline:** `getUserMedia` with a conservative front-camera request; display the preview at the browser’s natural rate but analyze sampled frames rather than every display frame. Face Detector should run at approximately 5–8 analysis frames/s for face-count presence, while Face Landmarker runs around 8–12 analysis frames/s on the primary face. These rates are **proposed engineering budgets**, not claimed MediaPipe performance guarantees.

**Vision:** MediaPipe Face Detector + Face Landmarker for `FACE_NOT_FOUND`, `MULTIPLE_FACES`, face-box size/centering, face-framing coaching, coarse pose, blink state and challenge response. The Face Landmarker bundle contains a BlazeFace short-range detector, a 256×256 face-mesh model and blendshape prediction. citeturn20search9

**Quality:** perform downsampled local luminance, clipped-pixel fraction, contrast/variance and simple Laplacian/high-frequency blur checks. These observations should become `LOW_LIGHT`, `OVEREXPOSED`, `CAMERA_BLURRY` or `CAMERA_OBSTRUCTED` only after temporal smoothing. OpenCV.js is unnecessary unless the team finds its tested implementation materially more reliable than a few worker-side functions.

**Identity:** lazy-load **SFace INT8** through ONNX Runtime Web only for the synthetic prototype. Align the reference and live face consistently, compute normalized embeddings locally, immediately discard cropped face pixels, and retain only similarity score/model version/quality metadata. The matching threshold must be calibrated in LicenceFlow’s own experiment rather than copied from LFW or another benchmark. SFace’s distributed INT8 file is roughly 9.9 MB. citeturn19search11turn19search0

**Liveness:** use randomized active challenges as the browser’s principal real liveness demonstration. Generate the challenge only after a live stream is established; support two or three alternatives, such as left/right head turn and blink; enforce temporal order and bounded duration; allow retries. A passive MiniFASNet-like score can be experimentally displayed as “presentation-attack suspicion” only if the experiment validates it, and it should not control pass/fail.

**Audio:** Silero VAD on 16 kHz mono input, locally, emitting only speech probability/start/end intervals. Do not record or upload normal microphone audio. `AudioWorklet` is designed for custom low-latency audio processing off the main JavaScript context. citeturn13search4turn14view0

**Networking/storage:** IndexedDB stores answer checkpoints and unsynchronized event metadata; Service Worker caches application resources. Do not trust `navigator.onLine` as the primary health signal; use a lightweight authenticated heartbeat and actual request latency/errors. citeturn6search0turn6search1turn6search3

**Exam design:** keep `knowledgeResult` and `integrityStatus` independent. A user can answer correctly while receiving an integrity status of `REVIEW_REQUIRED`; equally, a clean integrity session cannot convert an incorrect knowledge score into a pass. In a serious online exam, answer keys should remain server-side. A fully offline PWA whose scoring key is delivered to JavaScript cannot credibly claim that the answer key is secret from a technically capable user.

### Simpler fallback stack

If low-end Android performance is poor, remove features in this order:

**First remove:** passive PAD, continuous landmarks, and continuous identity inference.

**Keep:** `getUserMedia`, one MediaPipe Face Detector at 3–5 Hz, periodic Face Landmarker only during framing/liveness challenges, simple light/blur tests, visibility/fullscreen events, IndexedDB answer checkpoints and RMS-based audio activity if Silero causes problems.

**Identity fallback:** replace live face similarity with an honestly simulated screen saying that production identity verification would require an authorized biometric service. This is better than shipping a misleading or unusable matcher.

**Liveness fallback:** one randomized left/right head-turn challenge using landmarks. Avoid a blink-only requirement because eye landmarking has user-, visibility- and accessibility-dependent failure modes. Landmark-based blink research itself notes the need for thresholding over temporal windows rather than treating a single frame as a blink. citeturn20search4

### Proposed browser performance budgets

These are **acceptance targets to validate experimentally**, not sourced claims about guaranteed performance:

| Resource | Low-end Android target | Mid-range Android target |
|---|---:|---:|
| Camera capture | 640×480 minimum useful stream | 640×480 or 720p |
| Face-count detector | ≥5 analysis FPS | ≥8–10 analysis FPS |
| Face landmarks during challenge | ≥8 analysis FPS | ≥12 analysis FPS |
| Per-landmarker-frame p50 | <120 ms | <60 ms |
| Main-thread blocking from inference | effectively zero; worker-owned | effectively zero |
| Total lazily downloaded ML assets | preferably <15 MB normal path; <25 MB with optional identity | same |
| Identity inference | one-shot / infrequent | one-shot / infrequent |
| Passive PAD | challenge window only | challenge window only |
| Audio VAD | continuous only when microphone monitoring is disclosed/needed | same |
| Thermal stability | no major sustained FPS collapse over 15-minute test | same |
| Memory | no tab reload/OOM on 3–4 GB RAM phone | comfortable headroom |
| Network recovery | no answer loss after offline/reload test | same |

The most important battery optimization is architectural rather than micro-optimization: **do not run every model continuously**. Face verification needs only initial/recovery checks; expensive PAD, if retained at all, should run in short challenge windows; the detector can run more slowly than the camera preview.

## Recommended production-native stack and integrity-engine architecture

**Recommended production-native architecture.**

On **Android**, build a native Kotlin application around CameraX or another approved native camera capture layer, use MediaPipe native tasks for face framing/landmarks when appropriate, and place identity/PAD behind a dedicated biometric provider interface. Play Integrity should be validated **server-side** at important actions: Google states that it can return app-integrity and device-integrity verdicts and optional app-access-risk verdicts for other applications capable of capturing the screen, displaying overlays or controlling the device. Google also explicitly recommends Play Integrity as one component of a broader anti-abuse strategy rather than a sole mechanism. [Play Integrity overview](https://developer.android.com/google/play/integrity/overview), [verdicts](https://developer.android.com/google/play/integrity/verdicts). citeturn15search0turn15search3

Android native adds controls the PWA does not have. `FLAG_SECURE` asks Android to block screenshots/non-secure displays; Android 12 introduced `HIDE_OVERLAY_WINDOWS`/`setHideOverlayWindows()` protections; Android 14 introduced a screenshot-detection callback, though Google documents that the callback does not cover every screenshot mechanism; and current Play Integrity app-access-risk verdicts can indicate apps with capturing, controlling or overlay capabilities. [Secure sensitive activities](https://developer.android.com/security/fraud-prevention/activities), [Tapjacking guidance](https://developer.android.com/privacy-and-security/risks/tapjacking), [Screenshot detection](https://developer.android.com/about/versions/14/features/screenshot-detection). citeturn17search0turn17search1turn17search7

This still is not absolute lockdown. Google’s own documentation notes caveats to `FLAG_SECURE`, screenshot detection has defined blind spots, overlay mitigations can interact with legitimate applications, and integrity verdicts can be unavailable. A production application should therefore distinguish `ATTESTATION_UNAVAILABLE` from `ATTESTATION_FAILED`, and should account for legitimate accessibility services rather than treating accessibility use as inherently hostile. Play Integrity’s app-access-risk system expressly excludes certain verified accessibility tools. citeturn15search3turn17search9

On **iOS/iPadOS**, use AVFoundation/native camera capture or approved biometric SDK capture, App Attest for server-facing app authenticity, and Automatic Assessment Configuration where the operator and use case qualify for Apple’s restricted entitlement. Apple describes Automatic Assessment Configuration as a way to enter single-app assessment mode and prevent access to specified system features; Apple’s 2026 assessment material still describes the entitlement as restricted. [Automatic Assessment Configuration](https://developer.apple.com/documentation/automaticassessmentconfiguration), [WWDC26 assessment](https://developer.apple.com/videos/play/wwdc2026/230/). citeturn16search1turn16search16

Apple App Attest allows a server to validate assertions associated with the published app and a genuine Apple-device security path; Apple describes it as a mechanism for ensuring requests originate from an unmodified app that you distributed. It is **not** a reason to state that every possible jailbreak/runtime manipulation is impossible. [Apple App Attest validation](https://developer.apple.com/documentation/devicecheck/validating-apps-that-connect-to-your-server), [Apple WWDC App Attest](https://developer.apple.com/videos/play/wwdc2021/10110/). citeturn16search0turn16search19

iOS also exposes notification of user screenshots and capture-state changes such as screen recording/mirroring through UIKit APIs. Detection is not equivalent to universal screenshot prevention outside a stronger assessment/managed environment. [UIApplication screenshot notification](https://developer.apple.com/documentation/uikit/uiapplication/userdidtakescreenshotnotification), [UIScreen.isCaptured](https://developer.apple.com/documentation/uikit/uiscreen/iscaptured). citeturn18search0turn18search1

For **actual production biometric verification/PAD**, open research weights should not be the default security root. Procure or formally approve a biometric engine with explicit commercial/government deployment rights, reproducible threshold documentation, relevant independent 1:1 evaluation, and PAD test evidence appropriate to the expected attack instruments. ISO/IEC 30107-3 defines APCER as attack presentations of a PAI species incorrectly classified as bona fide and BPCER as bona-fide presentations incorrectly classified as attacks; NIST independently evaluates both face verification and, in dedicated evaluations, software PAD. [ISO/IEC 30107-3:2023 preview](https://www.iso.org/obp/ui/), [NIST FRTE 1:1](https://pages.nist.gov/frvt/html/frvt11.html), [NIST FATE PAD](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based). citeturn21search6turn21search4turn21search7

### Processing placement

| Processing | Browser/on-device | Authorized LicenceFlow service | Approved government/proctoring integration only |
|---|---|---|---|
| Camera/mic readiness | **Yes** | No raw media needed | No |
| Face count/framing | **Yes** | Event metadata only | No |
| Light/blur/obstruction | **Yes** | Event metadata only | No |
| Head pose/blink challenge | **Yes** | Challenge nonce/outcome can be verified/synchronized | No |
| Voice activity | **Yes** | Normally only timestamps/probabilities | No |
| Synthetic prototype face similarity | **Yes** | Prefer score only | No |
| Production identity document/reference retrieval | No | Only if explicitly authorized by actual operator | **Yes where official policy requires** |
| Production biometric decision | Native/on-device where approved SDK supports it | Often server policy/verification | **Potentially required** |
| Device/app attestation | Native app obtains token | **Server verifies** | Operator policy may consume result |
| Test question authorization | Cache authorized payloads | **Yes** | Official test service where applicable |
| Knowledge scoring | Local provisional only | **Authoritative online scoring preferred** | Official system if integrated |
| Risk/event aggregation | Local UX state | **Yes** for durable review state | Official proctoring if policy requires |
| Continuous A/V recording | **No by default** | **No by default** | Only where explicitly authorized, necessary, disclosed and governed |
| Official licence issuance/status | No | No | **Official government integration only** |

### Modular integrity engine

The integrity engine should have five deliberately separate layers:

**Observation layer.** Sensors/models emit factual measurements: face count, detector confidence, bounding box, brightness score, blur score, speech probability, visibility state, network latency.

**Signal layer.** Temporal logic converts those measurements into explainable events such as `FACE_NOT_FOUND` only after a persistence window, rather than reacting to one noisy frame.

**Risk layer.** A policy module considers recency, repetition, quality and corroboration. It must never overwrite the underlying measurements.

**Response layer.** A separate UX policy chooses coaching, continue, pause, retry, accommodation pathway or manual review.

**Review layer.** Stores human-review state independently from both model confidence and knowledge score.

A proposed event record is:

| Field | Purpose |
|---|---|
| `eventId` | Random event identifier |
| `sessionId` | Pseudonymous exam-session identifier, not an identity number |
| `sequence` | Monotonically increasing session sequence |
| `observedAt` | Client observation time |
| `receivedAt` | Server time when synchronized |
| `code` | Stable event code |
| `source` | `camera`, `face-detector`, `landmarker`, `vad`, `browser`, `network`, `storage`, `native-integrity` |
| `model` | Model/runtime/version where applicable |
| `observation` | Minimal scalar facts, e.g. `faceCount: 2`, not a camera image |
| `confidence` | Model confidence when it genuinely has that semantics |
| `quality` | Capture-quality context so weak evidence can be discounted |
| `durationMs` | Persistence interval where applicable |
| `challengeId` | Randomized liveness challenge identifier, if applicable |
| `riskContribution` | Policy-layer value, kept separate from raw confidence |
| `recommendedAction` | `CONTINUE`, `COACH`, `PAUSE`, `RETRY`, `REVIEW` |
| `reviewStatus` | `NOT_REQUIRED`, `PENDING`, `CLEARED`, `ESCALATED` |
| `prevDigest` | Optional local sequence digest for corruption/reordering detection |
| `serverReceipt` | Server-signed checkpoint reference after synchronization |

Useful event vocabulary includes:

`FACE_NOT_FOUND`, `MULTIPLE_FACES`, `FACE_TOO_SMALL`, `FACE_OFF_CENTER`, `LOW_LIGHT`, `OVEREXPOSED`, `CAMERA_BLURRY`, `CAMERA_OBSTRUCTED`, `CAMERA_PERMISSION_DENIED`, `CAMERA_STREAM_STOPPED`, `MIC_PERMISSION_DENIED`, `VOICE_ACTIVITY_DETECTED`, `BACKGROUND_SPEECH_PATTERN`, `VISIBILITY_LOST`, `FULLSCREEN_LOST`, `NETWORK_DEGRADED`, `NETWORK_OFFLINE`, `CHECKPOINT_SAVED_LOCAL`, `CHECKPOINT_SYNCED`, `LIVENESS_CHALLENGE_STARTED`, `LIVENESS_CHALLENGE_PASSED`, `LIVENESS_RETRY_REQUIRED`, `PRESENTATION_ATTACK_SUSPECTED`, `IDENTITY_MATCH_UNCERTAIN`, `MODEL_UNAVAILABLE`, `CAPABILITY_DEGRADED` and, in a future native application, `APP_ATTESTATION_UNAVAILABLE`, `APP_INTEGRITY_RISK`, `SCREEN_CAPTURE_RISK` and `OVERLAY_RISK`.

There should deliberately be **no `CHEATING_DETECTED` event generated by a biometric model**.

### Risk and response policy

A transparent policy should prioritize persistence and corroboration:

| Situation | Risk interpretation | Response |
|---|---|---|
| Face disappears for 0.5 s during motion | Probably noise | Continue |
| Face absent persistently while camera quality is good | Session continuity problem | Pause; ask user to re-center |
| Face absent while `LOW_LIGHT` is active | Quality failure, not suspicious behavior | Fix lighting first; discount integrity risk |
| Second face appears for one detector frame | Detector uncertainty possible | No accusation; wait for persistence |
| Second face persists several seconds | Meaningful integrity anomaly | Pause, explain, allow environment correction; record for review |
| Speech activity once | Ambiguous | Normally no user interruption |
| Repeated speech activity + multiple-face event | Corroborated anomaly but still not proof | Manual-review flag; do not auto-fail |
| Visibility lost once from OS interruption | Ambiguous | Resume with warning/checkpoint |
| Repeated long visibility losses | Stronger interruption signal | Pause/review according to stated test rules |
| Liveness challenge fails in low light | Poor observation quality | Improve conditions and retry |
| High-quality capture fails randomized liveness twice | Identity assurance unresolved | Stop identity-gated start and require retry/manual review, not “cheating” |
| Identity similarity close to threshold | Model uncertainty | Acquire another high-quality sample/manual review |
| Camera stops | Technical prerequisite missing | Pause test safely |
| Network fails | Connectivity failure | Local checkpoint; resume/sync when available |

Local hash chaining is worth using for corruption, ordering and synchronization diagnostics, but **must not be marketed as browser tamper-proofing**. A hostile modified client that controls the JavaScript can generate a new internally consistent chain. Server-signed receipts after synchronization make already-acknowledged history harder to rewrite without detection, but they do not make unsynchronized browser observations trustworthy.

## Privacy, security, bias and accessibility analysis and disposable experiment plan

**Privacy and data minimization.** The architecture should process camera frames and audio windows ephemerally and locally. Routine operation should persist neither video nor audio. Face embeddings are still linkable biometric-derived personal information and should not be described as anonymous merely because the original image cannot trivially be reconstructed. Store the minimum useful output: event type, timestamps, model version, coarse confidence/quality values and, for prototype identity comparison, preferably only the resulting similarity/decision metadata rather than the raw embedding.

India’s Digital Personal Data Protection Act defines personal data broadly as data about an identifiable individual; where consent is used, the Act says it must be free, specific, informed, unconditional and unambiguous and limited to data necessary for the specified purpose. It also requires reasonable security safeguards and, subject to legally required retention, provides for erasure when consent is withdrawn or the purpose is no longer served. [Digital Personal Data Protection Act, 2023 — MeitY](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf). citeturn22search0

Accordingly, a LicenceFlow prototype consent notice should separately explain why camera access is needed, why microphone access is requested, which computations occur locally, whether any derived metadata leaves the phone, retention duration, deletion mechanism and the consequences of refusing an optional signal. Camera/microphone permissions should not be disguised as proof of identity or official government requirements.

The Act also gives the user an option to access consent notices in English or an Eighth Schedule language and contains additional requirements for processing data of children and persons with disability who have a lawful guardian. A production deployment serving such users therefore requires legal/product review rather than assuming every candidate is an adult able to complete a standard blink/head-turn/audio flow. citeturn22search0

For LicenceFlow, provide the core notice and consent in **English and Hindi**. Hinglish can be a helpful additional explanation, but should not replace the formal language version. The precise commencement, transition and operational implications of India’s 2025 DPDP Rules should be checked by deployment counsel against the latest Gazette/MeitY material before production; MeitY currently maintains a dedicated [Digital Personal Data Protection Rules 2025](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa) resource, but this research does not infer an official retention period for learner-licence biometrics from it. citeturn22search1

**Bias.** Face verification thresholds must not be imported unquestioningly from LFW, MegaFace or a vendor’s global benchmark. NIST’s demographic evaluations have repeatedly found algorithm-dependent demographic differentials in face recognition, and current FRTE continues as an ongoing evaluation program. [NIST demographic effects](https://pages.nist.gov/frvt/html/frvt_demographics.html), [NIST FRTE 1:1](https://pages.nist.gov/frvt/html/frvt11.html). citeturn21search0turn21search4

There is even less basis for claiming India-specific fairness from generic open PAD models. The upstream Silent-FAS project acknowledges dependence on camera model and scene; NIST evaluates passive PAD by attack type because presentation instruments produce different error behavior. citeturn8search0turn21search7 LicenceFlow therefore needs local testing across darker and lighter skin tones, front-camera quality tiers, indoor daylight, fluorescent/LED rooms, backlighting, spectacles, facial hair, head coverings where face geometry remains visible, and realistically dirty/low-quality lenses. The test should report strata rather than one aggregate accuracy number.

**Accessibility.** Head turning, blinking, holding a pose, speaking and looking at a target can each be inaccessible to some people. Therefore challenge selection should be capability-based: allow an alternative to blink, an alternative to head motion, a no-audio pathway when policy permits, extended timing and manual verification rather than assigning risk because the user cannot perform a motor/speech/vision-dependent action. A disability-related failure must never contribute the same risk as a high-quality challenge that is clearly inconsistent with the requested temporal sequence.

**Gaze should carry almost no integrity weight.** Recent webcam-gaze research continues to show substantial subject, pose and domain sensitivity. One 2026 subject-disjoint study reported that error on unseen users more than doubled relative to a naive split in its experiment and documented large per-user spreads. This makes gaze appropriate for optional “please keep the device in a comfortable position” UX, not a cheating decision. [Auditing Per-User Reliability in Webcam-Based Gaze Estimation](https://www.mdpi.com/2076-3417/16/15/7630). citeturn20search3

### Disposable technical experiment plan

These experiments should be throwaway pages/workers, not foundations of the application. All success numbers below are **engineering acceptance criteria proposed for LicenceFlow**, not published product accuracy claims.

| Experiment | Question and candidate | Minimal implementation | Devices and scenarios | Success/failure and measurements | Effort / privacy |
|---|---|---|---|---|---|
| **Face presence/framing** | Can MediaPipe Face Detector/Landmarker remain stable on inexpensive Android cameras? | Camera preview → worker detector → box/landmarks → CSV/JSON performance metrics. | At least one 3–4 GB low-end Android phone, one mid-range Android, one current high-end Android; Chrome stable. Also iPhone Safari sanity test. Test daylight, dim room, backlight, glasses, ±30° pose, near/far face. | Measure detection rate in intentionally valid frames, false absence, box jitter, p50/p95 inference, analysis FPS, main-thread long tasks. Fail if ordinary well-lit use regularly loses the face or low-end device cannot sustain ~5 detector FPS. | **0.5–1 engineer-day.** Consenting testers; no retained images, only metrics. |
| **Multiple faces** | Can detector distinguish one from two visible people without excessive false alarms? | Detector configured for several faces; temporal confirmation over consecutive frames. | Same devices. One face, second face entering edge/center/background, face on poster/TV, very small second face. | Record precision/recall for “>1 visible human face” on hand-labelled clips; choose minimum box-size criterion. Fail if normal posters/background faces create persistent false alarms. | **0.5 day.** Delete clips after scoring; store labels/statistics only. |
| **Poor light/blur/obstruction** | Do inexpensive image heuristics provide useful coaching? | Downsample to small grayscale buffer; luminance/clipping, variance and Laplacian-like sharpness. | Normal room, low lux, backlight, lens partly/fully covered, fingerprints, motion blur, low-resolution front camera. | Plot metric distributions and choose thresholds to minimize warnings on acceptable frames. Success means clearly dark/covered cases separate from normal usage; ambiguous cases should be `QUALITY_UNCERTAIN`, not fail. | **0.5 day.** No image retention required. |
| **Identity comparison** | Is SFace INT8 usable fast enough and sufficiently separated for a synthetic identity demo? | Align synthetic/consented reference + live capture → SFace via ORT → cosine similarity; log score only. | Low/mid Android Chrome; 20–30 consenting participants if available, multiple genuine captures plus nonmatching pairs; varied lighting. | Build ROC, report empirical FAR/FRR with confidence intervals and quality-stratified results. Do **not** claim low FAR that the small sample cannot statistically demonstrate. Measure model download, warm-up, p50/p95. Fail if genuine/impostor distributions overlap too much or device cost is excessive. | **1–2 days.** Reference images kept only for the test with written consent; delete afterward. |
| **Active liveness** | Can MediaPipe landmarks support randomized challenges with low genuine-user failure? | Random challenge generator; temporal FSM for left/right turn and blink; record only challenge transitions. | Genuine users including spectacles and varied lighting; static printed photo; static screen photo; ordinary prerecorded talking/head-motion video. | Measure genuine completion/retry rate, completion time, and attack success by type. Failure means high genuine retry or attack video frequently satisfies random sequence. | **1 day.** No video retention. Include accessible alternative challenge. |
| **Simple replay/PAD** | Does a MiniFASNet-style RGB model add information beyond active challenge? | Convert/obtain legally traceable ONNX model; score cropped face only during 3–5 s test window. | Real face, glossy/matte print, another phone/tablet with photo, screen video at varying brightness and refresh rates. | Report **APCER and BPCER separately for each PAI type** at chosen threshold; do not report a generic “accuracy”. Compare held-out display devices. Reject from product if cross-device performance collapses. [ISO metric definitions](https://www.iso.org/obp/ui/) citeturn21search6 | **1–2 days.** No capture retention after evaluation. |
| **Voice activity** | Can Silero detect ordinary Hindi/English/Hinglish speech and common room noise without recordings? | Web Audio/AudioWorklet → 16 kHz frames → Silero ONNX or `vad-web`; log probability/timing only. | Android Chrome plus Safari; silence, fan, traffic, TV speech, normal voice, soft voice, whisper, Hindi/English/Hinglish. | Measure speech onset/offset latency, false-positive time during nonspeech noise and missed-speech time. Explicitly test the open iPhone packaging issue. Fail over to RMS indicator if wrapper is unreliable. | **0.5–1 day.** Process in memory; do not save speech. |
| **Thermal/mobile endurance** | Can the combined stack survive a realistic exam without throttling or tab death? | Integrate detector + periodic landmarks + VAD + IndexedDB logging in a throwaway page; identity once; liveness every few minutes. | Low-end/mid Android on battery, Chrome, 20–30-minute continuous run. | Log FPS, p95 inference, dropped frames, worker backlog, tab reload, approximate battery delta and thermal/FPS degradation. Fail if analysis FPS falls >~20% or browser becomes unstable; then reduce sampling/model count. | **1 day.** Synthetic events only. |
| **Offline checkpoint/recovery** | Are answers preserved through network loss, reload and duplicate sync? | IndexedDB answers + sequence; forced offline; restart; idempotent sync endpoint or mock server. | Android Chrome, airplane mode, flaky network, browser reload, duplicate POST, clock change. | Zero answer loss; deterministic duplicate handling; recovery without relying solely on `navigator.onLine`. | **0.5–1 day.** Use synthetic question data. |

The PAD experiment must resist the common mistake of comparing incompatible numbers. NIST’s PAD evaluation and ISO metrics are attack- and scenario-dependent; an ACER from one academic dataset cannot be declared “better” than another model’s TPR/FPR on a different private dataset. citeturn21search7turn21search6 Likewise, face-verification metrics from LFW cannot substitute for a threshold study on LicenceFlow’s camera/reference conditions.

## Technologies explicitly rejected and remaining unknowns

**Technologies explicitly rejected.**

**InsightFace open pretrained packages without a commercial model licence:** reject for deployment. InsightFace now clearly states that packages such as `buffalo_l`, `antelopev2`, `buffalo_s` and related models require separate commercial rights even though the code is MIT. [InsightFace licensing](https://www.insightface.ai/solutions/face-recognition-licensing). citeturn19search29

**PocketNet weights/repository as a deployment basis:** reject because the published repository uses CC BY-NC-SA 4.0, which is incompatible with a clean commercial path. [PocketNet](https://github.com/fdbtrs/PocketNet). citeturn10search1

**Random MobileFaceNet/ArcFace GitHub weights:** reject unless the exact weight licence and training-data provenance are established. “MIT repository” is not enough when model weights originate from separately restricted face datasets/packages. MobileFaceNets itself is an architecture paper, not a universal licence for all models bearing the name. [MobileFaceNets](https://arxiv.org/abs/1804.07573). citeturn9search2

**Silent-Face-Anti-Spoofing as production liveness/PAD:** reject. It remains useful as a small feasibility model, but maintenance is weak and its headline figures are author-reported rather than independent ISO/NIST PAD evidence. citeturn8search0turn8search3

**AuraFace in the PWA:** reject on size. Its principal ONNX face-recognition model is roughly 261 MB, far beyond the desired low-end mobile model budget. [AuraFace files](https://huggingface.co/fal/AuraFace-v1/tree/main). citeturn11search30

**OpenCV.js as the main inference/runtime layer:** reject as the default architecture, not as a library. MediaPipe and ORT directly cover the required ML tasks, while simple light/blur calculations do not justify another large always-loaded runtime.

**TensorFlow.js as an additional default runtime:** do not load it unless a selected model specifically requires TFJS. MediaPipe + ONNX Runtime already cover the proposed stack. A third ML runtime increases download, memory and debugging surface without a current feature benefit. [TensorFlow.js](https://www.tensorflow.org/js), [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html). citeturn3search4turn0search0

**Gaze-based cheating detection:** reject. Gaze error depends strongly on user, head pose, calibration and dataset/domain; it is not reliable enough to adjudicate integrity from a commodity front-facing camera. citeturn20search3

**“Whisper cheating detector” or VAD-as-speaker-attribution:** reject. VAD answers whether audio resembles speech, not who spoke, what was said or why. citeturn14view0

**Browser screenshot, screen-recording or overlay prevention claims:** reject. Those controls belong to native/managed assessment environments. Android specifically exposes native APIs such as `FLAG_SECURE`, overlay protection and screenshot callbacks precisely because these are platform-level capabilities. citeturn17search7turn17search9

**Browser virtual-camera detection as a security guarantee:** reject. The browser’s capture APIs do not provide a hardware-backed provenance assertion for a physical camera. This is an architectural inference from `getUserMedia`/device enumeration. citeturn5search0turn5search3

**Browser anti-DevTools or anti-modified-client tricks:** reject. Obfuscation, keyboard shortcuts and DevTools detection create friction, not a security boundary. Critical authorization belongs server-side; production mobile adds platform attestation.

**Continuous video/audio recording:** reject as LicenceFlow’s default design. None of the proposed normal signals requires storing an entire examination recording; local frame/audio-window inference is both more privacy-preserving and substantially cheaper.

### Remaining unknowns

Several questions should remain explicitly open rather than be filled with invented certainty.

**Low-end Android performance is not yet known.** None of the primary MediaPipe/ORT sources provides a credible current FPS benchmark for LicenceFlow’s exact multi-model PWA on inexpensive Indian Android hardware. The feasibility tests, not flagship benchmark numbers, must answer this.

**No open PAD model examined here has the evidence required for production.** A production procurement must identify an exact SDK/model version, exact tested attack instruments, ISO/IEC 30107-3 report where relevant, APCER/BPCER operating point, device/camera constraints, demographic analysis and licence terms. NIST’s currently published FATE PAD material demonstrates why attack-specific independent testing matters. citeturn21search7turn21search3

**The production face-verification model remains a procurement decision.** SFace is acceptable for a synthetic hackathon comparison, but it has not been established here as an official-government-quality biometric system or validated on a Madhya Pradesh learner population.

**Face-model training-data provenance remains a legal/ethical review item.** Even where a model file has a permissive licence, historic face-recognition training sets frequently involved web-collected data; software/model licensing and lawful/ethical data provenance are separate questions. The SFace paper itself describes training on CASIA-WebFace, VGGFace2 and MS-Celeb-1M-related datasets. citeturn19search0

**India-specific fairness is unknown until measured.** NIST establishes that demographic differentials can exist, but does not replace a local evaluation spanning Indian skin tones, camera qualities, lighting, age ranges and accessibility needs. citeturn21search0

**Apple assessment entitlement eligibility is not automatic.** Apple describes Automatic Assessment Configuration as a restricted entitlement, and current 2026 documentation/support discussions continue to reflect entitlement provisioning requirements. citeturn16search4turn16search16

**Official Madhya Pradesh/Parivahan/Sarathi behavior is deliberately outside this prototype research.** LicenceFlow must not infer government rules from this architecture or represent any simulated identity, payment, test or proctoring step as an official workflow.

**The exact current legal retention/consent policy for a future real operator must be separately established.** The DPDP Act supplies broad statutory duties, but this technical research does not invent a government biometric-retention period or determine which exceptions would apply to a future authorized public-sector deployment. citeturn22search0

## Final implementation decision matrix and complete source appendix

### Final implementation decision matrix

| LicenceFlow feature | Decision | Implementation interpretation |
|---|---|---|
| Pre-payment/device readiness screen | **IMPLEMENT FOR REAL** | Actually open/test camera and mic, report resolution/capture status and required browser features. |
| Camera permission | **IMPLEMENT FOR REAL** | Browser-native permission/capture handling. |
| Microphone permission | **IMPLEMENT FOR REAL** | Browser-native permission/capture handling. |
| Face presence | **IMPLEMENT FOR REAL** | MediaPipe observation, with quality-aware retries. |
| Face framing | **IMPLEMENT FOR REAL** | Bounding-box and landmark geometry. |
| Multiple visible faces | **IMPLEMENT FOR REAL** | Detector count with temporal persistence; explicitly limited to visible FOV. |
| Darkness / overexposure | **IMPLEMENT FOR REAL** | Local pixel-quality measurement. |
| Blur / camera obstruction | **IMPLEMENT FOR REAL** | Local image-quality metrics; coaching signal only. |
| Identity-photo vs live-face comparison | **IMPLEMENT AS LIMITED SIGNAL** | SFace INT8/ORT for synthetic prototype; similarity is not identity proof. |
| Passive RGB liveness | **SIMULATE HONESTLY** by default | Experimental MiniFAS score only if feasibility results are good; never authoritative. |
| Randomized active liveness | **IMPLEMENT FOR REAL** | Landmark temporal challenge; label as challenge-response, not unbeatable liveness. |
| Printed-photo attack | **IMPLEMENT AS LIMITED SIGNAL** | Active challenge can catch obvious static presentation; optionally experimental PAD. |
| Photo shown on another phone | **IMPLEMENT AS LIMITED SIGNAL** | Same, with explicit uncertainty. |
| Prerecorded video replay | **IMPLEMENT AS LIMITED SIGNAL** | Randomized challenge increases difficulty; no guarantee. |
| Deepfake/real-time face swap | **SIMULATE HONESTLY** | UI can explain production capability requirement; do not claim robust detection. |
| Sophisticated mask attack | **REJECT** in browser | Commodity RGB PWA cannot support a strong mask-PAD claim. |
| Head pose | **IMPLEMENT FOR REAL** | Landmark/transformation-matrix challenge signal. |
| Blink | **IMPLEMENT AS LIMITED SIGNAL** | Real measurement, but accessibility and visibility limitations require alternatives. |
| Gaze direction | **IMPLEMENT AS LIMITED SIGNAL** only if shown | Low-weight UX hint; never cheating evidence. |
| Voice activity | **IMPLEMENT FOR REAL** | Local Silero VAD; no audio recording. |
| Multiple-speaker detection | **SIMULATE HONESTLY** | Do not run heavy/uncertain diarization in hackathon baseline. |
| Whisper/background prompting | **IMPLEMENT AS LIMITED SIGNAL** | Speech/noise anomaly only; no speaker/intent conclusion. |
| Tab/page hidden | **IMPLEMENT FOR REAL** | `visibilitychange` event. |
| Fullscreen loss | **IMPLEMENT FOR REAL** where supported | Record state change; cannot enforce fullscreen. |
| Prevent app switching | **DEFER TO NATIVE PRODUCTION** | Browser cannot enforce; iOS assessment/native policy and platform controls are fundamentally stronger. |
| Detect/prevent screenshots | **DEFER TO NATIVE PRODUCTION** | Android native has `FLAG_SECURE`/capture APIs; iOS has native capture notifications/assessment controls. |
| Screen-recording protection | **DEFER TO NATIVE PRODUCTION** | Native/platform-dependent; still not absolute. |
| Overlay protection | **DEFER TO NATIVE PRODUCTION** | Android `HIDE_OVERLAY_WINDOWS`, Play Integrity app-access-risk, related controls. |
| Accessibility-service abuse detection | **DEFER TO NATIVE PRODUCTION** | Platform integrity/access-risk controls; preserve legitimate accessibility. |
| Rooted/compromised Android signal | **DEFER TO NATIVE PRODUCTION** | Play Integrity device/app verdicts, verified server-side. |
| iOS app authenticity | **DEFER TO NATIVE PRODUCTION** | App Attest with server verification. |
| Virtual-camera detection in web | **REJECT** | No trustworthy physical-camera provenance API. |
| Developer-tools detection | **REJECT** | Not a security boundary. |
| Modified PWA/client detection | **REJECT** as a browser guarantee | Server controls can constrain consequences but cannot make client-generated observations inherently trusted. |
| Network degradation | **IMPLEMENT FOR REAL** | Real heartbeat/request health, not `navigator.onLine` alone. |
| Offline answers | **IMPLEMENT FOR REAL** | IndexedDB checkpointing. |
| Automatic synchronization | **IMPLEMENT FOR REAL** | Idempotent foreground sync; Background Sync optional. |
| Tamper-proof offline answers | **REJECT** as a browser claim | Hashes help integrity diagnostics but a hostile client controls pre-sync state. |
| Secure question authorization | **IMPLEMENT FOR REAL** for online demo architecture | Server-authorized question/session payload; avoid shipping secret answer key when security matters. |
| Separate knowledge score | **IMPLEMENT FOR REAL** | Independent result object. |
| Separate integrity/proctoring status | **IMPLEMENT FOR REAL** | `CLEAR/RETRY/REVIEW/INCOMPLETE`, not merged with score. |
| Automatic “cheater” verdict | **REJECT** | Use transparent observations, confidence, risk and review states instead. |
| Continuous A/V recording | **REJECT** by default | Local inference and minimal metadata. |
| Government identity/UIDAI/Parivahan integration | **DEFER TO NATIVE PRODUCTION / APPROVED INTEGRATION** | Prototype must not imitate an authoritative integration. |
| SmartLock-equivalent browser claim | **REJECT** | Explicitly false framing for a PWA. |

### Complete source appendix

Access date for all live sources below: **August 22, 2026**. “Undated/live” means the source is maintained documentation or a repository page for which a reliable publication date was not exposed; no date has been invented.

| Source | Publication/update date | Exact claim supported |
|---|---|---|
| **Google AI Edge, [Face landmark detection guide](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)** | Updated Aug. 17, 2026 | Face Landmarker provides 478 3D landmarks, blendshapes, transformation matrices; bundle includes a 192×192 detector and 256×256 face mesh. citeturn2search0turn20search9 |
| **Google AI Edge, [Face Detector for Web](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/web_js)** | Live documentation | Web package/API, face boxes/keypoints, synchronous video calls that can block the UI thread. citeturn2search6 |
| **Google AI Edge, [Face Landmarker for Web](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js)** | Live documentation | Browser Face Landmarker use and synchronous inference/main-thread warning. citeturn2search8 |
| **Google AI Edge / MediaPipe, [repository licence](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE)** | Live repository | MediaPipe source is Apache License 2.0. citeturn1search3 |
| **Bazarevsky et al./Google Research, [BlazeFace: Sub-millisecond Neural Face Detection on Mobile GPUs](https://research.google/pubs/blazeface-sub-millisecond-neural-face-detection-on-mobile-gpus/)** | 2019 | BlazeFace is a mobile-oriented detector; author-reported flagship performance is very high but is not a LicenceFlow low-end-browser benchmark. citeturn2search2 |
| **Microsoft, [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)** | Live documentation | Browser execution-provider compatibility; WASM broad support, WebGPU narrower, WebGL maintenance mode. citeturn0search0 |
| **Microsoft, [ONNX Runtime releases](https://github.com/microsoft/onnxruntime/releases)** | v1.28.1 Aug. 18, 2026 in current crawl | ORT remains actively released in 2026. citeturn0search1 |
| **TensorFlow, [TensorFlow.js](https://www.tensorflow.org/js)** | Live documentation | TFJS executes machine-learning models in JavaScript/browser environments. citeturn3search4 |
| **TensorFlow, [tfjs repository/releases](https://github.com/tensorflow/tfjs/releases)** | Live release history | TFJS remains available, but observed formal release cadence is slower than ORT’s current cadence. citeturn3search1 |
| **OpenCV, [Introduction to OpenCV.js](https://docs.opencv.org/4.10.0/df/d0a/tutorial_js_intro.html)** | OpenCV 4.10 documentation | OpenCV computer-vision operations are available to browser JavaScript. citeturn3search6 |
| **OpenCV Zoo, [SFace model licence](https://github.com/opencv/opencv_zoo/blob/master/models/face_recognition_sface/LICENSE)** | Live repository | SFace model directory contains Apache License 2.0. citeturn19search19 |
| **OpenCV, [SFace model files](https://huggingface.co/opencv/face_recognition_sface/tree/main)** | Live model repository | FP32 SFace is ~38.7 MB and INT8 version ~9.9 MB. citeturn19search11 |
| **Zhong et al., [SFace: Sigmoid-Constrained Hypersphere Loss for Robust Face Recognition](https://arxiv.org/abs/2205.12010)** | May 24, 2022 | SFace training/evaluation methodology and use of CASIA-WebFace, VGGFace2, MS-Celeb-1M-related data/standard recognition benchmarks. citeturn19search0 |
| **Chen et al., [MobileFaceNets](https://arxiv.org/abs/1804.07573)** | Apr. 2018 | Author reports <1M parameters, ~4 MB, 18 ms mobile inference, 99.55% LFW and 92.59% MegaFace TAR at FAR \(10^{-6}\). citeturn9search2 |
| **InsightFace, [Face Recognition Model Licensing](https://www.insightface.ai/solutions/face-recognition-licensing)** | Live; current policy | InsightFace code and pretrained model rights are separate; model packages require commercial licensing for commercial deployment. citeturn19search29 |
| **FAL, [AuraFace v1 model card](https://huggingface.co/fal/AuraFace-v1)** | Model activity observed Aug. 16, 2024 | Model card states Apache-2.0 and publisher’s commercially-oriented data claim. citeturn11search0turn11search9 |
| **FAL, [AuraFace model files](https://huggingface.co/fal/AuraFace-v1/tree/main)** | Live repository | Main recognition ONNX file is ~261 MB. citeturn11search30 |
| **Minivision, [Silent-Face-Anti-Spoofing](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing)** | Upstream activity largely ending around 2023 in current evidence | MiniFAS model size/performance author claims, RGB camera/scene sensitivity and project implementation. citeturn8search0turn8search3 |
| **NIST — Ngan, Grother & Hom, [FATE Part 10: Performance of Passive, Software-based PAD Algorithms](https://www.nist.gov/publications/face-analysis-technology-evaluation-fate-part-10-performance-passive-software-based)** | Sept. 19, 2023 | Independent characterization of passive software-only face PAD on conventional 2D imagery. citeturn21search7 |
| **NIST, [FATE PAD evaluation page](https://pages.nist.gov/frvt/html/frvt_pad.html)** | Live | NIST PAD track status and evaluation context. citeturn21search3 |
| **ISO/IEC, [ISO/IEC 30107-3 presentation-attack testing](https://www.iso.org/obp/ui/)** | 2023 revision | Standardized PAD testing vocabulary/metrics including APCER and BPCER. citeturn21search6 |
| **NIST, [FRTE 1:1 Verification](https://pages.nist.gov/frvt/html/frvt11.html)** | New report May 8, 2026; stats updated July 2026 | Ongoing independent face-verification evaluation and separation of verification metrics from PAD. citeturn21search4 |
| **NIST, [FRTE Demographic Effects](https://pages.nist.gov/frvt/html/frvt_demographics.html)** | Live | NIST evaluates demographic differentials in face recognition; performance effects are algorithm dependent. citeturn21search0 |
| **Silero Team, [Silero VAD](https://github.com/snakers4/silero-vad)** | Live; v6.x current | MIT licence, ~2 MB model claim, 8/16 kHz support, local ONNX execution and author performance claims. citeturn14view0 |
| **Silero Team, [Silero releases](https://github.com/snakers4/silero-vad/releases)** | v6.2.1 Feb. 24, 2026 | Active maintenance; v6 quality/edge-case changes and author comparative error-reduction claims. citeturn14view2 |
| **Ricky0123, [Voice Activity Detection for JavaScript](https://github.com/ricky0123/vad)** | Live | Browser-focused Silero/ONNX Runtime integration and React/browser use. citeturn13search15 |
| **Ricky0123/vad issue, [VAD fails on iPhone browsers](https://github.com/ricky0123/vad/issues/227)** | Sept. 8, 2025 | Evidence that mobile Safari/iPhone packaging cannot be assumed to work without testing. citeturn13search28 |
| **Mozilla MDN, [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)** | Live documentation | Browser camera/microphone capture requires permission and exposes device/capture failures. citeturn5search0 |
| **Mozilla MDN, [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)** | Live documentation | Pages can observe transitions between visible and hidden states. citeturn5search1 |
| **Mozilla MDN, [fullscreenchange](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event)** | Live documentation | Fullscreen entry/exit can generate a non-cancelable state-change event. citeturn5search2 |
| **Mozilla MDN, [enumerateDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices)** | Live documentation | Browser exposes media-device enumeration, but the documented interface contains no hardware-backed camera-provenance attestation. The security conclusion is an inference from the API surface. citeturn5search3 |
| **Mozilla MDN, [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)** | Live documentation | Structured browser-local persistent storage suitable for offline application state. citeturn6search0 |
| **Mozilla MDN, [Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)** | Live documentation | Service workers support offline-first cached application resources in secure contexts. citeturn6search1 |
| **Mozilla MDN, [Background Synchronization API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)** | Live documentation | Background Sync exists but has limited/experimental availability and should not be the sole sync mechanism. citeturn6search6 |
| **Mozilla MDN, [Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)** | Live documentation | `onLine` uses heuristics and should not be treated as authoritative service reachability. citeturn6search3 |
| **Mozilla MDN, [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** | May 11, 2026 page update in current crawl | Browser-native graph for audio acquisition/processing. citeturn13search1 |
| **Mozilla MDN, [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)** | May 9, 2025 page update | Custom audio processing executes in a separate audio processing context/thread suitable for low-latency processing. citeturn13search4 |
| **Dewi et al., PeerJ Computer Science, [Adjusting eye aspect ratio for strong eye blink detection based on facial landmarks](https://pubmed.ncbi.nlm.nih.gov/35494836/)** | Apr. 18, 2022 | Blink detection from facial landmarks/EAR requires temporal and threshold logic and is affected by imaging conditions. citeturn20search4 |
| **Applied Sciences, [Auditing Per-User Reliability in Webcam-Based Gaze Estimation](https://www.mdpi.com/2076-3417/16/15/7630)** | 2026 | Demonstrates substantial unseen-user/per-user/pose variability and the risk of optimistic gaze evaluation with subject leakage. citeturn20search3 |
| **Google Android Developers, [Play Integrity overview](https://developer.android.com/google/play/integrity/overview)** | 2026 documentation | App/device integrity, optional app-access risk and recommendation to combine integrity with other anti-abuse controls. citeturn15search0 |
| **Google Android Developers, [Play Integrity verdicts](https://developer.android.com/google/play/integrity/verdicts)** | 2026 documentation | `CAPTURING`, `CONTROLLING` and `OVERLAYS` app-access-risk categories and eligibility limitations. citeturn15search3 |
| **Google Android Developers, [Secure sensitive activities](https://developer.android.com/security/fraud-prevention/activities)** | Mar. 6, 2026 | `FLAG_SECURE` behavior and Android 12 overlay protections, with documented caveats. citeturn17search9 |
| **Google Android Developers, [Tapjacking](https://developer.android.com/privacy-and-security/risks/tapjacking)** | Oct. 13, 2025 | `setHideOverlayWindows`, obscured-touch mitigations and limitations/legitimate-app tradeoffs. citeturn17search4 |
| **Google Android Developers, [Detect when users take device screenshots](https://developer.android.com/about/versions/14/features/screenshot-detection)** | Updated Aug. 14, 2026 | Android 14 screenshot callback, its defined coverage limitations and use of `FLAG_SECURE` to restrict capture. citeturn17search7 |
| **Apple Developer, [Validating apps that connect to your server](https://developer.apple.com/documentation/devicecheck/validating-apps-that-connect-to-your-server)** | Live documentation | App Attest server-validation architecture. citeturn16search0 |
| **Apple Developer, [Automatic Assessment Configuration](https://developer.apple.com/documentation/automaticassessmentconfiguration)** | Live documentation | Assessment apps can enter a restricted single-app assessment environment. citeturn16search1 |
| **Apple, [What’s new in assessment on macOS — WWDC26](https://developer.apple.com/videos/play/wwdc2026/230/)** | 2026 | Apple continues to describe Automatic Assessment Configuration as a secure assessment framework requiring a restricted entitlement. citeturn16search16 |
| **Apple Developer, [UIScreen.isCaptured](https://developer.apple.com/documentation/uikit/uiscreen/iscaptured)** | Live documentation | UIKit provides capture-state observation and a capture-state change notification. citeturn18search0 |
| **Apple Developer, [userDidTakeScreenshotNotification](https://developer.apple.com/documentation/uikit/uiapplication/userdidtakescreenshotnotification)** | Live documentation | Native iOS applications can be notified after a user screenshot. citeturn18search1 |
| **Government of India / MeitY, [Digital Personal Data Protection Act, 2023](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf)** | Aug. 11, 2023 | Definition of personal data; consent requirements; security safeguards; withdrawal/erasure provisions; child/guardian provisions; multilingual notice requirements. citeturn22search0 |
| **MeitY, [Digital Personal Data Protection Rules 2025 resource](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa)** | 2025 resource, live in 2026 | Confirms that current DPDP Rules material is maintained by MeitY; production legal interpretation must use the current operative text rather than a prototype assumption. citeturn22search1 |

**Final stack recommendation:** build LicenceFlow’s hackathon PWA with **React + TypeScript + Vite, browser-native media/visibility/storage APIs, MediaPipe Face Detector + Face Landmarker in Web Workers, local lightweight image-quality checks, ONNX Runtime Web on WASM with optional WebGPU, SFace INT8 only as a synthetic/prototype identity-similarity module, randomized MediaPipe-based active liveness, Silero VAD with no retained audio, and IndexedDB/Service Worker checkpointing; make every integrity feature emit transparent observations rather than cheating verdicts, leave passive PAD explicitly experimental, and reserve app attestation, screenshot/overlay controls, device-integrity enforcement and independently validated biometric/PAD technology for the future native Android/iOS production system.**
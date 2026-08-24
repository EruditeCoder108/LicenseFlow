LicenceFlow self-hosted MediaPipe assets

Runtime:
- Package: @mediapipe/tasks-vision
- Version: 1.0.1
- Source: the installed npm package in this repository
- Licence: Apache-2.0

Model:
- Name: MediaPipe Face Landmarker, float16 bundle, revision 1
- Source: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

SHA-256 checksums:
- face_landmarker.task: 64184E229B263107BC2B804C6625DB1341FF2BB731874B0BCC2FE6544E0BC9FF
- vision_wasm_internal.js: E170EE67DD4E16C1A6FCD8840A206687E5A59B22C20E4A902BC445B095454D73
- vision_wasm_internal.wasm: 8DA277A733926EACD0474B8704B36742D6EC3231C57A860C5B889DFF8F1DF886
- vision_wasm_nosimd_internal.js: E81D715A3D42CC3373602EB2F7AFF795D164934DB680E32496B65DAB537F9658
- vision_wasm_nosimd_internal.wasm: A28483CD42E74E855BF5EBDB6B40D9B66A5B49E35E95020BC97669E6822A3192

The SIMD and non-SIMD runtime variants are both retained because MediaPipe's
FilesetResolver selects the compatible pair for the applicant's browser.

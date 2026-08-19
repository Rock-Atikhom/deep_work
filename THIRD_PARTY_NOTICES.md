# Third-party notices

Deep Work Companion vendors a local, pinned MediaPipe release for voluntary
camera awareness. The application does not call a remote inference endpoint.

## MediaPipe Tasks Vision 0.10.35

- Package: `@mediapipe/tasks-vision@0.10.35`
- Package source: <https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-0.10.35.tgz>
- Upstream release: <https://github.com/google-ai-edge/mediapipe/tree/v0.10.35>
- License: Apache License 2.0, preserved at `public/vision/mediapipe-0.10.35-face-landmarker-float16-v1/LICENSE-MediaPipe.txt`
- Vendored runtime paths: `vision_wasm_internal.js`, `vision_wasm_internal.wasm`, `vision_wasm_module_internal.js`, `vision_wasm_module_internal.wasm`, `vision_wasm_nosimd_internal.js`, and `vision_wasm_nosimd_internal.wasm`

## Face Landmarker model

- Model: Face Landmarker `float16/1`
- Source: <https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task>
- Local path: `public/vision/mediapipe-0.10.35-face-landmarker-float16-v1/face_landmarker.task`

## Model cards

The release retains the official model cards alongside the local model and
runtime:

- [BlazeFace short-range model card](https://storage.googleapis.com/mediapipe-assets/MediaPipe%20BlazeFace%20Model%20Card%20%28Short%20Range%29.pdf)
- [Face Mesh V2 model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf)
- [Blendshape V2 model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Blendshape%20V2.pdf)

Their local copies, plus the upstream license and release notice, are included
in the pinned release directory. SHA-256 digests and byte counts are recorded
in `src/vision/generated/release-manifest.json` and verified before use.

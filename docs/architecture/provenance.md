# Provenance

Deep Work Companion reuses the camera lifecycle shape from the owner-approved
Smart Smile repository. The reuse is limited to camera permission, stream
attachment, abort and generation handling, visibility recovery, warm-up, and
track cleanup. No Smart Smile product copy, identity data, frame data, or
camera-analysis results are included here.

| Source                                                                                                | Commit                                     | Destination                                                              | Purpose                                                                                                          |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `Rock-Atikhom/smile_detection` `apps/web/src/camera/session.ts`                                       | `4b78615bcc32eb9579fb39020df02ca59943ca09` | `src/camera/session.ts`                                                  | Adapted consent-safe `MediaStream` lifecycle for desktop Deep Work Companion sessions.                           |
| `Rock-Atikhom/smile_detection` `apps/web/src/camera/useCameraSession.ts`                              | `4b78615bcc32eb9579fb39020df02ca59943ca09` | `src/camera/use-camera-session.ts`                                       | Adapted React subscription, video attachment, page visibility, and unmount cleanup.                              |
| `Rock-Atikhom/smile_detection` `apps/web/scripts/vision-release.config.mjs`                           | `4b78615bcc32eb9579fb39020df02ca59943ca09` | `scripts/vision-release.config.mjs`                                      | Adapted the pinned MediaPipe Tasks Vision and Face Landmarker inventory; removed the unrelated Selfie Segmenter. |
| `Rock-Atikhom/smile_detection` `apps/web/scripts/generate-vision-manifest.mjs`                        | `4b78615bcc32eb9579fb39020df02ca59943ca09` | `scripts/generate-vision-manifest.mjs`                                   | Adapted deterministic byte-count and SHA-256 manifest generation for the repository root.                        |
| `Rock-Atikhom/smile_detection` `apps/web/src/vision/manifest.ts`                                      | `4b78615bcc32eb9579fb39020df02ca59943ca09` | `src/vision/manifest.ts`                                                 | Adapted strict release, role, path, source, and integrity metadata validation.                                   |
| `Rock-Atikhom/smile_detection` `apps/web/src/vision/integrity.ts`                                     | `4b78615bcc32eb9579fb39020df02ca59943ca09` | `src/vision/integrity.ts`                                                | Adapted safe response verification and local operational errors with Deep Work naming.                           |
| `Rock-Atikhom/smile_detection` `apps/web/src/vision/release.ts` and `generated/release-manifest.json` | `4b78615bcc32eb9579fb39020df02ca59943ca09` | `src/vision/release.ts` and `src/vision/generated/release-manifest.json` | Adapted pinned runtime exports for local release loading.                                                        |

The repository owner authorized this reuse for the Deep Work Companion
prototype. The McDonald's doom-scroller repository is conceptual inspiration
only and is not copied.

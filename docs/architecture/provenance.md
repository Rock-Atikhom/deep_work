# Provenance

Deep Work Companion reuses the camera lifecycle shape from the owner-approved
Smart Smile repository. The reuse is limited to camera permission, stream
attachment, abort and generation handling, visibility recovery, warm-up, and
track cleanup. No Smart Smile product copy, identity data, frame data, or
camera-analysis results are included here.

| Source | Commit | Destination | Purpose |
| --- | --- | --- | --- |
| `Rock-Atikhom/smile_detection` `apps/web/src/camera/session.ts` | `4b78615bcc32eb9579fb39020df02ca59943ca09` | `src/camera/session.ts` | Adapted consent-safe `MediaStream` lifecycle for desktop Deep Work Companion sessions. |
| `Rock-Atikhom/smile_detection` `apps/web/src/camera/useCameraSession.ts` | `4b78615bcc32eb9579fb39020df02ca59943ca09` | `src/camera/use-camera-session.ts` | Adapted React subscription, video attachment, page visibility, and unmount cleanup. |

The repository owner authorized this reuse for the Deep Work Companion
prototype. The McDonald's doom-scroller repository is conceptual inspiration
only and is not copied.

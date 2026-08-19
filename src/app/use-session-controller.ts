import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { AwarenessEvent, AwarenessPolicyState } from "../awareness/awareness-policy";
import { advanceAwareness, createAwarenessPolicy } from "../awareness/awareness-policy";
import type { PresetName } from "../session/session-types";
import { useCameraSession } from "../camera/use-camera-session";
import type { CameraSnapshot } from "../camera/session";
import { createFaceFramePump, type FaceFramePump } from "../vision/face-frame-pump";
import {
  createVisionClient,
  type VisionClient,
  type VisionRuntimeSnapshot,
} from "../vision/vision-client";

export type CameraAdapter = {
  readonly snapshot: CameraSnapshot;
  readonly videoRef?: RefObject<HTMLVideoElement | null>;
  start(): Promise<void>;
  retry(): Promise<void>;
  stop(): void;
  subscribe(listener: (snapshot: CameraSnapshot) => void): () => void;
};

export type SessionControllerOptions = {
  camera?: CameraAdapter | undefined;
  cameraAdapter?: CameraAdapter | undefined;
  vision?: VisionClient | undefined;
  visionAdapter?: VisionClient | undefined;
  preset?: PresetName | undefined;
  onAwarenessEvent?: ((event: AwarenessEvent) => void) | undefined;
};

export type CameraJourneyStage =
  | "off"
  | "consent"
  | "starting"
  | "preparing"
  | "calibration"
  | "calibrating"
  | "ready"
  | "paused-hidden"
  | "error";

export type SessionController = {
  camera: CameraAdapter;
  vision: VisionClient;
  cameraMode: "enabled" | "disabled";
  stage: CameraJourneyStage;
  cameraSnapshot: CameraSnapshot;
  visionSnapshot: VisionRuntimeSnapshot;
  calibrationProgress: number;
  awarenessCount: number;
  lastAwarenessEvent: AwarenessEvent | null;
  pageHidden: boolean;
  policy: AwarenessPolicyState;
  videoRef: RefObject<HTMLVideoElement | null> | undefined;
  chooseCamera(): void;
  continueWithoutCamera(): void;
  allowCamera(): void;
  retryCamera(): void;
  startCalibration(): void;
  dismissAwareness(): void;
  resetAwareness(): void;
};

export function useSessionController(options: SessionControllerOptions = {}): SessionController {
  const defaultCamera = useCameraSession();
  const [defaultVision] = useState(() => createVisionClient());
  const camera = options.camera ?? options.cameraAdapter ?? defaultCamera;
  const vision = options.vision ?? options.visionAdapter ?? defaultVision;
  const preset = options.preset ?? "balanced";
  const [cameraMode, setCameraMode] = useState<"enabled" | "disabled">("disabled");
  const [stage, setStage] = useState<CameraJourneyStage>("off");
  const [cameraSnapshot, setCameraSnapshot] = useState<CameraSnapshot>(() => camera.snapshot);
  const [visionSnapshot, setVisionSnapshot] = useState<VisionRuntimeSnapshot>(
    () => vision.snapshot,
  );
  const [policy, setPolicy] = useState<AwarenessPolicyState>(() => createAwarenessPolicy(preset));
  const [awarenessCount, setAwarenessCount] = useState(0);
  const [lastAwarenessEvent, setLastAwarenessEvent] = useState<AwarenessEvent | null>(null);
  const [pageHidden, setPageHidden] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const preparationGeneration = useRef<number | null>(null);
  const preparationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const framePump = useRef<FaceFramePump | null>(null);
  const lastObservationKey = useRef<string | null>(null);
  const policyRef = useRef(policy);

  const clearPreparationTimer = useCallback(() => {
    if (preparationTimer.current !== null) {
      clearTimeout(preparationTimer.current);
      preparationTimer.current = null;
    }
  }, []);

  useEffect(() => clearPreparationTimer, [clearPreparationTimer]);

  const stopFramePump = useCallback(() => {
    framePump.current?.stop();
  }, []);

  useEffect(() => {
    return camera.subscribe(setCameraSnapshot);
  }, [camera]);

  const handleVisionSnapshot = useCallback(
    (snapshot: VisionRuntimeSnapshot) => {
      setVisionSnapshot(snapshot);
      if (snapshot.lastObservation) {
        const observation = snapshot.lastObservation;
        const key = JSON.stringify(observation);
        if (lastObservationKey.current !== key) {
          lastObservationKey.current = key;
          const advanced = advanceAwareness(policyRef.current, observation);
          policyRef.current = advanced.state;
          setPolicy(advanced.state);
          if (advanced.event) {
            setAwarenessCount((count) => count + 1);
            setLastAwarenessEvent(advanced.event);
            setAlertVisible(true);
            options.onAwarenessEvent?.(advanced.event);
          }
        }
      }
    },
    [options],
  );

  useEffect(() => {
    return vision.subscribe(handleVisionSnapshot);
  }, [handleVisionSnapshot, vision]);

  useEffect(() => {
    if (cameraMode !== "enabled") return;
    if (cameraSnapshot.state === "recoverable-error") {
      clearPreparationTimer();
      // Camera state is an external subscription; stage mirrors its latest event.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStage("error");
      return;
    }
    if (cameraSnapshot.state !== "ready" || stage !== "starting") return;
    if (preparationGeneration.current === cameraSnapshot.generation) return;
    preparationGeneration.current = cameraSnapshot.generation;
    if (visionSnapshot.phase === "ready" || visionSnapshot.phase === "calibrating") {
      // A hidden-page recovery keeps the prepared runtime and baseline alive.
      setStage(visionSnapshot.phase === "calibrating" ? "calibrating" : "ready");
      if (pageHidden) {
        setPageHidden(false);
      }
      return;
    }
    if (visionSnapshot.phase === "preparing") {
      setStage("preparing");
      return;
    }
    setStage("preparing");
    preparationTimer.current = setTimeout(() => {
      preparationTimer.current = null;
      if (preparationGeneration.current !== cameraSnapshot.generation) return;
      vision.cancel();
      setStage("error");
    }, 10_000);
    void vision.prepare().catch(() => {
      clearPreparationTimer();
      setStage("error");
    });
  }, [
    cameraMode,
    cameraSnapshot,
    clearPreparationTimer,
    pageHidden,
    stage,
    vision,
    visionSnapshot.phase,
  ]);

  useEffect(() => {
    if (cameraMode !== "enabled" || stage !== "preparing") return;
    if (visionSnapshot.phase === "error") {
      clearPreparationTimer();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStage("error");
    } else if (visionSnapshot.phase === "ready") {
      clearPreparationTimer();
      setStage(visionSnapshot.calibrationProgress >= 1 ? "ready" : "calibration");
    }
  }, [cameraMode, clearPreparationTimer, stage, visionSnapshot]);

  useEffect(() => {
    if (cameraMode !== "enabled" || stage !== "calibrating") return;
    if (visionSnapshot.phase === "error") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStage("error");
    } else if (visionSnapshot.calibrationProgress >= 1) {
      setStage("ready");
    }
  }, [cameraMode, stage, visionSnapshot]);

  useEffect(() => {
    const frameActive = cameraMode === "enabled" && (stage === "calibrating" || stage === "ready");
    const video = camera.videoRef?.current;
    if (!frameActive || !video || typeof createImageBitmap !== "function") return;

    const pump = createFaceFramePump({
      capture: (size) =>
        createImageBitmap(video, {
          resizeHeight: size.height,
          resizeQuality: "low",
          resizeWidth: size.width,
        }),
      now: () => Date.now(),
      submit: (command) =>
        vision.submitFrame(command.bitmap, {
          cameraGeneration: command.cameraGeneration,
          capturedAtMs: command.capturedAtMs,
          height: command.height,
          width: command.width,
        }),
    });
    framePump.current = pump;
    const width = cameraSnapshot.width ?? video.videoWidth ?? 640;
    const height = cameraSnapshot.height ?? video.videoHeight ?? 360;
    const interval = window.setInterval(() => {
      void pump.tick({
        cameraGeneration: cameraSnapshot.generation,
        generation: visionSnapshot.generation,
        height,
        width,
      });
    }, 250);

    return () => {
      window.clearInterval(interval);
      pump.stop();
      pump.dispose();
      if (framePump.current === pump) framePump.current = null;
    };
  }, [camera, cameraMode, cameraSnapshot, stage, vision, visionSnapshot.generation]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (cameraMode === "enabled") {
          setPageHidden(true);
          setStage("paused-hidden");
          stopFramePump();
          camera.stop();
        }
        return;
      }
      if (cameraMode === "enabled" && pageHidden) {
        setStage("starting");
        preparationGeneration.current = null;
        void camera.retry();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [camera, cameraMode, pageHidden, stopFramePump]);

  const chooseCamera = useCallback(() => {
    setCameraMode("enabled");
    setStage("consent");
  }, []);
  const continueWithoutCamera = useCallback(() => {
    clearPreparationTimer();
    stopFramePump();
    setCameraMode("disabled");
    setStage("off");
    vision.cancel();
    camera.stop();
  }, [camera, clearPreparationTimer, stopFramePump, vision]);
  const allowCamera = useCallback(() => {
    setCameraMode("enabled");
    setStage("starting");
    void camera.start();
  }, [camera]);
  const retryCamera = useCallback(() => {
    clearPreparationTimer();
    setStage("starting");
    preparationGeneration.current = null;
    void camera.retry();
  }, [camera, clearPreparationTimer]);
  const startCalibration = useCallback(() => {
    setStage("calibrating");
    vision.startCalibration();
  }, [vision]);
  const dismissAwareness = useCallback(() => setAlertVisible(false), []);
  const resetAwareness = useCallback(() => {
    setAlertVisible(false);
    setLastAwarenessEvent(null);
  }, []);

  return {
    camera,
    cameraMode,
    cameraSnapshot,
    calibrationProgress: visionSnapshot.calibrationProgress,
    chooseCamera,
    continueWithoutCamera,
    allowCamera,
    retryCamera,
    stage,
    startCalibration,
    vision,
    visionSnapshot,
    awarenessCount,
    lastAwarenessEvent: alertVisible ? lastAwarenessEvent : null,
    pageHidden,
    policy,
    resetAwareness,
    dismissAwareness,
    videoRef: camera.videoRef,
  };
}

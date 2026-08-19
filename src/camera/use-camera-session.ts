import { useEffect, useRef, useState, type RefObject } from "react";
import {
  CAMERA_ATTACHMENT_TIMEOUT_MS,
  CameraSession,
  createInitialCameraSnapshot,
  type CameraSessionDependencies,
  type CameraSnapshot,
} from "./session";

async function attachAndPlay(
  video: HTMLVideoElement | null,
  stream: MediaStream,
  signal: AbortSignal,
): Promise<{ height: number; width: number }> {
  if (!video) throw { name: "InvalidStateError" };
  video.srcObject = stream;
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      video.removeEventListener("loadeddata", onFrame);
    };
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      finish();
      callback();
    };
    const onAbort = () => settle(() => reject({ name: "AbortError" }));
    const onFrame = () => {
      void video.play().then(
        () => settle(resolve),
        (error) => settle(() => reject(error)),
      );
    };
    const timeout = setTimeout(
      () => settle(() => reject({ name: "AbortError" })),
      CAMERA_ATTACHMENT_TIMEOUT_MS,
    );
    signal.addEventListener("abort", onAbort, { once: true });
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) onFrame();
    else video.addEventListener("loadeddata", onFrame, { once: true });
  }).catch((error) => {
    if (signal.aborted) throw { name: "AbortError" };
    throw { name: "PlaybackError", cause: error };
  });
  if (signal.aborted) throw { name: "AbortError" };
  return { height: video.videoHeight, width: video.videoWidth };
}

function browserDependencies(
  videoRef: RefObject<HTMLVideoElement | null>,
): CameraSessionDependencies {
  return {
    attachAndPlay: (stream, signal) => attachAndPlay(videoRef.current, stream, signal),
    detach: () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    },
    enumerateDevices: () => navigator.mediaDevices?.enumerateDevices?.() ?? Promise.resolve([]),
    getUserMedia: (constraints) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        return Promise.reject({ name: "UnsupportedCameraApiError" });
      }
      return navigator.mediaDevices.getUserMedia(constraints);
    },
    isSecureContext: () => window.isSecureContext,
  };
}

export function useCameraSession(
  providedVideoRef?: RefObject<HTMLVideoElement | null>,
  providedDependencies?: CameraSessionDependencies,
) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = providedVideoRef ?? internalVideoRef;
  // The dependency callbacks read the video element only after an explicit start.
  const [camera] = useState(
    // eslint-disable-next-line react-hooks/refs
    () => new CameraSession(providedDependencies ?? browserDependencies(videoRef)),
  );
  const [snapshot, setSnapshot] = useState<CameraSnapshot>(() => camera.snapshot);

  useEffect(() => {
    const unsubscribe = camera.subscribe(setSnapshot);
    const handleVisibility = () => {
      void camera.setVisibility(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      unsubscribe();
      camera.dispose();
    };
  }, [camera]);

  return {
    snapshot,
    start: () => camera?.start() ?? Promise.resolve(),
    retry: () => camera?.retry() ?? Promise.resolve(),
    stop: () => camera?.stop(),
    subscribe: (listener: (next: CameraSnapshot) => void) => camera.subscribe(listener),
    videoRef,
  };
}

export { createInitialCameraSnapshot };

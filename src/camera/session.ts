export const CAMERA_PERMISSION_TIMEOUT_MS = 15_000;
export const CAMERA_ATTACHMENT_TIMEOUT_MS = 10_000;
export const CAMERA_WARMUP_MS = 1_200;

const MAX_DIAGNOSTIC_EVENTS = 20;

export type CameraState =
  | "privacy-introduction"
  | "permission-pending"
  | "camera-starting"
  | "warm-up"
  | "ready"
  | "stopped"
  | "recoverable-error";

export type CameraRecoveryReason =
  | "insecure-context"
  | "denied-permission"
  | "missing-camera"
  | "busy-unreadable-camera"
  | "overconstrained-request"
  | "aborted-request"
  | "inactive-document"
  | "ignored-prompt"
  | "interruption"
  | "unsupported-camera-api"
  | "playback-unavailable";

export type CameraPermission = "unknown" | "prompt" | "granted" | "denied";

export type CameraSnapshot = {
  diagnostics: readonly string[];
  generation: number;
  height?: number;
  permission: CameraPermission;
  reason?: CameraRecoveryReason | undefined;
  state: CameraState;
  width?: number;
};

export type CameraSessionDependencies = {
  attachAndPlay: (
    stream: MediaStream,
    signal: AbortSignal,
  ) => Promise<{ height: number; width: number }>;
  detach?: () => void;
  enumerateDevices: () => Promise<MediaDeviceInfo[]>;
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  isSecureContext: () => boolean;
};

type AttemptOutcome = "success" | "failed" | "superseded";

export function createInitialCameraSnapshot(): CameraSnapshot {
  return {
    diagnostics: ["state:privacy-introduction"],
    generation: 0,
    permission: "unknown",
    state: "privacy-introduction",
  };
}

export function mapCameraError(error: unknown): CameraRecoveryReason {
  const name =
    typeof error === "object" && error !== null && "name" in error ? String(error.name) : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "denied-permission";
    case "NotFoundError":
      return "missing-camera";
    case "NotReadableError":
      return "busy-unreadable-camera";
    case "OverconstrainedError":
      return "overconstrained-request";
    case "AbortError":
      return "aborted-request";
    case "InvalidStateError":
      return "inactive-document";
    case "IgnoredPromptError":
      return "ignored-prompt";
    default:
      return "unsupported-camera-api";
  }
}

function stopTracks(stream: MediaStream | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}

function cameraConstraints(): MediaStreamConstraints {
  return {
    audio: false,
    video: {
      frameRate: { ideal: 30 },
      height: { ideal: 720 },
      width: { ideal: 1280 },
    },
  };
}

export class CameraSession {
  private activeBeforeHide = false;
  private activeStream: MediaStream | undefined;
  private activeTrack: MediaStreamTrack | undefined;
  private attemptAbort: AbortController | undefined;
  private candidateStream: MediaStream | undefined;
  private listeners = new Set<(snapshot: CameraSnapshot) => void>();
  private requestEpoch = 0;
  private snapshotValue = createInitialCameraSnapshot();
  private warmupTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly deps: CameraSessionDependencies) {}

  get snapshot(): CameraSnapshot {
    return this.snapshotValue;
  }

  subscribe(listener: (snapshot: CameraSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(): Promise<void> {
    if (!this.deps.isSecureContext()) {
      this.setSnapshot({ reason: "insecure-context", state: "recoverable-error" });
      return;
    }
    await this.acquire(cameraConstraints());
  }

  async restart(): Promise<void> {
    this.invalidateInFlightAndOwned();
    await this.start();
  }

  retry(): Promise<void> {
    return this.restart();
  }

  stop(): void {
    this.invalidateInFlightAndOwned();
    this.setSnapshot({
      permission: this.snapshotValue.permission,
      reason: undefined,
      state: "stopped",
    });
  }

  setVisibility(visible: boolean): Promise<void> | void {
    if (!visible) {
      this.activeBeforeHide = Boolean(
        this.activeStream || this.candidateStream || this.attemptAbort,
      );
      if (this.activeBeforeHide) {
        this.invalidateInFlightAndOwned();
        this.setSnapshot({
          permission: this.snapshotValue.permission,
          reason: "inactive-document",
          state: "stopped",
        });
      }
      return;
    }
    if (!this.activeBeforeHide) return;
    this.activeBeforeHide = false;
    return this.start();
  }

  dispose(): void {
    this.activeBeforeHide = false;
    this.invalidateInFlightAndOwned();
    this.listeners.clear();
  }

  private async acquire(
    constraints: MediaStreamConstraints,
  ): Promise<{ epoch: number; outcome: AttemptOutcome }> {
    const epoch = ++this.requestEpoch;
    const abort = new AbortController();
    this.attemptAbort?.abort();
    this.attemptAbort = abort;
    this.clearWarmup();
    this.setSnapshot({ permission: "prompt", reason: undefined, state: "permission-pending" });

    let stream: MediaStream;
    try {
      stream = await this.requestWithTimeout(constraints, epoch, abort.signal);
    } catch (error) {
      if (this.attemptAbort === abort) this.attemptAbort = undefined;
      if (epoch !== this.requestEpoch || abort.signal.aborted)
        return { epoch, outcome: "superseded" };
      this.setError(error);
      return { epoch, outcome: "failed" };
    }

    if (epoch !== this.requestEpoch || abort.signal.aborted) {
      stopTracks(stream);
      return { epoch, outcome: "superseded" };
    }

    this.candidateStream = stream;
    const track = stream.getVideoTracks()[0];
    let candidateEnded = false;
    const onTrackEnded = () => {
      if (stream !== this.activeStream) return;
      this.publishInterruption();
    };
    track?.addEventListener("ended", onTrackEnded);

    try {
      if (!track) throw { name: "NotFoundError" };
      if (track.readyState !== "live") {
        candidateEnded = true;
        throw { name: "TrackEndedError" };
      }
      this.setSnapshot({ permission: "granted", state: "camera-starting", reason: undefined });
      const decoded = await this.deps.attachAndPlay(stream, abort.signal);
      if (
        epoch !== this.requestEpoch ||
        (abort.signal.aborted && !candidateEnded) ||
        this.candidateStream !== stream
      ) {
        stopTracks(stream);
        return { epoch, outcome: "superseded" };
      }
      if (candidateEnded || track.readyState !== "live") {
        candidateEnded = true;
        throw { name: "TrackEndedError" };
      }

      this.candidateStream = undefined;
      this.activeStream = stream;
      this.activeTrack = track;
      this.snapshotValue = {
        ...this.snapshotValue,
        generation: this.snapshotValue.generation + 1,
        height: decoded.height,
        permission: "granted",
        reason: undefined,
        state: "warm-up",
        width: decoded.width,
      };
      this.record("state:warm-up");
      this.emit();
      void this.refreshDevices(epoch);
      this.scheduleWarmup(epoch);
      return { epoch, outcome: "success" };
    } catch (error) {
      if (this.candidateStream === stream) this.candidateStream = undefined;
      track?.removeEventListener("ended", onTrackEnded);
      if (stream !== this.activeStream) stopTracks(stream);
      this.deps.detach?.();
      if (epoch !== this.requestEpoch || (abort.signal.aborted && !candidateEnded))
        return { epoch, outcome: "superseded" };
      if (candidateEnded) {
        this.setSnapshot({
          permission: "granted",
          reason: "interruption",
          state: "recoverable-error",
        });
        return { epoch, outcome: "failed" };
      }
      this.setError(error);
      return { epoch, outcome: "failed" };
    } finally {
      if (this.attemptAbort === abort) this.attemptAbort = undefined;
    }
  }

  private requestWithTimeout(
    constraints: MediaStreamConstraints,
    epoch: number,
    signal: AbortSignal,
  ): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = () => {
        clearTimeout(timeout);
        signal.removeEventListener("abort", onAbort);
      };
      const onAbort = () => {
        if (settled) return;
        settled = true;
        finish();
        reject({ name: "AbortError" });
      };
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        finish();
        reject({ name: "IgnoredPromptError" });
      }, CAMERA_PERMISSION_TIMEOUT_MS);
      signal.addEventListener("abort", onAbort, { once: true });

      let request: Promise<MediaStream>;
      try {
        request = this.deps.getUserMedia(constraints);
      } catch (error) {
        if (!settled) {
          settled = true;
          finish();
          reject(error);
        }
        return;
      }
      request.then(
        (stream) => {
          if (settled || epoch !== this.requestEpoch || signal.aborted) {
            stopTracks(stream);
            return;
          }
          settled = true;
          finish();
          resolve(stream);
        },
        (error: unknown) => {
          if (settled || epoch !== this.requestEpoch || signal.aborted) return;
          settled = true;
          finish();
          reject(error);
        },
      );
    });
  }

  private async refreshDevices(epoch: number): Promise<void> {
    try {
      await this.deps.enumerateDevices();
      if (epoch !== this.requestEpoch) return;
      // Device IDs and labels are intentionally not copied into the snapshot.
    } catch {
      // Device enumeration is an optional diagnostic after a working stream.
    }
  }

  private publishInterruption(): void {
    this.invalidateInFlightAndOwned();
    this.setSnapshot({
      generation: this.snapshotValue.generation + 1,
      reason: "interruption",
      state: "recoverable-error",
    });
  }

  private invalidateInFlightAndOwned(): void {
    this.requestEpoch += 1;
    this.attemptAbort?.abort();
    this.attemptAbort = undefined;
    this.clearWarmup();
    stopTracks(this.candidateStream);
    this.candidateStream = undefined;
    stopTracks(this.activeStream);
    this.activeStream = undefined;
    this.activeTrack = undefined;
    this.deps.detach?.();
  }

  private scheduleWarmup(epoch: number): void {
    this.clearWarmup();
    this.warmupTimer = setTimeout(() => {
      if (epoch === this.requestEpoch && this.snapshotValue.state === "warm-up")
        this.setSnapshot({ reason: undefined, state: "ready" });
    }, CAMERA_WARMUP_MS);
  }

  private clearWarmup(): void {
    if (this.warmupTimer) clearTimeout(this.warmupTimer);
    this.warmupTimer = undefined;
  }

  private setError(error: unknown): void {
    const name =
      typeof error === "object" && error !== null && "name" in error ? String(error.name) : "";
    const reason: CameraRecoveryReason =
      name === "PlaybackError" ? "playback-unavailable" : mapCameraError(error);
    this.setSnapshot({
      permission: reason === "denied-permission" ? "denied" : this.snapshotValue.permission,
      reason,
      state: "recoverable-error",
    });
  }

  private setSnapshot(change: Partial<CameraSnapshot>): void {
    this.snapshotValue = { ...this.snapshotValue, ...change };
    this.record(`state:${this.snapshotValue.state}`);
    if (this.snapshotValue.reason) this.record(`reason:${this.snapshotValue.reason}`);
    this.emit();
  }

  private record(event: string): void {
    this.snapshotValue = {
      ...this.snapshotValue,
      diagnostics: [...this.snapshotValue.diagnostics, event].slice(-MAX_DIAGNOSTIC_EVENTS),
    };
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener(this.snapshotValue));
  }
}

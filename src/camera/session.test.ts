import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CAMERA_PERMISSION_TIMEOUT_MS,
  CAMERA_WARMUP_MS,
  CameraSession,
  type CameraSessionDependencies,
} from "./session";

type FakeTrack = MediaStreamTrack & {
  emitEnded: () => void;
  stop: ReturnType<typeof vi.fn>;
};

function fakeTrack(): FakeTrack {
  const listeners = new Set<EventListener>();
  const track = {
    addEventListener: (_type: string, listener: EventListener) => listeners.add(listener),
    getCapabilities: () => ({}),
    getSettings: () => ({ width: 1280, height: 720 }),
    readyState: "live",
    removeEventListener: (_type: string, listener: EventListener) => listeners.delete(listener),
    stop: vi.fn(),
    emitEnded: () => listeners.forEach((listener) => listener(new Event("ended"))),
  } as unknown as FakeTrack;
  return track;
}

function fakeStream(track = fakeTrack()): MediaStream & { track: FakeTrack } {
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    track,
  } as unknown as MediaStream & { track: FakeTrack };
}

function dependencies(
  getUserMedia: CameraSessionDependencies["getUserMedia"],
  overrides: Partial<CameraSessionDependencies> = {},
) {
  return {
    attachAndPlay: vi.fn(async () => ({ height: 720, width: 1280 })),
    detach: vi.fn(),
    enumerateDevices: vi.fn(async () => []),
    getUserMedia,
    isSecureContext: () => true,
    ...overrides,
  } satisfies CameraSessionDependencies;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("CameraSession", () => {
  it("waits for an explicit start before requesting consent", async () => {
    const getUserMedia = vi.fn(async () => fakeStream());
    const deps = dependencies(getUserMedia);
    const session = new CameraSession(deps);

    expect(session.snapshot.state).toBe("privacy-introduction");
    expect(getUserMedia).not.toHaveBeenCalled();

    await session.start();
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(session.snapshot.state).toBe("warm-up");
  });

  it("marks a prompt as ignored after fifteen seconds", async () => {
    vi.useFakeTimers();
    const getUserMedia = vi.fn(() => new Promise<MediaStream>(() => undefined));
    const session = new CameraSession(dependencies(getUserMedia));
    const starting = session.start();

    await vi.advanceTimersByTimeAsync(CAMERA_PERMISSION_TIMEOUT_MS);
    await starting;
    expect(session.snapshot).toMatchObject({
      permission: "prompt",
      reason: "ignored-prompt",
      state: "recoverable-error",
    });
  });

  it("reports insecure contexts before touching media devices", async () => {
    const getUserMedia = vi.fn(async () => fakeStream());
    const session = new CameraSession(dependencies(getUserMedia, { isSecureContext: () => false }));

    await session.start();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(session.snapshot.reason).toBe("insecure-context");
  });

  it.each([
    ["NotAllowedError", "denied-permission", "denied"],
    ["NotFoundError", "missing-camera", "prompt"],
    ["NotReadableError", "busy-unreadable-camera", "prompt"],
  ] as const)("maps %s into a recoverable camera state", async (name, reason, permission) => {
    const session = new CameraSession(
      dependencies(async () => {
        throw { name };
      }),
    );

    await session.start();
    expect(session.snapshot).toMatchObject({ permission, reason, state: "recoverable-error" });
  });

  it("stops an attached stream when playback cannot attach", async () => {
    const stream = fakeStream();
    const session = new CameraSession(
      dependencies(async () => stream, {
        attachAndPlay: vi.fn(async () => {
          throw { name: "PlaybackError" };
        }),
      }),
    );

    await session.start();
    expect(stream.track.stop).toHaveBeenCalledOnce();
    expect(session.snapshot.reason).toBe("playback-unavailable");
  });

  it("moves from warm-up to ready without retaining device labels", async () => {
    vi.useFakeTimers();
    const stream = fakeStream();
    const session = new CameraSession(dependencies(async () => stream));

    await session.start();
    expect(session.snapshot.state).toBe("warm-up");
    await vi.advanceTimersByTimeAsync(CAMERA_WARMUP_MS);
    expect(session.snapshot.state).toBe("ready");
    expect(session.snapshot.diagnostics.join(" ")).not.toContain("device");
  });

  it("reports an ended track as an interruption and stops ownership", async () => {
    const stream = fakeStream();
    const session = new CameraSession(dependencies(async () => stream));
    await session.start();

    stream.track.emitEnded();
    expect(session.snapshot).toMatchObject({
      generation: 2,
      reason: "interruption",
      state: "recoverable-error",
    });
    expect(stream.track.stop).toHaveBeenCalledOnce();
  });

  it("disposes a late stream returned by a stale request", async () => {
    let resolveRequest!: (stream: MediaStream) => void;
    const request = new Promise<MediaStream>((resolve) => {
      resolveRequest = resolve;
    });
    const session = new CameraSession(dependencies(() => request));
    const starting = session.start();
    session.stop();

    const stream = fakeStream();
    resolveRequest(stream);
    await starting;
    expect(stream.track.stop).toHaveBeenCalledOnce();
    expect(session.snapshot.state).toBe("stopped");
  });

  it("stops immediately when the document becomes hidden and can restart visibly", async () => {
    const first = fakeStream();
    const second = fakeStream();
    const getUserMedia = vi
      .fn<CameraSessionDependencies["getUserMedia"]>()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    const session = new CameraSession(dependencies(getUserMedia));
    await session.start();

    await session.setVisibility(false);
    expect(first.track.stop).toHaveBeenCalledOnce();
    expect(session.snapshot).toMatchObject({ reason: "inactive-document", state: "stopped" });

    await session.setVisibility(true);
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(session.snapshot.state).toBe("warm-up");
  });

  it("stops every owned track on stop and dispose", async () => {
    const stream = fakeStream();
    const session = new CameraSession(dependencies(async () => stream));
    await session.start();
    session.stop();
    session.dispose();

    expect(stream.track.stop).toHaveBeenCalledOnce();
    expect(session.snapshot.state).toBe("stopped");
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCameraSession } from "./use-camera-session";
import { type CameraSessionDependencies } from "./session";

function stream() {
  const track = {
    addEventListener: vi.fn(),
    getSettings: () => ({ width: 640, height: 480 }),
    readyState: "live",
    removeEventListener: vi.fn(),
    stop: vi.fn(),
  } as unknown as MediaStreamTrack;
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    track,
  } as unknown as MediaStream & { track: MediaStreamTrack & { stop: ReturnType<typeof vi.fn> } };
}

function deps(getUserMedia: CameraSessionDependencies["getUserMedia"]) {
  return {
    attachAndPlay: vi.fn(async () => ({ height: 480, width: 640 })),
    detach: vi.fn(),
    enumerateDevices: vi.fn(async () => []),
    getUserMedia,
    isSecureContext: () => true,
  } satisfies CameraSessionDependencies;
}

describe("useCameraSession", () => {
  it("does not request a camera in an effect and disposes on unmount", async () => {
    const media = stream();
    const getUserMedia = vi.fn(async () => media);
    const { result, unmount } = renderHook(() => useCameraSession(undefined, deps(getUserMedia)));

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(result.current.snapshot.state).toBe("privacy-introduction");

    await result.current.start();
    await waitFor(() => expect(result.current.snapshot.state).toBe("warm-up"));
    unmount();
    expect(media.track.stop).toHaveBeenCalledOnce();
  });
});

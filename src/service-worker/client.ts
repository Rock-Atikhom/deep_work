import { resolveAppPath } from "../app/app-path";
import { VISION_MANIFEST, VISION_MANIFEST_URL } from "../vision/release";
import serviceWorkerUrl from "./sw.ts?worker&url";

type ServiceWorkerContainerLike = {
  ready: Promise<ServiceWorkerRegistration>;
  register(scriptURL: string, options?: RegistrationOptions): Promise<ServiceWorkerRegistration>;
};

/** Registers the Pages-safe worker and asks it to verify the pinned vision release. */
export async function registerApplicationServiceWorker(
  serviceWorker: ServiceWorkerContainerLike | undefined = "serviceWorker" in navigator
    ? navigator.serviceWorker
    : undefined,
): Promise<void> {
  if (serviceWorker === undefined) return;
  try {
    await serviceWorker.register(serviceWorkerUrl, { scope: resolveAppPath("") });
    const registration = await serviceWorker.ready;
    registration.active?.postMessage({
      type: "CACHE_RELEASE",
      generation: 0,
      manifestUrl: VISION_MANIFEST_URL,
      releaseId: VISION_MANIFEST.releaseId,
    });
  } catch {
    // The timer-only flow must remain available if offline setup is unavailable.
  }
}

import { resolveAppPath } from "../app/app-path";
import { VISION_MANIFEST, VISION_MANIFEST_URL } from "../vision/release";
import serviceWorkerRuntimeUrl from "./sw.ts?worker&url";

type ServiceWorkerContainerLike = {
  ready: Promise<ServiceWorkerRegistration>;
  register(scriptURL: string, options?: RegistrationOptions): Promise<ServiceWorkerRegistration>;
};

/** The public bootstrap must be registered so it can control the whole Pages app scope. */
export function serviceWorkerRegistrationUrl(basePath?: string): string {
  return resolveAppPath("sw.js", basePath);
}

/** Registers the Pages-safe worker and asks it to verify the pinned vision release. */
export async function registerApplicationServiceWorker(
  serviceWorker: ServiceWorkerContainerLike | undefined = "serviceWorker" in navigator
    ? navigator.serviceWorker
    : undefined,
  basePath?: string,
): Promise<void> {
  if (serviceWorker === undefined) return;
  try {
    // Retain the Vite worker URL as a build dependency. public/sw.js imports its
    // deterministic assets/sw.js output from the root service-worker script.
    if (serviceWorkerRuntimeUrl.length === 0) return;
    await serviceWorker.register(serviceWorkerRegistrationUrl(basePath), {
      scope: resolveAppPath("", basePath),
    });
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

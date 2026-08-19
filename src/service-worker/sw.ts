/// <reference lib="webworker" />

import { VISION_ASSET_ERROR_HEADER } from "../vision/integrity";
import { VISION_RELEASE_PATH_PREFIX } from "../vision/manifest";
import { VISION_MANIFEST } from "../vision/release";
import {
  cacheVisionRelease,
  isCacheableOfflineRequest,
  matchCompletedVisionAsset,
  type CacheReleaseCommand,
  type VisionCacheDependencies,
} from "./vision-cache";

declare const self: ServiceWorkerGlobalScope;

const shellCacheName = "deep-work-shell-v1";

function resolveWorkerPath(path: string): string {
  return new URL(path.replace(/^\/+/, ""), self.registration.scope).pathname;
}

const visionPathPrefix = resolveWorkerPath(VISION_RELEASE_PATH_PREFIX);
const visionPaths = new Set(VISION_MANIFEST.assets.map((asset) => resolveWorkerPath(asset.path)));
const dependencies: VisionCacheDependencies = {
  cacheStorage: self.caches,
  fetch: (input, init) => fetch(input, init),
  manifest: VISION_MANIFEST,
  scope: self.registration.scope,
};

function isCacheReleaseCommand(value: unknown): value is CacheReleaseCommand {
  if (typeof value !== "object" || value === null) return false;
  const command = value as Record<string, unknown>;
  return (
    command.type === "CACHE_RELEASE" &&
    typeof command.generation === "number" &&
    Number.isSafeInteger(command.generation) &&
    command.generation >= 0 &&
    typeof command.manifestUrl === "string" &&
    typeof command.releaseId === "string" &&
    command.releaseId === VISION_MANIFEST.releaseId
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(shellCacheName);
      await cache.addAll([
        new URL("./", self.registration.scope).href,
        new URL("index.html", self.registration.scope).href,
      ]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (!isCacheReleaseCommand(event.data)) return;
  const ownerId = event.source && "id" in event.source ? event.source.id : "page";
  event.waitUntil(
    cacheVisionRelease(event.data, ownerId, dependencies).catch(() => {
      // Runtime loading reports a bounded integrity or offline error to the page.
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith(visionPathPrefix)) {
    if (event.request.method !== "GET" || url.search !== "" || !visionPaths.has(url.pathname)) {
      event.respondWith(Promise.resolve(new Response(null, { status: 503 })));
      return;
    }
    event.respondWith(
      matchCompletedVisionAsset(event.request, VISION_MANIFEST.releaseId, dependencies).then(
        (cached) =>
          cached ??
          new Response(null, {
            headers: { [VISION_ASSET_ERROR_HEADER]: "offline-cache-failed" },
            status: 503,
          }),
        () =>
          new Response(null, {
            headers: { [VISION_ASSET_ERROR_HEADER]: "offline-cache-failed" },
            status: 503,
          }),
      ),
    );
    return;
  }

  if (event.request.mode !== "navigate" || !isCacheableOfflineRequest(event.request)) return;
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(shellCacheName);
          await cache.put(event.request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(shellCacheName);
        return (
          (await cache.match(event.request)) ??
          (await cache.match(new URL("./", self.registration.scope).href)) ??
          Response.error()
        );
      }),
  );
});

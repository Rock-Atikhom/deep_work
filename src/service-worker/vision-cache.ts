import {
  verifyVisionResponse,
  VisionAssetError,
  VisionAssetOperationalError,
} from "../vision/integrity";
import {
  parseVisionManifest,
  visionManifestsEqual,
  type VisionAsset,
  type VisionReleaseManifest,
} from "../vision/manifest";

export const visionCacheName = (releaseId: string) => `deep-work-vision-${releaseId}`;
export const completionUrl = (scope: string, releaseId: string) =>
  new URL(`__deep-work/vision-complete/${releaseId}`, scope).href;
export const visionAssetPath = (assetPath: string, scope: string) =>
  new URL(assetPath.replace(/^\/+/, ""), scope).pathname;

export type CacheReleaseCommand = {
  generation: number;
  manifestUrl: string;
  releaseId: string;
};

export interface CacheLike {
  delete(request: RequestInfo | URL): Promise<boolean>;
  match(request: RequestInfo | URL): Promise<Response | undefined>;
  put(request: RequestInfo | URL, response: Response): Promise<void>;
}

export interface CacheStorageLike {
  delete(cacheName: string): Promise<boolean>;
  open(cacheName: string): Promise<CacheLike>;
}

export interface VisionCacheDependencies {
  cacheStorage: CacheStorageLike;
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  manifest: VisionReleaseManifest;
  scope: string;
  verifyResponse?: typeof verifyVisionResponse;
}

export class VisionCacheIntegrityError extends Error {
  readonly code = "runtime-integrity-failed" as const;

  constructor() {
    super("Vision cache integrity failed");
    this.name = "VisionCacheIntegrityError";
  }
}

export class VisionCacheOperationalError extends Error {
  readonly code = "offline-cache-failed" as const;

  constructor() {
    super("Vision cache operation failed");
    this.name = "VisionCacheOperationalError";
  }
}

const activeControllers = new Map<string, Set<AbortController>>();
const releaseLocks = new Map<string, Promise<void>>();
const SAFE_RESPONSE_HEADERS = ["content-type", "content-language"] as const;

function controllerKey(ownerId: string, generation: number, releaseId: string): string {
  return JSON.stringify([ownerId, generation, releaseId]);
}

function acquireReleaseLock(releaseId: string): { release(): void; wait: Promise<void> } {
  const wait = (releaseLocks.get(releaseId) ?? Promise.resolve()).catch(() => undefined);
  let unlock!: () => void;
  const held = new Promise<void>((resolve) => {
    unlock = resolve;
  });
  const tail = wait.then(() => held);
  releaseLocks.set(releaseId, tail);
  return {
    release() {
      unlock();
      if (releaseLocks.get(releaseId) === tail) releaseLocks.delete(releaseId);
    },
    wait,
  };
}

function safeHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  for (const name of SAFE_RESPONSE_HEADERS) {
    const value = upstream.get(name);
    if (value !== null) headers.set(name, value);
  }
  return headers;
}

function ensureNotCancelled(signal: AbortSignal): void {
  if (signal.aborted) {
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException("The operation was aborted", "AbortError");
  }
}

function fetchOptions(signal: AbortSignal): RequestInit {
  return { cache: "no-store", credentials: "same-origin", signal };
}

async function deleteRelease(
  cacheName: string,
  dependencies: VisionCacheDependencies,
): Promise<void> {
  try {
    await dependencies.cacheStorage.delete(cacheName);
  } catch {
    throw new VisionCacheOperationalError();
  }
}

async function fetchVerifiedManifest(
  command: CacheReleaseCommand,
  dependencies: VisionCacheDependencies,
  signal: AbortSignal,
): Promise<VisionReleaseManifest> {
  let response: Response;
  try {
    response = await dependencies.fetch(command.manifestUrl, fetchOptions(signal));
  } catch {
    ensureNotCancelled(signal);
    throw new VisionCacheOperationalError();
  }
  if (!response.ok) throw new VisionCacheOperationalError();
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new VisionCacheIntegrityError();
  }
  try {
    const parsed = parseVisionManifest(value);
    if (
      parsed.releaseId !== command.releaseId ||
      !visionManifestsEqual(parsed, dependencies.manifest)
    ) {
      throw new VisionCacheIntegrityError();
    }
    return parsed;
  } catch (error) {
    if (error instanceof VisionCacheIntegrityError) throw error;
    throw new VisionCacheIntegrityError();
  }
}

async function verifyCachedInventory(
  cache: CacheLike,
  manifest: VisionReleaseManifest,
  dependencies: VisionCacheDependencies,
  signal: AbortSignal,
): Promise<boolean> {
  try {
    for (const asset of manifest.assets) {
      ensureNotCancelled(signal);
      const path = visionAssetPath(asset.path, dependencies.scope);
      const response = await cache.match(path);
      if (response === undefined) return false;
      await (dependencies.verifyResponse ?? verifyVisionResponse)(response, asset);
    }
    return true;
  } catch (error) {
    if (signal.aborted) ensureNotCancelled(signal);
    if (error instanceof VisionAssetError || error instanceof VisionCacheIntegrityError)
      return false;
    if (error instanceof VisionAssetOperationalError) throw new VisionCacheOperationalError();
    return false;
  }
}

async function putVerifiedAsset(
  cache: CacheLike,
  asset: VisionAsset,
  dependencies: VisionCacheDependencies,
  signal: AbortSignal,
): Promise<void> {
  const path = visionAssetPath(asset.path, dependencies.scope);
  ensureNotCancelled(signal);
  let upstream: Response;
  try {
    upstream = await dependencies.fetch(path, fetchOptions(signal));
  } catch {
    ensureNotCancelled(signal);
    throw new VisionCacheOperationalError();
  }
  const bytes = await (dependencies.verifyResponse ?? verifyVisionResponse)(upstream, asset);
  ensureNotCancelled(signal);
  const responseBytes = new Uint8Array(bytes.byteLength);
  responseBytes.set(bytes);
  await cache.put(
    path,
    new Response(responseBytes.buffer, { headers: safeHeaders(upstream.headers), status: 200 }),
  );
}

function completionIsValid(value: unknown, manifest: VisionReleaseManifest): boolean {
  const count = manifest.assets.filter((asset) => asset.requiredForOffline).length;
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { schemaVersion?: unknown }).schemaVersion === 1 &&
    (value as { releaseId?: unknown }).releaseId === manifest.releaseId &&
    (value as { assetCount?: unknown }).assetCount === count
  );
}

export async function queryVisionRelease(
  releaseId: string,
  dependencies: VisionCacheDependencies,
): Promise<"ready" | "missing" | "integrity-failed"> {
  if (releaseId !== dependencies.manifest.releaseId) return "missing";
  const name = visionCacheName(releaseId);
  const cache = await dependencies.cacheStorage.open(name);
  const marker = await cache.match(completionUrl(dependencies.scope, releaseId));
  if (marker === undefined) return "missing";
  try {
    if (!marker.ok || !completionIsValid(await marker.json(), dependencies.manifest)) {
      await deleteRelease(name, dependencies);
      return "integrity-failed";
    }
    const verified = await verifyCachedInventory(
      cache,
      dependencies.manifest,
      dependencies,
      new AbortController().signal,
    );
    if (!verified) {
      await deleteRelease(name, dependencies);
      return "integrity-failed";
    }
    return "ready";
  } catch {
    await deleteRelease(name, dependencies);
    return "integrity-failed";
  }
}

export async function cacheVisionRelease(
  command: CacheReleaseCommand,
  ownerId: string,
  dependencies: VisionCacheDependencies,
): Promise<"ready"> {
  if (command.releaseId !== dependencies.manifest.releaseId) {
    throw new VisionCacheIntegrityError();
  }
  const key = controllerKey(ownerId, command.generation, command.releaseId);
  const controller = new AbortController();
  const controllers = activeControllers.get(key) ?? new Set<AbortController>();
  controllers.add(controller);
  activeControllers.set(key, controllers);
  const cacheName = visionCacheName(command.releaseId);
  const lock = acquireReleaseLock(command.releaseId);
  let cache: CacheLike | undefined;
  let mutated = false;
  try {
    await lock.wait;
    ensureNotCancelled(controller.signal);
    const existing = await queryVisionRelease(command.releaseId, dependencies);
    if (existing === "ready") return "ready";
    cache = await dependencies.cacheStorage.open(cacheName);
    mutated = true;
    const release = await fetchVerifiedManifest(command, dependencies, controller.signal);
    for (const asset of release.assets) {
      await putVerifiedAsset(cache, asset, dependencies, controller.signal);
    }
    if (!(await verifyCachedInventory(cache, release, dependencies, controller.signal))) {
      throw new VisionCacheIntegrityError();
    }
    const assetCount = release.assets.filter((asset) => asset.requiredForOffline).length;
    await cache.put(
      completionUrl(dependencies.scope, command.releaseId),
      Response.json({ assetCount, releaseId: command.releaseId, schemaVersion: 1 }),
    );
    return "ready";
  } catch (error) {
    if (mutated) {
      try {
        await deleteRelease(cacheName, dependencies);
      } catch {
        // A corrupt release is never considered ready, even if cleanup cannot complete.
      }
    }
    throw error;
  } finally {
    lock.release();
    controllers.delete(controller);
    if (controllers.size === 0) activeControllers.delete(key);
  }
}

export function cancelVisionRelease(ownerId: string, generation: number, releaseId: string): void {
  for (const controller of activeControllers.get(controllerKey(ownerId, generation, releaseId)) ??
    []) {
    controller.abort(new DOMException("The operation was aborted", "AbortError"));
  }
}

export async function matchCompletedVisionAsset(
  request: RequestInfo | URL,
  releaseId: string,
  dependencies: VisionCacheDependencies,
): Promise<Response | undefined> {
  if ((await queryVisionRelease(releaseId, dependencies)) !== "ready") return undefined;
  const url =
    typeof request === "string"
      ? new URL(request, dependencies.scope)
      : request instanceof URL
        ? request
        : new URL(request.url);
  const asset = dependencies.manifest.assets.find(
    (candidate) => visionAssetPath(candidate.path, dependencies.scope) === url.pathname,
  );
  if (!asset) return undefined;
  const cache = await dependencies.cacheStorage.open(visionCacheName(releaseId));
  const cached = await cache.match(url.pathname);
  if (!cached) return undefined;
  try {
    const bytes = await (dependencies.verifyResponse ?? verifyVisionResponse)(cached, asset);
    const responseBytes = new Uint8Array(bytes.byteLength);
    responseBytes.set(bytes);
    return new Response(responseBytes.buffer, {
      headers: safeHeaders(cached.headers),
      status: 200,
    });
  } catch {
    await deleteRelease(visionCacheName(releaseId), dependencies);
    throw new VisionCacheIntegrityError();
  }
}

/** The runtime cache is deliberately limited to generated build and vision assets. */
export function isCacheableOfflineRequest(request: Request): boolean {
  const path = new URL(request.url).pathname.toLowerCase();
  return (
    request.method === "GET" &&
    !path.includes("camera-frame") &&
    !path.includes("indexeddb") &&
    !path.includes("export")
  );
}

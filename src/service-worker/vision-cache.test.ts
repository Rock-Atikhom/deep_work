import { describe, expect, it, vi } from "vitest";
import type { VisionAsset, VisionReleaseManifest } from "../vision/manifest";
import {
  cacheVisionRelease,
  isCacheableOfflineRequest,
  matchVisionAssetOrFetchNetwork,
  visionCacheName,
  type CacheLike,
  type CacheStorageLike,
} from "./vision-cache";

const asset: VisionAsset = {
  bytes: 7,
  id: "license",
  licenseRef: "/vision/mediapipe-0.10.35-face-landmarker-float16-v1/LICENSE.txt",
  path: "/vision/mediapipe-0.10.35-face-landmarker-float16-v1/LICENSE.txt",
  requiredForOffline: true,
  role: "license",
  sha256: "0".repeat(64),
  source: "https://example.test/LICENSE.txt",
  version: "0.10.35",
};

const manifest: VisionReleaseManifest = {
  assets: [asset],
  modelVersion: "float16/1",
  releaseId: "0123456789abcdef",
  runtimeVersion: "0.10.35",
  schemaVersion: 1,
};

class MemoryCache implements CacheLike {
  readonly entries = new Map<string, Response>();

  async delete(request: RequestInfo | URL): Promise<boolean> {
    return this.entries.delete(String(request));
  }

  async match(request: RequestInfo | URL): Promise<Response | undefined> {
    return this.entries.get(String(request))?.clone();
  }

  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    this.entries.set(String(request), response.clone());
  }
}

class MemoryCacheStorage implements CacheStorageLike {
  readonly caches = new Map<string, MemoryCache>();
  readonly deleted: string[] = [];

  async delete(name: string): Promise<boolean> {
    this.deleted.push(name);
    return this.caches.delete(name);
  }

  async open(name: string): Promise<MemoryCache> {
    const existing = this.caches.get(name);
    if (existing) return existing;
    const created = new MemoryCache();
    this.caches.set(name, created);
    return created;
  }
}

describe("verified vision cache", () => {
  it("uses the network while a verified release cache is still warming", async () => {
    const cacheStorage = new MemoryCacheStorage();
    const fetch = vi.fn(async () => new Response("license", { status: 200 }));

    const response = await matchVisionAssetOrFetchNetwork(
      "https://example.test/deep_work/vision/mediapipe-0.10.35-face-landmarker-float16-v1/LICENSE.txt",
      manifest.releaseId,
      {
        cacheStorage,
        fetch,
        manifest,
        scope: "https://example.test/deep_work/",
        verifyResponse: async (value) => new Uint8Array(await value.arrayBuffer()),
      },
    );

    expect(response).toBeInstanceOf(Response);
    expect(await response?.text()).toBe("license");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("verifies every required manifest asset before the release is ready", async () => {
    const cacheStorage = new MemoryCacheStorage();
    const verifyResponse = vi.fn(
      async (response: Response) => new Uint8Array(await response.arrayBuffer()),
    );

    await expect(
      cacheVisionRelease(
        {
          generation: 1,
          manifestUrl: "/vision/release-manifest.json",
          releaseId: manifest.releaseId,
        },
        "client-a",
        {
          cacheStorage,
          fetch: async (url) =>
            String(url).includes("manifest") ? Response.json(manifest) : new Response("license"),
          manifest,
          scope: "https://example.test/deep_work/",
          verifyResponse,
        },
      ),
    ).resolves.toBe("ready");

    expect(verifyResponse).toHaveBeenCalledWith(expect.any(Response), asset);
  });

  it("deletes a release cache when an asset fails verification", async () => {
    const cacheStorage = new MemoryCacheStorage();

    await expect(
      cacheVisionRelease(
        {
          generation: 1,
          manifestUrl: "/vision/release-manifest.json",
          releaseId: manifest.releaseId,
        },
        "client-a",
        {
          cacheStorage,
          fetch: async (url) =>
            String(url).includes("manifest") ? Response.json(manifest) : new Response("corrupt"),
          manifest,
          scope: "https://example.test/deep_work/",
          verifyResponse: async () => {
            throw new Error("corrupt");
          },
        },
      ),
    ).rejects.toThrow();

    expect(cacheStorage.deleted).toEqual([visionCacheName(manifest.releaseId)]);
  });

  it("refuses camera frames and IndexedDB exports as offline cache requests", () => {
    expect(isCacheableOfflineRequest(new Request("https://example.test/camera-frame.png"))).toBe(
      false,
    );
    expect(
      isCacheableOfflineRequest(new Request("https://example.test/indexeddb-export.json")),
    ).toBe(false);
  });
});

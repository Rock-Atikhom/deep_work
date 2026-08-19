import { describe, expect, it, vi } from "vitest";
import { registerApplicationServiceWorker, serviceWorkerRegistrationUrl } from "./client";

describe("service-worker registration", () => {
  it("registers a root worker script inside the GitHub Pages project scope", () => {
    expect(serviceWorkerRegistrationUrl("/deep_work/")).toBe("/deep_work/sw.js");
  });

  it("does not register a hashed assets worker for the project scope", async () => {
    const active = { postMessage: vi.fn() } as unknown as ServiceWorker;
    const registration = { active } as ServiceWorkerRegistration;
    const register = vi.fn(async () => registration);

    await registerApplicationServiceWorker(
      { ready: Promise.resolve(registration), register },
      "/deep_work/",
    );

    expect(register).toHaveBeenCalledWith("/deep_work/sw.js", { scope: "/deep_work/" });
  });
});

import { describe, expect, it } from "vitest";
import {
  courseOriginPattern,
  removeCourseOriginAccess,
  requestCourseOriginAccess,
  type CoursePermissionApi,
} from "./course-origin-permission";

function createPermissionApi(overrides: Partial<CoursePermissionApi> = {}): CoursePermissionApi {
  return {
    contains: async () => false,
    remove: async () => true,
    request: async () => true,
    ...overrides,
  };
}

describe("selected course-origin permission", () => {
  it("uses a single-origin match pattern", () => {
    expect(courseOriginPattern("https://learn.example.com")).toBe("https://learn.example.com/*");
    expect(courseOriginPattern("http://localhost:4000")).toBe("http://localhost:4000/*");
  });

  it("does not request access again when the selected origin is already granted", async () => {
    let requested = false;
    const api = createPermissionApi({
      contains: async () => true,
      request: async () => {
        requested = true;
        return true;
      },
    });

    await expect(requestCourseOriginAccess(api, "https://learn.example.com")).resolves.toBe(true);
    expect(requested).toBe(false);
  });

  it("keeps guard off when the learner declines access", async () => {
    const api = createPermissionApi({ request: async () => false });

    await expect(requestCourseOriginAccess(api, "https://learn.example.com")).resolves.toBe(false);
  });

  it("removes only the selected course origin when guard stops", async () => {
    let removedOrigins: string[] = [];
    const api = createPermissionApi({
      remove: async ({ origins }) => {
        removedOrigins = origins;
        return true;
      },
    });

    await removeCourseOriginAccess(api, "https://learn.example.com");

    expect(removedOrigins).toEqual(["https://learn.example.com/*"]);
  });
});

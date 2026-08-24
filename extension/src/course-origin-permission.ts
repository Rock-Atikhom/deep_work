export type CoursePermissionDetails = { origins: string[] };

export interface CoursePermissionApi {
  contains(details: CoursePermissionDetails): Promise<boolean>;
  remove(details: CoursePermissionDetails): Promise<boolean>;
  request(details: CoursePermissionDetails): Promise<boolean>;
}

export function courseOriginPattern(origin: string): string {
  const parsed = new URL(origin);
  return `${parsed.protocol}//${parsed.host}/*`;
}

export async function requestCourseOriginAccess(
  api: CoursePermissionApi,
  courseOrigin: string,
): Promise<boolean> {
  const origins = [courseOriginPattern(courseOrigin)];
  try {
    if (await api.contains({ origins })) return true;
    return await api.request({ origins });
  } catch {
    return false;
  }
}

export async function removeCourseOriginAccess(
  api: CoursePermissionApi,
  courseOrigin: string | null,
): Promise<void> {
  if (!courseOrigin) return;
  try {
    await api.remove({ origins: [courseOriginPattern(courseOrigin)] });
  } catch {
    // Stopping remains safe even when Chrome has already removed the permission.
  }
}

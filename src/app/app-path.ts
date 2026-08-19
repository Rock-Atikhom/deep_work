const DEFAULT_BASE_PATH = import.meta.env.BASE_URL;

function normalizedBasePath(basePath: string): string {
  if (basePath === "") return "/";
  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

/** Resolves static assets and hash routes inside a GitHub Pages project site. */
export function resolveAppPath(path: string, basePath = DEFAULT_BASE_PATH): string {
  const base = normalizedBasePath(basePath);
  const relativePath = path.replace(/^\/+/, "");
  return base === "/" ? `/${relativePath}` : `${base}${relativePath}`;
}

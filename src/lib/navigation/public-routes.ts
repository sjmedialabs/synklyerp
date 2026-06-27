/** Routes accessible without authentication */
export const PUBLIC_PATH_PREFIXES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/api-docs",
  "/p",
  "/f",
  "/blog",
  "/robots.txt",
  "/sitemap.xml",
] as const;

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

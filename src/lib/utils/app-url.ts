import { headers } from "next/headers";

/**
 * Resolve absolute base URL of the running app for use in shareable links.
 *
 * Order:
 *   1. NEXT_PUBLIC_APP_URL (explicit, useful for prod)
 *   2. VERCEL_URL (provided by Vercel runtime)
 *   3. Request host header (works in any environment)
 *   4. Fallback to localhost
 */
export async function getAppUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto =
      h.get("x-forwarded-proto") ??
      (host?.startsWith("localhost") ? "http" : "https");
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() can fail outside request scope
  }

  return "http://localhost:3000";
}

/** Build absolute board URL, optionally filtered to a project. */
export function buildBoardUrl(baseUrl: string, projectId?: string | null) {
  const url = new URL("/board", baseUrl);
  if (projectId) url.searchParams.set("project", projectId);
  return url.toString();
}

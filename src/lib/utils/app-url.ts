import { headers } from "next/headers";

/**
 * Resolve absolute base URL of the running app for use in shareable links.
 *
 * Priority:
 *   1. NEXT_PUBLIC_APP_URL  (explicit, recommended for prod)
 *   2. Request host header  (real user-facing domain, e.g. custom domain)
 *   3. VERCEL_PROJECT_PRODUCTION_URL (Vercel-provided prod alias)
 *   4. VERCEL_URL           (Vercel auto, may be preview/random)
 *   5. localhost            (dev fallback)
 *
 * The host header is preferred over VERCEL_URL so that custom domains
 * (e.g. codetolen.site) win over the auto-generated *.vercel.app URL.
 */
export async function getAppUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ??
        (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() can fail outside request scope (e.g. build-time)
  }

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

/** Build absolute board URL, optionally filtered to a project. */
export function buildBoardUrl(baseUrl: string, projectId?: string | null) {
  const url = new URL("/board", baseUrl);
  if (projectId) url.searchParams.set("project", projectId);
  return url.toString();
}

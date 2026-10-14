// URL guards for values that come from people (query strings, provider profiles). Stored data is
// validated on input too; these run again where the value is used, so a tampered or future
// server-side record can never become an open redirect or a script URL.

const BASE = "https://internal.invalid";

/** A same-site path to send someone back to after signing in, or the fallback.
 *  Parsing (rather than prefix checks) catches `//evil.com`, `/\evil.com`, `/\t/evil.com` and
 *  similar tricks that browsers turn into another origin. */
export function safeRedirectPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/")) return fallback;
  try {
    const url = new URL(value, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** An absolute http(s) URL safe to put in an href, or null (javascript:, data:, relative...). */
export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

const EMAIL = /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]{2,}$/;

/** mailto: link for a plain address only, so no extra headers can ride along. */
export function safeMailto(value: string | null | undefined) {
  return value && EMAIL.test(value.trim()) ? `mailto:${value.trim()}` : null;
}

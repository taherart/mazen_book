// Addresses for a method's page and picture. Kept apart from lib/methods.ts, which holds the
// book's full text and must never be bundled for the browser (it is marked server-only).
export const methodHref = (n: number) => `/method/${String(n).padStart(2, "0")}`;
export const methodImage = (n: number) => `/methods/${String(n).padStart(2, "0")}.webp`;

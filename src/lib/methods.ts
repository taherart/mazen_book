// The book's full text: server only. A client component that imported this module would ship every
// locked method to the browser, so the build fails instead (client code uses lib/method-links.ts).
import "server-only";
import raw from "@/data/methods.json";
import type { Method, MethodSummary } from "./types";

// Seeded from the book (see scripts/). The backend phase replaces these with database reads
// behind the same functions, so pages do not change.
const all = raw as Method[];

export function getMethods(): Method[] {
  return all;
}

/** Accepts "07" (as printed on the QR codes) and "7". */
export function parseMethodParam(param: string): number | null {
  if (!/^\d{1,2}$/.test(param)) return null;
  const n = Number(param);
  return n >= 1 && n <= all.length ? n : null;
}

export function getMethod(n: number): Method | undefined {
  return all[n - 1];
}

export function toSummary(m: Method): MethodSummary {
  const { n, slug, title, tagline, domain, kind, place, level, capitalBand, timeBand, stats } = m;
  return { n, slug, title, tagline, domain, kind, place, level, capitalBand, timeBand, stats, tasks: m.steps.length + 1, monthly: monthlyIncome(stats.income) };
}

/** Reads the monthly range out of the book's income line: «3,000–6,000 ريال شهريًا» → 3000–6000,
 *  «+4,000 ريال شهريًا» → 4000 and up. A line with several prices keeps only its monthly part. */
export function monthlyIncome(income: string): MethodSummary["monthly"] {
  const part = income.split("،").find((p) => p.includes("شهري"));
  if (!part) return null;
  const nums = [...part.matchAll(/\d[\d,]*/g)].map((x) => Number(x[0].replace(/,/g, "")));
  if (!nums.length) return null;
  const open = part.trim().startsWith("+") || part.includes("أكثر من");
  return { min: nums[0], max: open ? null : (nums[1] ?? nums[0]) };
}

export function getSummaries(): MethodSummary[] {
  return all.map(toSummary);
}

/** The five methods open to everyone, each picked by a rule so the reason shown with it is true.
 *  Each pick prefers a domain not chosen yet. */
const FREE_RULES: { reason: string; test: (m: Method) => boolean }[] = [
  { reason: "ابدأ من هنا", test: (m) => m.level === 1 && m.capitalBand === "zero" && m.place !== "field" },
  { reason: "بلا رأس مال", test: (m) => m.capitalBand === "zero" },
  { reason: "أول ريال خلال أسبوعين", test: (m) => m.timeBand === "week" },
  { reason: "تبدأ من بيتك", test: (m) => m.place === "home" },
  { reason: "لأصحاب الخبرة", test: (m) => m.level === 3 },
];
export const FREE_PICKS: { n: number; reason: string }[] = (() => {
  const used = new Set<number>();
  const domains = new Set<string>();
  return FREE_RULES.flatMap(({ reason, test }) => {
    const pool = all.filter((m) => !used.has(m.n) && test(m));
    const m = pool.find((x) => !domains.has(x.domain)) ?? pool[0];
    if (!m) return [];
    used.add(m.n);
    domains.add(m.domain);
    return [{ n: m.n, reason }];
  });
})();
export const FREE_METHODS = FREE_PICKS.map((p) => p.n);

export { methodHref, methodImage } from "./method-links";

/** A step the book left unlabelled is named by its opening clause. */
function headline(text: string) {
  const words = text.split(/[،.؛:(]/)[0].trim().split(/\s+/);
  return words.length > 8 ? `${words.slice(0, 8).join(" ")}…` : words.join(" ");
}

/** The weekly checklist: the book's own steps, then documenting the result. */
export function challengeTasks(m: Method): { title: string; detail: string }[] {
  const tasks = m.steps.map((s) => ({ title: s.label ?? headline(s.text), detail: s.text }));
  tasks.push({ title: "وثّق النتيجة", detail: "اكتب ما فعلته هذا الأسبوع وما تعلّمته، حتى لو لم تحقق دخلًا بعد. توثيقك هو مشاركتك في سحب الأسبوع." });
  return tasks;
}

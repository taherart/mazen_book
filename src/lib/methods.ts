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

export const methodHref = (n: number) => `/method/${String(n).padStart(2, "0")}`;
export const methodImage = (n: number) => `/methods/${String(n).padStart(2, "0")}.webp`;

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

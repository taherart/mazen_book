// Merge the text extracted from the book with the curated stats/taxonomy into the seed the site reads.
// usage: node scripts/build-methods.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(join(root, "scripts/book/methods.raw.json"), "utf8"));
const curated = JSON.parse(readFileSync(join(root, "scripts/book/curated.json"), "utf8"));

// The book sets tanween after the alef ("شهرياً"); the site uses the modern order ("شهريًا").
const tidy = (s) => s.replace(/اً/g, "ًا").replace(/\s+/g, " ").trim();
const deep = (v) => (typeof v === "string" ? tidy(v) : Array.isArray(v) ? v.map(deep) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)])) : v);

const methods = raw.map((m) => {
  const c = curated.find((x) => x.n === m.n);
  if (!c) throw new Error(`no curated row for method ${m.n}`);
  return deep({
    n: m.n,
    slug: String(m.n).padStart(2, "0"),
    title: m.title,
    tagline: m.tagline || null,
    domain: c.domain,
    kind: c.kind,
    place: c.place,
    level: c.level,
    capitalBand: c.capitalBand,
    timeBand: c.timeBand,
    stats: { income: c.income, capital: c.capital, firstRiyal: c.firstRiyal },
    why: m.why,
    facts: m.facts,
    steps: m.steps,
    earn: m.earn,
    tips: m.tips,
    warnings: m.warnings,
    summary: m.summary,
  });
});

if (methods.length !== 52) throw new Error(`expected 52 methods, got ${methods.length}`);
writeFileSync(join(root, "src/data/methods.json"), JSON.stringify(methods, null, 1) + "\n");
console.log(`wrote src/data/methods.json (${methods.length} methods)`);

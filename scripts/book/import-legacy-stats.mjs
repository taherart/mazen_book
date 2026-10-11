// One-off import: the previous landing page carried a hand-checked summary table for the
// 52 methods (income, capital, time to first riyal, domain). The book's own stat boxes have a
// few misprints, so the site uses that table. Editorial tags below are ours and need the
// author's review before launch.
//
// usage: node import-legacy-stats.mjs <legacy index.html> > curated.json
import { readFileSync } from "node:fs";

// place: h = from home, o = out in the field, m = both · level: 1 beginner … 3 advanced
// kind: service | trade | broker | content | digital | teach
const EDITORIAL = {
  1: "h1service", 2: "h2service", 3: "h1service", 4: "h1service", 5: "m2service", 6: "h1broker",
  7: "h2service", 8: "h2content", 9: "h2service", 10: "h3service", 11: "m2service", 12: "m2service",
  13: "h2digital", 14: "o1trade", 15: "o1trade", 16: "o2service", 17: "h2trade", 18: "m2trade",
  19: "o1service", 20: "o2broker", 21: "o3broker", 22: "o3broker", 23: "m2trade", 24: "h2broker",
  25: "o2content", 26: "o1content", 27: "h2content", 28: "o1content", 29: "o1service", 30: "o2service",
  31: "o1service", 32: "o2service", 33: "o3service", 34: "o2service", 35: "o2service", 36: "h2service",
  37: "h1service", 38: "h2service", 39: "h2service", 40: "h2service", 41: "h1service", 42: "h1service",
  43: "m2service", 44: "h1content", 45: "h1broker", 46: "h1broker", 47: "m3service", 48: "o1service",
  49: "o3service", 50: "h2teach", 51: "h2teach", 52: "o2teach",
};
const PLACE = { h: "home", o: "field", m: "both" };

const html = readFileSync(process.argv[2], "utf8");
const table = html.slice(html.indexOf('id="methods-table"'));
const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const rows = [...table.matchAll(/<tr data-domain="([^"]+)" data-capital="([^"]+)" data-time="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g)];
if (rows.length !== 52) throw new Error(`expected 52 rows, found ${rows.length}`);

const out = rows.map((r, i) => {
  const n = i + 1;
  const cells = [...r[4].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => strip(m[1]));
  const capital = cells[3];
  const e = EDITORIAL[n];
  return {
    n,
    domain: r[1],
    capitalBand: r[2],
    timeBand: r[3],
    income: cells[2],
    capital: /\d/.test(capital) ? `${capital} ريال` : capital,
    firstRiyal: cells[4].replace(/\s*–\s*(?=\D)/g, " – ").replace(/(?<=\D)–\s*/g, "– ").replace(/\s+/g, " "),
    place: PLACE[e[0]],
    level: Number(e[1]),
    kind: e.slice(2),
  };
});
process.stdout.write(JSON.stringify(out, null, 1) + "\n");

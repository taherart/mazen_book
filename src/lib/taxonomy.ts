import type { CapitalBand, Domain, Kind, Level, Outcome, Place, ReviewStatus, TimeBand } from "./types";

export const DOMAINS: Record<Domain, string> = {
  design: "التصميم والإبداع",
  photo: "التصوير",
  digital: "التسويق الرقمي",
  affiliate: "التسويق بالعمولة",
  ecom: "التجارة الإلكترونية",
  sales: "البيع والتجارة",
  realestate: "العقار والضيافة",
  media: "الفن والإعلام والفعاليات",
  hajj: "مواسم الحج والعمرة",
  edu: "التعليم والسياحة والخدمات",
};

export const KINDS: Record<Kind, string> = {
  service: "خدمات",
  trade: "تجارة وبيع",
  broker: "وساطة وعمولة",
  content: "صناعة محتوى وظهور",
  digital: "منتجات رقمية",
  teach: "تعليم وإرشاد",
};

export const CAPITAL: Record<CapitalBand, string> = {
  zero: "صفر أو شبه صفر",
  low: "حتى 1,000 ريال",
  high: "أكثر من 1,000 ريال",
};

export const TIME: Record<TimeBand, string> = {
  week: "خلال أسبوعين",
  month: "خلال شهرين",
  more: "أكثر من شهرين",
};

export const PLACES: Record<Place, string> = {
  home: "من البيت",
  field: "خارج البيت",
  both: "من البيت وخارجه",
};

export const LEVELS: Record<Level, string> = {
  1: "مبتدئ",
  2: "متوسط",
  3: "متقدم",
};

export const OUTCOMES: Record<Outcome, string> = {
  worked: "نجحت",
  partly: "نجحت جزئيًا",
  didnt: "لم تنجح",
};

export const STATUS: Record<ReviewStatus, string> = {
  pending: "بانتظار المراجعة",
  approved: "منشور",
  rejected: "لم يُقبل",
};

export const riyal = (n: number) => `${n.toLocaleString("en-US")} ريال`;

export const TASKS: [string, string, string] = ["مهمة", "مهمتان", "مهام"];
export const ENTRIES: [string, string, string] = ["مشاركة", "مشاركتان", "مشاركات"];

/** Arabic counts change the noun: one, a dual, a plural for 3–10, then the singular again.
 *  count(4, ["مشاركة", "مشاركتان", "مشاركات"]) → "4 مشاركات" */
export function count(n: number, [one, two, few]: [string, string, string]) {
  if (n === 0) return `لا ${few}`;
  if (n === 1) return `${one} واحدة`.replace(/(?<![ةى]) واحدة$/, " واحد");
  if (n === 2) return two;
  return n <= 10 ? `${n} ${few}` : `${n} ${one}`;
}

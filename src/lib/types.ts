export type Domain = "design" | "photo" | "digital" | "affiliate" | "ecom" | "sales" | "realestate" | "media" | "hajj" | "edu";
export type CapitalBand = "zero" | "low" | "high";
export type TimeBand = "week" | "month" | "more";
export type Place = "home" | "field" | "both";
export type Kind = "service" | "trade" | "broker" | "content" | "digital" | "teach";
export type Level = 1 | 2 | 3;

export interface MethodStep {
  n: number;
  label: string | null;
  text: string;
}

export interface Method {
  n: number;
  /** Two-digit id used in URLs and on the book's QR codes: /method/07 */
  slug: string;
  title: string;
  tagline: string | null;
  domain: Domain;
  kind: Kind;
  place: Place;
  level: Level;
  capitalBand: CapitalBand;
  timeBand: TimeBand;
  stats: { income: string; capital: string; firstRiyal: string };
  why: string;
  facts: string[];
  steps: MethodStep[];
  earn: string[];
  tips: string[];
  warnings: string[];
  summary: string;
}

/** What lists, cards and client components need; the long text stays on the server. */
export type MethodSummary = Pick<Method, "n" | "slug" | "title" | "tagline" | "domain" | "kind" | "place" | "level" | "capitalBand" | "timeBand" | "stats"> & {
  /** Number of items on the weekly checklist. */
  tasks: number;
  /** Monthly income range in riyals, when the book prices the method by the month; max is null
   *  for an open-ended figure such as «+4,000». Methods priced per piece, project or season: null. */
  monthly: { min: number; max: number | null } | null;
};

export type ReviewStatus = "pending" | "approved" | "rejected";
export type Outcome = "worked" | "partly" | "didnt";

export interface Story {
  id: string;
  method: number;
  title: string;
  author: string;
  city?: string;
  body: string;
  duration: string;
  /** Riyals actually spent; null when the author did not say. */
  cost: number | null;
  /** Riyals actually earned; null when there was none or it was not shared. */
  income: number | null;
  outcome: Outcome;
  challenges: string;
  tips: string[];
  media: "video" | "images" | "none";
  createdAt: string;
  status: ReviewStatus;
  /** Illustrative content written for the prototype, never a real member. */
  sample?: boolean;
  ownerId?: string;
}

export interface Provider {
  id: string;
  methods: number[];
  name: string;
  headline: string;
  bio: string;
  services: string[];
  portfolio: { label: string; url: string }[];
  priceFrom: number | null;
  priceNote?: string;
  city: string;
  remote: boolean;
  contact: { kind: "whatsapp" | "link" | "email"; value: string };
  createdAt: string;
  status: ReviewStatus;
  sample?: boolean;
  ownerId?: string;
}

export interface WeekInfo {
  /** 1…52, wraps after a full year. */
  week: number;
  startsAt: string;
  endsAt: string;
}

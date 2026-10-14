import "server-only";
import type { ContactRequest, Report } from "../demo/store";
import type { Provider, Story } from "../types";
import type { SessionUser } from "./auth";
import { db } from "./db";

export interface Community {
  stories: Story[];
  providers: Provider[];
  requests: ContactRequest[];
  reports: Report[];
  helpful: string[];
}

interface StoryRow {
  id: string;
  user_id: string;
  method: number;
  title: string;
  author: string;
  city: string | null;
  body: string;
  duration: string;
  cost: number | null;
  income: number | null;
  outcome: Story["outcome"];
  challenges: string;
  tips: string[];
  media: Story["media"];
  status: Story["status"];
  created_at: Date;
}

interface ProviderRow {
  id: string;
  user_id: string;
  methods: number[];
  name: string;
  headline: string;
  bio: string;
  services: string[];
  portfolio: { label: string; url: string }[];
  price_from: number | null;
  price_note: string | null;
  city: string;
  remote: boolean;
  contact_kind: Provider["contact"]["kind"];
  contact_value: string;
  status: Provider["status"];
  created_at: Date;
}

// owner ids are only sent back to their owner, so public lists do not expose account ids
const toStory = (r: StoryRow, viewer?: string): Story => ({
  id: r.id,
  method: r.method,
  title: r.title,
  author: r.author,
  city: r.city ?? undefined,
  body: r.body,
  duration: r.duration,
  cost: r.cost,
  income: r.income,
  outcome: r.outcome,
  challenges: r.challenges,
  tips: r.tips,
  media: r.media,
  createdAt: r.created_at.toISOString(),
  status: r.status,
  ownerId: r.user_id === viewer ? viewer : undefined,
});

const toProvider = (r: ProviderRow, viewer?: string): Provider => ({
  id: r.id,
  methods: r.methods,
  name: r.name,
  headline: r.headline,
  bio: r.bio,
  services: r.services,
  portfolio: r.portfolio,
  priceFrom: r.price_from,
  priceNote: r.price_note ?? undefined,
  city: r.city,
  remote: r.remote,
  contact: { kind: r.contact_kind, value: r.contact_value },
  createdAt: r.created_at.toISOString(),
  status: r.status,
  ownerId: r.user_id === viewer ? viewer : undefined,
});

/** What this visitor may see: everything approved, plus their own items and the requests sent to
 *  their profiles. Admins also get the review queue, every request and the reports. */
export async function loadCommunity(user: SessionUser | null): Promise<Community> {
  const sql = db();
  const me = user?.id ?? null;
  const all = !!user?.admin;
  const [stories, providers] = await Promise.all([
    sql<StoryRow[]>`select * from stories where status = 'approved' or user_id = ${me} or ${all} order by created_at desc limit 500`,
    sql<ProviderRow[]>`select * from providers where status = 'approved' or user_id = ${me} or ${all} order by created_at desc limit 500`,
  ]);
  const requests = me
    ? await sql<{ id: string; provider_id: string; provider_name: string; name: string; contact: string; message: string; created_at: Date }[]>`
        select r.id, r.provider_id, p.name as provider_name, r.name, r.contact, r.message, r.created_at
        from contact_requests r join providers p on p.id = r.provider_id
        where p.user_id = ${me} or ${all} order by r.created_at desc limit 500`
    : [];
  const helpful = me ? await sql<{ story_id: string }[]>`select story_id from helpful where user_id = ${me}` : [];
  const reports = all
    ? await sql<{ id: string; kind: Report["kind"]; target_id: string; target_title: string; reason: string; created_at: Date; resolved: boolean }[]>`
        select id, kind, target_id, target_title, reason, created_at, resolved from reports order by created_at desc limit 500`
    : [];
  return {
    stories: stories.map((r) => toStory(r, me ?? undefined)),
    providers: providers.map((r) => toProvider(r, me ?? undefined)),
    requests: requests.map((r) => ({ id: r.id, providerId: r.provider_id, providerName: r.provider_name, name: r.name, contact: r.contact, message: r.message, createdAt: r.created_at.toISOString() })),
    reports: reports.map((r) => ({ id: r.id, kind: r.kind, targetId: r.target_id, targetTitle: r.target_title, reason: r.reason, createdAt: r.created_at.toISOString(), resolved: r.resolved })),
    helpful: helpful.map((h) => h.story_id),
  };
}

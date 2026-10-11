import type { Metadata } from "next";
import { Admin } from "@/components/admin/admin";
import { SITE } from "@/lib/config";
import { getSummaries } from "@/lib/methods";
import { getCurrentWeek } from "@/lib/server/current-week";

export const metadata: Metadata = { title: "لوحة الإدارة", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const week = await getCurrentWeek();
  return <Admin methods={getSummaries()} week={week} siteUrl={SITE.url} />;
}

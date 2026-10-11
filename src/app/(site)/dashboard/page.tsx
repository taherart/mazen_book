import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { getSummaries } from "@/lib/methods";
import { getCurrentWeek } from "@/lib/server/current-week";

export const metadata: Metadata = { title: "حسابي", robots: { index: false } };

export default async function DashboardPage() {
  const week = await getCurrentWeek();
  return <Dashboard methods={getSummaries()} week={week} />;
}

import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChallengePage } from "@/components/challenge-page";
import { PageSkeleton } from "@/components/skeletons";
import { challengeTasks, getMethods, getSummaries } from "@/lib/methods";
import { currentWeekMethod } from "@/lib/server/access";
import { getCurrentWeek } from "@/lib/server/current-week";
import { backendEnabled } from "@/lib/server/db";

export const metadata: Metadata = {
  title: "تحدي وجائزة الأسبوع",
  description: "كل أسبوع طريقة جديدة لزيادة الدخل. انضم للتحدي، أنجز المهام، وثّق تجربتك، وادخل سحب الأسبوع.",
  alternates: { canonical: "/challenge" },
};

export default function WeeklyChallengeRoute() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content />
    </Suspense>
  );
}

// Only this week's method is open to everyone, so only its tasks are sent; the week's method can be
// changed by the team, so it is read per request. Without a database every method is open.
async function Content() {
  await connection();
  const week = await getCurrentWeek();
  const methods = getMethods();
  const open = backendEnabled() ? [await currentWeekMethod()] : methods.map((m) => m.n);
  const taskTitles = Object.fromEntries(open.map((n) => [n, challengeTasks(methods[n - 1]).map((t) => t.title)]));
  return <ChallengePage week={week} methods={getSummaries()} taskTitles={taskTitles} />;
}

import type { Metadata } from "next";
import { ChallengePage } from "@/components/challenge-page";
import { challengeTasks, getMethods, getSummaries } from "@/lib/methods";
import { getCurrentWeek } from "@/lib/server/current-week";

export const metadata: Metadata = {
  title: "تحدي وجائزة الأسبوع",
  description: "كل أسبوع طريقة جديدة لزيادة الدخل. انضم للتحدي، أنجز المهام، وثّق تجربتك، وادخل سحب الأسبوع.",
  alternates: { canonical: "/challenge" },
};

export default async function WeeklyChallengeRoute() {
  const week = await getCurrentWeek();
  const taskTitles = getMethods().map((m) => challengeTasks(m).map((t) => t.title));
  return <ChallengePage week={week} methods={getSummaries()} taskTitles={taskTitles} />;
}

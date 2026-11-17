import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChallengeBoard } from "@/components/challenge-board";
import { MethodSubpage } from "@/components/method-subpage";
import { UnlockPanel } from "@/components/unlock";
import { FormSkeleton } from "@/components/skeletons";
import { challengeTasks, getMethod, getMethods, parseMethodParam, toSummary } from "@/lib/methods";
import { methodOpen } from "@/lib/server/access";
import { getCurrentWeek } from "@/lib/server/current-week";

export function generateStaticParams() {
  return getMethods().map((m) => ({ n: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/method/[n]/challenge">): Promise<Metadata> {
  const n = parseMethodParam((await params).n);
  const m = n ? getMethod(n) : undefined;
  return { title: m ? `تحدي: ${m.title}` : "تحدٍ غير موجود", robots: { index: false } };
}

export default function ChallengePage({ params }: PageProps<"/method/[n]/challenge">) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/method/[n]/challenge">, "params">) {
  const n = parseMethodParam((await params).n);
  if (!n) notFound();
  const m = getMethod(n)!;
  const week = await getCurrentWeek();
  // the checklist is the method's steps, so it opens with the method
  if (!(await methodOpen(n))) {
    return (
      <MethodSubpage wide method={toSummary(m)} title={`تحدي: ${m.title}`} lead="هذه الطريقة مقفلة لك حاليًا، وتحديها يُفتح معها.">
        <UnlockPanel method={n} parts={["خطوات الطريقة", "مهام التحدي"]} />
      </MethodSubpage>
    );
  }
  return (
    <MethodSubpage wide method={toSummary(m)} title={`تحدي: ${m.title}`} lead="أنجز المهام واحدة واحدة، ووثّق ما يحدث معك خلال الأسبوع.">
      <ChallengeBoard method={toSummary(m)} tasks={challengeTasks(m)} week={week} />
    </MethodSubpage>
  );
}

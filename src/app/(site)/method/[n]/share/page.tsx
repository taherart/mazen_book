import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MethodSubpage } from "@/components/method-subpage";
import { FormSkeleton } from "@/components/skeletons";
import { StoryForm } from "@/components/story-form";
import { getMethod, getMethods, getSummaries, parseMethodParam, toSummary } from "@/lib/methods";

export function generateStaticParams() {
  return getMethods().map((m) => ({ n: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/method/[n]/share">): Promise<Metadata> {
  const n = parseMethodParam((await params).n);
  const m = n ? getMethod(n) : undefined;
  return { title: m ? `شارك تجربتك: ${m.title}` : "طريقة غير موجودة", robots: { index: false } };
}

export default function SharePage({ params }: PageProps<"/method/[n]/share">) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/method/[n]/share">, "params">) {
  const n = parseMethodParam((await params).n);
  if (!n) notFound();
  const m = toSummary(getMethod(n)!);
  return (
    <MethodSubpage method={m} title="شارك تجربتك" lead="جرّبت هذه الطريقة؟ احكِ ما حدث فعلًا: المدة، التكلفة، والنتيجة.">
      <StoryForm method={m} methods={getSummaries()} />
    </MethodSubpage>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MethodSubpage } from "@/components/method-subpage";
import { ProviderForm } from "@/components/provider-form";
import { FormSkeleton } from "@/components/skeletons";
import { getMethod, getMethods, getSummaries, parseMethodParam, toSummary } from "@/lib/methods";

export function generateStaticParams() {
  return getMethods().map((m) => ({ n: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/method/[n]/offer">): Promise<Metadata> {
  const n = parseMethodParam((await params).n);
  const m = n ? getMethod(n) : undefined;
  return { title: m ? `اعرض خدماتك: ${m.title}` : "طريقة غير موجودة", robots: { index: false } };
}

export default function OfferPage({ params }: PageProps<"/method/[n]/offer">) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/method/[n]/offer">, "params">) {
  const n = parseMethodParam((await params).n);
  if (!n) notFound();
  const m = toSummary(getMethod(n)!);
  return (
    <MethodSubpage method={m} title="اعرض خدماتك" lead="تتقن هذه المهارة؟ أنشئ ملفك ليصل إليك من يبحث عمّن ينفّذها.">
      <ProviderForm method={m} methods={getSummaries()} />
    </MethodSubpage>
  );
}

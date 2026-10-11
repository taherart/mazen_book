import type { Metadata } from "next";
import { Suspense } from "react";
import { ProviderDetail } from "@/components/provider-detail";
import { PageSkeleton } from "@/components/skeletons";
import { SAMPLE_PROVIDERS } from "@/data/samples";
import { getSummaries } from "@/lib/methods";

export function generateStaticParams() {
  return SAMPLE_PROVIDERS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/providers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const provider = SAMPLE_PROVIDERS.find((p) => p.id === id);
  return { title: provider?.name ?? "مقدم خدمة", description: provider?.headline, robots: { index: false } };
}

export default function ProviderPage({ params }: PageProps<"/providers/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

// Same as stories: profiles are looked up in the browser until the backend exists.
async function Content({ params }: Pick<PageProps<"/providers/[id]">, "params">) {
  const { id } = await params;
  return <ProviderDetail id={id} methods={getSummaries()} />;
}

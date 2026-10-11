import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/skeletons";
import { StoryDetail } from "@/components/story-detail";
import { SAMPLE_STORIES } from "@/data/samples";
import { getSummaries } from "@/lib/methods";

export function generateStaticParams() {
  return SAMPLE_STORIES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/stories/[id]">): Promise<Metadata> {
  const { id } = await params;
  const story = SAMPLE_STORIES.find((s) => s.id === id);
  return { title: story?.title ?? "تجربة من المجتمع", description: story?.body.slice(0, 160), robots: { index: false } };
}

export default function StoryPage({ params }: PageProps<"/stories/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

// In the prototype a story lives either in the illustrative set or in the visitor's browser,
// so the lookup happens on the client. With a backend this becomes a server read.
async function Content({ params }: Pick<PageProps<"/stories/[id]">, "params">) {
  const { id } = await params;
  return <StoryDetail id={id} methods={getSummaries()} />;
}

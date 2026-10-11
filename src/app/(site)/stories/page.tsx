import type { Metadata } from "next";
import { StoriesGrid } from "@/components/community-lists";
import { Container, Eyebrow, LinkButton } from "@/components/ui";
import { getSummaries } from "@/lib/methods";

export const metadata: Metadata = {
  title: "تجارب المجتمع",
  description: "تجارب حقيقية مع طرق زيادة الدخل: المدة، التكلفة، الدخل المحقق، والدروس. الناجح منها وغير الناجح.",
  alternates: { canonical: "/stories" },
};

export default function StoriesPage() {
  return (
    <>
      <header className="border-b-2 border-ink bg-white">
        <Container className="flex flex-wrap items-end justify-between gap-6 py-10 sm:py-14">
          <div className="max-w-2xl">
            <Eyebrow>تجارب المجتمع</Eyebrow>
            <h1 className="mt-4 font-display text-4xl text-ink sm:text-6xl">
              ماذا حدث حين <span className="marker marker-draw">جرّبوها؟</span>
            </h1>
            <p className="mt-3 text-lg text-ink-soft">كل تجربة توثّق المدة والتكلفة والدخل وأبرز التحديات. ننشر الناجح وغير الناجح، لأن الهدف التعلّم لا استعراض الأرباح.</p>
          </div>
          <LinkButton href="/methods" variant="primary" size="lg">
            شارك تجربتك
          </LinkButton>
        </Container>
      </header>
      <Container className="py-10">
        <StoriesGrid methods={getSummaries()} filter />
      </Container>
    </>
  );
}

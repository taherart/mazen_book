import type { Metadata } from "next";
import { ProvidersGrid } from "@/components/community-lists";
import { Container, Eyebrow, LinkButton } from "@/components/ui";
import { getSummaries } from "@/lib/methods";

export const metadata: Metadata = {
  title: "أصحاب المهارات",
  description: "دليل مقدمي الخدمات المرتبطة بطرق زيادة الدخل: مصورون، مصممون، مسوقون وغيرهم. تواصل مباشر بلا وسيط.",
  alternates: { canonical: "/providers" },
};

export default function ProvidersPage() {
  return (
    <>
      <header className="border-b-2 border-ink bg-white">
        <Container className="flex flex-wrap items-end justify-between gap-6 py-10 sm:py-14">
          <div className="max-w-2xl">
            <Eyebrow>دليل مقدمي الخدمات</Eyebrow>
            <h1 className="mt-4 font-display text-4xl text-ink sm:text-6xl">
              أصحاب <span className="marker marker-draw">المهارات</span>
            </h1>
            <p className="mt-3 text-lg text-ink-soft">أشخاص يتقنون إحدى الطرق ويقدمونها كخدمة. تصفّح ملفاتهم ونماذج أعمالهم، وتواصل معهم مباشرة.</p>
          </div>
          <LinkButton href="/methods" variant="primary" size="lg">
            اعرض خدماتك
          </LinkButton>
        </Container>
      </header>
      <Container className="py-10">
        <ProvidersGrid methods={getSummaries()} filter />
      </Container>
    </>
  );
}

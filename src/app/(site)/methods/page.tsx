import type { Metadata } from "next";
import { Suspense } from "react";
import { MethodsExplorer } from "@/components/methods-explorer";
import { CardGridSkeleton } from "@/components/skeletons";
import { Container, Eyebrow } from "@/components/ui";
import { getSummaries } from "@/lib/methods";

export const metadata: Metadata = {
  title: "دليل الطرق الـ52",
  description: "كل طرق زيادة الدخل في مكان واحد. صفِّ حسب رأس المال، مستوى الخبرة، مكان العمل، ونوع الدخل، واعثر على طريقتك خلال ثوانٍ.",
  alternates: { canonical: "/methods" },
};

export default function MethodsPage() {
  const methods = getSummaries();
  return (
    <>
      <header className="border-b border-line">
        <Container className="py-10 sm:py-14">
          <Eyebrow>الدليل الكامل</Eyebrow>
          <h1 className="mt-3 font-display text-4xl text-ink sm:text-6xl">ابحث عن طريقتك</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">52 طريقة من الكتاب، بأرقامها كما وردت فيه. اختر ما يناسب وقتك ورأس مالك وخبرتك، ثم افتح الطريقة وابدأ تحدّيها.</p>
        </Container>
      </header>
      <Container className="py-10">
        <Suspense fallback={<CardGridSkeleton count={8} />}>
          <MethodsExplorer methods={methods} />
        </Suspense>
        <p className="mt-10 rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-ink-soft">
          الدخل ورأس المال والمدة من ملخص كل طريقة في الكتاب، وهي تقديرات تختلف من شخص لآخر. تصنيفات «مستوى الخبرة» و«مكان العمل» و«نوع الدخل» أضفناها لتسهيل البحث.
        </p>
      </Container>
    </>
  );
}

import { FileWarning } from "lucide-react";
import type { Metadata } from "next";
import { Container, Notice } from "@/components/ui";

export const metadata: Metadata = { title: "الشروط والخصوصية وشروط السحب", robots: { index: false } };

// The legal text itself has to come from the project's counsel. This page fixes where it lives,
// what each part must cover, and the anchors the forms already link to.
const SECTIONS = [
  {
    id: "terms",
    title: "شروط الاستخدام",
    points: ["من يحق له التسجيل وما مسؤوليات العضو.", "المحتوى من الكتاب إرشادي، والأرقام تقديرات لا وعود بدخل.", "المنصة لا تدير المدفوعات بين العملاء ومقدمي الخدمات ولا تضمن الخدمة.", "متى يُوقف الحساب أو يُحذف المحتوى."],
  },
  {
    id: "publishing",
    title: "شروط النشر",
    points: ["التجربة شخصية وأرقامها صحيحة، وقد يُطلب إثبات.", "حقوق الصور والفيديو ونماذج الأعمال لصاحبها، ويمنح المنصة حق عرضها.", "لا بيانات عملاء ولا وجوه من لم يوافق.", "كل محتوى يُراجع قبل النشر، ويمكن التبليغ عنه بعده."],
  },
  {
    id: "privacy",
    title: "سياسة الخصوصية",
    points: ["البيانات التي نجمعها ولماذا (الحساب، التجارب، وسائل التواصل).", "ما يظهر للعموم وما يبقى خاصًا.", "حق العضو في تعديل بياناته وحذف حسابه ومحتواه.", "الالتزام بنظام حماية البيانات الشخصية في المملكة."],
  },
  {
    id: "raffle",
    title: "شروط السحب الأسبوعي",
    points: ["شروط التأهل لكل تحدٍ وموعد إغلاقه.", "آلية المراجعة، ثم الاختيار العشوائي بين المؤهلين.", "التحقق من الفائز قبل الإعلان، وطريقة تسليم الجائزة.", "ما يستلزمه النظام من تراخيص أو موافقات للسحوبات والجوائز."],
  },
];

export default function TermsPage() {
  return (
    <Container className="max-w-3xl py-12">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">الشروط والخصوصية</h1>
      <Notice tone="sun" className="mt-6" icon={<FileWarning className="size-5 text-sun-deep" />} title="النصوص النظامية لم تُكتب بعد">
        هذه الصفحة تحدد ما يجب أن يغطيه كل قسم. الصياغة النهائية يعدّها المستشار القانوني للمشروع وتُنشر قبل الإطلاق، خصوصًا شروط السحب والجوائز.
      </Notice>
      <div className="mt-8 grid gap-5">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24 rounded-3xl border-2 border-ink bg-white p-6">
            <h2 className="font-display text-2xl text-ink">{s.title}</h2>
            <p className="mt-1 text-sm font-bold text-ink-mute">يجب أن يغطي:</p>
            <ul className="mt-3 grid gap-2 text-ink-soft">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2.5 leading-7">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}

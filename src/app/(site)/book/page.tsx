import { AlertTriangle, ArrowLeft, Banknote, BookOpen, FileCheck2, Footprints, Laugh, QrCode, Scale, ShoppingBag } from "@/components/icons";
import type { Metadata } from "next";
import Image from "next/image";
import { Container, Eyebrow, LinkButton } from "@/components/ui";
import { SITE } from "@/lib/config";
import { getMethods } from "@/lib/methods";
import { DOMAINS } from "@/lib/taxonomy";
import type { Domain } from "@/lib/types";

export const metadata: Metadata = {
  title: "الكتاب والمؤلف",
  description: "كتاب عملي بـ52 طريقة لزيادة الدخل في السعودية: كم تكسب، كم تحتاج رأس مال، متى يجيك أول ريال، وما الأنظمة التي تلتزم بها. تأليف مازن الضراب.",
  alternates: { canonical: "/book" },
  openGraph: { type: "book", title: SITE.bookTitle, images: ["/brand/cover.webp"] },
};

const FEATURES = [
  { icon: Banknote, title: "أرقام واضحة بالريال", text: "دخل متوقع ورأس مال ومدة لكل طريقة، قبل أن تقرأ أي شيء آخر." },
  { icon: FileCheck2, title: "أرقام موثقة", text: "إحصاءات من جهات سعودية رسمية تشرح لماذا الطلب موجود." },
  { icon: AlertTriangle, title: "تحذيرات نظامية", text: "ما التراخيص المطلوبة (مثل وثيقة العمل الحر) وما الذي يعرّضك للمخالفة." },
  { icon: Footprints, title: "خطوات تبدأ بها اليوم", text: "لا نظريات. خطوات مرتبة تأخذك من الفكرة إلى أول عميل." },
  { icon: Laugh, title: "لغة بسيطة ورسومات مرحة", text: "مكتوب لكل المستويات، وكل طريقة تبدأ برسمة." },
  { icon: Scale, title: "صادق في التوقعات", text: "يوضح متى تكون الطريقة دخلًا إضافيًا ومتى تقود إلى الاستقلال المالي." },
];

const PAGE_TWO = ["ليش هذي الفرصة؟", "بعض الأرقام", "من أين تبدأ؟", "كم تكسب؟", "كيف تتميّز؟ (سرّ الصنعة)", "انتبه", "الخلاصة", "قصص نجاح واقعية", "رمز QR يفتح صفحة الطريقة هنا"];

const FAQ = [
  ["هل الكتاب مناسب للمبتدئين؟", "نعم. لغته بسيطة، وكثير من الطرق برأس مال صفر أو شبه صفر."],
  ["هل الأرقام مضمونة؟", "لا. هي تقديرات واقعية، والدخل الفعلي يعتمد على جهدك وخبرتك وموقعك، والكتاب يوضح ذلك في كل طريقة."],
  ["هل أحتاج ترخيصًا؟", "بعض الطرق نعم، مثل رخصة «فال» للوساطة العقارية، ورخصة «موثوق» للإعلانات المدفوعة. كل طريقة توضح ذلك في فقرة «انتبه»."],
  ["ما علاقة الكتاب بهذه المنصة؟", "في كل طريقة رمز QR يفتح صفحتها هنا، حيث تنضم لتحديها، تشارك تجربتك، أو تعرض خدماتك إن كنت تتقنها."],
  ["كم عدد الصفحات؟", "أكثر من 100 صفحة، بواقع صفحتين لكل طريقة."],
];

const AUTHOR_FACTS = [
  ["7000+", "متجر إلكتروني تم تأهيله"],
  ["200,000+", "شخص تم تدريبهم في التسويق والتجارة الإلكترونية"],
  ["eTree", "مؤسس جمعية التجارة الإلكترونية"],
];
const AWARDS = [
  ["2023", "أفضل شخصية عصامية رائدة، مبادرة عصاميون (الموسم الخامس)"],
  ["2013", "رواد الأعمال الأكثر إبداعًا في المملكة، فوربس الشرق الأوسط"],
  ["2011", "جائزة هديل للإعلام الجديد"],
];
const EDUCATION = [
  ["2015", "شهادة القيادة الرقمية والاستراتيجية الاجتماعية، كلية هارفارد للأعمال"],
  ["2010", "ماجستير التجارة الإلكترونية والتسويق، جامعة غرب أستراليا"],
  ["2006", "بكالوريوس علوم الحاسب، جامعة الملك سعود"],
];

export default function BookPage() {
  const methods = getMethods();
  const counts = methods.reduce<Record<string, number>>((acc, m) => ({ ...acc, [m.domain]: (acc[m.domain] ?? 0) + 1 }), {});

  return (
    <>
      <header className="overflow-hidden border-b-2 border-ink bg-brand blue-dots">
        <Container className="grid items-center gap-10 py-12 md:grid-cols-[1fr_auto] md:py-16">
          <div className="animate-enter text-white">
            <Eyebrow className="border-white/40 bg-white/10 text-white">
              <BookOpen aria-hidden className="size-3.5" />
              تأليف {SITE.author}
            </Eyebrow>
            <h1 className="mt-5 font-display text-display">
              52 طريقة لتزيد دخلك <span className="marker-white marker-draw">«من جد»</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-9 text-white/85">دليل عملي لـ52 فرصة دخل حقيقية في السعودية: كم تكسب، كم تحتاج، من أين تبدأ، وما الذي تحذر منه.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <OrderButton />
              <LinkButton href="/methods" variant="white" size="lg">
                تصفّح الطرق
                <ArrowLeft aria-hidden className="size-5" />
              </LinkButton>
            </div>
          </div>
          <Image src="/brand/cover.webp" alt={`غلاف كتاب ${SITE.bookTitle}`} width={768} height={1024} priority sizes="(min-width: 768px) 300px, 60vw" className="lift mx-auto w-56 rotate-[4deg] animate-enter rounded-2xl border-2 border-ink shadow-print [animation-delay:160ms] md:w-72" />
        </Container>
      </header>

      <section className="border-b-2 border-ink bg-white">
        <Container className="grid gap-10 py-14 lg:grid-cols-2">
          <div data-reveal>
            <h2 className="font-display text-h2 text-ink">دخلك ثابت… والمصاريف مو ثابتة؟</h2>
            <p className="mt-4 text-lg leading-9 text-ink-soft">تعرف أن الراتب وحده ما يكفي، لكن ما تعرف من وين تبدأ. الفرص موجودة، لكنها مبعثرة، ومعظم الكلام عنها نظري.</p>
            <p className="mt-3 text-lg leading-9 text-ink-soft">
              هذا الكتاب يجمعها لك: لكل طريقة صفحتان تقول لك <b className="text-ink">كم تكسب بالريال</b>، <b className="text-ink">كم تحتاج رأس مال</b>، <b className="text-ink">متى يجيك أول ريال</b>، وما الأنظمة التي تلتزم بها.
            </p>
          </div>
          <div data-stagger className="grid gap-4 sm:grid-cols-2">
            <div data-reveal className="rounded-3xl border-2 border-ink bg-paper p-5">
              <p className="text-xs font-bold text-ink-mute">الصفحة الأولى</p>
              <h3 className="mt-1 font-display text-xl text-ink">الصورة بثلاثة أرقام</h3>
              <ul className="mt-3 grid gap-2 text-sm font-bold text-ink">
                {["رسمة مرحة وعنوان", "الدخل المتوقع", "رأس المال", "أول ريال خلال"].map((x) => (
                  <li key={x} className="rounded-xl border border-line bg-white px-3 py-2">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div data-reveal className="rounded-3xl border-2 border-ink bg-paper p-5">
              <p className="text-xs font-bold text-ink-mute">الصفحة الثانية</p>
              <h3 className="mt-1 font-display text-xl text-ink">تسعة أجزاء ثابتة</h3>
              <ol className="mt-3 grid gap-1.5 text-sm text-ink-soft">
                {PAGE_TWO.map((x, i) => (
                  <li key={x} className="flex gap-2">
                    <span className="font-display text-brand">{i + 1}</span>
                    {x}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      <section className="paper-dots">
        <Container className="py-14">
          <h2 data-reveal className="font-display text-h2 text-ink">
            طرق، <span className="marker marker-draw">مو نصايح</span>
          </h2>
          <ul data-stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} data-reveal className="rounded-3xl border-2 border-ink bg-white p-5">
                <span className="grid size-12 place-items-center rounded-2xl border-2 border-ink bg-sun text-ink">
                  <Icon aria-hidden className="size-6" />
                </span>
                <h3 className="mt-4 font-display text-xl text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-7 text-ink-soft">{text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-y-2 border-ink bg-white">
        <Container className="py-14">
          <h2 data-reveal className="font-display text-h2 text-ink">52 طريقة في 10 مجالات</h2>
          <ul data-reveal className="mt-6 flex flex-wrap gap-2.5">
            {(Object.keys(DOMAINS) as Domain[]).map((d) => (
              <li key={d}>
                <LinkButton href={`/methods?domain=${d}`} variant="white">
                  {DOMAINS[d]}
                  <span className="grid size-6 place-items-center rounded-full bg-brand pt-px text-xs text-white">{counts[d] ?? 0}</span>
                </LinkButton>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-center gap-2 text-ink-soft">
            <QrCode aria-hidden className="size-5 text-brand" />
            في كل طريقة رمز QR يفتح صفحتها على هذه المنصة لتبدأ تحدّيها.
          </p>
        </Container>
      </section>

      <section id="author" className="scroll-mt-20 bg-brand-deep text-white blue-dots">
        <Container className="grid gap-10 py-14 lg:grid-cols-[auto_1fr]">
          <Image src="/brand/author.avif" alt={SITE.author} width={400} height={400} sizes="220px" className="mx-auto size-48 rounded-[2rem] border-2 border-white object-cover lg:mx-0 lg:size-56" />
          <div data-reveal>
            <p className="text-sm font-bold text-sun">عن المؤلف</p>
            <h2 className="mt-1 font-display text-h1">{SITE.author}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-9 text-white/85">رائد أعمال ومستثمر ملاكي سعودي. الرئيس التنفيذي لشركة زد منذ يوليو 2025، وعضو مجلس إدارة شركة فلاي أكيد. أسّس شركة حركات للإنتاج المرئي وترأس مجلس إدارتها.</p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              {AUTHOR_FACTS.map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-white/25 bg-white/10 p-4">
                  <dd className="font-display text-3xl leading-none text-sun" dir="ltr">
                    {value}
                  </dd>
                  <dt className="mt-2 text-sm text-white/80">{label}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <Timeline title="جوائز" rows={AWARDS} />
              <Timeline title="التعليم" rows={EDUCATION} />
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container className="max-w-3xl py-14">
          <h2 data-reveal className="font-display text-h2 text-ink">عندك سؤال؟</h2>
          <div data-reveal className="mt-6 grid gap-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-3xl border-2 border-ink bg-white p-5 open:shadow-print-sm">
                <summary className="flex list-none items-center justify-between gap-4 font-display text-xl text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink text-xl leading-none transition group-open:rotate-45 group-open:bg-sun">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-8 text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
          <div data-reveal="scale" className="mt-10 rounded-[2rem] border-2 border-ink bg-sun p-6 text-center shadow-print sm:p-10">
            <h2 className="font-display text-h2 text-ink">ابدأ طريقك الأولى اليوم</h2>
            <p className="mt-2 text-ink">52 فرصة، وبعضها يبدأ بأسبوع وبلا رأس مال. اختر واحدة وابدأ.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <OrderButton />
              <LinkButton href="/challenge" variant="white" size="lg">
                تحدي هذا الأسبوع
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function OrderButton() {
  if (!SITE.bookOrderUrl) {
    return (
      <span className="inline-flex h-14 items-center gap-2.5 rounded-full border-2 border-dashed border-ink bg-white/90 px-7 text-lg font-bold text-ink-soft" title="يُضاف رابط المتجر عند توفره">
        <ShoppingBag aria-hidden className="size-5" />
        رابط الطلب يُضاف قريبًا
      </span>
    );
  }
  return (
    <a href={SITE.bookOrderUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-14 select-none items-center gap-2.5 rounded-full border-2 border-ink bg-sun px-7 text-lg font-bold text-ink shadow-print-sm transition hover:bg-sun-deep">
      <ShoppingBag aria-hidden className="size-5" />
      اطلب نسختك الآن
    </a>
  );
}

function Timeline({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div>
      <h3 className="font-display text-xl text-sun">{title}</h3>
      <ul className="mt-3 grid gap-3">
        {rows.map(([year, text]) => (
          <li key={year} className="flex gap-3 text-sm leading-6 text-white/85">
            <span className="font-display text-lg leading-6 text-white">{year}</span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

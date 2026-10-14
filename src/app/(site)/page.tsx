import { ArrowLeft, BookOpen, HandCoins, ListChecks, PenLine } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { CommunityStats, ProvidersGrid, StoriesGrid } from "@/components/community-lists";
import { MethodsExplorer } from "@/components/methods-explorer";
import { Container, Eyebrow, LinkButton, SectionHead } from "@/components/ui";
import { WeekStrip, WeeklyChallengeCard } from "@/components/weekly";
import { SITE } from "@/lib/config";
import { getSummaries } from "@/lib/methods";
import { getCurrentWeek } from "@/lib/server/current-week";

const JOURNEY = [
  { icon: BookOpen, title: "اقرأ عن الفرصة", text: "كل طريقة في صفحة واحدة: كم تكسب، كم تحتاج، ومن أين تبدأ." },
  { icon: ListChecks, title: "جرّبها في أسبوع", text: "انضم للتحدي واتبع قائمة مهام عملية، خطوة بخطوة." },
  { icon: PenLine, title: "وثّق نتيجتك", text: "شارك ما حدث فعلًا، نجحت أو لم تنجح، وادخل سحب الأسبوع." },
  { icon: HandCoins, title: "قدّمها كخدمة", text: "أتقنت المهارة؟ اعرض خدماتك في دليل أصحاب المهارات." },
];

export default async function HomePage() {
  const week = await getCurrentWeek();
  const methods = getSummaries();
  const facts = [
    { value: methods.filter((m) => m.capitalBand === "zero").length, label: "طريقة برأس مال صفر أو شبه صفر" },
    { value: methods.filter((m) => m.timeBand === "week").length, label: "طريقة يأتي أول ريالها خلال أسبوعين" },
    { value: methods.filter((m) => m.place !== "field").length, label: "طريقة تبدأ بها من بيتك" },
  ];

  return (
    <>
      {/* ---------- hero: CSS load sequence, never waits for JavaScript ---------- */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-brand blue-dots">
        {/* the site's one parallax element: the outlined 52 drifts against the scroll */}
        <span aria-hidden className="drift pointer-events-none absolute -top-16 start-[-2rem] select-none">
          <span className="block animate-[vt-fade_var(--dur-5)_var(--ease-out-expo)_both] font-display text-[22rem] leading-none text-transparent [-webkit-text-stroke:3px_rgb(255_255_255/0.1)] sm:text-[30rem]">52</span>
        </span>
        <Container className="relative grid items-center gap-10 pb-14 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-20">
          <div className="text-white">
            <Eyebrow className="animate-rise border-white/40 bg-white/10 text-white">
              <BookOpen aria-hidden className="size-3.5" />
              من كتاب {SITE.author}
            </Eyebrow>
            <h1 className="mt-5 animate-rise font-display text-display [animation-delay:80ms]">
              دخلك الإضافي يبدأ{" "}
              <span className="marker-white marker-draw" style={{ "--marker-delay": "520ms" } as React.CSSProperties}>
                بتجربة.
              </span>
            </h1>
            <p className="mt-5 max-w-xl animate-rise text-lead text-white/85 [animation-delay:620ms]">52 طريقة عملية لزيادة دخلك. اختر الطريقة التي تناسبك، جرّبها، شارك نتائجك، وتعلّم من تجارب الآخرين.</p>
            {/* one action here: the weekly card beside it owns "join" */}
            <div className="mt-8 animate-rise [animation-delay:680ms]">
              <LinkButton href="/methods" variant="sun" size="lg">
                استكشف الـ52 طريقة
                <ArrowLeft aria-hidden className="size-5" />
              </LinkButton>
            </div>
          </div>
          <WeeklyChallengeCard week={week} methods={methods} className="animate-land [animation-delay:700ms]" />
        </Container>
      </section>

      {/* ---------- the numbers, moved out of the hero ---------- */}
      <section aria-label="الطرق بالأرقام" className="border-b-2 border-ink bg-paper">
        <Container>
          <dl data-stagger className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {facts.map((f) => (
              <div key={f.label} data-reveal className="flex items-center gap-4 py-5 sm:px-6 sm:first:ps-0 sm:last:pe-0">
                <dt className="text-sm font-semibold leading-6 text-ink-soft">{f.label}</dt>
                <dd data-countup={f.value} className="order-first font-display text-h1 leading-none text-brand tabular-nums">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="border-b-2 border-ink bg-white">
        <Container className="py-10">
          <ol data-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map(({ icon: Icon, title, text }, i) => (
              <li key={title} data-reveal className="relative flex gap-4 rounded-3xl bg-paper p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-white text-brand shadow-print-sm">
                  <Icon aria-hidden className="size-6" />
                </span>
                <div>
                  <p className="text-xs font-bold text-ink-mute">الخطوة {i + 1}</p>
                  <h3 className="font-display text-h3 text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ---------- explore ---------- */}
      <section className="paper-dots">
        <Container className="py-section">
          <SectionHead
            reveal
            title={
              <>
                استكشف <span className="marker marker-draw">الطرق الـ52</span>
              </>
            }
            lead="صفِّ حسب ما تملكه الآن: رأس المال، خبرتك، والوقت الذي تنتظره حتى أول دخل."
            action={
              <LinkButton href="/methods" variant="white">
                كل الطرق
                <ArrowLeft aria-hidden className="size-4" />
              </LinkButton>
            }
          />
          <div className="mt-8">
            <Suspense fallback={<div className="skeleton h-96" />}>
              <MethodsExplorer methods={methods} compact limit={8} />
            </Suspense>
          </div>
        </Container>
      </section>

      {/* ---------- the year ---------- */}
      <section className="border-y-2 border-ink bg-white">
        <Container className="grid items-center gap-8 py-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div data-reveal>
            <h2 className="font-display text-h2 text-ink">كل أسبوع طريقة، وكل طريقة فرصة</h2>
            <p className="mt-3 text-ink-soft">كل مربع صفحة طريقة، وهي نفسها التي يفتحها رمز QR في الكتاب. المربع الأصفر هو تحدي هذا الأسبوع، والأزرق ما بدأته أنت.</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-soft">
              <li className="flex items-center gap-2">
                <span className="size-4 rounded-md border-2 border-ink bg-sun" /> تحدي الأسبوع
              </li>
              <li className="flex items-center gap-2">
                <span className="size-4 rounded-md border-2 border-ink bg-brand" /> بدأتها
              </li>
              <li className="flex items-center gap-2">
                <span className="size-4 rounded-md border-2 border-ink bg-ink" /> أكملتها
              </li>
            </ul>
          </div>
          <WeekStrip week={week} methods={methods} />
        </Container>
      </section>

      {/* ---------- stories ---------- */}
      <section>
        <Container className="py-section">
          <SectionHead
            reveal
            title="ماذا حدث حين جرّبوها؟"
            lead="تجارب موثّقة بالمدة والتكلفة والدخل، الناجح منها وغير الناجح."
            action={
              <LinkButton href="/stories" variant="white">
                كل التجارب
                <ArrowLeft aria-hidden className="size-4" />
              </LinkButton>
            }
          />
          <div data-reveal className="mt-8">
            <StoriesGrid methods={methods} limit={3} filter />
          </div>
        </Container>
      </section>

      {/* ---------- providers ---------- */}
      <section className="border-y-2 border-ink bg-white">
        <Container className="py-section">
          <SectionHead
            reveal
            title="تحتاج من ينفّذها لك؟"
            lead="أشخاص يقدّمون خدمات مرتبطة بالطرق. تواصل معهم مباشرة، بلا وسيط ولا عمولة."
            action={
              <LinkButton href="/providers" variant="white">
                دليل أصحاب المهارات
                <ArrowLeft aria-hidden className="size-4" />
              </LinkButton>
            }
          />
          <div data-reveal className="mt-8">
            <ProvidersGrid methods={methods} limit={4} />
          </div>
        </Container>
      </section>

      {/* ---------- achievements ---------- */}
      <section className="bg-brand-deep blue-dots">
        <Container className="py-section">
          <div data-reveal>
            <h2 className="font-display text-h2 text-white">إنجازات المجتمع</h2>
            <p className="mt-2 max-w-2xl text-white/75">نعدّ ما حدث فعلًا فقط: تجارب بدأت، وتجارب اكتملت، وقصص نُشرت.</p>
          </div>
          <div className="mt-8">
            <CommunityStats methods={methods} />
          </div>
        </Container>
      </section>

      {/* ---------- book ---------- */}
      <section>
        <Container className="py-section">
          <div data-reveal className="grid items-center gap-8 overflow-hidden rounded-[2rem] border-2 border-ink bg-sun p-6 shadow-print sm:p-10 md:grid-cols-[auto_1fr]">
            <Image src="/brand/cover.webp" alt={`غلاف كتاب ${SITE.bookTitle}`} width={768} height={1024} sizes="220px" className="mx-auto w-44 rotate-[-4deg] rounded-xl border-2 border-ink shadow-print transition-[rotate,translate] duration-(--dur-2) ease-out-expo hover:-translate-y-1.5 hover:rotate-[-2deg] md:w-52" />
            <div>
              <h2 className="font-display text-h2 text-ink">الطرق كلها بين يديك في الكتاب</h2>
              <p className="mt-3 max-w-xl text-ink">صفحتان لكل طريقة: الأرقام، الخطوات، سرّ الصنعة، والتنبيهات النظامية. وفي كل صفحة رمز QR يأخذك إلى هنا لتبدأ التجربة.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/book" variant="primary" size="lg">
                  تعرّف على الكتاب
                </LinkButton>
                <LinkButton href="/methods" variant="white" size="lg">
                  تصفّح الطرق
                </LinkButton>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

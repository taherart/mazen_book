import { ArrowLeft, BookOpen, HandCoins, ListChecks, PenLine, QrCode } from "lucide-react";
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
  const zero = methods.filter((m) => m.capitalBand === "zero").length;
  const fast = methods.filter((m) => m.timeBand === "week").length;
  const home = methods.filter((m) => m.place !== "field").length;

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-brand blue-dots">
        <span aria-hidden className="pointer-events-none absolute -top-16 start-[-2rem] select-none font-display text-[22rem] leading-none text-transparent opacity-60 [-webkit-text-stroke:3px_rgb(255_255_255/0.16)] sm:text-[30rem]">
          52
        </span>
        <Container className="relative grid items-center gap-10 pb-14 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-20">
          <div className="animate-rise text-white">
            <Eyebrow className="border-white/40 bg-white/10 text-white">
              <BookOpen aria-hidden className="size-3.5" />
              من كتاب {SITE.author}
            </Eyebrow>
            <h1 className="mt-5 font-display text-5xl leading-[1.25] sm:text-6xl lg:text-7xl">
              دخلك الإضافي يبدأ <span className="marker-white">بتجربة.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-9 text-white/85 sm:text-xl">52 طريقة عملية لزيادة دخلك. اختر الطريقة التي تناسبك، جرّبها، شارك نتائجك، وتعلّم من تجارب الآخرين.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/methods" variant="sun" size="lg">
                استكشف الـ52 طريقة
                <ArrowLeft aria-hidden className="size-5" />
              </LinkButton>
              <LinkButton href="/challenge" variant="white" size="lg">
                ابدأ تحدي هذا الأسبوع
              </LinkButton>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                { value: zero, label: "طريقة برأس مال صفر أو شبه صفر" },
                { value: fast, label: "طريقة يأتي أول ريالها خلال أسبوعين" },
                { value: home, label: "طريقة تبدأ بها من بيتك" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/25 bg-white/10 px-3 py-3">
                  <dd className="font-display text-4xl leading-none">{s.value}</dd>
                  <dt className="mt-1.5 text-xs leading-5 text-white/80">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <WeeklyChallengeCard week={week} methods={methods} className="animate-rise [animation-delay:120ms]" />
        </Container>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="border-b-2 border-ink bg-white">
        <Container className="py-10">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative flex gap-4 rounded-3xl bg-paper p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-white text-brand shadow-print-sm">
                  <Icon aria-hidden className="size-6" />
                </span>
                <div>
                  <p className="text-xs font-bold text-ink-mute">الخطوة {i + 1}</p>
                  <h3 className="font-display text-xl leading-tight text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ---------- explore ---------- */}
      <section className="paper-dots">
        <Container className="py-16">
          <SectionHead
            eyebrow="الدليل"
            title={
              <>
                استكشف <span className="marker">الطرق الـ52</span>
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
          <div>
            <Eyebrow>
              <QrCode aria-hidden className="size-3.5" />
              52 أسبوعًا
            </Eyebrow>
            <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">كل أسبوع طريقة، وكل طريقة فرصة</h2>
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
        <Container className="py-16">
          <SectionHead
            eyebrow="تجارب المجتمع"
            title="ماذا حدث حين جرّبوها؟"
            lead="تجارب موثّقة بالمدة والتكلفة والدخل، الناجح منها وغير الناجح."
            action={
              <LinkButton href="/stories" variant="white">
                كل التجارب
                <ArrowLeft aria-hidden className="size-4" />
              </LinkButton>
            }
          />
          <StoriesGrid methods={methods} limit={3} filter className="mt-8" />
        </Container>
      </section>

      {/* ---------- providers ---------- */}
      <section className="border-y-2 border-ink bg-white">
        <Container className="py-16">
          <SectionHead
            eyebrow="أصحاب المهارات"
            title="تحتاج من ينفّذها لك؟"
            lead="أشخاص يقدّمون خدمات مرتبطة بالطرق. تواصل معهم مباشرة، بلا وسيط ولا عمولة."
            action={
              <LinkButton href="/providers" variant="white">
                دليل أصحاب المهارات
                <ArrowLeft aria-hidden className="size-4" />
              </LinkButton>
            }
          />
          <ProvidersGrid methods={methods} limit={4} className="mt-8" />
        </Container>
      </section>

      {/* ---------- achievements ---------- */}
      <section className="bg-brand-deep blue-dots">
        <Container className="py-16">
          <h2 className="font-display text-3xl text-white sm:text-4xl">إنجازات المجتمع</h2>
          <p className="mt-2 max-w-2xl text-white/75">نعدّ ما حدث فعلًا فقط: تجارب بدأت، وتجارب اكتملت، وقصص نُشرت.</p>
          <div className="mt-8">
            <CommunityStats methods={methods} />
          </div>
        </Container>
      </section>

      {/* ---------- book ---------- */}
      <section>
        <Container className="py-16">
          <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] border-2 border-ink bg-sun p-6 shadow-print sm:p-10 md:grid-cols-[auto_1fr]">
            <Image src="/brand/cover.webp" alt={`غلاف كتاب ${SITE.bookTitle}`} width={768} height={1024} sizes="220px" className="mx-auto w-44 rotate-[-4deg] rounded-xl border-2 border-ink shadow-print md:w-52" />
            <div>
              <h2 className="font-display text-3xl text-ink sm:text-4xl">الطرق كلها بين يديك في الكتاب</h2>
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

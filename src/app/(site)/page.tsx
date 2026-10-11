import { ArrowLeft, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CommunityBento, CommunityStats } from "@/components/community-lists";
import { MethodTile } from "@/components/method-card";
import { Container, Eyebrow, LinkButton, SectionHead } from "@/components/ui";
import { STRIP_LEGEND } from "@/components/week-strip-tones";
import { WeekStrip, WeeklyChallengeCard } from "@/components/weekly";
import { SITE } from "@/lib/config";
import { getSummaries } from "@/lib/methods";
import { getCurrentWeek } from "@/lib/server/current-week";
import type { MethodSummary } from "@/lib/types";

const JOURNEY = [
  { title: "اقرأ عن الفرصة", text: "كل طريقة في صفحة واحدة: كم تكسب، كم تحتاج، ومن أين تبدأ." },
  { title: "جرّبها في أسبوع", text: "انضم للتحدي واتبع قائمة مهام عملية، خطوة بخطوة." },
  { title: "وثّق نتيجتك", text: "شارك ما حدث فعلًا، نجحت أو لم تنجح، وادخل سحب الأسبوع." },
  { title: "قدّمها كخدمة", text: "أتقنت المهارة؟ اعرض خدماتك في دليل أصحاب المهارات." },
];

/** The bento's five cells, each picked by a rule rather than by hand, so the reason on the card is
 *  always true. The first rule fills the large cell. Each pick prefers a domain not shown yet. */
const PICKS: { reason: string; test: (m: MethodSummary) => boolean }[] = [
  { reason: "ابدأ من هنا", test: (m) => m.level === 1 && m.capitalBand === "zero" && m.place !== "field" },
  { reason: "بلا رأس مال", test: (m) => m.capitalBand === "zero" },
  { reason: "أول ريال خلال أسبوعين", test: (m) => m.timeBand === "week" },
  { reason: "تبدأ من بيتك", test: (m) => m.place === "home" },
  { reason: "لأصحاب الخبرة", test: (m) => m.level === 3 },
];

function pickMethods(methods: MethodSummary[], skip: number) {
  const used = new Set([skip]); // this week's method already leads the hero
  const domains = new Set<string>();
  return PICKS.flatMap(({ reason, test }) => {
    const pool = methods.filter((m) => !used.has(m.n) && test(m));
    const m = pool.find((x) => !domains.has(x.domain)) ?? pool[0];
    if (!m) return [];
    used.add(m.n);
    domains.add(m.domain);
    return [{ method: m, reason }];
  });
}

export default async function HomePage() {
  const week = await getCurrentWeek();
  const methods = getSummaries();
  const count = (test: (m: MethodSummary) => boolean) => methods.filter(test).length;
  const zero = count((m) => m.capitalBand === "zero");
  const fast = count((m) => m.timeBand === "week");
  const home = count((m) => m.place !== "field");
  const [lead, ...picks] = pickMethods(methods, week.week);
  // the same filters the guide uses, so each shortcut opens it already narrowed
  const shortcuts = [
    { href: "/methods?capital=zero", label: "رأس مال صفر", n: zero },
    { href: "/methods?time=week", label: "دخل خلال أسبوعين", n: fast },
    { href: "/methods?place=home", label: "من البيت", n: home },
    { href: "/methods?level=1", label: "للمبتدئين", n: count((m) => m.level === 1) },
  ];

  return (
    <>
      {/* ---------- hero ----------
          First-paint choreography, CSS only: the 52 fades in, the headline rises line by line,
          the marker swipes under «بتجربة», then the subtext, the button and the weekly card. */}
      <section className="torn-b relative overflow-hidden bg-brand blue-dots">
        <span aria-hidden className="pointer-events-none absolute -top-16 start-[-2rem] animate-fade-in select-none">
          <span className="drift block font-display text-[22rem] leading-none text-transparent opacity-60 [-webkit-text-stroke:3px_rgb(255_255_255/0.16)] sm:text-[30rem]">52</span>
        </span>
        <Container className="relative grid items-center gap-10 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-24 lg:pt-20">
          <div className="text-white">
            <Eyebrow className="animate-enter border-white/40 bg-white/10 text-white">
              <BookOpen aria-hidden className="size-3.5" />
              من كتاب {SITE.author}
            </Eyebrow>
            <h1 className="mt-5 font-display text-display">
              <span className="block animate-enter [animation-delay:80ms]">دخلك الإضافي</span>{" "}
              <span className="block animate-enter [animation-delay:160ms]">
                يبدأ <span className="marker-white marker-draw [--marker-delay:520ms]">بتجربة.</span>
              </span>
            </h1>
            <p className="mt-5 max-w-xl animate-enter text-lead text-white/85 [animation-delay:620ms]">52 طريقة عملية لزيادة دخلك. اختر الطريقة التي تناسبك، جرّبها، شارك نتائجك، وتعلّم من تجارب الآخرين.</p>
            <div className="mt-8 animate-enter [animation-delay:680ms]">
              <LinkButton href="/methods" variant="sun" size="lg">
                استكشف الـ52 طريقة
                <ArrowLeft aria-hidden className="size-5" />
              </LinkButton>
            </div>
          </div>
          <WeeklyChallengeCard week={week} methods={methods} className="animate-land [animation-delay:700ms]" />
        </Container>
      </section>

      {/* ---------- facts: the three real numbers, flat, counted up once ---------- */}
      <section>
        <Container className="py-section-tight">
          <dl data-stagger className="grid grid-cols-3 divide-x divide-line">
            {[
              { value: zero, label: "طريقة برأس مال صفر أو شبه صفر" },
              { value: fast, label: "طريقة يأتي أول ريالها خلال أسبوعين" },
              { value: home, label: "طريقة تبدأ بها من بيتك" },
            ].map((s) => (
              <div key={s.label} data-reveal className="flex flex-col-reverse px-3 text-center sm:px-6">
                <dt className="mt-2 text-meta text-ink-soft sm:text-sm">{s.label}</dt>
                <dd data-countup={s.value} className="font-display text-h1 leading-none text-brand">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ---------- how it works: one drawn route, four stops (vertical on phones) ---------- */}
      <section className="border-y-2 border-ink bg-white">
        <Container className="py-section-tight">
          <h2 className="sr-only">كيف تعمل المنصة</h2>
          <ol
            data-stagger
            className="relative grid gap-8 before:absolute before:inset-y-6 before:start-6 before:border-s-2 before:border-dashed before:border-ink/35 lg:grid-cols-4 lg:gap-6 lg:before:inset-x-[12.5%] lg:before:bottom-auto lg:before:top-6 lg:before:border-s-0 lg:before:border-t-2"
          >
            {JOURNEY.map((s, i) => (
              <li key={s.title} data-reveal className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
                <span aria-hidden className="grid size-12 shrink-0 rotate-[-6deg] place-items-center rounded-full border-2 border-ink bg-sun pt-[0.12em] font-display text-2xl leading-none text-ink shadow-print-sm">
                  {i + 1}
                </span>
                <div className="pt-1 lg:pt-0">
                  <h3 className="font-display text-h3 text-ink">
                    <span className="sr-only">الخطوة {i + 1}: </span>
                    {s.title}
                  </h3>
                  <p className="mt-1 max-w-xs text-sm leading-6 text-ink-soft">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ---------- explore: five picks, then shortcuts into the full guide ---------- */}
      <section className="paper-dots">
        <Container className="py-section">
          <SectionHead
            reveal
            title={
              <>
                استكشف <span className="marker marker-draw">الطرق الـ52</span>
              </>
            }
            lead="خمس طرق نقترح أن تبدأ بها، وكل واحدة لسبب مكتوب عليها."
            action={
              <LinkButton href="/methods" variant="white">
                كل الطرق
                <ArrowLeft aria-hidden className="size-4" />
              </LinkButton>
            }
          />
          <ul data-stagger className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:gap-5">
            {lead ? (
              <li data-reveal className="col-span-2 lg:row-span-2">
                <MethodTile method={lead.method} reason={lead.reason} large />
              </li>
            ) : null}
            {picks.map((p) => (
              <li key={p.method.n} data-reveal>
                <MethodTile method={p.method} reason={p.reason} />
              </li>
            ))}
          </ul>
          <nav data-reveal aria-label="تصفّح الطرق حسب" className="mt-8 flex flex-wrap items-center gap-2">
            <span className="me-1 text-sm font-bold text-ink-soft">تصفّح حسب:</span>
            {shortcuts.map((s) => (
              <Link key={s.href} href={s.href} className="tap inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3.5 py-2 text-sm font-bold leading-none text-ink transition hover:bg-brand-wash">
                {s.label}
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 pt-px text-xs text-white">{s.n}</span>
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      {/* ---------- the year: the signature object, full width ---------- */}
      <section className="torn-y bg-brand text-white blue-dots">
        <Container className="py-section">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="max-w-2xl">
              <h2 className="font-display text-h2">كل أسبوع طريقة، وكل طريقة فرصة</h2>
              <p className="mt-2 text-white/85">كل مربع صفحة طريقة، وهي نفسها التي يفتحها رمز QR في الكتاب.</p>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/85">
              {STRIP_LEGEND.blue.map(([swatch, label]) => (
                <li key={label} className="flex items-center gap-2">
                  <span className={`size-4 rounded-md border-2 border-ink ${swatch}`} /> {label}
                </li>
              ))}
            </ul>
          </div>
          <WeekStrip week={week} methods={methods} tone="blue" className="mt-8 sm:gap-2.5 sm:[&_a]:text-2xl" />
        </Container>
      </section>

      {/* ---------- community: stories, providers and the counters in one place ---------- */}
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
          <div className="mt-8">
            <CommunityBento methods={methods} />
          </div>
          <div className="mt-12 border-t-2 border-ink pt-8">
            <h3 data-reveal className="mb-5 font-display text-h3 text-ink">
              إنجازات المجتمع <span className="font-sans text-base font-normal text-ink-soft">· نعدّ ما حدث فعلًا فقط</span>
            </h3>
            <CommunityStats methods={methods} />
          </div>
        </Container>
      </section>

      {/* ---------- book ---------- */}
      <section>
        <Container className="pb-section">
          <div data-reveal className="grid items-center gap-8 overflow-hidden rounded-panel border-2 border-ink bg-sun p-6 shadow-print sm:p-10 md:grid-cols-[auto_1fr]">
            <Image src="/brand/cover.webp" alt={`غلاف كتاب ${SITE.bookTitle}`} width={768} height={1024} sizes="220px" className="lift mx-auto w-44 rotate-[-4deg] rounded-tile border-2 border-ink shadow-print md:w-52" />
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

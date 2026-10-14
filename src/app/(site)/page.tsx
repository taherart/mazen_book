import { ArrowLeft, BookOpen, Check } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";
import { CommunityBento, CommunityStats } from "@/components/community-lists";
import { MethodTile } from "@/components/method-card";
import { Container, Eyebrow, LinkButton, SectionHead } from "@/components/ui";
import { WeeklyChallengeCard } from "@/components/weekly";
import { YearWall } from "@/components/year-wall";
import { SITE } from "@/lib/config";
import { getSummaries } from "@/lib/methods";
import { getCurrentWeek } from "@/lib/server/current-week";
import type { MethodSummary } from "@/lib/types";

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
          First-paint choreography, CSS only: the headline rises line by line, then the subtext,
          the button and the weekly card. */}
      <section className="relative overflow-hidden bg-brand">
        <Container className="relative grid items-center gap-10 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-24 lg:pt-20">
          <div className="text-white">
            <Eyebrow className="animate-enter text-white/80">
              <BookOpen aria-hidden className="size-3.5" />
              من كتاب {SITE.author}
            </Eyebrow>
            <h1 className="mt-5 font-display text-display">
              <span className="block animate-enter [animation-delay:80ms]">دخلك الإضافي</span>{" "}
              <span className="block animate-enter [animation-delay:160ms]">
                يبدأ بتجربة.
              </span>
            </h1>
            <p className="mt-5 max-w-xl animate-enter text-lead text-white/85 [animation-delay:620ms]">52 طريقة عملية لزيادة دخلك. اختر الطريقة التي تناسبك، جرّبها، شارك نتائجك، وتعلّم من تجارب الآخرين.</p>
            <div className="mt-8 animate-enter [animation-delay:680ms]">
              <LinkButton href="/methods" variant="white" size="lg">
                استكشف الـ52 طريقة
                <ArrowLeft aria-hidden className="size-5" />
              </LinkButton>
            </div>
          </div>
          <WeeklyChallengeCard week={week} methods={methods} className="animate-land [animation-delay:700ms]" />
        </Container>
      </section>

      {/* ---------- explore: five picks, then shortcuts into the full guide ---------- */}
      <section>
        <Container className="py-section">
          <SectionHead
            reveal
            title="خمس طرق نقترح أن تبدأ بها"
            lead="كل واحدة لسبب مكتوب عليها. والبقية في دليل الطرق الـ52."
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
              <Link key={s.href} href={s.href} className="tap inline-flex items-center gap-2 rounded-full border border-ink/20 bg-white px-3.5 py-2 text-sm font-bold leading-none text-ink transition hover:border-ink">
                {s.label}
                <span className="text-xs font-semibold text-brand">{s.n}</span>
              </Link>
            ))}
            <Link href="/methods?view=chart" className="tap inline-flex items-center gap-1.5 px-2 py-2 text-sm font-bold text-brand underline underline-offset-4">
              قارن الدخل الشهري للطرق
            </Link>
          </nav>
        </Container>
      </section>

      {/* ---------- the year: a wall planner of the 52 weeks ---------- */}
      <section className="border-y border-line bg-paper-deep/40">
        <Container className="py-section">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="max-w-2xl">
              <h2 className="font-display text-h2 text-ink">جدول السنة: 52 أسبوعًا، 52 طريقة</h2>
              <p className="mt-2 text-ink-soft">كل أسبوع تحدٍّ بطريقة من الكتاب، والتاريخ يوم بدايته. افتح أي طريقة متى شئت؛ السحب والجائزة لأسبوعها.</p>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
              <li className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-sun" /> هذا الأسبوع
              </li>
              <li className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand" /> بدأتها
              </li>
              <li className="flex items-center gap-2">
                <Check aria-hidden className="size-4 text-ok" /> أكملتها
              </li>
            </ul>
          </div>
          <YearWall week={week} methods={methods} className="mt-8" />
        </Container>
      </section>

      {/* ---------- community: stories, providers and the counters in one place ---------- */}
      <section>
        <Container className="py-section">
          <SectionHead
            reveal
            title="ما حدث فعلًا حين جرّبوها"
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
          <div className="mt-12 border-t border-line pt-8">
            <h3 data-reveal className="mb-5 text-lg font-bold text-ink">
              إنجازات المجتمع <span className="text-base font-normal text-ink-soft">· نعدّ ما حدث فعلًا فقط</span>
            </h3>
            <CommunityStats methods={methods} />
          </div>
        </Container>
      </section>

      {/* ---------- book ---------- */}
      <section>
        <Container className="pb-section">
          <div data-reveal className="grid items-center gap-8 overflow-hidden rounded-panel border border-line bg-white p-6 sm:p-10 md:grid-cols-[auto_1fr]">
            <Image src="/brand/cover.webp" alt={`غلاف كتاب ${SITE.bookTitle}`} width={768} height={1024} sizes="220px" className="lift mx-auto w-40 rounded-md shadow-[0_18px_40px_-18px_rgb(29_31_38/0.55)] md:w-48" />
            <div>
              <h2 className="font-display text-h2 text-ink">الطرق كلها بين يديك في الكتاب</h2>
              <p className="mt-3 max-w-xl text-ink-soft">صفحتان لكل طريقة: الأرقام، الخطوات، سرّ الصنعة، والتنبيهات النظامية. وفي كل صفحة رمز QR يأخذك إلى هنا لتبدأ التجربة.</p>
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

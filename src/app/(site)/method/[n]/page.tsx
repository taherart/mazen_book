import { AlertTriangle, ArrowLeft, Banknote, BookOpen, ChevronLeft, Clock3, HandHeart, Lock, MessageSquareHeart, PlayCircle, Rocket, Sparkles, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { ProvidersGrid, StoriesGrid } from "@/components/community-lists";
import { LevelDots, MethodArt, MethodNumber } from "@/components/method-card";
import { RafflePanel, WeekRibbon } from "@/components/method-week";
import { Qr } from "@/components/qr";
import { ShareButtons } from "@/components/share-buttons";
import { PageSkeleton } from "@/components/skeletons";
import { T } from "@/components/text";
import { Chip, Container, LinkButton, SectionHead } from "@/components/ui";
import { JoinButton } from "@/components/weekly";
import { SITE } from "@/lib/config";
import { challengeTasks, getMethod, getMethods, getSummaries, methodHref, parseMethodParam } from "@/lib/methods";
import { getCurrentWeek } from "@/lib/server/current-week";
import { CAPITAL, DOMAINS, KINDS, LEVELS, PLACES, TASKS, TIME, count } from "@/lib/taxonomy";
import type { Method } from "@/lib/types";

export function generateStaticParams() {
  return getMethods().map((m) => ({ n: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/method/[n]">): Promise<Metadata> {
  const n = parseMethodParam((await params).n);
  const m = n ? getMethod(n) : undefined;
  if (!m) return { title: "طريقة غير موجودة" };
  const description = `${m.tagline ? `${m.tagline}. ` : ""}${m.why}`.slice(0, 180);
  return {
    title: `${m.title} · الطريقة ${m.n}`,
    description,
    alternates: { canonical: methodHref(m.n) },
    openGraph: { type: "article", title: `الطريقة ${m.n}: ${m.title}`, description, url: methodHref(m.n), images: [{ url: `/og/${m.slug}.jpg`, width: 1200, height: 630, alt: m.title }] },
  };
}

/** "Who is this for", read straight off the method's tags rather than written by hand. */
function fitLines(m: Method) {
  return [
    m.place === "home" ? "تبحث عن عمل تديره من البيت." : m.place === "field" ? "لا تمانع العمل الميداني خارج البيت." : "تريد عملًا يجمع بين البيت والميدان.",
    m.level === 1 ? "تبدأ من الصفر، بلا خبرة سابقة." : m.level === 2 ? "مستعد لتعلّم مهارة خلال أسابيع قبل أول عميل." : "عندك خبرة أو مستعد للحصول على تأهيل أو ترخيص متخصص.",
    m.capitalBand === "zero" ? "لا تريد أن تضع رأس مال في البداية." : m.capitalBand === "low" ? "تستطيع أن تبدأ بمبلغ بسيط لا يتجاوز ألف ريال." : "عندك رأس مال تستثمره في المعدات أو البضاعة.",
    m.timeBand === "week" ? "تريد دخلًا سريعًا خلال أسبوع أو أسبوعين." : m.timeBand === "month" ? "تصبر شهرًا أو شهرين حتى أول دخل." : "تبني دخلًا على المدى الأبعد، وتصبر عليه أشهرًا.",
  ];
}

export default function MethodPage({ params }: PageProps<"/method/[n]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MethodContent params={params} />
    </Suspense>
  );
}

async function MethodContent({ params }: Pick<PageProps<"/method/[n]">, "params">) {
  const { n: param } = await params;
  const n = parseMethodParam(param);
  if (!n) notFound();
  const m = getMethod(n)!;
  // the QR codes print /method/07; keep one address per method
  if (param !== m.slug) permanentRedirect(methodHref(n));

  const week = await getCurrentWeek();
  const methods = getSummaries();
  const tasks = challengeTasks(m);
  const prev = getMethod(n - 1);
  const next = getMethod(n + 1);
  const base = methodHref(n);

  const stats = [
    { icon: Banknote, label: "الدخل المتوقع", value: m.stats.income, tone: "bg-brand text-white" },
    { icon: Wallet, label: "رأس المال المبدئي", value: m.stats.capital, tone: "bg-white text-ink" },
    { icon: Clock3, label: "أول ريال خلال", value: m.stats.firstRiyal, tone: "bg-white text-ink" },
  ];

  return (
    <article>
      {/* ---------- hero ---------- */}
      <header className="border-b-2 border-ink paper-dots">
        <Container className="pb-10 pt-6">
          <nav aria-label="مسار التصفح" className="flex flex-wrap items-center gap-1 text-sm font-semibold text-ink-soft">
            <Link href="/methods" className="hover:text-brand">
              الطرق الـ52
            </Link>
            <ChevronLeft aria-hidden className="size-4" />
            <Link href={`/methods?domain=${m.domain}`} className="hover:text-brand">
              {DOMAINS[m.domain]}
            </Link>
          </nav>

          <div className="mt-5 grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
            <div className="animate-rise">
              <div className="flex items-center gap-3">
                <MethodNumber n={m.n} size="lg" className="shadow-print-sm" />
                <p className="text-sm font-bold text-ink-soft">
                  الطريقة {m.n} من 52
                  <span className="block font-normal text-ink-mute">{DOMAINS[m.domain]}</span>
                </p>
              </div>
              <h1 className="mt-4 font-display text-4xl leading-[1.3] text-ink sm:text-5xl lg:text-6xl">{m.title}</h1>
              {m.tagline ? <p className="mt-3 font-display text-2xl leading-snug text-brand sm:text-3xl">«{m.tagline}»</p> : null}
              <ul className="mt-5 flex flex-wrap gap-2">
                <li>
                  <Chip tone="white">{KINDS[m.kind]}</Chip>
                </li>
                <li>
                  <Chip tone="white">{PLACES[m.place]}</Chip>
                </li>
                <li>
                  <Chip tone="white">
                    <LevelDots level={m.level} />
                  </Chip>
                </li>
              </ul>
              <dl className="mt-6 grid gap-3 sm:grid-cols-3">
                {stats.map(({ icon: Icon, label, value, tone }) => (
                  <div key={label} className={`rounded-3xl border-2 border-ink p-4 shadow-print-sm ${tone}`}>
                    <dt className="flex items-center gap-1.5 text-xs font-bold opacity-80">
                      <Icon aria-hidden className="size-4" />
                      {label}
                    </dt>
                    <dd className="mt-1.5 font-display text-xl leading-snug">
                      <T>{value}</T>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <JoinButton method={n} />
                <a href="#paths" className="text-sm font-bold text-ink-soft underline underline-offset-4 hover:text-brand">
                  أو اعرض خدماتك · شارك تجربتك
                </a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md animate-rise [animation-delay:120ms]">
              <div className="rounded-[2.5rem] border-2 border-ink bg-white p-4 shadow-print">
                <MethodArt n={m.n} title={m.title} priority sizes="(min-width: 1024px) 420px, 90vw" />
              </div>
              <span aria-hidden className="absolute -bottom-4 -start-3 rotate-[-6deg] rounded-2xl border-2 border-ink bg-sun px-4 py-1.5 font-display text-lg text-ink shadow-print-sm">
                جرّبها هذا الأسبوع
              </span>
            </div>
          </div>
          <div className="mt-8">
            <WeekRibbon method={n} week={week} />
          </div>
        </Container>
      </header>

      {/* ---------- the three ways in (what the book's QR code opens onto) ---------- */}
      <section id="paths" className="scroll-mt-20 border-b-2 border-ink bg-white">
        <Container className="grid gap-4 py-8 md:grid-cols-3">
          <PathCard icon={<Rocket className="size-6" />} tone="bg-brand text-white" title="أريد تجربة هذه الطريقة" text={`${count(tasks.length, TASKS)} تتابع إنجازها خلال الأسبوع، خطوة بخطوة.`}>
            <JoinButton method={n} size="md" variant="sun" className="w-full" label="ابدأ التحدي" />
          </PathCard>
          <PathCard icon={<HandHeart className="size-6" />} tone="bg-white text-ink" title="أمتلك المهارة وأريد تقديم خدماتي" text="أنشئ ملفك واظهر في دليل مقدمي الخدمات لهذه الطريقة.">
            <LinkButton href={`${base}/offer`} variant="white" className="w-full">
              اعرض خدماتك
            </LinkButton>
          </PathCard>
          <PathCard icon={<MessageSquareHeart className="size-6" />} tone="bg-white text-ink" title="لدي تجربة وأريد مشاركتها" text="نجحت أو لم تنجح: المدة، التكلفة، وما تعلّمته يفيد من بعدك.">
            <LinkButton href={`${base}/share`} variant="white" className="w-full">
              شارك تجربتك
            </LinkButton>
          </PathCard>
        </Container>
      </section>

      {/* ---------- A. about the method ---------- */}
      <Container className="grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="why">
            <h2 id="why" className="font-display text-3xl text-ink">
              ليش هذي الفرصة؟
            </h2>
            <p className="mt-3 text-lg leading-9 text-ink-soft">
              <T>{m.why}</T>
            </p>
            <div className="mt-6 flex items-center gap-4 rounded-3xl border-2 border-dashed border-line bg-white/70 p-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-wash text-brand">
                <PlayCircle aria-hidden className="size-7" />
              </span>
              <div>
                <p className="font-bold text-ink">الفيديو التعريفي</p>
                <p className="text-sm text-ink-soft">مقطع قصير يشرح الفكرة يُضاف هنا مع انطلاق تحدي هذه الطريقة.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="facts">
            <h2 id="facts" className="font-display text-3xl text-ink">
              بعض الأرقام
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {m.facts.map((f) => (
                <li key={f} className="rounded-3xl border-2 border-ink bg-white p-4 text-sm leading-7 text-ink-soft">
                  <T>{f}</T>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="steps">
            <h2 id="steps" className="font-display text-3xl text-ink">
              من أين تبدأ؟ <span className="text-ink-mute">خطواتك إلى أول عميل</span>
            </h2>
            <ol className="mt-5 grid gap-3">
              {m.steps.map((s) => (
                <li key={s.n} className="flex gap-4 rounded-3xl border-2 border-ink bg-white p-4 sm:p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun pt-[0.12em] font-display text-2xl leading-none text-ink">{s.n}</span>
                  <p className="leading-8 text-ink-soft">
                    {s.label ? (
                      <b className="text-ink">
                        <T>{s.label}</T>:{" "}
                      </b>
                    ) : null}
                    <T>{s.text}</T>
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {m.earn.length ? (
            <section aria-labelledby="earn" className="rounded-[2rem] border-2 border-ink bg-brand-wash p-5 sm:p-7">
              <h2 id="earn" className="font-display text-3xl text-ink">
                كم تكسب؟
              </h2>
              <ul className="mt-3 grid gap-2.5">
                {m.earn.map((e) => (
                  <li key={e} className="flex gap-3 leading-8 text-ink">
                    <Banknote aria-hidden className="mt-1.5 size-5 shrink-0 text-brand" />
                    <span>
                      <T>{e}</T>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* a taste of the two sections that stay in the book */}
          <section aria-labelledby="craft" className="overflow-hidden rounded-[2rem] border-2 border-ink bg-brand-deep text-white blue-dots">
            <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-2">
              <div>
                <h2 id="craft" className="flex items-center gap-2 font-display text-2xl">
                  <Sparkles aria-hidden className="size-5 text-sun" />
                  كيف تتميّز؟ (سرّ الصنعة)
                </h2>
                <p className="mt-3 leading-8 text-white/90">
                  <T>{m.tips[0]}</T>
                </p>
              </div>
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl">
                  <AlertTriangle aria-hidden className="size-5 text-sun" />
                  انتبه
                </h2>
                <p className="mt-3 leading-8 text-white/90">
                  <T>{m.warnings[0]}</T>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-white/20 bg-white/10 px-5 py-4 sm:px-7">
              <p className="flex items-center gap-2 text-sm">
                <Lock aria-hidden className="size-4 text-sun" />
                في الكتاب: {count(m.tips.length - 1, ["سرّ آخر", "سرّان آخران", "أسرار أخرى"])} للتميّز{m.warnings.length > 1 ? ` و${count(m.warnings.length - 1, ["تنبيه إضافي", "تنبيهان إضافيان", "تنبيهات إضافية"])}` : ""}.
              </p>
              <LinkButton href="/book" variant="sun" size="sm">
                <BookOpen aria-hidden className="size-4" />
                الطريقة كاملة في الكتاب
              </LinkButton>
            </div>
          </section>

          <blockquote className="relative rounded-[2rem] border-2 border-ink bg-sun p-6 shadow-print sm:p-8">
            <p className="text-sm font-bold text-ink/70">الخلاصة</p>
            <p className="mt-2 font-display text-2xl leading-[1.6] text-ink sm:text-3xl">
              <T>{m.summary}</T>
            </p>
          </blockquote>
        </div>

        {/* ---------- sidebar ---------- */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border-2 border-ink bg-white p-5">
            <h2 className="font-display text-xl text-ink">لمن تناسب؟</h2>
            <ul className="mt-3 grid gap-2.5 text-sm leading-6 text-ink-soft">
              {fitLines(m).map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {line}
                </li>
              ))}
            </ul>
            <dl className="mt-4 grid gap-2 border-t border-line pt-4 text-sm">
              {[
                ["رأس المال", CAPITAL[m.capitalBand]],
                ["أول دخل", TIME[m.timeBand]],
                ["مستوى الخبرة", LEVELS[m.level]],
                ["مكان العمل", PLACES[m.place]],
                ["نوع الدخل", KINDS[m.kind]],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-mute">{k}</dt>
                  <dd className="font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl border-2 border-ink bg-white p-5">
            <h2 className="font-display text-xl text-ink">شارك هذه الطريقة</h2>
            <p className="mt-1 text-sm text-ink-soft">أرسلها لمن تعرف أنها تناسبه.</p>
            <ShareButtons path={base} title={`الطريقة ${m.n}: ${m.title}`} className="mt-3" />
          </div>

          <div className="flex items-center gap-4 rounded-3xl border-2 border-ink bg-white p-5">
            <Qr value={`${SITE.url}${base}`} title={`رمز QR لصفحة ${m.title}`} className="size-24 shrink-0 rounded-lg border border-line" />
            <div className="text-sm">
              <p className="font-bold text-ink">رمز هذه الصفحة في الكتاب</p>
              <p className="text-ink-soft">
                يفتح <bdi dir="ltr" className="font-semibold text-brand">{`${new URL(SITE.url).host}${base}`}</bdi>
              </p>
            </div>
          </div>
        </aside>
      </Container>

      {/* ---------- B. start the challenge ---------- */}
      <section className="border-y-2 border-ink bg-brand blue-dots">
        <Container className="grid items-center gap-8 py-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="text-white">
            <h2 className="font-display text-4xl">ابدأ التجربة</h2>
            <p className="mt-2 max-w-md text-lg text-white/85">المعرفة وحدها لا تزيد الدخل. انضم للتحدي، أنجز المهام واحدة واحدة، ووثّق ما يحدث.</p>
            <JoinButton method={n} variant="sun" className="mt-6" />
          </div>
          <ol className="grid gap-2 rounded-[2rem] border-2 border-ink bg-white p-4 shadow-print">
            {tasks.map((t, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-paper px-3 py-2.5">
                <span aria-hidden className="size-5 shrink-0 rounded-md border-2 border-ink bg-white" />
                <span className="min-w-0 flex-1 truncate font-bold text-ink">
                  <T>{t.title}</T>
                </span>
                <span className="text-xs font-semibold text-ink-mute">مهمة {i + 1}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ---------- E. stories ---------- */}
      <section>
        <Container className="py-14">
          <SectionHead
            title="تجارب الآخرين مع هذه الطريقة"
            lead="قصص موثّقة بالمدة والتكلفة والدخل، تُنشر بعد المراجعة."
            action={
              <LinkButton href={`${base}/share`} variant="white">
                جرّبتها؟ شارك تجربتك
              </LinkButton>
            }
          />
          <StoriesGrid methods={methods} method={n} limit={3} className="mt-8" />
        </Container>
      </section>

      {/* ---------- F. providers ---------- */}
      <section className="border-y-2 border-ink bg-white">
        <Container className="py-14">
          <SectionHead
            title="مقدمو الخدمات"
            lead="أشخاص يقدمون خدمات مرتبطة بهذه الطريقة. التواصل مباشر معهم."
            action={
              <LinkButton href={`${base}/offer`} variant="white">
                أمتلك هذه المهارة
              </LinkButton>
            }
          />
          <ProvidersGrid methods={methods} method={n} limit={4} className="mt-8" />
        </Container>
      </section>

      {/* ---------- G. weekly prize ---------- */}
      <section>
        <Container className="py-14">
          <SectionHead title="تحدي وجائزة الأسبوع" />
          <RafflePanel method={n} week={week} className="mt-6" />
        </Container>
      </section>

      {/* ---------- prev / next ---------- */}
      <nav aria-label="طرق أخرى" className="border-t-2 border-ink bg-white">
        <Container className="grid grid-cols-2 gap-3 py-6">
          {prev ? (
            <Link href={methodHref(prev.n)} className="group rounded-2xl border-2 border-line p-3 transition hover:border-ink">
              <span className="text-xs text-ink-mute">الطريقة السابقة</span>
              <span className="block truncate font-bold text-ink group-hover:text-brand">
                {prev.n}. {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={methodHref(next.n)} className="group rounded-2xl border-2 border-line p-3 text-end transition hover:border-ink">
              <span className="text-xs text-ink-mute">الطريقة التالية</span>
              <span className="flex items-center justify-end gap-1 truncate font-bold text-ink group-hover:text-brand">
                {next.n}. {next.title}
                <ArrowLeft aria-hidden className="size-4 shrink-0" />
              </span>
            </Link>
          ) : null}
        </Container>
      </nav>
    </article>
  );
}

function PathCard({ icon, tone, title, text, children }: { icon: React.ReactNode; tone: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-3 rounded-3xl border-2 border-ink p-5 shadow-print-sm ${tone}`}>
      <span className="grid size-11 place-items-center rounded-2xl border-2 border-ink bg-white text-brand">{icon}</span>
      <h2 className="font-display text-xl leading-snug">{title}</h2>
      <p className="text-sm leading-6 opacity-80">{text}</p>
      <div className="mt-auto pt-1">{children}</div>
    </div>
  );
}

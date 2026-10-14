"use client";

import { Award, Bell, Flag, HandHeart, Inbox, LogOut, MessageSquareHeart, Rocket, ShieldCheck, Sparkles, Ticket, Trash2, Trophy } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useDemo } from "@/lib/demo/hooks";
import { actions, type DemoUser } from "@/lib/demo/store";
import { methodHref } from "@/lib/methods";
import type { MethodSummary, WeekInfo } from "@/lib/types";
import { AuthGate } from "./auth-gate";
import { MethodNumber } from "./method-card";
import { Avatar, Button, Chip, Container, EmptyState, Progress, StatusPill, buttonClass, cx } from "./ui";
import { WeekStrip, useWeekMethod } from "./weekly";

const ENTRY = { pending: { label: "بانتظار المراجعة", tone: "sun" }, eligible: { label: "مؤهلة للسحب", tone: "ok" }, rejected: { label: "غير مؤهلة", tone: "bad" } } as const;

export function Dashboard({ methods, week }: { methods: MethodSummary[]; week: WeekInfo }) {
  return (
    <Container className="py-8 sm:py-10">
      <AuthGate title="سجّل دخولك لترى لوحتك" reason="هنا تتابع الطرق التي بدأتها، مهامك، تجاربك المنشورة، خدماتك، ومشاركاتك في السحوبات.">
        {(user) => <Board user={user} methods={methods} week={week} />}
      </AuthGate>
    </Container>
  );
}

function Board({ user, methods, week }: { user: DemoUser; methods: MethodSummary[]; week: WeekInfo }) {
  const router = useRouter();
  const { challenges, stories, providers, requests, admin } = useDemo();
  const weekMethod = useWeekMethod(week);
  const mine = Object.entries(challenges)
    .map(([n, c]) => ({ m: methods[Number(n) - 1], c }))
    .sort((a, b) => b.c.joinedAt.localeCompare(a.c.joinedAt));
  const completed = mine.filter(({ m, c }) => c.done.length >= m.tasks);
  const entries = mine.filter(({ c }) => c.submittedAt);
  const published = stories.filter((s) => s.status === "approved").length;
  const myRequests = requests.filter((r) => providers.some((p) => p.id === r.providerId));

  const badges = [
    { icon: Rocket, title: "أول تجربة", text: "انضممت لأول تحدٍ", earned: mine.length >= 1 },
    { icon: Flag, title: "أكملت 4 تحديات", text: `${Math.min(completed.length, 4)} من 4`, earned: completed.length >= 4 },
    { icon: MessageSquareHeart, title: "شاركت أول قصة", text: "أرسلت تجربة للمجتمع", earned: stories.length >= 1 },
    { icon: HandHeart, title: "صاحب مهارة", text: "عرضت خدمة في الدليل", earned: providers.length >= 1 },
    { icon: Trophy, title: "أكملت 12 أسبوعًا", text: `${Math.min(completed.length, 12)} من 12`, earned: completed.length >= 12 },
  ];

  const notes: { icon: typeof Bell; text: ReactNode; href: string }[] = [];
  if (!challenges[weekMethod]) notes.push({ icon: Sparkles, text: <>تحدي هذا الأسبوع: <b>{methods[weekMethod - 1].title}</b>. انضم قبل أن ينتهي.</>, href: "/challenge" });
  for (const { m, c } of entries) if (c.entry !== "pending") notes.push({ icon: Ticket, text: <>مشاركتك في تحدي «{m.title}»: <b>{ENTRY[c.entry].label}</b>.</>, href: `${methodHref(m.n)}/challenge` });
  for (const s of stories) if (s.status !== "pending") notes.push({ icon: MessageSquareHeart, text: <>تجربتك «{s.title}» {s.status === "approved" ? <b>نُشرت</b> : <b>لم تُقبل</b>}.</>, href: `/stories/${s.id}` });
  for (const p of providers) if (p.status !== "pending") notes.push({ icon: HandHeart, text: <>ملف خدماتك «{p.name}» {p.status === "approved" ? <b>ظهر في الدليل</b> : <b>لم يُقبل</b>}.</>, href: `/providers/${p.id}` });
  if (myRequests.length) notes.push({ icon: Inbox, text: <>طلبات تواصل جديدة على خدماتك: <b>{myRequests.length}</b>.</>, href: "#services" });
  const win = Object.entries(admin.winners).find(([, w]) => w.announced && w.name === user.name);
  if (win) notes.unshift({ icon: Trophy, text: <>مبروك! فزت بسحب الأسبوع <b>{win[0]}</b>.</>, href: "/challenge" });

  return (
    <div className="space-y-10">
      {/* ---------- header ---------- */}
      <header className="flex flex-wrap items-center gap-4 rounded-[2rem] border-2 border-ink bg-brand p-5 text-white shadow-print blue-dots sm:p-7">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl sm:text-4xl">أهلًا {user.name.split(" ")[0]}</h1>
          <p className="truncate text-white/75" dir="ltr">
            {user.email}
          </p>
        </div>
        <dl className="grid w-full grid-cols-4 gap-2 sm:w-auto">
          {[
            ["بدأتها", mine.length],
            ["أكملتها", completed.length],
            ["قصص منشورة", published],
            ["خدمات", providers.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/25 bg-white/10 px-3 py-2 text-center">
              <dd className="font-display text-3xl leading-none">{value}</dd>
              <dt className="mt-1 text-[0.7rem] text-white/80">{label}</dt>
            </div>
          ))}
        </dl>
      </header>

      {user.admin ? (
        <Link href="/admin" className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-sun px-4 py-3 font-bold text-ink shadow-print-sm">
          <ShieldCheck aria-hidden className="size-5" />
          حسابك مشرف: افتح لوحة الإدارة
        </Link>
      ) : null}

      {/* ---------- notifications ---------- */}
      <Section icon={<Bell className="size-5" />} title="الإشعارات">
        {notes.length ? (
          <ul className="grid gap-2">
            {notes.map((n, i) => (
              <li key={i}>
                <Link href={n.href} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink-soft transition hover:border-ink">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-wash text-brand">
                    <n.icon aria-hidden className="size-4" />
                  </span>
                  <span>{n.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-ink-soft">لا جديد الآن. تصلك هنا التحديات الجديدة وحالة مشاركاتك.</p>
        )}
      </Section>

      {/* ---------- challenges ---------- */}
      <Section icon={<Rocket className="size-5" />} title="الطرق التي بدأتها" action={<Link href="/methods" className={buttonClass("white", "sm")}>ابدأ طريقة جديدة</Link>}>
        {mine.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {mine.map(({ m, c }) => {
              const pct = (c.done.length / m.tasks) * 100;
              const done = c.done.length >= m.tasks;
              return (
                <li key={m.n} className="rounded-3xl border-2 border-ink bg-white p-4">
                  <div className="flex items-start gap-3">
                    <MethodNumber n={m.n} />
                    <div className="min-w-0 flex-1">
                      <Link href={methodHref(m.n)} className="block truncate font-display text-xl leading-tight text-ink hover:text-brand">
                        {m.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {m.n === weekMethod ? <Chip tone="sun">تحدي الأسبوع</Chip> : null}
                        {done ? <Chip tone="ok">مكتمل</Chip> : <Chip>جارٍ</Chip>}
                        {c.submittedAt ? <Chip tone={ENTRY[c.entry].tone}>{ENTRY[c.entry].label}</Chip> : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={pct} tone={done ? "sun" : "brand"} className="flex-1" />
                    <span className="text-sm font-bold tabular-nums text-ink">
                      {c.done.length}/{m.tasks}
                    </span>
                  </div>
                  <Link href={`${methodHref(m.n)}/challenge`} className={buttonClass(done ? "soft" : "primary", "sm", "mt-4")}>
                    {done ? (c.submittedAt ? "راجع مشاركتك" : "أرسل مشاركتك") : "تابع المهام"}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={<Rocket className="size-6" />} title="لم تبدأ أي طريقة بعد" action={<Link href="/challenge" className={buttonClass("primary")}>ابدأ بتحدي هذا الأسبوع</Link>}>
            اختر طريقة تناسبك وانضم لتحدّيها، وستظهر هنا مهامها ونسبة إنجازك.
          </EmptyState>
        )}
      </Section>

      {/* ---------- badges ---------- */}
      <Section icon={<Award className="size-5" />} title="شارات الإنجاز">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {badges.map(({ icon: Icon, title, text, earned }) => (
            <li key={title} className={cx("rounded-3xl border-2 p-4 text-center transition", earned ? "border-ink bg-sun shadow-print-sm" : "border-dashed border-line bg-white/60")}>
              <span className={cx("mx-auto grid size-12 place-items-center rounded-full border-2", earned ? "animate-wiggle border-ink bg-white text-brand" : "border-line text-ink-mute")}>
                <Icon aria-hidden className="size-6" />
              </span>
              <p className={cx("mt-2 font-display text-lg leading-tight", earned ? "text-ink" : "text-ink-mute")}>{title}</p>
              <p className="text-xs text-ink-soft">{earned ? "حصلت عليها" : text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- 52 map ---------- */}
      <Section icon={<Flag className="size-5" />} title="خريطتك على مدار 52 أسبوعًا">
        <WeekStrip week={week} methods={methods} />
      </Section>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* ---------- stories ---------- */}
        <Section icon={<MessageSquareHeart className="size-5" />} title="تجاربي">
          {stories.length ? (
            <ul className="grid gap-2">
              {stories.map((s) => (
                <li key={s.id}>
                  <Link href={`/stories/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 transition hover:border-ink">
                    <MethodNumber n={s.method} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-bold text-ink">{s.title}</span>
                    <StatusPill status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<MessageSquareHeart className="size-6" />} title="لم تشارك تجربة بعد" action={mine[0] ? <Link href={`${methodHref(mine[0].m.n)}/share`} className={buttonClass("primary")}>شارك تجربتك</Link> : undefined}>
              بعد أن تجرّب طريقة، احكِ ما حدث: المدة، التكلفة، والنتيجة.
            </EmptyState>
          )}
        </Section>

        {/* ---------- services ---------- */}
        <Section id="services" icon={<HandHeart className="size-5" />} title="خدماتي">
          {providers.length ? (
            <ul className="grid gap-2">
              {providers.map((p) => {
                const count = requests.filter((r) => r.providerId === p.id).length;
                return (
                  <li key={p.id}>
                    <Link href={`/providers/${p.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 transition hover:border-ink">
                      <Avatar name={p.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-ink">{p.name}</span>
                        <span className="text-xs text-ink-mute">{count ? `طلبات التواصل: ${count}` : "لا طلبات بعد"}</span>
                      </span>
                      <StatusPill status={p.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={<HandHeart className="size-6" />} title="لا تعرض خدمات بعد" action={<Link href="/methods" className={buttonClass("primary")}>اختر مهارتك واعرضها</Link>}>
              إن كنت تتقن إحدى الطرق، أنشئ ملفًا ليصل إليك العملاء.
            </EmptyState>
          )}
        </Section>
      </div>

      {/* ---------- raffle entries ---------- */}
      <Section icon={<Ticket className="size-5" />} title="مشاركاتي في السحوبات">
        {entries.length ? (
          <ul className="grid gap-2">
            {entries.map(({ m, c }) => (
              <li key={m.n} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
                <MethodNumber n={m.n} size="sm" />
                <span className="min-w-0 flex-1 truncate font-bold text-ink">{m.title}</span>
                <span className="text-xs text-ink-mute">
                  المهام: {c.done.length}/{m.tasks}
                </span>
                <Chip tone={ENTRY[c.entry].tone}>{ENTRY[c.entry].label}</Chip>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-ink-soft">لم ترسل أي مشاركة بعد. أكمل مهام تحدي الأسبوع وأرسل ملخص تجربتك لتدخل السحب.</p>
        )}
      </Section>

      {/* ---------- account ---------- */}
      <Section icon={<ShieldCheck className="size-5" />} title="الحساب والبيانات">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="white"
            onClick={() => {
              actions.signOut();
              router.push("/");
            }}
          >
            <LogOut aria-hidden className="size-4" />
            تسجيل الخروج
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm("سيُحذف حسابك وكل تحدياتك وتجاربك وخدماتك من هذا الجهاز نهائيًا. متابعة؟")) {
                actions.reset();
                router.push("/");
              }
            }}
          >
            <Trash2 aria-hidden className="size-4" />
            احذف حسابي وبياناتي
          </Button>
        </div>
      </Section>
    </div>
  );
}

function Section({ id, icon, title, action, children }: { id?: string; icon: ReactNode; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
          <span className="text-brand">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

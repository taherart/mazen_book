"use client";

import { ClipboardCheck, ExternalLink, Gauge, LayoutList, QrCode, ShieldAlert, Ticket, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useDemo, useHydrated } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { Logo } from "../logo";
import { Button, cx } from "../ui";
import { AdminMethods } from "./admin-methods";
import { AdminOverview } from "./admin-overview";
import { AdminPeople } from "./admin-people";
import { AdminQr } from "./admin-qr";
import { AdminRaffle } from "./admin-raffle";
import { AdminReview } from "./admin-review";
import { AdminWeek } from "./admin-week";
import type { AdminProps, AdminTab } from "./shared";

const TABS: { id: AdminTab; label: string; icon: typeof Gauge }[] = [
  { id: "overview", label: "نظرة عامة", icon: Gauge },
  { id: "review", label: "المراجعة", icon: ClipboardCheck },
  { id: "week", label: "تحدي الأسبوع", icon: Trophy },
  { id: "raffle", label: "السحب والفائز", icon: Ticket },
  { id: "methods", label: "الطرق الـ52", icon: LayoutList },
  { id: "people", label: "الأعضاء والبلاغات", icon: Users },
  { id: "qr", label: "رموز QR", icon: QrCode },
];

export function Admin(props: AdminProps) {
  const { user, stories, providers, reports } = useDemo();
  const hydrated = useHydrated();
  const [tab, setTab] = useState<AdminTab>("overview");

  if (!hydrated) return <div className="skeleton m-6 h-[70vh] flex-1" aria-busy="true" />;
  if (!user?.admin) {
    return (
      <div className="grid flex-1 place-items-center p-6">
        <div className="max-w-md rounded-[2rem] border-2 border-ink bg-white p-8 text-center shadow-print">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-sun">
            <ShieldAlert aria-hidden className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-3xl text-ink">لوحة الإدارة لفريق المنصة</h1>
          <p className="mt-2 text-ink-soft">تحتاج حسابًا بصلاحية مشرف. في النسخة الأولية تستطيع الدخول بحساب مشرف تجريبي لتجربة المراجعة والسحب.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => actions.signIn({ name: user?.name ?? "مشرف المنصة", email: user?.email ?? "admin@example.com", admin: true })}>
              ادخل كمشرف تجريبي
            </Button>
            <Link href="/" className="inline-flex h-14 items-center px-4 font-bold text-ink-soft underline underline-offset-4">
              عُد للموقع
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pending: Partial<Record<AdminTab, number>> = {
    review: stories.filter((s) => s.status === "pending").length + providers.filter((p) => p.status === "pending").length,
    people: reports.filter((r) => !r.resolved).length,
  };

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="border-b-2 border-ink bg-ink text-white lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-e-2">
        <div className="flex items-center justify-between gap-3 p-4">
          <Logo inverted />
          <span className="rounded-full bg-sun px-2.5 py-1 text-xs font-bold text-ink">الإدارة</span>
        </div>
        <nav aria-label="أقسام لوحة الإدارة" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={cx("flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition", tab === id ? "bg-white text-ink" : "text-white/75 hover:bg-white/10 hover:text-white")}>
              <Icon aria-hidden className="size-[1.1rem]" />
              {label}
              {pending[id] ? <span className="ms-auto grid min-w-5 place-items-center rounded-full bg-sun px-1.5 text-xs text-ink">{pending[id]}</span> : null}
            </button>
          ))}
        </nav>
        <div className="hidden border-t border-white/15 p-4 text-sm lg:block">
          <p className="truncate font-bold">{user.name}</p>
          <Link href="/" className="mt-1 inline-flex items-center gap-1.5 text-white/70 hover:text-sun">
            <ExternalLink aria-hidden className="size-3.5" />
            افتح الموقع
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-8">
        {tab === "overview" ? <AdminOverview {...props} go={setTab} /> : null}
        {tab === "review" ? <AdminReview {...props} /> : null}
        {tab === "week" ? <AdminWeek {...props} /> : null}
        {tab === "raffle" ? <AdminRaffle {...props} /> : null}
        {tab === "methods" ? <AdminMethods {...props} /> : null}
        {tab === "people" ? <AdminPeople {...props} /> : null}
        {tab === "qr" ? <AdminQr {...props} /> : null}
      </main>
    </div>
  );
}


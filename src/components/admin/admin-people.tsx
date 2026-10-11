"use client";

import { Check, Flag, Inbox, Users } from "@/components/icons";
import Link from "next/link";
import { SAMPLE_ENTRIES } from "@/data/samples";
import { useDemo } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { formatDate } from "@/lib/week";
import { Avatar, Button, Chip, EmptyState, SampleTag } from "../ui";
import { AdminHead, Panel, type AdminProps } from "./shared";

export function AdminPeople({ methods }: AdminProps) {
  const { user, challenges, stories, providers, reports, requests, showSamples } = useDemo();
  const open = reports.filter((r) => !r.resolved);
  const started = Object.keys(challenges).map((n) => methods[Number(n) - 1].title);

  return (
    <>
      <AdminHead title="الأعضاء والبلاغات" lead="من سجّل، ماذا بدأ، وما الذي بُلّغ عنه." />

      <Panel title={`البلاغات المفتوحة (${open.length})`}>
        {reports.length ? (
          <ul className="grid gap-3">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bad-wash text-bad">
                  <Flag aria-hidden className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{r.reason}</p>
                  <p className="truncate text-sm text-ink-soft">
                    {r.kind === "story" ? "تجربة" : "ملف خدمة"}:{" "}
                    <Link href={`/${r.kind === "story" ? "stories" : "providers"}/${r.targetId}`} className="font-semibold text-brand underline underline-offset-4">
                      {r.targetTitle}
                    </Link>{" "}
                    · {formatDate(r.createdAt)}
                  </p>
                </div>
                {r.resolved ? (
                  <Chip tone="ok">
                    <Check aria-hidden className="size-3.5" />
                    عُولج
                  </Chip>
                ) : (
                  <Button size="sm" variant="white" onClick={() => actions.resolveReport(r.id)}>
                    علّمه كمعالَج
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Flag className="size-6" />} title="لا بلاغات">
            كل تجربة وكل ملف خدمة فيه زر «بلّغ عن هذا المحتوى»، وما يُبلَّغ عنه يصل هنا.
          </EmptyState>
        )}
      </Panel>

      <Panel title="الأعضاء" className="mt-6" action={showSamples ? <SampleTag /> : undefined}>
        {user || showSamples ? (
          <ul className="grid gap-2">
            {user ? (
              <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-3">
                <Avatar name={user.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">
                    {user.name} {user.admin ? <Chip tone="sun">مشرف</Chip> : null}
                  </p>
                  <p className="truncate text-sm text-ink-soft" dir="ltr">
                    {user.email}
                  </p>
                </div>
                <p className="text-sm text-ink-soft">
                  طرق: {started.length} · تجارب: {stories.length} · خدمات: {providers.length}
                </p>
              </li>
            ) : null}
            {showSamples
              ? SAMPLE_ENTRIES.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line p-3">
                    <Avatar name={e.name} size="sm" />
                    <p className="min-w-0 flex-1 font-bold text-ink">{e.name}</p>
                    <p className="text-sm text-ink-soft">المهام المنجزة في تحدي الأسبوع: {e.done}</p>
                  </li>
                ))
              : null}
          </ul>
        ) : (
          <EmptyState icon={<Users className="size-6" />} title="لا أعضاء بعد" />
        )}
        <p className="mt-3 text-xs text-ink-mute">إيقاف الحسابات وتغيير الصلاحيات يُفعّلان مع نظام الحسابات في المرحلة التالية.</p>
      </Panel>

      <Panel title={`طلبات التواصل مع مقدمي الخدمات (${requests.length})`} className="mt-6">
        {requests.length ? (
          <ul className="grid gap-2">
            {requests.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line p-3 text-sm">
                <p className="font-bold text-ink">
                  {r.name} ← {r.providerName}
                </p>
                <p className="text-ink-soft">{r.message}</p>
                <p className="mt-1 text-xs text-ink-mute">
                  <bdi dir="ltr">{r.contact}</bdi> · {formatDate(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            <Inbox aria-hidden className="size-5 text-ink-mute" />
            لم يُرسل أي طلب تواصل بعد.
          </p>
        )}
      </Panel>
    </>
  );
}

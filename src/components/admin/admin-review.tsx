"use client";

import { Check, ClipboardCheck, Eye, X } from "lucide-react";
import Link from "next/link";
import { useDemo } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { riyal } from "@/lib/taxonomy";
import type { ReviewStatus } from "@/lib/types";
import { OutcomeChip } from "../community";
import { MethodNumber } from "../method-card";
import { Avatar, Button, EmptyState, StatusPill, buttonClass } from "../ui";
import { AdminHead, Panel, type AdminProps } from "./shared";

function Decide({ status, onDecide }: { status: ReviewStatus; onDecide: (s: ReviewStatus) => void }) {
  if (status !== "pending") {
    return (
      <div className="flex items-center gap-2">
        <StatusPill status={status} />
        <button type="button" onClick={() => onDecide("pending")} className="text-xs font-bold text-ink-mute underline underline-offset-4 hover:text-ink">
          تراجع
        </button>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => onDecide("approved")}>
        <Check aria-hidden className="size-4" />
        انشر
      </Button>
      <Button size="sm" variant="danger" onClick={() => onDecide("rejected")}>
        <X aria-hidden className="size-4" />
        ارفض
      </Button>
    </div>
  );
}

export function AdminReview({ methods }: AdminProps) {
  const { stories, providers } = useDemo();
  const order = (a: { status: ReviewStatus }, b: { status: ReviewStatus }) => Number(b.status === "pending") - Number(a.status === "pending");

  return (
    <>
      <AdminHead title="المراجعة" lead="لا شيء يُنشر قبل موافقتك: التجارب والفيديوهات، وملفات مقدمي الخدمات." />

      <Panel title={`التجارب (${stories.filter((s) => s.status === "pending").length} بانتظارك)`}>
        {stories.length ? (
          <ul className="grid gap-3">
            {[...stories].sort(order).map((s) => (
              <li key={s.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <MethodNumber n={s.method} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl leading-tight text-ink">{s.title}</p>
                    <p className="text-sm text-ink-soft">
                      {s.author}
                      {s.city ? ` · ${s.city}` : ""} · {methods[s.method - 1].title}
                    </p>
                  </div>
                  <OutcomeChip outcome={s.outcome} />
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-ink-soft">{s.body}</p>
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div className="flex gap-1.5">
                    <dt className="text-ink-mute">المدة:</dt>
                    <dd className="font-bold">{s.duration}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-ink-mute">التكلفة:</dt>
                    <dd className="font-bold">{s.cost === null ? "لم تُذكر" : riyal(s.cost)}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-ink-mute">الدخل:</dt>
                    <dd className="font-bold">{s.income ? riyal(s.income) : "لا دخل"}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-ink-mute">المرفقات:</dt>
                    <dd className="font-bold">{s.media === "video" ? "فيديو" : s.media === "images" ? "صور" : "لا شيء"}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <Link href={`/stories/${s.id}`} className={buttonClass("ghost", "sm")}>
                    <Eye aria-hidden className="size-4" />
                    عاين كاملة
                  </Link>
                  <Decide status={s.status} onDecide={(st) => actions.reviewStory(s.id, st)} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<ClipboardCheck className="size-6" />} title="لا تجارب بانتظار المراجعة">
            حين يرسل عضو تجربته تظهر هنا. جرّب: افتح صفحة أي طريقة واضغط «شارك تجربتك».
          </EmptyState>
        )}
      </Panel>

      <Panel title={`ملفات مقدمي الخدمات (${providers.filter((p) => p.status === "pending").length} بانتظارك)`} className="mt-6">
        {providers.length ? (
          <ul className="grid gap-3">
            {[...providers].sort(order).map((p) => (
              <li key={p.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl leading-tight text-ink">{p.name}</p>
                    <p className="text-sm text-ink-soft">
                      {p.city}
                      {p.remote ? " · عن بُعد" : ""} · {p.methods.map((n) => methods[n - 1].title).join("، ")}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-ink">{p.priceFrom !== null ? `من ${riyal(p.priceFrom)}` : "السعر عند الطلب"}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink-soft">{p.headline}</p>
                <p className="mt-1 text-sm text-ink-mute">
                  الخدمات: {p.services.join("، ")} · نماذج الأعمال: {p.portfolio.length} · التواصل: <bdi dir="ltr">{p.contact.value}</bdi>
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <Link href={`/providers/${p.id}`} className={buttonClass("ghost", "sm")}>
                    <Eye aria-hidden className="size-4" />
                    عاين الملف
                  </Link>
                  <Decide status={p.status} onDecide={(st) => actions.reviewProvider(p.id, st)} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<ClipboardCheck className="size-6" />} title="لا ملفات بانتظار الموافقة">
            حين يعرض عضو خدماته يظهر ملفه هنا قبل أن يدخل الدليل.
          </EmptyState>
        )}
      </Panel>
    </>
  );
}

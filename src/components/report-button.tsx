"use client";

import { Check, Flag } from "@/components/icons";
import { useState } from "react";
import { actions, type Report } from "@/lib/demo/store";
import { Button, Select } from "./ui";

const REASONS = ["محتوى مضلل أو أرقام غير صحيحة", "محتوى مخالف أو غير لائق", "انتحال شخصية أو أعمال ليست لصاحبها", "احتيال أو طلب دفع خارج الاتفاق", "سبب آخر"];

/** Every published story and profile can be flagged; flags land in the admin queue. */
export function ReportButton({ kind, targetId, targetTitle }: Pick<Report, "kind" | "targetId" | "targetTitle">) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);

  if (sent) {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ok">
        <Check aria-hidden className="size-4" />
        وصلنا بلاغك وسنراجعه.
      </p>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-mute hover:text-bad">
        <Flag aria-hidden className="size-4" />
        بلّغ عن هذا المحتوى
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-white p-3">
      <div className="min-w-56 flex-1">
        <label htmlFor="report-reason" className="mb-1 block text-xs font-bold text-ink-mute">
          سبب البلاغ
        </label>
        <Select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
      </div>
      <Button
        variant="danger"
        onClick={() => {
          actions.addReport({ kind, targetId, targetTitle, reason });
          setSent(true);
        }}
      >
        أرسل البلاغ
      </Button>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        إلغاء
      </Button>
    </div>
  );
}

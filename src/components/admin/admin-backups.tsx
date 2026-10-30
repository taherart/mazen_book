"use client";

import { Download, ShieldCheck } from "@/components/icons";
import { useEffect, useState } from "react";
import { useDemo } from "@/lib/demo/hooks";
import { formatDate } from "@/lib/week";
import { Chip, Notice } from "../ui";
import { Panel } from "./shared";

interface Backup {
  name: string;
  bytes: number;
  at: string;
}

const TIME = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh" });
const mb = (n: number) => `${(n / 1048576).toFixed(n < 1048576 ? 2 : 1)} MB`;
/** How long ago, for the latest copy: a backup older than a day and a half has missed its run. */
const hoursAgo = (iso: string) => (Date.now() - new Date(iso).getTime()) / 36e5;

/**
 * The database copies the server keeps (one a day, see deploy/docker-compose.yml), with a download
 * for each so a copy can live off the server too. Admins only; the server checks again.
 */
export function AdminBackups() {
  const { backend } = useDemo();
  const [state, setState] = useState<{ backups: Backup[] } | { error: string } | null>(null);

  useEffect(() => {
    if (!backend) return;
    fetch("/api/admin/backups", { cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : { error: r.status === 404 ? "off" : "denied" }))
      .then(setState)
      .catch(() => setState({ error: "offline" }));
  }, [backend]);

  if (!backend) {
    return (
      <Panel title="النسخ الاحتياطي">
        <p className="text-sm text-ink-soft">يظهر هنا سجل النسخ الاحتياطية اليومية لقاعدة البيانات مع إمكانية تنزيلها، عند التشغيل على الخادم.</p>
      </Panel>
    );
  }

  const latest = state && "backups" in state ? state.backups[0] : undefined;
  const late = latest ? hoursAgo(latest.at) > 36 : false;

  return (
    <Panel
      title="النسخ الاحتياطي"
      action={
        latest ? (
          <Chip tone={late ? "bad" : "ok"}>
            <ShieldCheck aria-hidden className="size-3.5" />
            {late ? "آخر نسخة متأخرة" : "نسخة يومية تعمل"}
          </Chip>
        ) : null
      }
    >
      {!state ? (
        <p className="text-sm text-ink-mute">جارٍ القراءة…</p>
      ) : "error" in state ? (
        <Notice tone="bad" title={state.error === "off" ? "النسخ الاحتياطي غير مفعّل على هذا الخادم" : "تعذّر قراءة النسخ"}>
          {state.error === "off" ? "خدمة backup في deploy/docker-compose.yml تكتب النسخ، وweb يقرؤها من BACKUP_DIR." : "حدّث الصفحة، فإن تكرر فراجع سجل الخادم."}
        </Notice>
      ) : !state.backups.length ? (
        <Notice tone="sun" title="لا نسخ بعد">
          تُكتب أول نسخة عند تشغيل الخادم، ثم كل يوم الساعة 6 صباحًا بتوقيت الرياض.
        </Notice>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            {state.backups.length} نسخة على الخادم، تُحفظ 30 يومًا. نزّل الأحدث بانتظام واحتفظ بها خارج الخادم؛ طريقة الاستعادة في deploy/README.md.
          </p>
          {late ? (
            <Notice tone="bad" className="mt-3" title="آخر نسخة أقدم من يوم ونصف">
              راجع سجل خدمة backup في Docker Manager: سطر «backup FAILED» يشرح السبب.
            </Notice>
          ) : null}
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {state.backups.slice(0, 7).map((b, i) => (
              <li key={b.name} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                <span className="min-w-0 flex-1 font-semibold text-ink" suppressHydrationWarning>
                  {formatDate(b.at)} · {TIME.format(new Date(b.at))}
                  {i === 0 ? <span className="ms-2 text-xs font-normal text-brand">الأحدث</span> : null}
                </span>
                <span className="tabular-nums text-ink-mute">{mb(b.bytes)}</span>
                <a href={`/api/admin/backups?file=${encodeURIComponent(b.name)}`} download className="inline-flex items-center gap-1.5 font-bold text-brand hover:underline">
                  <Download aria-hidden className="size-4" />
                  تنزيل
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

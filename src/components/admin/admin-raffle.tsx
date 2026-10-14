"use client";

import { Dices, Megaphone, PartyPopper, Ticket, Undo2 } from "@/components/icons";
import { useState } from "react";
import { useDemo, useEntries, type RaffleEntry } from "@/lib/demo/hooks";
import { actions, type EntryStatus } from "@/lib/demo/store";
import { formatDay, openDraws } from "@/lib/week";
import { Button, Chip, EmptyState, Notice, SampleTag, cx } from "../ui";
import { useWeekMethod } from "../weekly";
import { AdminHead, Panel, type AdminProps } from "./shared";

const LABEL: Record<EntryStatus, string> = { pending: "بانتظار المراجعة", eligible: "مؤهلة", rejected: "غير مؤهلة" };

/** Uniform pick using the browser's cryptographic generator, so the draw cannot be steered. */
function pickRandom<T>(list: T[]): T {
  const limit = Math.floor(0x100000000 / list.length) * list.length;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return list[buf[0] % list.length];
}

const pause = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export function AdminRaffle({ methods, week }: AdminProps) {
  const { backend, admin } = useDemo();
  // last week's draw stays open, since its winner is picked after the week closes
  const draws = openDraws(new Date(week.startsAt));
  const [pickedStart, setPickedStart] = useState(week.startsAt);
  const target = draws.find((w) => w.startsAt === pickedStart) ?? week;
  const isCurrent = target.startsAt === week.startsAt;
  const server = admin.raffle.find((r) => r.weekStart === target.startsAt);
  const weekMethod = useWeekMethod(week);
  const method = backend ? (server?.method ?? target.week) : isCurrent ? weekMethod : target.week;
  const m = methods[method - 1];
  const demoEntries = useEntries(method, m.tasks);
  // with a database the draw runs on the server, over the members' real entries only
  const entries = backend ? (server?.entries ?? []) : demoEntries;
  const winner = admin.winners[target.week];
  const [rolling, setRolling] = useState(false);
  const [failed, setFailed] = useState(false);
  const eligible = entries.filter((e) => e.status === "eligible");

  const decide = async (step: "draw" | "announce" | "undo") => {
    setFailed(false);
    if (step === "draw") setRolling(true);
    const [ok] = await Promise.all([actions.decideRaffle(step, target.startsAt), step === "draw" ? pause(900) : null]);
    setRolling(false);
    setFailed(!ok);
  };

  const draw = () => {
    if (backend) return void decide("draw");
    setRolling(true);
    window.setTimeout(() => {
      const pick = pickRandom(eligible);
      actions.setWinner(target.week, { name: pick.name, method, drawnAt: new Date().toISOString(), announced: false });
      setRolling(false);
    }, 900);
  };
  const announce = () => (backend ? void decide("announce") : winner && actions.setWinner(target.week, { ...winner, announced: true }));
  const undo = () => (backend ? void decide("undo") : actions.setWinner(target.week, null));

  return (
    <>
      <AdminHead title="السحب والفائز" lead={`سحب الأسبوع ${target.week}: ${m.title}`}>
        {draws.length > 1 ? (
          <div className="flex gap-2" role="group" aria-label="أسبوع السحب">
            {draws.map((w, i) => (
              <Button key={w.startsAt} size="sm" variant={w.startsAt === target.startsAt ? "primary" : "white"} aria-pressed={w.startsAt === target.startsAt} onClick={() => setPickedStart(w.startsAt)}>
                {i === 0 ? `هذا الأسبوع (${w.week})` : `الأسبوع الماضي (${w.week})`}
              </Button>
            ))}
          </div>
        ) : null}
      </AdminHead>

      {failed ? (
        <Notice tone="bad" className="mb-6" title="لم يُحفظ القرار">
          ربما تغيّرت حالة السحب من جهاز آخر. حدّثنا البيانات؛ راجعها ثم أعد المحاولة.
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel
          title="المشاركات"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="ok">{eligible.length} مؤهلة</Chip>
              <Chip tone="sun">{entries.filter((e) => e.status === "pending").length} بانتظارك</Chip>
              {entries.some((e) => e.sample) ? <SampleTag /> : null}
            </div>
          }
        >
          {entries.length ? (
            <ul className="grid gap-3">
              {entries.map((e) => (
                <EntryRow key={e.id} entry={e} locked={!!winner} />
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Ticket className="size-6" />} title="لا مشاركات في سحب هذا الأسبوع">
              تظهر المشاركات هنا حين يرسل الأعضاء ملخص تجربتهم من صفحة التحدي.
            </EmptyState>
          )}
        </Panel>

        <Panel title="السحب" className={winner ? "bg-sun-wash" : undefined}>
          {winner ? (
            <div className="text-center">
              <span className="mx-auto grid size-16 animate-pop place-items-center rounded-full border-2 border-ink bg-sun">
                <PartyPopper aria-hidden className="size-8" />
              </span>
              <p className="mt-3 text-sm text-ink-soft">وقع الاختيار على</p>
              <p className="font-display text-4xl text-ink">{winner.name}</p>
              {winner.announced ? (
                <Notice tone="ok" className="mt-4 text-start" title="أُعلن الفائز">
                  يظهر اسمه الآن في صفحة التحدي وصفحة الطريقة.
                </Notice>
              ) : (
                <>
                  <Notice tone="sun" className="mt-4 text-start" title="تحقق قبل الإعلان">
                    تأكد من هوية الفائز واستيفائه للشروط، ثم أعلن النتيجة.
                  </Notice>
                  <Button size="lg" className="mt-4 w-full" onClick={announce}>
                    <Megaphone aria-hidden className="size-5" />
                    اعتمد وأعلن الفائز
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" className="mt-2" onClick={undo}>
                <Undo2 aria-hidden className="size-4" />
                {winner.announced ? "اسحب الإعلان" : "ألغِ النتيجة وأعد السحب"}
              </Button>
              {server && server.draws > 1 ? <p className="mt-2 text-xs text-ink-mute">عدد مرات السحب لهذا الأسبوع: {server.draws}. كل سحب محفوظ في سجل السحوبات.</p> : null}
            </div>
          ) : (
            <>
              <p className="text-sm leading-7 text-ink-soft">يختار النظام فائزًا واحدًا عشوائيًا من المشاركات المؤهلة فقط. النتيجة لا تُعلن حتى تعتمدها.</p>
              {isCurrent ? (
                <p className="mt-2 text-sm font-semibold text-ink" suppressHydrationWarning>
                  التحدي مفتوح حتى {formatDay(target.endsAt)}. ما يُرسل بعد السحب لا يدخله.
                </p>
              ) : null}
              <Button size="lg" className="mt-4 w-full" disabled={!eligible.length || rolling} onClick={draw}>
                <Dices aria-hidden className={cx("size-5", rolling && "animate-spin")} />
                {rolling ? "جارٍ السحب…" : `اسحب الفائز (المؤهلة: ${eligible.length})`}
              </Button>
              {!eligible.length ? <p className="mt-2 text-sm font-semibold text-bad">أهّل مشاركة واحدة على الأقل لتتمكن من السحب.</p> : null}
            </>
          )}
        </Panel>
      </div>
    </>
  );
}

function EntryRow({ entry, locked }: { entry: RaffleEntry; locked: boolean }) {
  return (
    <li className="rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-bold text-ink">{entry.name}</p>
        <span className="text-sm text-ink-soft">
          المهام المنجزة: {entry.done} من {entry.total}
        </span>
        {entry.sample ? <SampleTag /> : <Chip tone="brand">عضو فعلي</Chip>}
        <Chip tone={entry.status === "eligible" ? "ok" : entry.status === "rejected" ? "bad" : "sun"} className="ms-auto">
          {LABEL[entry.status]}
        </Chip>
      </div>
      <p className="mt-2 text-sm leading-7 text-ink-soft">{entry.note || "لم يكتب ملخصًا."}</p>
      {!locked ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant={entry.status === "eligible" ? "primary" : "white"} onClick={() => actions.reviewEntry(entry.id, "eligible")}>
            مؤهلة
          </Button>
          <Button size="sm" variant="danger" onClick={() => actions.reviewEntry(entry.id, "rejected")}>
            غير مؤهلة
          </Button>
          {entry.status !== "pending" ? (
            <Button size="sm" variant="ghost" onClick={() => actions.reviewEntry(entry.id, "pending")}>
              تراجع
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

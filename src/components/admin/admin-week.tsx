"use client";

import { CalendarClock, RotateCcw } from "@/components/icons";
import { useDemo } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { formatDay } from "@/lib/week";
import { MethodArt, MethodRow } from "../method-card";
import { RAFFLE_RULES } from "../method-week";
import { Button, Field, Input, Notice, Select } from "../ui";
import { Countdown } from "../weekly";
import { AdminHead, Panel, type AdminProps } from "./shared";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function AdminWeek({ methods, week }: AdminProps) {
  const { admin } = useDemo();
  const active = admin.weekMethod ?? week.week;
  // the draw is for one method; once it has run, the method stays
  const drawn = !!admin.winners[week.week];
  const m = methods[active - 1];
  const schedule = [0, 1, 2, 3, 4, 5].map((k) => ({ week: ((week.week - 1 + k) % 52) + 1, starts: new Date(new Date(week.startsAt).getTime() + k * WEEK_MS).toISOString() }));

  return (
    <>
      <AdminHead title="تحدي الأسبوع" lead="الطريقة المعروضة في الصفحة الرئيسية وصفحة التحدي، وجائزة سحبها." />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title={`الأسبوع ${week.week} من 52`}>
          <div className="grid items-center gap-5 sm:grid-cols-[10rem_1fr]">
            <div className="plate rounded-3xl border-2 border-ink bg-paper p-2">
              <MethodArt n={m.n} title={m.title} sizes="160px" />
            </div>
            <div className="space-y-4">
              <Field label="طريقة هذا الأسبوع" htmlFor="week-method" hint={drawn ? "جرى سحب هذا الأسبوع، فلا يمكن تغيير طريقته." : admin.weekMethod ? `اخترتها يدويًا. بحسب الجدول كانت الطريقة ${week.week}.` : "بحسب الجدول: الطريقة رقم الأسبوع. اختر غيرها إن أردت."}>
                <Select id="week-method" value={active} disabled={drawn} onChange={(e) => actions.setWeekMethod(week.startsAt, Number(e.target.value) === week.week ? null : Number(e.target.value))}>
                  {methods.map((x) => (
                    <option key={x.n} value={x.n}>
                      {x.n}. {x.title}
                    </option>
                  ))}
                </Select>
              </Field>
              {admin.weekMethod && !drawn ? (
                <Button variant="soft" size="sm" onClick={() => actions.setWeekMethod(week.startsAt, null)}>
                  <RotateCcw aria-hidden className="size-4" />
                  عُد لجدول الكتاب
                </Button>
              ) : null}
              <Countdown endsAt={week.endsAt} />
            </div>
          </div>
        </Panel>

        <Panel title="الجائزة">
          <Field label="وصف الجائزة كما يظهر للأعضاء" htmlFor="prize" hint="يظهر في صفحة التحدي وصفحة الطريقة. اتركه فارغًا ليظهر «تُعلن الجائزة مع بداية التحدي».">
            <Input id="prize" value={admin.prize} placeholder="مثال: نسخة موقّعة من الكتاب وجلسة استشارية" maxLength={200} onChange={(e) => actions.setPrize(week.startsAt, e.target.value)} />
          </Field>
          <Notice tone="sun" className="mt-4" title="قبل أول سحب">
            الجوائز والسحوبات تحتاج مراجعة المتطلبات النظامية ونشر شروط واضحة للمشاركة والاختيار.
          </Notice>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="شروط التأهل المعروضة">
          <ol className="grid gap-2 text-sm text-ink-soft">
            {RAFFLE_RULES.map((r, i) => (
              <li key={r} className="flex gap-2">
                <span className="font-display text-brand">{i + 1}</span>
                {r}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-ink-mute">تعديل نص الشروط يُفعّل مع نظام إدارة المحتوى في المرحلة التالية.</p>
        </Panel>
        <Panel title="الجدول القادم" action={<CalendarClock aria-hidden className="size-5 text-brand" />}>
          <ul className="grid gap-2.5">
            {schedule.map((s, i) => (
              <li key={s.week}>
                <MethodRow
                  method={methods[s.week - 1]}
                  trailing={
                    <span className="shrink-0 text-xs font-semibold text-ink-mute" suppressHydrationWarning>
                      {i === 0 ? "هذا الأسبوع" : formatDay(s.starts)}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

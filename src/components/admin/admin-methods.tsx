"use client";

import { ExternalLink, Pencil, Search, X } from "@/components/icons";
import Link from "next/link";
import { useState } from "react";
import { methodHref } from "@/lib/methods";
import { CAPITAL, DOMAINS, KINDS, LEVELS, PLACES, TIME } from "@/lib/taxonomy";
import type { MethodSummary } from "@/lib/types";
import { MethodNumber } from "../method-card";
import { Button, Chip, Field, Input, Notice, Select } from "../ui";
import { AdminHead, Panel, type AdminProps } from "./shared";

export function AdminMethods({ methods }: AdminProps) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<MethodSummary | null>(null);
  const list = methods.filter((m) => !q || `${m.n} ${m.title}`.includes(q.trim()));

  return (
    <>
      <AdminHead title="الطرق الـ52" lead="محتوى الطرق كما استُخرج من الكتاب: العنوان، الأرقام، الخطوات، والتصنيفات.">
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">ابحث</span>
          <Search aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-ink-mute" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الرقم" className="ps-10" />
        </label>
      </AdminHead>

      {editing ? <Editor method={editing} onClose={() => setEditing(null)} /> : null}

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-start text-sm">
            <thead className="border-b-2 border-ink bg-paper text-xs text-ink-mute">
              <tr>
                {["#", "الطريقة", "المجال", "الدخل المتوقع", "رأس المال", "المستوى", "المهام", ""].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-start font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.n} className="border-b border-line last:border-0 hover:bg-brand-wash/50">
                  <td className="px-4 py-2.5">
                    <MethodNumber n={m.n} size="sm" />
                  </td>
                  <td className="px-4 py-2.5 font-bold text-ink">{m.title}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{DOMAINS[m.domain]}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{m.stats.income}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{m.stats.capital}</td>
                  <td className="px-4 py-2.5">
                    <Chip>{LEVELS[m.level]}</Chip>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-ink-soft">{m.tasks}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setEditing(m)} aria-label={`تعديل ${m.title}`} className="grid size-9 place-items-center rounded-xl text-ink-soft hover:bg-white hover:text-brand">
                        <Pencil className="size-4" />
                      </button>
                      <Link href={methodHref(m.n)} target="_blank" aria-label={`فتح صفحة ${m.title}`} className="grid size-9 place-items-center rounded-xl text-ink-soft hover:bg-white hover:text-brand">
                        <ExternalLink className="size-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Editor({ method, onClose }: { method: MethodSummary; onClose: () => void }) {
  const options = (o: Record<string, string>) =>
    Object.entries(o).map(([v, l]) => (
      <option key={v} value={v}>
        {l}
      </option>
    ));
  return (
    <Panel
      className="mb-6 shadow-print"
      title={`تعديل الطريقة ${method.n}`}
      action={
        <button type="button" onClick={onClose} aria-label="إغلاق" className="grid size-9 place-items-center rounded-xl hover:bg-paper">
          <X className="size-5" />
        </button>
      }
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <Field label="العنوان" htmlFor="ed-title">
          <Input id="ed-title" defaultValue={method.title} key={method.n} />
        </Field>
        <Field label="العبارة التعريفية" htmlFor="ed-tagline" optional>
          <Input id="ed-tagline" defaultValue={method.tagline ?? ""} key={method.n} />
        </Field>
        <Field label="الدخل المتوقع" htmlFor="ed-income">
          <Input id="ed-income" defaultValue={method.stats.income} key={method.n} />
        </Field>
        <Field label="رأس المال المبدئي" htmlFor="ed-capital">
          <Input id="ed-capital" defaultValue={method.stats.capital} key={method.n} />
        </Field>
        <Field label="أول ريال خلال" htmlFor="ed-time">
          <Input id="ed-time" defaultValue={method.stats.firstRiyal} key={method.n} />
        </Field>
        <Field label="رابط الفيديو التعريفي" htmlFor="ed-video" optional>
          <Input id="ed-video" dir="ltr" placeholder="https://" />
        </Field>
        <Field label="المجال" htmlFor="ed-domain">
          <Select id="ed-domain" defaultValue={method.domain} key={method.n}>
            {options(DOMAINS)}
          </Select>
        </Field>
        <Field label="نوع الدخل" htmlFor="ed-kind">
          <Select id="ed-kind" defaultValue={method.kind} key={method.n}>
            {options(KINDS)}
          </Select>
        </Field>
        <Field label="مستوى الخبرة" htmlFor="ed-level">
          <Select id="ed-level" defaultValue={method.level} key={method.n}>
            {options(LEVELS)}
          </Select>
        </Field>
        <Field label="مكان العمل" htmlFor="ed-place">
          <Select id="ed-place" defaultValue={method.place} key={method.n}>
            {options(PLACES)}
          </Select>
        </Field>
        <Field label="فئة رأس المال (للتصفية)" htmlFor="ed-capband">
          <Select id="ed-capband" defaultValue={method.capitalBand} key={method.n}>
            {options(CAPITAL)}
          </Select>
        </Field>
        <Field label="فئة المدة (للتصفية)" htmlFor="ed-timeband">
          <Select id="ed-timeband" defaultValue={method.timeBand} key={method.n}>
            {options(TIME)}
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Notice tone="sun" title="الحفظ يُفعّل مع قاعدة البيانات">
            هذه واجهة التعديل كما ستعمل. في النسخة الأولية يُقرأ المحتوى من الكتاب مباشرة، فلا تُحفظ التغييرات. الخطوات والمهام تُحرَّر من الشاشة نفسها في المرحلة التالية.
          </Notice>
          <div className="mt-4 flex gap-3">
            <Button type="submit" disabled>
              احفظ التغييرات
            </Button>
            <Button variant="ghost" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  );
}

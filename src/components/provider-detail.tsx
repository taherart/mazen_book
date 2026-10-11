"use client";

import { CircleCheckBig, ExternalLink, Link2, Mail, MapPin, MessageCircle, SearchX, Send, Wifi } from "@/components/icons";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SAMPLE_PROVIDERS } from "@/data/samples";
import { useDemo, useHydrated } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { riyal } from "@/lib/taxonomy";
import type { MethodSummary, Provider } from "@/lib/types";
import { MethodRow } from "./method-card";
import { ReportButton } from "./report-button";
import { PageSkeleton } from "./skeletons";
import { Avatar, Button, Chip, Container, EmptyState, Field, Input, Notice, SampleTag, StatusPill, Textarea, buttonClass } from "./ui";

function contactLink(c: Provider["contact"]) {
  if (!c.value) return null;
  if (c.kind === "whatsapp") return { href: `https://wa.me/${c.value.replace(/\D/g, "")}`, label: "تواصل عبر واتساب", icon: MessageCircle };
  if (c.kind === "email") return { href: `mailto:${c.value}`, label: "راسله بالبريد", icon: Mail };
  return { href: c.value, label: "افتح رابط التواصل", icon: ExternalLink };
}

export function ProviderDetail({ id, methods }: { id: string; methods: MethodSummary[] }) {
  const { providers, showSamples } = useDemo();
  const hydrated = useHydrated();
  const provider = providers.find((p) => p.id === id) ?? (showSamples ? SAMPLE_PROVIDERS.find((p) => p.id === id) : undefined);

  if (!provider) {
    if (!hydrated) return <PageSkeleton />;
    return (
      <Container className="max-w-2xl py-16">
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="هذا الملف غير موجود"
          action={
            <Link href="/providers" className={buttonClass("primary")}>
              دليل أصحاب المهارات
            </Link>
          }
        >
          ربما لم يُنشر بعد، أو أن الرابط غير صحيح.
        </EmptyState>
      </Container>
    );
  }

  const link = contactLink(provider.contact);
  return (
    <>
      <header className="border-b-2 border-ink paper-dots">
        <Container className="max-w-5xl py-8">
          {provider.status !== "approved" ? (
            <Notice tone={provider.status === "rejected" ? "bad" : "sun"} className="mb-5" title={provider.status === "pending" ? "معاينة خاصة بك: بانتظار موافقة الإدارة" : "لم يُقبل هذا الملف"}>
              {provider.status === "pending" ? "لا يظهر في الدليل حتى توافق عليه الإدارة." : "راجع شروط النشر وعدّل ملفك ثم أرسله من جديد."}
            </Notice>
          ) : null}
          <div className="flex flex-wrap items-start gap-5">
            <Avatar name={provider.name} size="lg" className="shadow-print-sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl leading-snug text-ink sm:text-5xl">{provider.name}</h1>
                {provider.sample ? <SampleTag /> : null}
                {provider.status !== "approved" ? <StatusPill status={provider.status} /> : null}
              </div>
              <p className="mt-2 max-w-2xl text-lg text-ink-soft">{provider.headline}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin aria-hidden className="size-4" />
                  {provider.city}
                </span>
                {provider.remote ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Wifi aria-hidden className="size-4" />
                    يعمل عن بُعد
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </Container>
      </header>

      <Container className="grid max-w-5xl gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="font-display text-2xl text-ink">نبذة</h2>
            <p className="mt-2 whitespace-pre-line text-lg leading-9 text-ink-soft">{provider.bio}</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">الخدمات</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {provider.services.map((s) => (
                <li key={s} className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-white px-4 py-3 font-bold text-ink">
                  <span aria-hidden className="size-2 shrink-0 rounded-full bg-brand" />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">نماذج الأعمال</h2>
            {provider.portfolio.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {provider.portfolio.map((p) =>
                  p.url ? (
                    <li key={p.label}>
                      <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className={buttonClass("white", "md")}>
                        <Link2 aria-hidden className="size-4" />
                        {p.label}
                      </a>
                    </li>
                  ) : (
                    <li key={p.label}>
                      <Chip tone="white" className="h-11 px-4 text-sm" title="رابط توضيحي في النسخة الأولية">
                        <Link2 aria-hidden className="size-4" />
                        {p.label}
                      </Chip>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="mt-2 text-ink-soft">لم يُضف نماذج أعمال بعد.</p>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">الطرق التي يخدمها</h2>
            <ul className="mt-3 grid gap-3">
              {provider.methods.map((n) => (
                <li key={n} className="rounded-2xl border border-line bg-white p-3">
                  <MethodRow method={methods[n - 1]} />
                </li>
              ))}
            </ul>
          </section>

          <ReportButton kind="provider" targetId={provider.id} targetTitle={provider.name} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[2rem] border-2 border-ink bg-white p-5 shadow-print">
            <p className="text-sm text-ink-mute">{provider.priceFrom !== null ? "السعر يبدأ من" : "السعر"}</p>
            <p className="font-display text-3xl text-ink">
              {provider.priceFrom !== null ? riyal(provider.priceFrom) : "عند الطلب"}
              {provider.priceNote ? <span className="ms-2 font-sans text-sm font-normal text-ink-soft">{provider.priceNote}</span> : null}
            </p>
            {link ? (
              <a href={link.href} target="_blank" rel="noopener noreferrer nofollow" className={buttonClass("primary", "lg", "mt-4 w-full")}>
                <link.icon aria-hidden className="size-5" />
                {link.label}
              </a>
            ) : null}
            <RequestForm provider={provider} primary={!link} />
          </div>
          <p className="px-2 text-xs leading-6 text-ink-mute">الاتفاق والدفع بينك وبين مقدم الخدمة مباشرة. المنصة لا تدير المدفوعات ولا تضمن الخدمة في هذه النسخة، فاتفق كتابيًا على التفاصيل.</p>
        </aside>
      </Container>
    </>
  );
}

function RequestForm({ provider, primary }: { provider: Provider; primary: boolean }) {
  const [open, setOpen] = useState(primary);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; contact?: string; message?: string }>({});

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const next: typeof errors = {};
    if (get("name").length < 2) next.name = "اكتب اسمك.";
    if (!/^(\+?\d[\d\s-]{8,}|[^\s@]+@[^\s@]+\.[^\s@]{2,})$/.test(get("contact"))) next.contact = "اكتب رقم جوال أو بريدًا إلكترونيًا صحيحًا.";
    if (get("message").length < 15) next.message = "صف ما تحتاجه في سطر على الأقل.";
    setErrors(next);
    if (Object.keys(next).length) return;
    actions.addRequest({ providerId: provider.id, providerName: provider.name, name: get("name"), contact: get("contact"), message: get("message") });
    setSent(true);
  };

  if (sent) {
    return (
      <Notice tone="ok" className="mt-4" icon={<CircleCheckBig className="size-5 text-ok" />} title="أُرسل طلبك">
        {provider.sample ? "هذا ملف توضيحي، فلن يصل الطلب لأحد. في المنصة الفعلية يصل لمقدم الخدمة مباشرة." : "سيتواصل معك مقدم الخدمة على الوسيلة التي كتبتها."}
      </Notice>
    );
  }
  if (!open) {
    return (
      <Button variant="white" size="lg" className="mt-3 w-full" onClick={() => setOpen(true)}>
        أو أرسل له طلبًا
      </Button>
    );
  }
  return (
    <form noValidate onSubmit={submit} className="mt-4 space-y-3 border-t border-line pt-4">
      <p className="font-display text-xl text-ink">أرسل طلب تواصل</p>
      <Field label="اسمك" htmlFor="rq-name" error={errors.name}>
        <Input id="rq-name" name="name" aria-invalid={!!errors.name} />
      </Field>
      <Field label="جوالك أو بريدك" htmlFor="rq-contact" error={errors.contact}>
        <Input id="rq-contact" name="contact" dir="ltr" className="text-end" aria-invalid={!!errors.contact} />
      </Field>
      <Field label="ماذا تحتاج؟" htmlFor="rq-message" error={errors.message}>
        <Textarea id="rq-message" name="message" rows={3} aria-invalid={!!errors.message} />
      </Field>
      <Button type="submit" size="lg" className="w-full">
        <Send aria-hidden className="size-5" />
        أرسل الطلب
      </Button>
    </form>
  );
}

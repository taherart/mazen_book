"use client";

import { CircleCheckBig, ImagePlus, LoaderCircle, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { actions, type DemoUser } from "@/lib/demo/store";
import { methodHref } from "@/lib/methods";
import type { MethodSummary, Provider } from "@/lib/types";
import { AuthGate } from "./auth-gate";
import { Button, Field, Input, Notice, Select, Textarea, buttonClass } from "./ui";

type Errors = Partial<Record<"name" | "headline" | "bio" | "services" | "portfolio" | "price" | "city" | "contact" | "consent", string>>;
type ContactKind = Provider["contact"]["kind"];

const CONTACT: Record<ContactKind, { label: string; placeholder: string; test: (v: string) => boolean; error: string }> = {
  whatsapp: { label: "واتساب", placeholder: "9665XXXXXXXX", test: (v) => /^\+?\d{9,15}$/.test(v.replace(/[\s-]/g, "")), error: "اكتب رقم الواتساب مع مفتاح الدولة، أرقامًا فقط." },
  email: { label: "بريد إلكتروني", placeholder: "name@example.com", test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), error: "البريد الإلكتروني غير صحيح." },
  link: { label: "رابط (موقع، حساب، نموذج طلب)", placeholder: "https://", test: (v) => /^https?:\/\/\S+\.\S+/.test(v), error: "الرابط يجب أن يبدأ بـ https://" },
};

export function ProviderForm({ method, methods }: { method: MethodSummary; methods: MethodSummary[] }) {
  return (
    <AuthGate title="سجّل دخولك لتعرض خدماتك" reason="ملفك يرتبط بحسابك لتعدّله وتتابع طلبات التواصل التي تصلك.">
      {(user) => <Form user={user} method={method} methods={methods} />}
    </AuthGate>
  );
}

function Form({ user, method, methods }: { user: DemoUser; method: MethodSummary; methods: MethodSummary[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [services, setServices] = useState<string[]>(["", ""]);
  const [links, setLinks] = useState<{ label: string; url: string }[]>([{ label: "", url: "" }]);
  const [kind, setKind] = useState<ContactKind>("whatsapp");
  const [remote, setRemote] = useState(true);
  const [photo, setPhoto] = useState("");
  const [savedId, setSavedId] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const cleanServices = services.map((s) => s.trim()).filter(Boolean);
    const cleanLinks = links.map((l) => ({ label: l.label.trim(), url: l.url.trim() })).filter((l) => l.label || l.url);
    const price = get("price");
    const next: Errors = {};
    if (get("name").length < 2) next.name = "اكتب اسمك أو اسم نشاطك.";
    if (get("headline").length < 15) next.headline = "سطر واحد يقول ماذا تقدّم ولمن (15 حرفًا على الأقل).";
    if (get("bio").length < 40) next.bio = "عرّف بنفسك وخبرتك في سطرين أو ثلاثة.";
    if (!cleanServices.length) next.services = "أضف خدمة واحدة على الأقل.";
    if (cleanLinks.some((l) => !l.label || !/^https?:\/\/\S+\.\S+/.test(l.url))) next.portfolio = "كل نموذج يحتاج عنوانًا ورابطًا يبدأ بـ https://";
    if (price && !/^\d+$/.test(price)) next.price = "اكتب السعر بالأرقام فقط، أو اتركه فارغًا.";
    if (!get("city")) next.city = "اكتب مدينتك.";
    if (!CONTACT[kind].test(get("contact"))) next.contact = CONTACT[kind].error;
    if (!f.get("consent")) next.consent = "نحتاج موافقتك على شروط النشر.";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      document.getElementById(first === "services" ? "service-0" : first === "portfolio" ? "link-url-0" : first)?.focus();
      return;
    }
    setStatus("saving");
    window.setTimeout(() => {
      const id = actions.addProvider({
        methods: [Number(get("method")) || method.n],
        name: get("name"),
        headline: get("headline"),
        bio: get("bio"),
        services: cleanServices,
        portfolio: cleanLinks,
        priceFrom: price ? Number(price) : null,
        priceNote: get("priceNote") || undefined,
        city: get("city"),
        remote,
        contact: { kind, value: get("contact") },
      });
      setSavedId(id);
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 700);
  };

  if (status === "done") {
    return (
      <div className="animate-pop rounded-[2rem] border-2 border-ink bg-white p-6 text-center shadow-print sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-full border-2 border-ink bg-ok text-white">
          <CircleCheckBig aria-hidden className="size-8" />
        </span>
        <h2 className="mt-4 font-display text-3xl text-ink">استلمنا ملفك</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">يظهر في دليل مقدمي الخدمات لهذه الطريقة بعد موافقة الإدارة. حتى ذلك الحين تراه أنت فقط.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/providers/${savedId}`} className={buttonClass("primary")}>
            عاين ملفك
          </Link>
          <Link href="/dashboard" className={buttonClass("white")}>
            حسابي
          </Link>
          <Link href={methodHref(method.n)} className={buttonClass("ghost")}>
            صفحة الطريقة
          </Link>
        </div>
      </div>
    );
  }

  const err = (k: keyof Errors) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-error` : undefined });
  const removeBtn = "grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-line text-ink-soft hover:border-bad hover:text-bad";

  return (
    <form noValidate onSubmit={submit} className="space-y-6">
      {Object.values(errors).some(Boolean) ? (
        <Notice tone="bad" title="بقيت بعض الحقول تحتاج تعديلًا">
          راجع الحقول المعلّمة بالأحمر ثم أرسل من جديد.
        </Notice>
      ) : null}

      <fieldset className="space-y-5 rounded-[2rem] border-2 border-ink bg-white p-5 sm:p-7">
        <legend className="px-2 font-display text-2xl text-ink">من أنت؟</legend>
        <Field label="المهارة التي تقدّمها" htmlFor="method">
          <Select id="method" name="method" defaultValue={method.n} onChange={(e) => router.replace(`${methodHref(Number(e.target.value))}/offer`)}>
            {methods.map((m) => (
              <option key={m.n} value={m.n}>
                {m.n}. {m.title}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <Field label="الاسم أو اسم النشاط" htmlFor="name" error={errors.name}>
            <Input id="name" name="name" defaultValue={user.name} {...err("name")} />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-2xl border-2 border-dashed border-line px-4 py-2.5 text-sm hover:border-ink">
            <ImagePlus aria-hidden className="size-5 shrink-0 text-brand" />
            <span className="max-w-40 truncate font-bold text-ink">{photo || "صورة أو شعار"}</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0]?.name ?? "")} />
          </label>
        </div>
        <Field label="سطر تعريفي" htmlFor="headline" error={errors.headline} hint="يظهر على بطاقتك في الدليل.">
          <Input id="headline" name="headline" maxLength={110} placeholder="تصوير منتجات للمتاجر الإلكترونية بخلفيات نظيفة." {...err("headline")} />
        </Field>
        <Field label="نبذة تعريفية" htmlFor="bio" error={errors.bio}>
          <Textarea id="bio" name="bio" rows={4} {...err("bio")} />
        </Field>
      </fieldset>

      <fieldset className="space-y-5 rounded-[2rem] border-2 border-ink bg-white p-5 sm:p-7">
        <legend className="px-2 font-display text-2xl text-ink">ماذا تقدّم؟</legend>
        <div>
          <p className="mb-1.5 text-sm font-bold text-ink">الخدمات</p>
          <ul className="grid gap-2">
            {services.map((s, i) => (
              <li key={i} className="flex gap-2">
                <Input id={`service-${i}`} aria-label={`الخدمة ${i + 1}`} value={s} placeholder={i === 0 ? "مثال: باقة تصوير 20 منتجًا" : ""} aria-invalid={!!errors.services && i === 0} onChange={(e) => setServices(services.map((v, k) => (k === i ? e.target.value : v)))} />
                {services.length > 1 ? (
                  <button type="button" aria-label="احذف الخدمة" onClick={() => setServices(services.filter((_, k) => k !== i))} className={removeBtn}>
                    <X className="size-5" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {errors.services ? <p className="mt-1.5 text-sm font-semibold text-bad">{errors.services}</p> : null}
          {services.length < 6 ? (
            <button type="button" onClick={() => setServices([...services, ""])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
              <Plus className="size-4" />
              أضف خدمة
            </button>
          ) : null}
        </div>

        <div>
          <p className="mb-1.5 flex items-baseline gap-2 text-sm font-bold text-ink">
            نماذج الأعمال <span className="text-xs font-normal text-ink-mute">اختياري</span>
          </p>
          <ul className="grid gap-2">
            {links.map((l, i) => (
              <li key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <Input aria-label={`عنوان النموذج ${i + 1}`} value={l.label} placeholder="ملف الأعمال" onChange={(e) => setLinks(links.map((v, k) => (k === i ? { ...v, label: e.target.value } : v)))} />
                <Input id={`link-url-${i}`} aria-label={`رابط النموذج ${i + 1}`} value={l.url} dir="ltr" placeholder="https://" aria-invalid={!!errors.portfolio} onChange={(e) => setLinks(links.map((v, k) => (k === i ? { ...v, url: e.target.value } : v)))} />
                {links.length > 1 ? (
                  <button type="button" aria-label="احذف النموذج" onClick={() => setLinks(links.filter((_, k) => k !== i))} className={removeBtn}>
                    <X className="size-5" />
                  </button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
          {errors.portfolio ? <p className="mt-1.5 text-sm font-semibold text-bad">{errors.portfolio}</p> : null}
          {links.length < 5 ? (
            <button type="button" onClick={() => setLinks([...links, { label: "", url: "" }])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
              <Plus className="size-4" />
              أضف نموذجًا
            </button>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="السعر يبدأ من" htmlFor="price" optional error={errors.price} hint="بالريال">
            <Input id="price" name="price" inputMode="numeric" dir="ltr" className="text-end" placeholder="300" {...err("price")} />
          </Field>
          <Field label="طريقة التسعير" htmlFor="priceNote" optional>
            <Input id="priceNote" name="priceNote" placeholder="للصورة، للمشروع، شهريًا…" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5 rounded-[2rem] border-2 border-ink bg-white p-5 sm:p-7">
        <legend className="px-2 font-display text-2xl text-ink">أين وكيف يصلون إليك؟</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="المدينة" htmlFor="city" error={errors.city}>
            <Input id="city" name="city" {...err("city")} />
          </Field>
          <label className="flex items-center gap-3 self-end rounded-2xl border-2 border-line px-4 py-3 text-sm font-bold">
            <input type="checkbox" className="size-5 accent-brand" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
            أعمل عن بُعد أيضًا
          </label>
        </div>
        <div className="grid gap-5 sm:grid-cols-[14rem_1fr]">
          <Field label="وسيلة التواصل" htmlFor="contactKind">
            <Select id="contactKind" value={kind} onChange={(e) => setKind(e.target.value as ContactKind)}>
              {(Object.keys(CONTACT) as ContactKind[]).map((k) => (
                <option key={k} value={k}>
                  {CONTACT[k].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={CONTACT[kind].label} htmlFor="contact" error={errors.contact} hint="يظهر للزوار على ملفك بعد الموافقة.">
            <Input id="contact" name="contact" dir="ltr" className="text-end" placeholder={CONTACT[kind].placeholder} {...err("contact")} />
          </Field>
        </div>
        <Notice tone="brand">التواصل والاتفاق والدفع يتم بينك وبين العميل مباشرة. المنصة لا تأخذ عمولة ولا تدير المدفوعات في هذه النسخة.</Notice>
        <label className="flex items-start gap-3 text-sm">
          <input id="consent" type="checkbox" name="consent" className="mt-1 size-5 accent-brand" aria-invalid={!!errors.consent} />
          <span>
            أقرّ بأن البيانات صحيحة وأن نماذج الأعمال من عملي، وأوافق على{" "}
            <Link href="/terms#publishing" className="font-bold text-brand underline underline-offset-4">
              شروط النشر
            </Link>
            .{errors.consent ? <span className="mt-1 block font-semibold text-bad">{errors.consent}</span> : null}
          </span>
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={status === "saving"}>
          {status === "saving" ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : null}
          {status === "saving" ? "جارٍ الإرسال…" : "أرسل ملفي للمراجعة"}
        </Button>
        <p className="text-sm text-ink-soft">يظهر في الدليل بعد موافقة الإدارة.</p>
      </div>
    </form>
  );
}

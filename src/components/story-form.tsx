"use client";

import { CircleCheckBig, Film, ImagePlus, LoaderCircle, Plus, X } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { actions, type DemoUser } from "@/lib/demo/store";
import { methodHref } from "@/lib/methods";
import { OUTCOMES } from "@/lib/taxonomy";
import type { MethodSummary, Outcome } from "@/lib/types";
import { AuthGate } from "./auth-gate";
import { Button, Field, Input, Notice, Select, Textarea, buttonClass, cx } from "./ui";

const MAX_VIDEO_MB = 100;
const MAX_IMAGE_MB = 5;
const MAX_IMAGES = 6;

type Errors = Partial<Record<"title" | "body" | "duration" | "cost" | "income" | "challenges" | "tips" | "media" | "consent", string>>;

export function StoryForm({ method, methods }: { method: MethodSummary; methods: MethodSummary[] }) {
  return (
    <AuthGate title="سجّل دخولك لتشارك تجربتك" reason="نربط التجربة بحسابك لتتابع حالتها: بانتظار المراجعة، منشورة، أو تحتاج تعديلًا.">
      {(user) => <Form user={user} method={method} methods={methods} />}
    </AuthGate>
  );
}

function Form({ user, method, methods }: { user: DemoUser; method: MethodSummary; methods: MethodSummary[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [outcome, setOutcome] = useState<Outcome>("worked");
  const [tips, setTips] = useState<string[]>([""]);
  const [video, setVideo] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [savedId, setSavedId] = useState("");

  const pickVideo = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, media: `حجم الفيديو ${Math.round(file.size / 1024 / 1024)} م.ب، والحد الأقصى ${MAX_VIDEO_MB} م.ب. قصّه أو اضغطه ثم أعد المحاولة.` }));
      return;
    }
    setErrors((e) => ({ ...e, media: undefined }));
    setVideo(file);
  };
  const pickImages = (files: FileList | null) => {
    if (!files) return;
    const list = [...images, ...files];
    const big = list.find((f) => f.size > MAX_IMAGE_MB * 1024 * 1024);
    if (big) return setErrors((e) => ({ ...e, media: `الصورة «${big.name}» أكبر من ${MAX_IMAGE_MB} م.ب.` }));
    if (list.length > MAX_IMAGES) return setErrors((e) => ({ ...e, media: `الحد الأقصى ${MAX_IMAGES} صور.` }));
    setErrors((e) => ({ ...e, media: undefined }));
    setImages(list);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const cleanTips = tips.map((t) => t.trim()).filter(Boolean);
    const cost = get("cost");
    const income = get("income");
    const next: Errors = {};
    if (get("title").length < 8) next.title = "اكتب عنوانًا يصف تجربتك في جملة (8 أحرف على الأقل).";
    if (get("body").length < 60) next.body = "احكِ ما فعلته بشيء من التفصيل (60 حرفًا على الأقل).";
    if (!get("duration")) next.duration = "كم استغرقت التجربة؟ مثال: 5 أسابيع.";
    if (cost && !/^\d+$/.test(cost)) next.cost = "اكتب المبلغ بالأرقام فقط، أو اتركه فارغًا.";
    if (income && !/^\d+$/.test(income)) next.income = "اكتب المبلغ بالأرقام فقط، أو اتركه فارغًا.";
    if (get("challenges").length < 15) next.challenges = "اذكر أبرز ما واجهك، ولو في سطر.";
    if (!cleanTips.length) next.tips = "أضف نصيحة واحدة على الأقل لمن يبدأ بعدك.";
    if (!f.get("consent")) next.consent = "نحتاج موافقتك على شروط النشر.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0] === "tips" ? "tip-0" : Object.keys(next)[0])?.focus();
      return;
    }
    setStatus("saving");
    window.setTimeout(() => {
      const id = actions.addStory({
        method: Number(get("method")) || method.n,
        title: get("title"),
        author: get("author") || user.name,
        city: get("city") || undefined,
        body: get("body"),
        duration: get("duration"),
        cost: cost ? Number(cost) : null,
        income: income ? Number(income) : null,
        outcome,
        challenges: get("challenges"),
        tips: cleanTips,
        media: video ? "video" : images.length ? "images" : "none",
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
        <h2 className="mt-4 font-display text-3xl text-ink">وصلتنا تجربتك، شكرًا لك</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">هي الآن بانتظار المراجعة. تُنشر بعد موافقة الإدارة، وتتابع حالتها من حسابك.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/stories/${savedId}`} className={buttonClass("primary")}>
            عاين تجربتك
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

  return (
    <form noValidate onSubmit={submit} className="space-y-6">
      {Object.values(errors).some(Boolean) ? (
        <Notice tone="bad" title="بقيت بعض الحقول تحتاج تعديلًا">
          راجع الحقول المعلّمة بالأحمر ثم أرسل من جديد.
        </Notice>
      ) : null}

      <fieldset className="space-y-5 rounded-[2rem] border-2 border-ink bg-white p-5 sm:p-7">
        <legend className="px-2 font-display text-2xl text-ink">التجربة</legend>
        <Field label="الطريقة" htmlFor="method">
          <Select id="method" name="method" defaultValue={method.n} onChange={(e) => router.replace(`${methodHref(Number(e.target.value))}/share`)}>
            {methods.map((m) => (
              <option key={m.n} value={m.n}>
                {m.n}. {m.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="عنوان التجربة" htmlFor="title" error={errors.title} hint="جملة تلخّص ما حدث، مثل: «أول عميل بعد ثلاثة أسابيع».">
          <Input id="title" name="title" maxLength={90} {...err("title")} />
        </Field>
        <div>
          <p className="mb-2 text-sm font-bold text-ink">كيف انتهت؟</p>
          <div role="radiogroup" aria-label="نتيجة التجربة" className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(OUTCOMES) as Outcome[]).map((o) => (
              <button key={o} type="button" role="radio" aria-checked={outcome === o} onClick={() => setOutcome(o)} className={cx("rounded-2xl border-2 px-4 py-3 text-start font-bold transition", outcome === o ? "border-ink bg-brand text-white shadow-print-sm" : "border-line bg-white text-ink-soft hover:border-ink")}>
                {OUTCOMES[o]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-mute">التجارب التي لم تنجح مرحّب بها مثل الناجحة؛ الهدف أن نتعلّم لا أن نستعرض الأرباح.</p>
        </div>
        <Field label="ماذا فعلت؟" htmlFor="body" error={errors.body}>
          <Textarea id="body" name="body" rows={6} placeholder="احكِ الخطوات كما حدثت: من أين بدأت، ماذا جرّبت، وكيف وصلت لأول عميل (أو لماذا لم تصل)." {...err("body")} />
        </Field>
      </fieldset>

      <fieldset className="space-y-5 rounded-[2rem] border-2 border-ink bg-white p-5 sm:p-7">
        <legend className="px-2 font-display text-2xl text-ink">الأرقام</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="المدة" htmlFor="duration" error={errors.duration}>
            <Input id="duration" name="duration" placeholder="5 أسابيع" {...err("duration")} />
          </Field>
          <Field label="التكلفة الفعلية" htmlFor="cost" optional error={errors.cost} hint="بالريال">
            <Input id="cost" name="cost" inputMode="numeric" placeholder="180" dir="ltr" className="text-end" {...err("cost")} />
          </Field>
          <Field label="الدخل المحقق" htmlFor="income" optional error={errors.income} hint="بالريال، إن وُجد">
            <Input id="income" name="income" inputMode="numeric" placeholder="1200" dir="ltr" className="text-end" {...err("income")} />
          </Field>
        </div>
        <Notice tone="sun">اكتب الأرقام كما هي. نعرضها باسمك ولا نعدّلها، وقد نطلب إثباتًا قبل النشر.</Notice>
      </fieldset>

      <fieldset className="space-y-5 rounded-[2rem] border-2 border-ink bg-white p-5 sm:p-7">
        <legend className="px-2 font-display text-2xl text-ink">الدروس</legend>
        <Field label="أبرز التحديات" htmlFor="challenges" error={errors.challenges}>
          <Textarea id="challenges" name="challenges" rows={3} {...err("challenges")} />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-bold text-ink">نصائحك للمبتدئين</p>
          <ul className="grid gap-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <Input id={`tip-${i}`} aria-label={`النصيحة ${i + 1}`} value={tip} placeholder={i === 0 ? "مثال: حدّد عدد التعديلات كتابيًا قبل أن تبدأ." : ""} aria-invalid={!!errors.tips && i === 0} onChange={(e) => setTips(tips.map((t, k) => (k === i ? e.target.value : t)))} />
                {tips.length > 1 ? (
                  <button type="button" aria-label="احذف النصيحة" onClick={() => setTips(tips.filter((_, k) => k !== i))} className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-line text-ink-soft hover:border-bad hover:text-bad">
                    <X className="size-5" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {errors.tips ? <p className="mt-1.5 text-sm font-semibold text-bad">{errors.tips}</p> : null}
          {tips.length < 5 ? (
            <button type="button" onClick={() => setTips([...tips, ""])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
              <Plus className="size-4" />
              أضف نصيحة
            </button>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-[2rem] border-2 border-ink bg-white p-5 sm:p-7">
        <legend className="px-2 font-display text-2xl text-ink">فيديو أو صور</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line p-5 text-center hover:border-ink">
            <Film aria-hidden className="size-7 text-brand" />
            <span className="font-bold text-ink">{video ? video.name : "فيديو قصير"}</span>
            <span className="text-xs text-ink-mute">MP4 أو MOV، حتى {MAX_VIDEO_MB} م.ب</span>
            <input type="file" accept="video/mp4,video/quicktime" className="sr-only" onChange={(e) => pickVideo(e.target.files?.[0])} />
          </label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line p-5 text-center hover:border-ink">
            <ImagePlus aria-hidden className="size-7 text-brand" />
            <span className="font-bold text-ink">{images.length ? `الصور المختارة: ${images.length}` : "صور"}</span>
            <span className="text-xs text-ink-mute">
              حتى {MAX_IMAGES} صور، {MAX_IMAGE_MB} م.ب للصورة
            </span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => pickImages(e.target.files)} />
          </label>
        </div>
        {errors.media ? (
          <Notice tone="bad" title="تعذّر قبول الملف">
            {errors.media}
          </Notice>
        ) : null}
        <p className="text-xs text-ink-mute">لا تُظهر في الفيديو أو الصور بيانات عملائك أو وجوه من لم يوافق. في النسخة الأولية نتحقق من الحجم والنوع فقط ولا يُرفع الملف.</p>
      </fieldset>

      <fieldset className="space-y-5 rounded-[2rem] border-2 border-ink bg-white p-5 sm:p-7">
        <legend className="px-2 font-display text-2xl text-ink">كيف يظهر اسمك؟</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="الاسم المعروض" htmlFor="author" hint="يمكنك الاكتفاء بالاسم الأول.">
            <Input id="author" name="author" defaultValue={user.name} />
          </Field>
          <Field label="المدينة" htmlFor="city" optional>
            <Input id="city" name="city" />
          </Field>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input id="consent" type="checkbox" name="consent" className="mt-1 size-5 accent-brand" aria-invalid={!!errors.consent} />
          <span>
            أقرّ بأن هذه تجربتي وأن أرقامها صحيحة، وأوافق على{" "}
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
          {status === "saving" ? "جارٍ الإرسال…" : "أرسل تجربتي للمراجعة"}
        </Button>
        <p className="text-sm text-ink-soft">تُنشر بعد مراجعة الإدارة.</p>
      </div>
    </form>
  );
}

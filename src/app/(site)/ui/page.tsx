import { CircleCheckBig, Inbox, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OutcomeChip, ProviderCard, StoryCard } from "@/components/community";
import { MethodArt, MethodCard, MethodNumber } from "@/components/method-card";
import { CardGridSkeleton } from "@/components/skeletons";
import { Avatar, Button, Chip, Container, EmptyState, Field, Input, Notice, Progress, SampleTag, Select, StatusPill, Textarea } from "@/components/ui";
import { SAMPLE_PROVIDERS, SAMPLE_STORIES } from "@/data/samples";
import { getSummaries } from "@/lib/methods";

export const metadata: Metadata = { title: "مكتبة المكوّنات وحالات الواجهة", robots: { index: false } };

const COLORS = [
  ["brand", "bg-brand", "#2f5bd3", "الأزرق الأساسي"],
  ["brand-dark", "bg-brand-dark", "#1d3d99", "أزرق غامق"],
  ["brand-deep", "bg-brand-deep", "#12245c", "كحلي"],
  ["brand-soft", "bg-brand-soft", "#a9c0ff", "أزرق فاتح"],
  ["brand-wash", "bg-brand-wash", "#eef2fd", "خلفية زرقاء"],
  ["ink", "bg-ink", "#1d1f26", "الحبر"],
  ["paper", "bg-paper", "#f7f3ea", "الورق"],
  ["sun", "bg-sun", "#ffc83d", "التمييز"],
  ["ok", "bg-ok", "#0f9d68", "نجاح"],
  ["bad", "bg-bad", "#d93b41", "خطأ"],
];

export default function UiPage() {
  const methods = getSummaries();
  return (
    <Container className="space-y-14 py-12">
      <header>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">مكتبة المكوّنات وحالات الواجهة</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">مرجع للمصممين والمبرمجين: الألوان، الخطوط، المكوّنات القابلة لإعادة الاستخدام، وحالات كل واجهة (فارغة، تحميل، نجاح، خطأ، بانتظار المراجعة).</p>
      </header>

      <Block title="الألوان" note="مأخوذة من صفحات الكتاب الداخلية: أزرق ملكي على ورق كريمي، ولون تمييز واحد.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {COLORS.map(([name, cls, hex, label]) => (
            <li key={name} className="overflow-hidden rounded-2xl border-2 border-ink bg-white">
              <div className={`h-16 ${cls}`} />
              <div className="p-2.5 text-xs">
                <p className="font-bold text-ink">{label}</p>
                <p className="text-ink-mute" dir="ltr">
                  {name} · {hex}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="الخطوط" note="خطّا الكتاب: Lalezar للعناوين والأرقام، وIBM Plex Sans Arabic للنصوص.">
        <div className="grid gap-4 rounded-3xl border-2 border-ink bg-white p-6">
          <p className="font-display text-6xl text-ink">
            52 طريقة <span className="marker">من جد</span>
          </p>
          <p className="font-display text-3xl text-brand">«عدسة تبيع»</p>
          <p className="text-lg leading-9 text-ink-soft">نص أساسي بحجم 18: في المتجر الإلكتروني لا يلمس العميل المنتج ولا يجرّبه؛ الصورة هي البائع الوحيد.</p>
          <p className="text-sm text-ink-mute">نص ثانوي بحجم 14: 40–80 ريال للصورة · 3–5 أسابيع</p>
        </div>
      </Block>

      <Block title="الأزرار" note="الزر الأساسي واحد في كل شاشة. كل الأزرار لها حالة تركيز واضحة وحالة تعطيل.">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">أساسي كبير</Button>
          <Button>أساسي</Button>
          <Button variant="sun">تمييز</Button>
          <Button variant="white">ثانوي</Button>
          <Button variant="soft">هادئ</Button>
          <Button variant="ghost">نصّي</Button>
          <Button variant="danger">خطر</Button>
          <Button disabled>معطّل</Button>
          <Button size="sm">صغير</Button>
        </div>
      </Block>

      <Block title="الشارات والحالات">
        <div className="flex flex-wrap items-center gap-2.5">
          <Chip>محايد</Chip>
          <Chip tone="brand">مجال</Chip>
          <Chip tone="sun">تحدي الأسبوع</Chip>
          <Chip tone="ok">مكتمل</Chip>
          <Chip tone="bad">مرفوض</Chip>
          <StatusPill status="pending" />
          <StatusPill status="approved" />
          <StatusPill status="rejected" />
          <OutcomeChip outcome="worked" />
          <OutcomeChip outcome="partly" />
          <OutcomeChip outcome="didnt" />
          <SampleTag />
          <MethodNumber n={7} />
          <Avatar name="نورة" />
        </div>
        <Progress value={66} className="mt-5 max-w-md" />
      </Block>

      <Block title="البطاقات" note="بطاقة الطريقة، بطاقة التجربة، وبطاقة مقدم الخدمة.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <MethodCard method={methods[6]} />
          <StoryCard story={SAMPLE_STORIES[0]} method={methods[0]} />
          <ProviderCard provider={SAMPLE_PROVIDERS[0]} />
        </div>
      </Block>

      <Block title="النماذج والتحقق من المدخلات" note="الخطأ يظهر تحت الحقل بنص يشرح المطلوب، ويُنقل التركيز لأول حقل خاطئ.">
        <div className="grid gap-5 rounded-3xl border-2 border-ink bg-white p-6 md:grid-cols-2">
          <Field label="حقل عادي" htmlFor="ui-1" hint="نص مساعد قصير.">
            <Input id="ui-1" placeholder="اكتب هنا" />
          </Field>
          <Field label="حقل فيه خطأ" htmlFor="ui-2" error="اكتب بريدًا إلكترونيًا صحيحًا، مثل name@example.com">
            <Input id="ui-2" defaultValue="name@" aria-invalid />
          </Field>
          <Field label="قائمة اختيار" htmlFor="ui-3" optional>
            <Select id="ui-3" defaultValue="1">
              <option value="1">الخيار الأول</option>
              <option value="2">الخيار الثاني</option>
            </Select>
          </Field>
          <Field label="حقل معطّل" htmlFor="ui-4">
            <Input id="ui-4" disabled defaultValue="لا يمكن تعديله" className="disabled:bg-paper disabled:text-ink-mute" />
          </Field>
          <div className="md:col-span-2">
            <Field label="نص طويل" htmlFor="ui-5">
              <Textarea id="ui-5" rows={3} placeholder="احكِ ما حدث…" />
            </Field>
          </div>
        </div>
      </Block>

      <Block title="حالات الواجهة" note="كل قائمة ونموذج في المنصة يمرّ بهذه الحالات الخمس.">
        <div className="grid gap-6 lg:grid-cols-2">
          <State name="فارغة">
            <EmptyState icon={<Inbox className="size-6" />} title="لا توجد تجارب منشورة بعد" action={<Button>كن أول من يشارك تجربته</Button>}>
              تشرح الحالة الفارغة ماذا سيظهر هنا، وتقترح الخطوة التالية.
            </EmptyState>
          </State>
          <State name="تحميل">
            <CardGridSkeleton count={2} />
          </State>
          <State name="نجاح">
            <Notice tone="ok" icon={<CircleCheckBig className="size-5 text-ok" />} title="وصلتنا تجربتك، شكرًا لك">
              تأكيد واضح لما حدث، وما الذي سيحدث بعده.
            </Notice>
          </State>
          <State name="خطأ">
            <Notice tone="bad" icon={<TriangleAlert className="size-5 text-bad" />} title="تعذّر قبول الملف">
              حجم الفيديو 140 م.ب، والحد الأقصى 100 م.ب. قصّه أو اضغطه ثم أعد المحاولة.
            </Notice>
          </State>
          <State name="بانتظار المراجعة">
            <Notice tone="sun" title="معاينة خاصة بك: بانتظار المراجعة">
              لا يراها غيرك حتى توافق عليها الإدارة.
            </Notice>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
              <MethodNumber n={3} size="sm" />
              <span className="min-w-0 flex-1 truncate font-bold text-ink">باقة شهرية لعيادة أسنان من أول تجربة</span>
              <StatusPill status="pending" />
            </div>
          </State>
        </div>
      </Block>

      {/* ---------- proposed motion layer: live samples of app/motion.css ---------- */}
      <div aria-hidden className="scroll-progress fixed inset-x-0 top-0 z-(--z-overlay) h-1 bg-sun" />
      <Block title="الحركة والتأثيرات" note="عيّنات حيّة من نظام الحركة في app/motion.css، المطبّق على الرئيسية وصفحات الطرق والتحدي. الخط الأصفر أعلى الصفحة هو مؤشر التقدّم في القراءة.">
        <div className="grid gap-6 lg:grid-cols-2">
          <State name="كشف عند التمرير + قلم التظليل (data-reveal · marker-draw)">
            <div data-reveal className="rounded-panel border-2 border-ink bg-white p-6">
              <p className="font-display text-h2 text-ink">
                52 أسبوعًا. <span className="marker marker-draw">52 فرصة.</span>
              </p>
              <ul data-stagger className="mt-4 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <li key={n} data-reveal="scale" className="grid aspect-square place-items-center rounded-tile border-2 border-ink bg-paper font-display text-2xl">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </State>

          <State name="بطاقة مطبوعة: رفع عند المرور، حافة مضيئة، وانزياح الرسمة (lift · spotlight · art-drift)">
            <div data-reveal>
              <div data-spotlight className="spotlight lift group flex items-center gap-4 rounded-card border-2 border-ink bg-white p-4 shadow-print-sm">
                <div className="w-28 shrink-0 overflow-hidden rounded-tile bg-paper paper-dots">
                  <MethodArt n={7} title={methods[6].title} sizes="112px" className="art-drift misprint" />
                </div>
                <div>
                  <p className="font-display text-h3 text-ink">{methods[6].title}</p>
                  <p className="text-sm text-ink-soft">مرّر المؤشر فوق البطاقة (على سطح المكتب فقط).</p>
                </div>
              </div>
            </div>
          </State>

          <State name="زر مغناطيسي + عدّاد (data-magnetic · data-countup)">
            <div data-reveal className="flex flex-wrap items-center gap-6 rounded-panel border-2 border-ink bg-brand p-6 blue-dots">
              <Button variant="sun" size="lg" data-magnetic="0.3">
                سأجرّب هذه الطريقة
              </Button>
              <p className="font-display text-display leading-none text-white">
                <span data-countup="52">52</span>
              </p>
            </div>
          </State>

          <State name="ختم الإنجاز (animate-stamp): علّم المهمة">
            <label data-reveal className="relative flex cursor-pointer items-center gap-4 rounded-card border-2 border-ink bg-white p-5">
              <input type="checkbox" className="peer size-6 accent-brand" />
              <span className="font-display text-h3 text-ink peer-checked:text-ok peer-checked:line-through">تواصل مع خمسة عملاء محتملين</span>
              <span className="pointer-events-none absolute end-5 top-1/2 -mt-5 hidden rounded-tile border-4 border-ok px-3 py-1 font-display text-xl text-ok peer-checked:block peer-checked:animate-stamp">تم</span>
            </label>
          </State>

          <State name="ملصق يُوضَع على الصفحة (animate-land)">
            <div data-reveal className="grid place-items-center rounded-panel border-2 border-dashed border-line bg-white/60 p-8">
              <div className="animate-land rounded-card border-2 border-ink bg-sun px-6 py-4 font-display text-h3 text-ink shadow-print">تحدي الأسبوع</div>
            </div>
          </State>

          <State name="زجاج مصنفر للشريط العائم + حبيبات الورق (glass · grain)">
            <div data-reveal className="relative h-44 overflow-hidden rounded-panel border-2 border-ink bg-brand blue-dots">
              <MethodArt n={3} title={methods[2].title} sizes="260px" className="absolute -bottom-10 start-6 w-56" />
              <div aria-hidden className="grain absolute inset-0" />
              <div className="glass absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full border border-ink/15 px-5 py-2.5">
                <span className="font-bold text-ink">مصمّم بوستات السوشال ميديا</span>
                <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white">انضم</span>
              </div>
            </div>
          </State>
        </div>

        <div data-reveal className="mt-6 rounded-panel border-2 border-ink bg-white p-6">
          <p className="mb-3 text-xs font-bold text-ink-mute">السلّم الطباعي المرن (text-display · text-h1 · text-h2 · text-h3 · text-lead)</p>
          <p className="font-display text-display text-ink">دخلك يبدأ بتجربة</p>
          <p className="font-display text-h1 text-ink">ابحث عن طريقتك</p>
          <p className="font-display text-h2 text-brand">«عدسة تبيع»</p>
          <p className="font-display text-h3 text-ink">من أين تبدأ؟</p>
          <p className="text-lead text-ink-soft">نص تمهيدي يكبر ويصغر بسلاسة مع عرض الشاشة، بلا قفزات عند نقاط التوقف.</p>
        </div>
      </Block>
    </Container>
  );
}

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      {note ? <p className="mt-1 text-sm text-ink-soft">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function State({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-ink-mute">{name}</p>
      {children}
    </div>
  );
}

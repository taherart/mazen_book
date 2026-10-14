import { ChevronDown } from "@/components/icons";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { ReviewStatus } from "@/lib/types";
import { STATUS } from "@/lib/taxonomy";

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ---------- layout ---------- */

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold text-ink", className)}>{children}</span>;
}

/** Section title. `reveal` fades it in as it scrolls into view (never use it above the fold). */
export function SectionHead({ eyebrow, title, lead, action, reveal, className }: { eyebrow?: ReactNode; title: ReactNode; lead?: ReactNode; action?: ReactNode; reveal?: boolean; className?: string }) {
  return (
    <div data-reveal={reveal ? "" : undefined} className={cx("flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="max-w-2xl">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className={cx("font-display text-h2 text-ink", !!eyebrow && "mt-3")}>{title}</h2>
        {lead ? <p className="mt-2 text-ink-soft">{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ---------- buttons ---------- */

type Variant = "primary" | "sun" | "white" | "soft" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white border-2 border-ink shadow-print-sm hover:bg-brand-dark",
  sun: "bg-sun text-ink border-2 border-ink shadow-print-sm hover:bg-sun-deep",
  white: "bg-white text-ink border-2 border-ink shadow-print-sm hover:bg-brand-wash",
  soft: "bg-brand-wash text-brand-dark border-2 border-transparent hover:border-brand-soft",
  ghost: "text-ink-soft border-2 border-transparent hover:bg-ink/5 hover:text-ink",
  danger: "bg-white text-bad border-2 border-bad hover:bg-bad-wash",
};
// printed buttons rise a little under a mouse and press flat when tapped
const PRESS = "hover:translate-x-px hover:-translate-y-0.5 hover:shadow-print active:translate-x-[-2px] active:translate-y-[2px] active:shadow-none";
const SIZE: Record<Size, string> = {
  sm: "tap h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.95rem] gap-2",
  lg: "h-14 px-7 text-lg gap-2.5",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  const printed = variant === "primary" || variant === "sun" || variant === "white";
  return cx(
    "inline-flex select-none items-center justify-center rounded-full font-bold leading-none transition duration-150 disabled:translate-none disabled:opacity-50 disabled:shadow-none",
    VARIANT[variant],
    printed && PRESS,
    SIZE[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };
export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };
export function LinkButton({ variant, size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* ---------- small pieces ---------- */

type Tone = "paper" | "brand" | "sun" | "ok" | "bad" | "ink" | "white";
const TONE: Record<Tone, string> = {
  paper: "bg-paper-deep text-ink-soft",
  brand: "bg-brand-wash text-brand-dark",
  sun: "bg-sun-wash text-ink",
  ok: "bg-ok-wash text-ok",
  bad: "bg-bad-wash text-bad",
  ink: "bg-ink text-white",
  white: "bg-white text-ink border border-line",
};

export function Chip({ tone = "paper", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none", TONE[tone], className)} {...props} />;
}

/** Marks illustrative content so nobody mistakes it for a real member or result. */
export function SampleTag({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-md border border-dashed border-ink-mute px-1.5 py-0.5 text-[0.68rem] font-semibold leading-none text-ink-mute", className)} title="محتوى توضيحي في النسخة الأولية، وليس تجربة حقيقية">
      مثال توضيحي
    </span>
  );
}

export function StatusPill({ status }: { status: ReviewStatus }) {
  const tone: Tone = status === "approved" ? "ok" : status === "rejected" ? "bad" : "sun";
  return <Chip tone={tone}>{STATUS[status]}</Chip>;
}

export function Card({ className, printed, ...props }: ComponentProps<"div"> & { printed?: boolean }) {
  return <div className={cx("rounded-3xl bg-white", printed ? "border-2 border-ink shadow-print" : "border border-line shadow-soft", className)} {...props} />;
}

const AVATAR_TONES = ["bg-brand text-white", "bg-sun text-ink", "bg-brand-deep text-white", "bg-brand-soft text-brand-deep", "bg-ink text-white"];
export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const tone = AVATAR_TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  const box = size === "lg" ? "size-20 text-3xl" : size === "sm" ? "size-9 text-base" : "size-12 text-xl";
  return (
    <span aria-hidden className={cx("grid shrink-0 place-items-center rounded-full border-2 border-ink font-display leading-none", box, tone, className)}>
      {name.trim().charAt(0)}
    </span>
  );
}

export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "sun" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className={cx("h-3 overflow-hidden rounded-full border-2 border-ink bg-white", className)}>
      <div className={cx("h-full rounded-full transition-[width,background-color] duration-700 ease-spring-soft", tone === "sun" ? "bg-sun" : "bg-brand")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, children, action, className }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-3xl border-2 border-dashed border-line bg-white/60 px-6 py-10 text-center", className)}>
      {icon ? <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand-wash text-brand">{icon}</div> : null}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {children ? <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-soft">{children}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Notice({ tone = "brand", icon, title, children, className }: { tone?: "brand" | "sun" | "ok" | "bad"; icon?: ReactNode; title?: string; children?: ReactNode; className?: string }) {
  const tones = { brand: "border-brand-soft bg-brand-wash", sun: "border-sun-deep/40 bg-sun-wash", ok: "border-ok/30 bg-ok-wash", bad: "border-bad/30 bg-bad-wash" };
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={cx("flex gap-3 rounded-2xl border px-4 py-3 text-sm text-ink", tones[tone], className)}>
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div>
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className="text-ink-soft">{children}</div> : null}
      </div>
    </div>
  );
}

/* ---------- forms ---------- */

const CONTROL = "w-full rounded-2xl border-2 border-line bg-white px-4 text-ink placeholder:text-ink-mute transition focus:border-brand focus:outline-none aria-[invalid=true]:border-bad";

export function Field({ label, hint, error, optional, htmlFor, children }: { label: string; hint?: string; error?: string; optional?: boolean; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-2 text-sm font-bold text-ink">
        {label}
        {optional ? <span className="text-xs font-normal text-ink-mute">اختياري</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm font-semibold text-bad">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-mute">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(CONTROL, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(CONTROL, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cx(CONTROL, "h-12 appearance-none pe-10", className)} {...props} />
      <ChevronDown aria-hidden className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
    </div>
  );
}

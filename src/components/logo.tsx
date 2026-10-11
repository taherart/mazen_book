import Link from "next/link";
import { cx } from "./ui";

export function Logo({ inverted, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="52 طريقة لزيادة الدخل، الصفحة الرئيسية" className={cx("flex shrink-0 items-center gap-2.5", className)}>
      <span className={cx("grid size-10 place-items-center rounded-xl border-2 pt-1 font-display text-2xl leading-none", inverted ? "border-white bg-brand text-white" : "border-ink bg-brand text-white shadow-print-sm")}>52</span>
      <span className={cx("font-display text-xl leading-none", inverted ? "text-white" : "text-ink")}>
        طريقة <span className={cx("hidden min-[380px]:inline", inverted ? "text-white/60" : "text-ink-soft")}>لزيادة الدخل</span>
      </span>
    </Link>
  );
}

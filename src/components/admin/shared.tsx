import type { ReactNode } from "react";
import type { MethodSummary, WeekInfo } from "@/lib/types";
import { cx } from "../ui";

export interface AdminProps {
  methods: MethodSummary[];
  week: WeekInfo;
  siteUrl: string;
}

export type AdminTab = "overview" | "review" | "week" | "raffle" | "methods" | "people" | "qr";

export function AdminHead({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {lead ? <p className="mt-1 max-w-2xl text-ink-soft">{lead}</p> : null}
      </div>
      {children}
    </header>
  );
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cx("rounded-3xl border-2 border-ink bg-white p-5", className)}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

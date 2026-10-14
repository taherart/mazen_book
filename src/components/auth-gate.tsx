"use client";

import { LogIn } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useHydrated, useUser } from "@/lib/demo/hooks";
import type { DemoUser } from "@/lib/demo/store";
import { buttonClass } from "./ui";

/** Pages stay readable by anyone; taking part asks for an account, and brings you back afterwards. */
export function AuthGate({ children, title = "سجّل دخولك لتكمل", reason, fallback }: { children: (user: DemoUser) => ReactNode; title?: string; reason: string; fallback?: ReactNode }) {
  const user = useUser();
  const hydrated = useHydrated();
  const pathname = usePathname();
  if (!hydrated) return fallback ?? <div className="skeleton h-64" aria-busy="true" />;
  if (!user) {
    const next = encodeURIComponent(pathname);
    return (
      <div className="rounded-[2rem] border-2 border-ink bg-white p-6 text-center shadow-print sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-ink bg-sun text-ink">
          <LogIn aria-hidden className="size-6" />
        </span>
        <h2 className="mt-4 font-display text-2xl text-ink">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">{reason}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/signup?next=${next}`} className={buttonClass("primary", "lg")}>
            أنشئ حسابًا
          </Link>
          <Link href={`/login?next=${next}`} className={buttonClass("white", "lg")}>
            عندي حساب
          </Link>
        </div>
      </div>
    );
  }
  return <>{children(user)}</>;
}

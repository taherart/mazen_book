import { ChevronLeft } from "@/components/icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { methodHref } from "@/lib/methods";
import type { MethodSummary } from "@/lib/types";
import { MethodNumber } from "./method-card";
import { Container, cx } from "./ui";

/** Shared frame for the pages that hang off a method: its challenge, the story form, the service form. */
export function MethodSubpage({ method, title, lead, children, wide }: { method: MethodSummary; title: string; lead: string; children: ReactNode; wide?: boolean }) {
  return (
    <>
      <header className="border-b border-line">
        <Container className={cx("py-8", !wide && "max-w-3xl")}>
          <nav aria-label="مسار التصفح" className="flex flex-wrap items-center gap-1 text-sm font-semibold text-ink-soft">
            <Link href="/methods" className="hover:text-brand">
              الطرق الـ52
            </Link>
            <ChevronLeft aria-hidden className="size-4" />
            <Link href={methodHref(method.n)} className="hover:text-brand">
              {method.title}
            </Link>
          </nav>
          <div className="mt-4 flex items-start gap-4">
            <MethodNumber n={method.n} size="lg" className="shadow-print-sm" />
            <div className="min-w-0">
              <h1 className="font-display text-3xl leading-snug text-ink sm:text-4xl">{title}</h1>
              <p className="mt-1 text-ink-soft">{lead}</p>
            </div>
          </div>
        </Container>
      </header>
      <Container className={cx("py-8 sm:py-10", !wide && "max-w-3xl")}>{children}</Container>
    </>
  );
}

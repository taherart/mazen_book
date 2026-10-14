"use client";

import { RotateCcw, TriangleAlert } from "@/components/icons";
import { Button, Container, LinkButton } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="grid flex-1 place-items-center py-20 text-center">
      <div role="alert">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl border-2 border-ink bg-bad-wash text-bad">
          <TriangleAlert aria-hidden className="size-8" />
        </span>
        <h1 className="mt-4 font-display text-4xl text-ink">حدث خطأ غير متوقع</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">لم نتمكن من عرض هذه الصفحة. جرّب مرة أخرى، وإن تكرر الخطأ عُد للصفحة الرئيسية.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={reset}>
            <RotateCcw aria-hidden className="size-5" />
            حاول مرة أخرى
          </Button>
          <LinkButton href="/" variant="white" size="lg">
            الصفحة الرئيسية
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}

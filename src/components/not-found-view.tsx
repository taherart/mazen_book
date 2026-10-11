import { Compass } from "lucide-react";
import { Container, LinkButton } from "./ui";

export function NotFoundView() {
  return (
    <Container className="grid flex-1 place-items-center py-20 text-center">
      <div>
        <p aria-hidden className="font-display text-[9rem] leading-none text-transparent [-webkit-text-stroke:3px_var(--color-brand)]">
          53
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">هذه الطريقة ليست في الكتاب</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">الصفحة التي تبحث عنها غير موجودة أو تغيّر عنوانها. عندنا 52 طريقة أخرى تستحق وقتك.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <LinkButton href="/methods" size="lg">
            <Compass aria-hidden className="size-5" />
            استكشف الطرق الـ52
          </LinkButton>
          <LinkButton href="/" variant="white" size="lg">
            الصفحة الرئيسية
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}

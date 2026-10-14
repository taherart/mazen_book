import { Container } from "./ui";

/** Loading state for a detail page: the outline of a hero and its first cards. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="جارٍ التحميل">
      <div className="border-b-2 border-ink paper-dots">
        <Container className="grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="skeleton h-16 w-40" />
            <div className="skeleton h-14 w-full max-w-lg" />
            <div className="skeleton h-8 w-72" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="skeleton h-24" />
              <div className="skeleton h-24" />
              <div className="skeleton h-24" />
            </div>
            <div className="skeleton h-14 w-56 rounded-full" />
          </div>
          <div className="skeleton mx-auto aspect-square w-full max-w-md rounded-[2.5rem]" />
        </Container>
      </div>
      <Container className="grid gap-4 py-10 md:grid-cols-3">
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </Container>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="جارٍ التحميل" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-3xl border-2 border-line bg-white p-4">
          <div className="skeleton aspect-[16/10]" />
          <div className="skeleton mt-4 h-6 w-3/4" />
          <div className="skeleton mt-2 h-4 w-1/2" />
          <div className="skeleton mt-4 h-14" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <Container className="max-w-3xl py-10" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="skeleton h-10 w-2/3" />
      <div className="mt-6 space-y-4 rounded-panel border-2 border-line bg-white p-6">
        <div className="skeleton h-12" />
        <div className="skeleton h-12" />
        <div className="skeleton h-28" />
        <div className="skeleton h-12 w-40 rounded-full" />
      </div>
    </Container>
  );
}

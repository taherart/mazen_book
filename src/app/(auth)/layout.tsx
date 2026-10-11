import Image from "next/image";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid flex-1 lg:grid-cols-[1fr_1.05fr]">
      <main className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto my-auto w-full max-w-md py-10">{children}</div>
      </main>
      <aside className="relative hidden overflow-hidden border-s-2 border-ink bg-brand blue-dots lg:flex lg:flex-col lg:justify-between lg:p-12">
        <span aria-hidden className="pointer-events-none absolute -bottom-24 -end-10 select-none font-display text-[26rem] leading-none text-transparent [-webkit-text-stroke:3px_rgb(255_255_255/0.16)]">
          52
        </span>
        <p className="relative max-w-md font-display text-5xl leading-[1.35] text-white">
          من «قرأت عن فرصة» إلى <span className="marker-white">«جرّبتها»</span>
        </p>
        <div className="relative flex items-end gap-6">
          <Image src="/methods/03.webp" alt="" width={640} height={640} sizes="260px" className="w-64 rounded-[2rem] border-2 border-ink bg-white p-3 shadow-print" />
          <ul className="grid gap-2 pb-3 text-lg font-semibold text-white/90">
            <li>52 أسبوعًا.</li>
            <li>52 فرصة.</li>
            <li className="text-sun">ابدأ تجربتك.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

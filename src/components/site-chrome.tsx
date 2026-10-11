"use client";

import { BookOpen, Compass, Home, LayoutGrid, Menu, MessagesSquare, Trophy, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useHydrated, useUser } from "@/lib/demo/hooks";
import { Logo } from "./logo";
import { Avatar, buttonClass, cx } from "./ui";

const NAV = [
  { href: "/methods", label: "الطرق الـ52" },
  { href: "/challenge", label: "تحدي الأسبوع" },
  { href: "/stories", label: "تجارب المجتمع" },
  { href: "/providers", label: "أصحاب المهارات" },
  { href: "/book", label: "الكتاب" },
];

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`) || (href === "/methods" && pathname.startsWith("/method/")));

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useUser();
  const hydrated = useHydrated();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="التنقل الرئيسي" className="mx-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined} className={cx("rounded-full px-3.5 py-2 text-[0.95rem] font-semibold transition", isActive(pathname, item.href) ? "bg-ink text-white" : "text-ink-soft hover:bg-ink/5 hover:text-ink")}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          {!hydrated ? (
            <span className="skeleton block h-10 w-24" />
          ) : user ? (
            <Link href="/dashboard" className="flex items-center gap-2 rounded-full border-2 border-ink bg-white py-1 pe-1 ps-3 text-sm font-bold hover:bg-brand-wash">
              <span className="max-w-28 truncate">{user.name.split(" ")[0]}</span>
              <Avatar name={user.name} size="sm" className="size-8 border-0" />
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
                دخول
              </Link>
              <Link href="/signup" className={buttonClass("primary", "sm")}>
                ابدأ تجربتك
              </Link>
            </>
          )}
          <button type="button" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white lg:hidden">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav aria-label="القائمة" className="border-t-2 border-ink bg-white lg:hidden">
          <ul className="mx-auto grid max-w-6xl gap-1 px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)} className={cx("block rounded-2xl px-4 py-3 font-bold", isActive(pathname, item.href) ? "bg-brand-wash text-brand-dark" : "text-ink hover:bg-paper")}>
                  {item.label}
                </Link>
              </li>
            ))}
            {hydrated && !user ? (
              <li>
                <Link href="/login" onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-bold text-ink hover:bg-paper">
                  تسجيل الدخول
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

/** Non-interactive stand-in while the header's route state resolves. */
export function SiteHeaderShell() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <Logo />
      </div>
    </header>
  );
}

const TABS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/methods", label: "الطرق", icon: LayoutGrid },
  { href: "/challenge", label: "التحدي", icon: Trophy },
  { href: "/stories", label: "التجارب", icon: MessagesSquare },
  { href: "/dashboard", label: "حسابي", icon: UserRound },
];

/** Thumb-reach navigation on phones. */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="التنقل السريع" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          const main = href === "/challenge";
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-1 py-2 text-[0.7rem] font-bold">
                <span className={cx("grid place-items-center rounded-full transition", main ? "-mt-6 size-12 border-2 border-ink shadow-print-sm" : "size-8", main ? (active ? "bg-sun text-ink" : "bg-brand text-white") : active ? "bg-ink text-white" : "text-ink-soft")}>
                  <Icon aria-hidden className={main ? "size-6" : "size-[1.15rem]"} />
                </span>
                <span className={active ? "text-ink" : "text-ink-mute"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t-2 border-ink bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/70">منصة ترافق كتاب «52 طريقة لتزيد دخلك من جد» لمازن الضراب: تنقلك من «قرأت عن فرصة» إلى «جرّبتها».</p>
          <p className="mt-4 font-display text-xl text-sun">52 أسبوعًا. 52 فرصة. ابدأ تجربتك.</p>
        </div>
        <FooterList
          title="استكشف"
          links={[
            { href: "/methods", label: "دليل الطرق الـ52", icon: Compass },
            { href: "/challenge", label: "تحدي وجائزة الأسبوع", icon: Trophy },
            { href: "/stories", label: "تجارب المجتمع", icon: MessagesSquare },
            { href: "/providers", label: "أصحاب المهارات", icon: UserRound },
            { href: "/book", label: "عن الكتاب والمؤلف", icon: BookOpen },
          ]}
        />
        <FooterList
          title="المنصة"
          links={[
            { href: "/dashboard", label: "حسابي" },
            { href: "/terms", label: "الشروط والخصوصية وشروط السحب" },
            { href: "/ui", label: "مكتبة المكوّنات وحالات الواجهة" },
            { href: "/admin", label: "لوحة الإدارة" },
          ]}
        />
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/50 sm:px-6">© 2026 {`52 طريقة لزيادة الدخل`}. جميع الأرقام والمحتوى من كتاب مازن الضراب، والنتائج تختلف من شخص لآخر.</p>
      </div>
    </footer>
  );
}

function FooterList({ title, links }: { title: string; links: { href: string; label: string; icon?: typeof Home }[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white/50">{title}</h3>
      <ul className="mt-4 grid gap-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex items-center gap-2 font-semibold text-white/85 hover:text-sun">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

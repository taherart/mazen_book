import { Suspense } from "react";
import { SiteFooter, SiteHeader, SiteHeaderShell, TabBar } from "@/components/site-chrome";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<SiteHeaderShell />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <div className="pb-tabbar">
        <SiteFooter />
      </div>
      <Suspense>
        <TabBar />
      </Suspense>
    </>
  );
}

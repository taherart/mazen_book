import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found-view";

export const metadata: Metadata = { title: "الصفحة غير موجودة" };

export default function NotFound() {
  return <NotFoundView />;
}

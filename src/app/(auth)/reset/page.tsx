import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "@/components/password-reset";

export const metadata: Metadata = { title: "كلمة مرور جديدة", robots: { index: false } };

// the token arrives in the address, so the form reads it on the client
export default function ResetPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96" aria-busy="true" />}>
      <ResetForm />
    </Suspense>
  );
}

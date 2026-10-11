import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "إنشاء حساب", robots: { index: false } };

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96" aria-busy="true" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}

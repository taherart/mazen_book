import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false } };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96" aria-busy="true" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}

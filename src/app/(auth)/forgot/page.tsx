import type { Metadata } from "next";
import { ForgotForm } from "@/components/password-reset";

export const metadata: Metadata = { title: "نسيت كلمة المرور", robots: { index: false } };

export default function ForgotPage() {
  return <ForgotForm />;
}

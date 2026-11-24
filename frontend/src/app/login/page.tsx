import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
      <Suspense fallback={<div className="h-48 animate-pulse rounded bg-slate-100" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/FormControls";
import { useAuth } from "@/context/AuthContext";
import { errorMessage, fieldErrorsFrom } from "@/lib/apiError";
import { PasswordInput } from "./PasswordInput";

const safeRedirect = (target: string | null) => (target && target.startsWith("/") && !target.startsWith("//") ? target : "/dashboard");

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const nextPath = safeRedirect(useSearchParams().get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      await login(email, password);
      router.push(nextPath);
    } catch (error) {
      setFieldErrors(fieldErrorsFrom(error));
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}
      <Field label="Email" htmlFor="login-email" error={fieldErrors.email}>
        <TextInput id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} required />
      </Field>
      <Field label="Password" htmlFor="login-password" error={fieldErrors.password}>
        <PasswordInput id="login-password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={fieldErrors.password} required />
      </Field>
      <div className="-mt-2 flex justify-end"><Link href="/forgot-password" className="text-sm font-medium text-teal-700 hover:underline">Forgot password?</Link></div>
      <Button type="submit" loading={submitting} className="w-full">Sign in</Button>
      <p className="text-center text-sm text-slate-500">
        New here? <Link href="/register" className="font-medium text-teal-700 hover:underline">Create an account</Link>
      </p>
      <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Demo account (after seeding): demo@estatehub.test / Password@123</p>
    </form>
  );
}

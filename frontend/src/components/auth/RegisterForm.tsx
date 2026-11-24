"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/FormControls";
import { useAuth } from "@/context/AuthContext";
import { errorMessage, fieldErrorsFrom } from "@/lib/apiError";
import { PasswordInput } from "./PasswordInput";

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const change = (field: keyof typeof form) => (event: { target: { value: string; }; }) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone.trim() || undefined });
      router.push("/dashboard");
    } catch (error) {
      setFieldErrors(fieldErrorsFrom(error));
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}
      <Field label="Full name" htmlFor="register-name" error={fieldErrors.name}>
        <TextInput id="register-name" autoComplete="name" value={form.name} onChange={change("name")} error={fieldErrors.name} required />
      </Field>
      <Field label="Email" htmlFor="register-email" error={fieldErrors.email}>
        <TextInput id="register-email" type="email" autoComplete="email" value={form.email} onChange={change("email")} error={fieldErrors.email} required />
      </Field>
      <Field label="Phone (optional)" htmlFor="register-phone" error={fieldErrors.phone}>
        <TextInput id="register-phone" type="tel" autoComplete="tel" value={form.phone} onChange={change("phone")} error={fieldErrors.phone} />
      </Field>
      <Field label="Password" htmlFor="register-password" error={fieldErrors.password} hint="At least 8 characters with a letter and a number">
        <PasswordInput id="register-password" autoComplete="new-password" value={form.password} onChange={change("password")} error={fieldErrors.password} required />
      </Field>
      <Button type="submit" loading={submitting} className="w-full">Create account</Button>
      <p className="text-center text-sm text-slate-500">
        Already registered? <Link href="/login" className="font-medium text-teal-700 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormControls";
import { useToast } from "@/context/ToastContext";
import { clientFetch } from "@/lib/clientApi";
import { errorMessage, fieldErrorsFrom } from "@/lib/apiError";

export default function ResetPasswordPage() { return <Suspense fallback={<main className="mx-auto max-w-lg px-4 py-16"><div className="h-80 animate-pulse rounded-3xl bg-slate-100" /></main>}><ResetPasswordForm /></Suspense>; }

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? ""; const router = useRouter(); const { toast } = useToast(); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [errors, setErrors] = useState<Record<string, string>>({}); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); const next: Record<string, string> = {}; if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) next.password = "Use 8–72 characters with at least one letter and one number."; if (confirm !== password) next.confirmPassword = "Passwords do not match."; if (!token) next.token = "This reset link is missing or invalid."; setErrors(next); if (Object.keys(next).length) { toast("error", Object.values(next)[0]); return; } setLoading(true); try { await clientFetch("/api/auth/reset-password", { method: "POST", body: { token, password, confirmPassword: confirm } }); toast("success", "Password reset successfully."); router.replace("/login"); } catch (e) { const mapped = fieldErrorsFrom(e); setErrors(mapped); toast("error", errorMessage(e)); } finally { setLoading(false); } }
  return <main className="mx-auto max-w-lg px-4 py-16"><section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Secure account</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Set a new password</h1><p className="mt-2 text-sm text-slate-600">Choose a strong password you have not used before.</p><form onSubmit={submit} className="mt-6 space-y-5"><Field label="New password" htmlFor="reset-password" error={errors.password} hint="8–72 characters, including a letter and a number." required><PasswordInput id="reset-password" autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: "" })); }} error={errors.password} required /></Field><Field label="Confirm password" htmlFor="reset-confirm" error={errors.confirmPassword} required><PasswordInput id="reset-confirm" autoComplete="new-password" value={confirm} onChange={e => { setConfirm(e.target.value); setErrors(v => ({ ...v, confirmPassword: "" })); }} error={errors.confirmPassword} required /></Field>{errors.token && <p role="alert" className="text-sm text-red-600">{errors.token}</p>}<Button className="w-full" loading={loading}>Reset password</Button></form><p className="mt-6 text-center text-sm text-slate-500"><Link href="/forgot-password" className="font-medium text-teal-700 hover:underline">Request a new reset link</Link></p></section></main>;
}

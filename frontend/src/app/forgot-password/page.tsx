"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/FormControls";
import { clientFetch } from "@/lib/clientApi";
import { errorMessage, fieldErrorsFrom } from "@/lib/apiError";
import { useToast } from "@/context/ToastContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false); const { toast } = useToast();
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { await clientFetch("/api/auth/forgot-password", { method: "POST", body: { email } }); setSent(true); toast("success", "If the account exists, reset instructions are on their way."); } catch (e) { const errors = fieldErrorsFrom(e); setError(errors.email ?? errorMessage(e)); toast("error", errors.email ?? errorMessage(e)); } finally { setLoading(false); } }
  return <main className="mx-auto max-w-lg px-4 py-16"><section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Account recovery</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Forgot your password?</h1><p className="mt-2 text-sm leading-6 text-slate-600">Enter your account email and we’ll send a secure reset link if an account matches.</p>{sent ? <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">Check your inbox for password reset instructions. The response is the same whether or not an account exists.</div> : <form onSubmit={submit} className="mt-6 space-y-5"><Field label="Email address" htmlFor="forgot-email" error={error} required><TextInput id="forgot-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} required /></Field><Button className="w-full" loading={loading}>Send reset link</Button></form>}<p className="mt-6 text-center text-sm text-slate-500"><Link href="/login" className="font-medium text-teal-700 hover:underline">Back to sign in</Link></p></section></main>;
}

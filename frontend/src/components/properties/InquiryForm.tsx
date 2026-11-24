"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/FormControls";
import { useAuth } from "@/context/AuthContext";
import { ApiError, errorMessage, fieldErrorsFrom } from "@/lib/apiError";
import { clientFetch } from "@/lib/clientApi";
import { useToast } from "@/context/ToastContext";

export function InquiryForm({ propertyId, ownerName }: { propertyId: number; ownerName: string; }) {
  const { user, status } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const change = (field: keyof typeof form) => (event: { target: { value: string; }; }) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => { const next = { ...current }; delete next[field]; return next; });
  };

  if (status === "loading") return <div className="h-72 animate-pulse rounded-xl bg-slate-100" aria-hidden />;

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Contact {ownerName}</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in to send an inquiry. This keeps owners safe from spam.</p>
        <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={`${buttonClasses("primary")} mt-4 w-full`}>
          Sign in to contact owner
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-lg font-bold text-emerald-900">Inquiry sent</h2>
        <p className="mt-1 text-sm text-emerald-800">{ownerName} will see your message and contact you on the details you provided.</p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      await clientFetch(`/api/properties/${propertyId}/inquiries`, { method: "POST", body: form });
      setSent(true);
      toast("success", "Your inquiry has been sent to the owner.");
    } catch (error) {
      const errors = fieldErrorsFrom(error);
      setFieldErrors(errors);
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        toast("error", errors[firstError]);
        const field = document.getElementById(`inquiry-${firstError}`);
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => field?.focus(), 250);
      }

      if (!(error instanceof ApiError) || error.status !== 400 || error.code !== "VALIDATION_ERROR") {
        setFormError(errorMessage(error));
        toast("error", errorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">Contact {ownerName}</h2>
      {formError && <Alert variant="error">{formError}</Alert>}

      <Field label="Your name" htmlFor="inquiry-name" error={fieldErrors.name}>
        <TextInput id="inquiry-name" value={form.name} onChange={change("name")} error={fieldErrors.name} autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="inquiry-email" error={fieldErrors.email}>
        <TextInput id="inquiry-email" type="email" value={form.email} onChange={change("email")} error={fieldErrors.email} autoComplete="email" required />
      </Field>
      <Field label="Phone" htmlFor="inquiry-phone" error={fieldErrors.phone} hint="10-14 digits, e.g. 9876543210">
        <TextInput id="inquiry-phone" type="tel" value={form.phone} onChange={change("phone")} error={fieldErrors.phone} autoComplete="tel" required />
      </Field>
      <Field label="Message" htmlFor="inquiry-message" error={fieldErrors.message} hint="At least 20 characters">
        <TextArea id="inquiry-message" rows={4} maxLength={1000} value={form.message} onChange={change("message")} error={fieldErrors.message} required />
      </Field>

      <div className="hp-field" aria-hidden="true">
        <label htmlFor="inquiry-website">Website</label>
        <input id="inquiry-website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={change("website")} />
      </div>

      <Button type="submit" loading={submitting} className="w-full">Send inquiry</Button>
    </form>
  );
}

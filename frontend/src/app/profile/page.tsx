"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/FormControls";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { errorMessage, fieldErrorsFrom } from "@/lib/apiError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { clientFetch } from "@/lib/clientApi";

export default function ProfilePage() {
  return <RequireAuth><ProfileContent /></RequireAuth>;
}

function ProfileContent() {
  const { user, updateProfile, updateAvatar, removeAvatar, logout } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ currentPassword: "", password: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? "");
    setEmail(user.email);
  }, [user]);

  useEffect(() => {
    if (!avatarFile) { setAvatarPreview(null); return; }
    const preview = URL.createObjectURL(avatarFile); setAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [avatarFile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "Name must be at least 2 characters.";
    if (phone.trim() && !/^\+?\d{10,14}$/.test(phone.trim())) nextErrors.phone = "Enter a valid phone number (10-14 digits, optional leading +).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (email.trim().toLowerCase() !== user?.email.toLowerCase() && !currentPassword) nextErrors.currentPassword = "Enter your current password to change your email.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0];
      toast("error", nextErrors[first]);
      const field = document.getElementById(`profile-${first}`);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => field?.focus(), 200);
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() || null, ...(email.trim().toLowerCase() !== user?.email.toLowerCase() ? { currentPassword } : {}) });
      toast("success", "Profile updated successfully.");
      setCurrentPassword("");
      setErrors({});
    } catch (error) {
      const fieldErrors = fieldErrorsFrom(error);
      setErrors(fieldErrors);
      const first = Object.keys(fieldErrors)[0];
      if (first) {
        toast("error", fieldErrors[first]);
        document.getElementById(`profile-${first}`)?.focus();
      } else toast("error", errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const initials = user?.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";

  async function onAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) { toast("error", "Choose a JPG, PNG or WebP image under 5 MB."); event.target.value = ""; return; }
    setAvatarFile(file); event.target.value = "";
  }
  async function saveAvatar() { if (!avatarFile) return; setAvatarBusy(true); try { await updateAvatar(avatarFile); setAvatarFile(null); toast("success", "Profile photo updated."); } catch (e) { toast("error", errorMessage(e)); } finally { setAvatarBusy(false); } }
  async function changePassword(event: FormEvent) {
    event.preventDefault(); const next: Record<string, string> = {}; if (passwords.password.length < 8 || passwords.password.length > 72 || !/[A-Za-z]/.test(passwords.password) || !/[0-9]/.test(passwords.password)) next.password = "Use 8–72 characters with a letter and a number."; if (passwords.password !== passwords.confirmPassword) next.confirmPassword = "Passwords do not match."; setPasswordErrors(next); if (Object.keys(next).length) { toast("error", Object.values(next)[0]); return; }
    setSubmitting(true); try { await clientFetch("/api/auth/change-password", { method: "POST", body: passwords }); toast("success", "Password changed. Please sign in again."); await logout(); window.location.assign("/login"); } catch (e) { const fields = fieldErrorsFrom(e); setPasswordErrors(fields); toast("error", errorMessage(e)); } finally { setSubmitting(false); }
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Your account</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">My profile</h1><p className="mt-2 text-sm text-slate-500">Manage the details used when you list a property or contact an owner.</p></div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
          {avatarPreview || user?.avatarUrl ? <img src={avatarPreview ?? user!.avatarUrl!} alt="Profile preview" className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-teal-100" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-teal-50 text-lg font-bold text-teal-800 ring-1 ring-teal-100">{initials}</span>}
          <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-semibold text-slate-900">{user?.name}</h2><p className="truncate text-sm text-slate-500">{user?.email}</p>{user?.createdAt && <p className="mt-1 text-xs text-slate-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>}<div className="mt-2 flex flex-wrap items-center gap-4"><label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-teal-800">{avatarFile ? "Choose another photo" : "Change photo"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onAvatar} disabled={avatarBusy} /></label>{avatarFile && <><button type="button" disabled={avatarBusy} onClick={() => void saveAvatar()} className="text-xs font-semibold text-teal-800 hover:underline">{avatarBusy ? "Uploading…" : "Save photo"}</button><button type="button" disabled={avatarBusy} onClick={() => setAvatarFile(null)} className="text-xs text-slate-500 hover:text-slate-800">Cancel</button></>}{user?.avatarUrl && !avatarFile && <button type="button" disabled={avatarBusy} onClick={async () => { setAvatarBusy(true); try { await removeAvatar(); toast("success", "Profile photo removed."); } catch (e) { toast("error", errorMessage(e)); } finally { setAvatarBusy(false); } }} className="text-xs font-medium text-slate-500 hover:text-red-700">Remove photo</button>}</div></div>
        </div>
        <form onSubmit={submit} noValidate className="max-w-xl space-y-5">
          <Field label="Full name" htmlFor="profile-name" error={errors.name} hint="This name appears on your account and property enquiries.">
            <TextInput id="profile-name" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: "" })); }} error={errors.name} required />
          </Field>
          <Field label="Email address" htmlFor="profile-email" error={errors.email} hint="Confirm your current password when changing your account email." required>
            <TextInput id="profile-email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: "" })); }} error={errors.email} required />
          </Field>
          {email.trim().toLowerCase() !== user?.email.toLowerCase() && <Field label="Current password" htmlFor="profile-current-password" error={errors.currentPassword} required><PasswordInput id="profile-current-password" autoComplete="current-password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setErrors(v => ({ ...v, currentPassword: "" })); }} error={errors.currentPassword} required /></Field>}
          <Field label="Phone number" htmlFor="profile-phone" error={errors.phone} hint="Optional. Use 10-14 digits; a leading + is allowed.">
            <TextInput id="profile-phone" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setErrors((current) => ({ ...current, phone: "" })); }} error={errors.phone} />
          </Field>
          <div className="flex flex-wrap items-center gap-3 pt-1"><Button type="submit" loading={submitting} disabled={submitting || (name.trim() === user?.name && email.trim() === user?.email && phone.trim() === (user?.phone ?? ""))}>Save changes</Button><Link href="/dashboard" className={buttonClasses("secondary")}>Go to dashboard</Link></div>
        </form>
        <form onSubmit={changePassword} className="mt-9 max-w-xl space-y-5 border-t border-slate-100 pt-7"><div><h3 className="text-lg font-semibold text-slate-900">Change password</h3><p className="mt-1 text-sm text-slate-500">Your other active sessions will be signed out after a password change.</p></div>
          <Field label="Current password" htmlFor="change-current" error={passwordErrors.currentPassword} required><PasswordInput id="change-current" autoComplete="current-password" value={passwords.currentPassword} onChange={e => setPasswords(v => ({ ...v, currentPassword: e.target.value }))} error={passwordErrors.currentPassword} required /></Field>
          <Field label="New password" htmlFor="change-new" error={passwordErrors.password} hint="At least 8 characters with a letter and a number." required><PasswordInput id="change-new" autoComplete="new-password" value={passwords.password} onChange={e => setPasswords(v => ({ ...v, password: e.target.value }))} error={passwordErrors.password} required /></Field>
          <Field label="Confirm new password" htmlFor="change-confirm" error={passwordErrors.confirmPassword} required><PasswordInput id="change-confirm" autoComplete="new-password" value={passwords.confirmPassword} onChange={e => setPasswords(v => ({ ...v, confirmPassword: e.target.value }))} error={passwordErrors.confirmPassword} required /></Field><Button type="submit" loading={submitting}>Update password</Button></form>
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Your EstateHub</h2><p className="mt-1 text-sm leading-6 text-slate-500">Manage listings and keep track of property enquiries from your dashboard.</p>
        <div className="mt-4 space-y-1">
          <Link href="/dashboard#listings" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-800">My properties <span className="float-right">→</span></Link>
          <Link href="/dashboard#received" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-800">Inquiries received <span className="float-right">→</span></Link>
          <Link href="/dashboard#sent" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-800">My inquiries <span className="float-right">→</span></Link>
          <Link href="/dashboard/properties/new" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-teal-800 hover:bg-teal-50">Post a property <span className="float-right">→</span></Link>
        </div>
      </aside>
    </div>
  </div>;
}

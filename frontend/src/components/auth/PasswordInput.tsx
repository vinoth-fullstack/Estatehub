"use client";

import { useState, type InputHTMLAttributes } from "react";

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { id: string; error?: string; }) {
  const [visible, setVisible] = useState(false);
  return <div className="relative"><input {...props} type={visible ? "text" : "password"} className={`w-full rounded-xl border ${props.error ? "border-red-500" : "border-slate-200"} bg-white px-3.5 py-2.5 pr-12 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20`} aria-invalid={Boolean(props.error)} aria-describedby={props.error ? `${props.id}-error` : undefined} /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-slate-500 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-teal-700">{visible ? <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.9 5.2A11 11 0 0121 12a11.7 11.7 0 01-3.1 4.1M6.2 6.2A11.3 11.3 0 003 12a11 11 0 0012.1 6.8" /></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7z" /><circle cx="12" cy="12" r="2.7" /></svg>}</button></div>;
}

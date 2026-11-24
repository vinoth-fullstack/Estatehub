import type { ReactNode } from "react";

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode; }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:py-16">
      <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-teal-50" aria-hidden />
      <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-100" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7M5 9v12h14V9m-9 12v-7h4v7" /></svg>
      </span>
      <h2 className="relative mt-5 text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  );
}

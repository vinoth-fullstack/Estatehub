"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "warning" | "info" | "loading";
type ToastItem = { id: number; kind: ToastKind; message: string; };
type ToastApi = { toast: (kind: ToastKind, message: string, duration?: number) => number; dismiss: (id: number) => void; };
const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode; }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const toast = useCallback((kind: ToastKind, message: string, duration = 4200) => {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setItems((current) => [...current.slice(-3), { id, kind, message }]);
    if (duration > 0) window.setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);
  return <ToastContext.Provider value={{ toast, dismiss }}>{children}<div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-atomic="false">
    {items.map((item) => <div key={item.id} role={item.kind === "error" ? "alert" : "status"} className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${item.kind === "success" ? "border-emerald-200" : item.kind === "error" ? "border-red-200" : item.kind === "warning" ? "border-amber-200" : "border-slate-200"}`}>
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${item.kind === "success" ? "bg-emerald-100 text-emerald-800" : item.kind === "error" ? "bg-red-100 text-red-800" : item.kind === "warning" ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"}`}>{item.kind === "loading" ? "…" : item.kind === "success" ? "✓" : item.kind === "error" ? "!" : "i"}</span>
      <p className="flex-1 text-sm leading-5 text-slate-800">{item.message}</p><button type="button" className="text-slate-400 hover:text-slate-700" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}>×</button>
    </div>)}
  </div></ToastContext.Provider>;
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}

import type { ReactNode } from "react";

const STYLES = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
} as const;

export function Alert({ variant = "info", children }: { variant?: keyof typeof STYLES; children: ReactNode; }) {
  return (
    <div role={variant === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${STYLES[variant]}`}>
      {children}
    </div>
  );
}

import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-teal-700 text-white hover:bg-teal-800 focus-visible:outline-teal-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  ghost: "text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-500",
};
const SIZE_CLASSES: Record<Size, string> = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm" };

export const buttonClasses = (variant: Variant = "primary", size: Size = "md") =>
  `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading = false, disabled, className = "", children, ...rest }: ButtonProps) {
  return (
    <button className={`${buttonClasses(variant, size)} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const CONTROL_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm shadow-slate-900/[0.02] transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20 disabled:bg-slate-100";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
        {label}{required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}{required && <span className="sr-only"> (required)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const errorProps = (id: string, hasError: boolean) =>
  hasError ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};

export function TextInput({ error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { id: string; error?: string; }) {
  return <input className={`${CONTROL_CLASSES} ${error ? "border-red-500" : ""}`} {...errorProps(rest.id, !!error)} {...rest} />;
}

export function TextArea({ error, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; error?: string; }) {
  return <textarea className={`${CONTROL_CLASSES} ${error ? "border-red-500" : ""}`} {...errorProps(rest.id, !!error)} {...rest} />;
}

export function SelectInput({ error, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { id: string; error?: string; }) {
  return (
    <select className={`${CONTROL_CLASSES} ${error ? "border-red-500" : ""}`} {...errorProps(rest.id, !!error)} {...rest}>
      {children}
    </select>
  );
}

"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { clientFetch } from "@/lib/clientApi";

type Suggestion = { value: string; label: string; detail: string; kind: "locality" | "city" | "property"; };

export function LocationAutocomplete({
  id, value, onChange, placeholder = "City, locality, apartment or landmark", className = "",
}: { id: string; value: string; onChange: (value: string) => void; placeholder?: string; className?: string; }) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) { setItems([]); setLoading(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await clientFetch<{ data: Suggestion[]; }>(`/api/properties/suggestions?q=${encodeURIComponent(value.trim())}`, { signal: controller.signal });
        setItems(result.data);
      } catch (error) {
        if (!controller.signal.aborted) setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value]);

  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function choose(item: Suggestion) { onChange(item.value); setOpen(false); setActive(-1); }
  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && items.length) { event.preventDefault(); setOpen(true); setActive((current) => (current + 1) % items.length); }
    if (event.key === "ArrowUp" && items.length) { event.preventDefault(); setOpen(true); setActive((current) => (current <= 0 ? items.length - 1 : current - 1)); }
    if (event.key === "Enter" && open && active >= 0) { event.preventDefault(); choose(items[active]); }
    if (event.key === "Escape") setOpen(false);
  }

  return <div className="relative min-w-0 flex-1" ref={root}>
    <div className="relative">
      <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
      <input id={id} role="combobox" aria-autocomplete="list" aria-expanded={open && value.trim().length >= 2} aria-controls={`${id}-options`} aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
        value={value} onChange={(event) => { onChange(event.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onKeyDown={handleKey}
        placeholder={placeholder} maxLength={100} autoComplete="off" className={`w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 ${className}`} />
      {value && <button type="button" aria-label="Clear location" onClick={() => { onChange(""); setOpen(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>}
    </div>
    {open && value.trim().length >= 2 && <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-xl" role="listbox" id={`${id}-options`}>
      {loading ? <p className="px-3 py-4 text-center text-sm text-slate-500">Finding matching places…</p> : items.length ? items.map((item, index) => <button type="button" role="option" aria-selected={active === index} id={`${id}-option-${index}`} key={`${item.kind}-${item.value}`} onMouseEnter={() => setActive(index)} onClick={() => choose(item)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active === index ? "bg-teal-50" : "hover:bg-slate-50"}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-teal-700"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{item.label}</span><span className="block truncate text-xs text-slate-500">{item.detail}</span></span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.kind}</span>
      </button>) : <p className="px-3 py-4 text-center text-sm text-slate-500">No matching places yet. Try a city or locality.</p>}
    </div>}
  </div>;
}

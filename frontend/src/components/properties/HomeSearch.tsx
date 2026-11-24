"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LocationAutocomplete } from "./LocationAutocomplete";

const MODES = [{ value: "sale", label: "Buy" }, { value: "rent", label: "Rent" }, { value: "commercial", label: "Commercial" }] as const;

export function HomeSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<(typeof MODES)[number]["value"]>("sale");
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (location.trim().length >= 2) params.set("q", location.trim());
    if (mode === "commercial") params.set("propertyType", "commercial");
    else params.set("listingType", mode);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (maxPrice) params.set("maxPrice", maxPrice);
    router.push(`/properties?${params.toString()}`);
  }
  return <div className="mx-auto mt-8 max-w-4xl rounded-2xl bg-white p-2 text-left shadow-[0_24px_80px_-28px_rgba(15,23,42,.38)] sm:p-3">
    <div role="tablist" aria-label="Listing category" className="flex gap-1 border-b border-slate-100 px-2">
      {MODES.map((item) => <button key={item.value} role="tab" aria-selected={mode === item.value} onClick={() => setMode(item.value)} className={`relative px-5 py-3 text-sm font-semibold transition ${mode === item.value ? "text-teal-800 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-teal-700" : "text-slate-500 hover:text-slate-800"}`}>{item.label}</button>)}
      <span className="ml-auto hidden items-center px-3 text-xs text-slate-400 sm:flex">Explore owner-listed homes</span>
    </div>
    <form onSubmit={submit} className="flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
      <LocationAutocomplete id="home-location" value={location} onChange={setLocation} />
      <select aria-label="Bedrooms" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-700 outline-none focus:border-teal-600">
        <option value="">BHK</option><option value="1">1 BHK</option><option value="2">2 BHK</option><option value="3">3 BHK</option><option value="4">4 BHK</option><option value="5">5+ BHK</option>
      </select>
      <select aria-label="Maximum budget" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-700 outline-none focus:border-teal-600">
        <option value="">Any budget</option>
        {(mode === "rent" ? [[15000, "₹15,000/mo"], [25000, "₹25,000/mo"], [50000, "₹50,000/mo"], [100000, "₹1 lakh/mo"]] : [[5000000, "₹50 lakh"], [10000000, "₹1 crore"], [20000000, "₹2 crore"], [50000000, "₹5 crore"]]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button className="rounded-xl bg-teal-700 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Search homes</button>
    </form>
  </div>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { InquiryList } from "@/components/dashboard/InquiryList";
import { MyListings } from "@/components/dashboard/MyListings";
import { buttonClasses } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

const TABS = [
  { id: "listings", label: "My listings", detail: "Your property portfolio", icon: "⌂" },
  { id: "received", label: "Received requests", detail: "People interested in your listings", icon: "↙" },
  { id: "sent", label: "Sent requests", detail: "Requests you have made", icon: "↗" },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("listings");

  useEffect(() => {
    const syncTab = () => {
      const next = window.location.hash.slice(1);
      if (TABS.some((tab) => tab.id === next)) setActiveTab(next as (typeof TABS)[number]["id"]);
    };
    const selectTabFromMenu = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (TABS.some((tab) => tab.id === next)) setActiveTab(next as (typeof TABS)[number]["id"]);
    };
    syncTab();
    window.addEventListener("hashchange", syncTab);
    window.addEventListener("popstate", syncTab);
    window.addEventListener("estatehub:dashboard-tab", selectTabFromMenu);
    return () => {
      window.removeEventListener("hashchange", syncTab);
      window.removeEventListener("popstate", syncTab);
      window.removeEventListener("estatehub:dashboard-tab", selectTabFromMenu);
    };
  }, []);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-6xl space-y-7 sm:space-y-9">
        <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-10">
          <div className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-[42px] border-white/[0.06]" aria-hidden />
          <div className="absolute bottom-0 right-24 -z-10 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl" aria-hidden />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">EstateHub · Your workspace</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Good to see you, {user?.name.split(" ")[0] ?? "there"}.</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">Manage your listings and keep every property conversation moving.</p>
              <p className="mt-4 text-xs text-slate-400">Signed in as {user?.email}</p>
            </div>
            <Link href="/dashboard/properties/new" className={`${buttonClasses()} shrink-0 !rounded-xl !bg-white !px-5 !py-3 !text-slate-900 shadow-lg transition hover:!bg-teal-50`}>
              <span aria-hidden className="text-lg leading-none">＋</span> Add a property
            </Link>
          </div>
        </section>

        <div role="tablist" aria-label="Dashboard sections" className="grid gap-2 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm sm:grid-cols-3">
          {TABS.map((tab) => (
            <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => { setActiveTab(tab.id); window.history.replaceState(null, "", `/dashboard#${tab.id}`); }}
              className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition-all sm:px-4 ${activeTab === tab.id ? "bg-teal-50 text-teal-950 ring-1 ring-teal-100" : "text-slate-600 hover:bg-slate-50"}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${activeTab === tab.id ? "bg-teal-800 text-white shadow-sm" : "bg-slate-100 text-slate-500"}`} aria-hidden>{tab.icon}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{tab.label}</span><span className="mt-0.5 hidden truncate text-xs text-slate-500 md:block">{tab.detail}</span></span>
            </button>
          ))}
        </div>

        <div role="tabpanel" className="min-h-64">
          {activeTab === "listings" && <MyListings />}
          {activeTab === "received" && <InquiryList kind="received" />}
          {activeTab === "sent" && <InquiryList kind="sent" />}
        </div>
      </div>
    </RequireAuth>
  );
}

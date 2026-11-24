"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { buttonClasses } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

export function Navbar() {
  const { user, status, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
      toast("success", "You have signed out.");
    } catch {
      toast("error", "Your device was signed out, but the server could not confirm it. Try again when you are back online.");
    }
    setProfileOpen(false);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const closeMenu = () => setMenuOpen(false);
  const selectDashboardTab = (tab: "listings" | "received" | "sent") => {
    setProfileOpen(false);
    closeMenu();
    window.dispatchEvent(new CustomEvent("estatehub:dashboard-tab", { detail: tab }));
  };
  const linkClasses = (active = false) => `rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${active ? "bg-teal-50 text-teal-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900" onClick={closeMenu}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-800 text-white shadow-sm"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11 12 4l9 7M5 10v10h14V10M9 20v-6h6v6" /></svg></span>
          Estate<span className="text-teal-800">Hub</span>
        </Link>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
        </button>

        <nav
          className={`${menuOpen ? "flex" : "hidden"} absolute left-0 right-0 top-full max-h-[calc(100vh-4.5rem)] flex-col gap-1 overflow-y-auto border-b border-slate-200 bg-white p-4 shadow-lg md:static md:max-h-none md:flex md:flex-row md:items-center md:gap-1 md:overflow-visible md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          <Link href="/properties?listingType=sale" className={linkClasses(false)} onClick={closeMenu}>Buy</Link>
          <Link href="/properties?listingType=rent" className={linkClasses(false)} onClick={closeMenu}>Rent</Link>
          <Link href="/properties?propertyType=commercial" className={linkClasses(false)} onClick={closeMenu}>Commercial</Link>
          <Link href="/properties" className={linkClasses(pathname === "/properties")} onClick={closeMenu}>Explore</Link>
          {status === "authenticated" && user ? (
            <>
              <Link href="/dashboard" className={linkClasses(pathname.startsWith("/dashboard"))} onClick={closeMenu}>
                Dashboard
              </Link>
              <Link href="/dashboard/properties/new" className={`${buttonClasses("primary", "sm")} !rounded-xl !px-4 !py-2.5 shadow-sm`} onClick={closeMenu}>
                Post property
              </Link>
              <div ref={profileRef} className="relative" onMouseEnter={() => setProfileOpen(true)} onMouseLeave={() => setProfileOpen(false)}>
                <button ref={profileButtonRef} type="button" aria-haspopup="true" aria-expanded={profileOpen} aria-controls="profile-menu" onClick={() => setProfileOpen(true)} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100 md:w-auto">
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-teal-100 bg-teal-50 text-sm font-bold text-teal-800" aria-hidden>{user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U"}</span>
                  <span className="min-w-0 flex-1 md:max-w-32"><span className="block truncate text-sm font-semibold text-slate-800">{user.name}</span><span className="hidden truncate text-xs text-slate-500 md:block">My account</span></span>
                  <svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                </button>
                {profileOpen && <div className="absolute right-0 top-full z-50 w-[min(19rem,calc(100vw-2rem))] pt-2">
                  <div id="profile-menu" className="overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl" aria-label="Profile menu">
                    <div className="border-b border-slate-100 px-4 py-3"><p className="truncate text-sm font-semibold text-slate-900">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
                    <div className="py-1">
                      <Link href="/profile" onClick={() => { setProfileOpen(false); closeMenu(); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"><ProfileIcon kind="person" />My profile</Link>
                      <Link href="/dashboard#listings" onClick={() => selectDashboardTab("listings")} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"><ProfileIcon kind="home" />My properties</Link>
                      <Link href="/dashboard#received" onClick={() => selectDashboardTab("received")} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"><ProfileIcon kind="inbox" />Inquiries received</Link>
                      <Link href="/dashboard#sent" onClick={() => selectDashboardTab("sent")} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"><ProfileIcon kind="activity" />My inquiries</Link>
                    </div>
                    <div className="border-t border-slate-100 py-1">
                      <Link href="/dashboard/properties/new" onClick={() => { setProfileOpen(false); closeMenu(); }} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-teal-800 transition hover:bg-teal-50"><ProfileIcon kind="plus" />Post a property</Link>
                      <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-red-50 hover:text-red-800"><ProfileIcon kind="logout" />Sign out</button>
                    </div>
                  </div></div>}
              </div>
            </>
          ) : status === "loading" ? (
            <span className="h-8 w-24 animate-pulse rounded-lg bg-slate-100" aria-hidden />
          ) : (
            <>
              <Link href="/login" className={linkClasses(false)} onClick={closeMenu}>
                Log in
              </Link>
              <Link href="/register" className={buttonClasses("primary", "sm")} onClick={closeMenu}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function ProfileIcon({ kind }: { kind: "person" | "home" | "inbox" | "activity" | "plus" | "logout"; }) {
  const paths: Record<typeof kind, string> = {
    person: "M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    home: "m3 10 9-7 9 7M5 9v12h14V9m-9 12v-7h4v7",
    inbox: "M4 4h16v16H4zM4 13h4l2 3h4l2-3h4",
    activity: "M4 19V5m0 14h16M7 15l3-4 3 2 5-7",
    plus: "M12 5v14m-7-7h14",
    logout: "M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6",
  };
  return <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={paths[kind]} /></svg>;
}

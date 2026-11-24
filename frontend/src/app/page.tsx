import Link from "next/link";
import { HomeSearch } from "@/components/properties/HomeSearch";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { serverFetch } from "@/lib/serverApi";
import type { Paginated, PropertyCardData } from "@/lib/types";

export const revalidate = 60;

const CITIES = ["Bengaluru", "Mumbai", "Chennai", "Pune", "Hyderabad", "Delhi"];
const SERVICES = [
  ["01", "Moving & relocation", "Plan a smoother move into your next home."],
  ["02", "Home care", "Find help for cleaning, repairs and everyday upkeep."],
  ["03", "Rent & paperwork", "Get ready for the practical steps around a move."],
];

export default async function HomePage() {
  let latest: PropertyCardData[] = [];
  let loadFailed = false;
  try { latest = (await serverFetch<Paginated<PropertyCardData>>("/api/properties?limit=8", { revalidate: 60 })).data; }
  catch { loadFailed = true; }

  return <div className="space-y-20 pb-8 sm:space-y-24">
    <section className="relative isolate -mx-4 overflow-visible bg-[#f1f6f4] px-4 pb-14 pt-12 sm:-mx-6 sm:px-8 sm:pb-20 sm:pt-16">
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden"><div className="absolute -right-20 -top-36 h-[28rem] w-[28rem] rounded-full bg-teal-100/60 blur-3xl" /><div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-amber-100/50 blur-3xl" /></div>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-900/10 bg-white/75 px-3 py-1.5 text-xs font-semibold tracking-wide text-teal-800"><span className="h-1.5 w-1.5 rounded-full bg-teal-600" />A better way to find your place</p>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl">The right home.<br /><span className="text-teal-800">The right way.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Explore homes listed directly on EstateHub. Search the places you love, compare details and connect with property owners.</p>
        </div>
        <HomeSearch />
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="mr-1 font-medium">Popular cities</span>{CITIES.map((city) => <Link key={city} href={`/properties?q=${encodeURIComponent(city)}`} className="rounded-full border border-slate-200/80 bg-white/75 px-3 py-1.5 transition hover:border-teal-300 hover:text-teal-800">{city}</Link>)}</div>
        <div className="mt-12 grid gap-4 border-t border-teal-900/10 pt-6 sm:grid-cols-3">
          {[["Search with context", "City, locality and property details"], ["Compare with confidence", "Clear specs, pricing and photos"], ["Talk to the owner", "Send an enquiry from the listing"]].map(([title, text]) => <div key={title} className="flex items-start gap-3"><span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-teal-700">✓</span><p className="text-sm font-semibold text-slate-800">{title}<span className="mt-1 block font-normal text-slate-500">{text}</span></p></div>)}
        </div>
      </div>
    </section>

    <section aria-labelledby="latest-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Fresh on EstateHub</p><h2 id="latest-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Recently listed homes</h2><p className="mt-1 text-sm text-slate-500">A first look at the latest properties added by owners.</p></div><Link href="/properties" className="rounded-lg px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50">Explore all homes <span aria-hidden>→</span></Link></div>
      {loadFailed ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Listings are temporarily unavailable. Please try again shortly.</p> : latest.length ? <PropertyGrid properties={latest} /> : <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No listings are available yet. Be the first to <Link href="/dashboard/properties/new" className="font-semibold text-teal-800 underline">post a property</Link>.</p>}
    </section>

    <section className="grid gap-8 rounded-3xl bg-slate-900 p-7 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-10">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-300">For property owners</p><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Your property deserves the right audience.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Create a listing, add photos and manage enquiries from one simple dashboard.</p></div><Link href="/dashboard/properties/new" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-teal-50">Post your property <span className="ml-2">→</span></Link>
    </section>

    <section aria-labelledby="cities-heading"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Start somewhere familiar</p><h2 id="cities-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Explore by city</h2></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{CITIES.map((city, index) => <Link key={city} href={`/properties?q=${encodeURIComponent(city)}`} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-md"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-sm font-bold text-teal-800">{city.slice(0, 1)}</span><span className="mt-5 block font-semibold text-slate-800">{city}</span><span className="mt-1 block text-xs text-slate-500 group-hover:text-teal-700">Browse homes <span aria-hidden>↗</span></span></Link>)}</div></section>

    <section aria-labelledby="services-heading"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Beyond the listing</p><h2 id="services-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Make moving feel simpler</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Helpful next steps for your home journey. Service-provider discovery and bookings are not available yet.</p></div><div className="grid gap-4 md:grid-cols-3">{SERVICES.map(([number, title, description]) => <article key={number} className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-xs font-bold tracking-widest text-teal-700">{number}</span><h3 className="mt-5 font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><span className="mt-4 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">Coming soon</span></article>)}</div></section>
  </div>;
}

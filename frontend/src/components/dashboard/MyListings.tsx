"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/apiError";
import { clientFetch } from "@/lib/clientApi";
import { formatDate, formatPrice, PROPERTY_TYPE_LABELS } from "@/lib/format";
import { propertyPath } from "@/lib/slug";
import type { Paginated, PropertyCardData } from "@/lib/types";
import { useToast } from "@/context/ToastContext";

const PAGE_SIZE = 10;

function ListingCover({ src, title }: { src: string | null; title: string; }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt={title} onError={() => setFailed(true)} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />;
  }
  return <div className="grid h-full place-items-center text-teal-900/30"><svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="m5 22 19-16 19 16M10 19v22h28V19M19 41V27h10v14" /></svg><span className="sr-only">No property photo available</span></div>;
}

export function MyListings() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<PropertyCardData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertyCardData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await clientFetch<Paginated<PropertyCardData>>(`/api/properties/mine?page=${page}&limit=${PAGE_SIZE}`));
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!deleteTarget) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDeleteTarget(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget]);

  async function toggleStatus(property: PropertyCardData) {
    setBusyId(property.id);
    try {
      await clientFetch(`/api/properties/${property.id}`, { method: "PUT", body: { status: property.status === "active" ? "inactive" : "active" } });
      toast("success", property.status === "active" ? "Property hidden from search." : "Property is visible in search again.");
      await load();
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(property: PropertyCardData) {
    setBusyId(property.id);
    try {
      await clientFetch(`/api/properties/${property.id}`, { method: "DELETE" });
      toast("success", "Property deleted successfully.");

      if (result && result.data.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !result) return <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white text-teal-800"><div className="flex items-center gap-3"><Spinner className="h-6 w-6" /><span className="text-sm font-medium text-slate-600">Loading your properties…</span></div></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold tracking-tight text-slate-950">Your property portfolio</h2><p className="mt-1 text-sm text-slate-500">Keep your listings current and easy to discover.</p></div>
        {result && <p className="text-sm font-medium text-slate-500">{result.meta.total?.toLocaleString("en-IN") ?? result.data.length} listings</p>}
      </div>
      {error && <Alert variant="error">{error} <button className="font-semibold underline" onClick={load}>Retry</button></Alert>}

      {result && result.data.length === 0 ? (
        <EmptyState title="No listings yet" message="Post your first property and start receiving inquiries."
          action={<Link href="/dashboard/properties/new" className={buttonClasses()}>Post a property</Link>} />
      ) : (
        <ul className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-60" : ""}`} aria-label="Your listings">
          {result?.data.map((property) => (
            <li key={property.id} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/[0.06]">
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-teal-50">
                <ListingCover src={property.coverImageUrl} title={property.title} />
                <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur ${property.listingType === "sale" ? "bg-white/95 text-teal-900" : "bg-white/95 text-indigo-900"}`}>{property.listingType === "sale" ? "For sale" : "For rent"}</span>
                <span className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${property.status === "active" ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}>{property.status === "active" ? "● Active" : "○ Hidden"}</span>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <p className="text-lg font-semibold tracking-tight text-slate-950">{formatPrice(property.price, property.listingType)}</p>
                  <Link href={propertyPath(property.id, property.title)} className="mt-1 block line-clamp-1 text-sm font-semibold text-slate-800 transition hover:text-teal-800">{property.title}</Link>
                  <p className="mt-1 truncate text-sm text-slate-500">{property.locality}, {property.city}</p>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>{PROPERTY_TYPE_LABELS[property.propertyType]}</span><span>·</span><span>{property.bedrooms > 0 ? `${property.bedrooms} BHK` : "Land"}</span><span>·</span><span>{property.areaSqft.toLocaleString("en-IN")} sq ft</span><span>·</span><span>{formatDate(property.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Link href={`/dashboard/properties/${property.id}/edit`} className={`${buttonClasses("primary", "sm")} flex-1 !rounded-xl`}>Edit listing</Link>
                  <Button size="sm" variant="secondary" className="!rounded-xl" onClick={() => toggleStatus(property)} disabled={busyId === property.id}>
                    {property.status === "active" ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant="ghost" className="!rounded-xl !text-slate-500 hover:!bg-red-50 hover:!text-red-700" onClick={() => setDeleteTarget(property)} disabled={busyId === property.id}>Delete</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {result && (result.meta.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <Button size="sm" variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {page} of {result.meta.totalPages}</span>
          <Button size="sm" variant="secondary" disabled={!result.meta.hasNextPage || loading} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="delete-listing-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-700" aria-hidden><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg></span>
            <h2 id="delete-listing-title" className="mt-4 text-lg font-semibold text-slate-950">Delete this listing?</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">“{deleteTarget.title}” will be permanently removed from your listings.</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" className="!rounded-xl" autoFocus onClick={() => setDeleteTarget(null)}>Keep listing</Button>
              <Button variant="danger" className="!rounded-xl" loading={busyId === deleteTarget.id} onClick={() => { void remove(deleteTarget); setDeleteTarget(null); }}>Delete listing</Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError, errorMessage } from "@/lib/apiError";
import { clientFetch } from "@/lib/clientApi";
import type { PropertyDetailData } from "@/lib/types";

function EditPropertyContent() {
  const { id } = useParams<{ id: string; }>();
  const [property, setProperty] = useState<PropertyDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    clientFetch<{ data: PropertyDetailData; }>(`/api/properties/${id}`)
      .then(({ data }) => {
        if (!data.isOwner) setError("You can only edit your own listings.");
        else setProperty(data);
      })
      .catch((loadError) => setError(loadError instanceof ApiError && loadError.status === 404 ? "Listing not found." : errorMessage(loadError)));
  }, [id]);

  if (error) return <div className="mx-auto max-w-3xl"><Alert variant="error">{error}</Alert></div>;
  if (!property) return <div className="mx-auto grid min-h-64 max-w-4xl place-items-center rounded-2xl border border-slate-200 bg-white text-teal-800"><div className="flex items-center gap-3"><Spinner className="h-6 w-6" /><span className="text-sm font-medium text-slate-600">Loading property details…</span></div></div>;

  return (
    <>
      <PropertyForm mode="edit" property={property} />
    </>
  );
}

export default function EditPropertyPage() {
  return (
    <RequireAuth>
      <EditPropertyContent />
    </RequireAuth>
  );
}

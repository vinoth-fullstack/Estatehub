"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { PropertyForm } from "@/components/properties/PropertyForm";

export default function NewPropertyPage() {
  return (
    <RequireAuth>
      <PropertyForm mode="create" />
    </RequireAuth>
  );
}

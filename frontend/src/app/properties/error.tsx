"use client";

import { Button } from "@/components/ui/Button";

export default function PropertiesError({ reset }: { error: Error; reset: () => void; }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-800">We could not load properties</h2>
      <p className="mt-1 text-sm text-red-700">The server may be busy or unreachable. Please try again.</p>
      <Button className="mt-4" onClick={reset}>Retry</Button>
    </div>
  );
}

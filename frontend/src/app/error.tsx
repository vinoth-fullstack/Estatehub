"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string; }; reset: () => void; }) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-1 text-slate-500">{error.message || "An unexpected error occurred."}</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}

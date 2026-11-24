"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth({ children }: { children: ReactNode; }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status !== "authenticated") {
    return (
      <div className="grid min-h-[40vh] place-items-center text-teal-700">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  return <>{children}</>;
}

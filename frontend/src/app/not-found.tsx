import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl font-extrabold text-teal-700">404</p>
      <h1 className="mt-3 text-xl font-bold">We could not find that page</h1>
      <p className="mt-1 text-slate-500">
        The listing may have been removed or the link is incorrect.
      </p>
      <Link href="/properties" className={`${buttonClasses()} mt-6`}>
        Browse properties
      </Link>
    </div>
  );
}

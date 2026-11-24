import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;

  buildHref: (page: number) => string;
}

function visiblePages(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

const itemClasses = "min-w-9 rounded-lg border px-3 py-1.5 text-center text-sm";

export function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link href={buildHref(currentPage - 1)} className={`${itemClasses} border-slate-300 bg-white hover:bg-slate-50`}>
          Previous
        </Link>
      )}
      {visiblePages(currentPage, totalPages).map((page, index) =>
        page === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`${itemClasses} ${page === currentPage ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white hover:bg-slate-50"}`}
          >
            {page}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link href={buildHref(currentPage + 1)} className={`${itemClasses} border-slate-300 bg-white hover:bg-slate-50`}>
          Next
        </Link>
      )}
    </nav>
  );
}

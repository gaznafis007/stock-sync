interface PaginationControlsProps {
  page: number;
  totalPages: number;
  isLoading: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange: (page: number) => void;
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, 4, '...', totalPages];
  if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', page - 1, page, page + 1, '...', totalPages];
}

export function PaginationControls({
  page,
  totalPages,
  isLoading,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onPageChange,
}: PaginationControlsProps) {
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-600 shrink-0">
        Page {page} of {totalPages}
      </p>
      
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto sm:justify-end">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious || isLoading}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-[var(--ui-radius-lg)] border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>
        
        <div className="flex items-center gap-1 px-1">
          {visiblePages.map((p, index) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400">
                  &hellip;
                </span>
              );
            }
            
            const pageNum = p as number;
            const isActive = pageNum === page;
            
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                disabled={isActive || isLoading}
                className={`inline-flex h-9 min-w-[36px] shrink-0 items-center justify-center rounded-[var(--ui-radius-lg)] text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          className="btn-primary h-9 shrink-0 px-3 text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}

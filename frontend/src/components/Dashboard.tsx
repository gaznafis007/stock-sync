import { useCallback } from 'react';
import type { FormEvent } from 'react';
import { DropCard } from './DropCard';
import { DropCardSkeleton } from './DropCardSkeleton';
import { PaginationControls } from './PaginationControls';
import { getLoadingState, useAppStore } from '../hooks/useAppStore';
import { useDropOperations } from '../hooks/useDropOperations';
import { usePaginatedDrops } from '../hooks/usePaginatedDrops';

export function Dashboard() {
  const { activeReservations, clearReservation } = useAppStore();

  const {
    drops,
    meta,
    isInitialLoading,
    isPageLoading,
    initialLoadError,
    canGoPrevious,
    canGoNext,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    retryInitialLoad,
    resyncCurrentPage,
    handleLocalDropCreated,
  } = usePaginatedDrops();

  const {
    userId,
    loadingByDropAction,
    isCreatingDrop,
    formMessage,
    createDropForm,
    updateCreateDropField,
    handleReserve,
    handlePurchase,
    handleCreateDrop,
  } = useDropOperations({
    onResyncCurrentPage: resyncCurrentPage,
    onCreatedDrop: handleLocalDropCreated,
  });

  const onSubmitCreateDrop = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void handleCreateDrop();
    },
    [handleCreateDrop],
  );

  return (
    <main className="min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="surface-card mb-6 rounded-[var(--ui-radius-xl)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-700/75">
                Real-time inventory
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Stock Sync Dashboard
              </h1>
              <p className="mt-2 break-all text-xs text-slate-600 sm:text-sm">
                Session user: {userId}
              </p>
            </div>
          </div>
        </header>

        <section className="section-card mb-6 rounded-[var(--ui-radius-xl)] p-5 sm:p-6">
          <h2 className="section-title">Add Product</h2>
          <p className="section-subtitle">
            Create a new drop directly from the dashboard.
          </p>

          <form className="mt-4 grid gap-3 sm:grid-cols-6" onSubmit={onSubmitCreateDrop}>
            <label className="form-label sm:col-span-6">
              Product Name
              <input
                type="text"
                value={createDropForm.name}
                onChange={(event) => updateCreateDropField('name', event.target.value)}
                placeholder="e.g. Limited Hoodie"
                className="input-control"
                disabled={isCreatingDrop}
                required
              />
            </label>

            <label className="form-label sm:col-span-2">
              Price
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={createDropForm.price}
                onChange={(event) => updateCreateDropField('price', event.target.value)}
                placeholder="0.00"
                className="input-control"
                disabled={isCreatingDrop}
                required
              />
            </label>

            <label className="form-label sm:col-span-2">
              Total Stock
              <input
                type="number"
                min="1"
                step="1"
                value={createDropForm.totalStock}
                onChange={(event) =>
                  updateCreateDropField('totalStock', event.target.value)
                }
                placeholder="10"
                className="input-control"
                disabled={isCreatingDrop}
                required
              />
            </label>

            <div className="flex items-end sm:col-span-2">
              <button
                type="submit"
                disabled={isCreatingDrop}
                className="btn-primary h-11 w-full px-4 text-sm"
              >
                {isCreatingDrop ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </form>

          <p className={`helper-text mt-3 ${formMessage.type === 'error' ? 'error' : ''}`}>
            {formMessage.text}
          </p>
        </section>

        {isInitialLoading ? (
          <section className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <DropCardSkeleton key={index} />
            ))}
          </section>
        ) : initialLoadError && drops.length === 0 ? (
          <section className="section-card rounded-[var(--ui-radius-xl)] border-rose-200 bg-rose-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              ⚠
            </div>
            <h2 className="text-lg font-semibold text-rose-900">
              Couldn&apos;t load drops
            </h2>
            <p className="mt-2 text-sm text-rose-800/85">{initialLoadError}</p>
            <button
              type="button"
              onClick={() => void retryInitialLoad()}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-[var(--ui-radius-lg)] border border-rose-700 bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              Retry
            </button>
          </section>
        ) : drops.length === 0 ? (
          <section className="section-card rounded-[var(--ui-radius-xl)] p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              ⊕
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              No drops available
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              New merch drops will appear here as soon as they are created.
            </p>
          </section>
        ) : (
          <section className="section-card rounded-[var(--ui-radius-xl)] p-4 sm:p-5">
            <div className={`grid gap-4 sm:grid-cols-2 ${isPageLoading ? 'opacity-70' : ''}`}>
              {drops.map((drop) => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  hasReservation={Boolean(activeReservations[drop.id])}
                  expiresAt={activeReservations[drop.id]}
                  reserveLoading={getLoadingState(
                    loadingByDropAction,
                    drop.id,
                    'reserve',
                  )}
                  purchaseLoading={getLoadingState(
                    loadingByDropAction,
                    drop.id,
                    'purchase',
                  )}
                  onReserve={handleReserve}
                  onPurchase={handlePurchase}
                  onClearReservationLocal={clearReservation}
                />
              ))}
            </div>

            <PaginationControls
              page={meta.page}
              totalPages={meta.totalPages}
              isLoading={isPageLoading}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              onPrevious={() => void goToPreviousPage()}
              onNext={() => void goToNextPage()}
              onPageChange={(p) => void goToPage(p)}
            />
          </section>
        )}
      </div>
    </main>
  );
}

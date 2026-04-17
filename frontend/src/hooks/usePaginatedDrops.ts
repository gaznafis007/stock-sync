import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchDrops, toApiError } from '../services/api';
import { useAppStore } from './useAppStore';
import { useSocket } from './useSocket';
import type {
  Drop,
  DropCreatedPayload,
  PaginationMeta,
  PurchaseCompletePayload,
  ReservationExpiredPayload,
  StockUpdatedPayload,
} from '../types';

export const DROPS_PAGE_SIZE = 4;

function createMeta(page = 1, pageSize = DROPS_PAGE_SIZE): PaginationMeta {
  return {
    page,
    pageSize,
    totalItems: 0,
    totalPages: 1,
  };
}

function getNextTotals(totalItems: number, pageSize: number): {
  totalItems: number;
  totalPages: number;
} {
  const nextTotalItems = Math.max(0, totalItems);
  const nextTotalPages = nextTotalItems === 0 ? 1 : Math.ceil(nextTotalItems / pageSize);
  return {
    totalItems: nextTotalItems,
    totalPages: nextTotalPages,
  };
}

export function usePaginatedDrops() {
  const {
    userId,
    drops,
    setDrops,
    prependDrop,
    updateDropStock,
    appendRecentPurchase,
    setReservation,
    clearReservation,
  } = useAppStore();

  const [meta, setMeta] = useState<PaginationMeta>(() => createMeta());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const localCreatedIdsRef = useRef<Set<string>>(new Set());

  const syncReservationsFromPage = useCallback(
    (items: Drop[]) => {
      items.forEach((drop) => {
        if (drop.userReservationExpiresAt) {
          setReservation(drop.id, drop.userReservationExpiresAt);
        } else {
          clearReservation(drop.id);
        }
      });
    },
    [clearReservation, setReservation],
  );

  const loadPage = useCallback(
    async (targetPage: number, options?: { initial?: boolean; silent?: boolean }) => {
      const initial = options?.initial ?? false;
      const silent = options?.silent ?? false;

      if (initial) {
        setIsInitialLoading(true);
        setInitialLoadError(null);
      } else {
        setIsPageLoading(true);
      }

      try {
        const result = await fetchDrops(userId, targetPage, DROPS_PAGE_SIZE);
        setDrops(result.items);
        syncReservationsFromPage(result.items);
        setMeta(result.meta);
        setInitialLoadError(null);
      } catch (error) {
        const apiError = toApiError(error);
        if (initial && useAppStore.getState().drops.length === 0) {
          setInitialLoadError(apiError.message || 'We could not load drops right now.');
        } else if (!silent) {
          toast.error(apiError.message || 'Failed to load drops.');
        }
      } finally {
        if (initial) {
          setIsInitialLoading(false);
        } else {
          setIsPageLoading(false);
        }
      }
    },
    [setDrops, syncReservationsFromPage, userId],
  );

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const params = new URLSearchParams(window.location.search);
      const initialPage = parseInt(params.get('page') || '1', 10) || 1;
      void loadPage(initialPage, { initial: true });
    }
  }, [loadPage]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get('page') || '1', 10) || 1;
      void loadPage(page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadPage]);

  const resyncCurrentPage = useCallback(async () => {
    await loadPage(meta.page, { silent: true });
  }, [loadPage, meta.page]);

  const handleLocalDropCreated = useCallback(
    (drop: Drop) => {
      localCreatedIdsRef.current.add(drop.id);
      setMeta((prev) => {
        const totals = getNextTotals(prev.totalItems + 1, prev.pageSize);
        return {
          ...prev,
          ...totals,
        };
      });

      if (meta.page === 1) {
        prependDrop(
          {
            ...drop,
            userReservationExpiresAt: undefined,
            recentPurchases: drop.recentPurchases ?? [],
          },
          DROPS_PAGE_SIZE,
        );
      }
    },
    [meta.page, prependDrop],
  );

  const socketHandlers = useMemo(
    () => ({
      onStockUpdated: (payload: StockUpdatedPayload) => {
        updateDropStock(payload.dropId, payload.availableStock);
      },
      onReservationExpired: (payload: ReservationExpiredPayload) => {
        if (payload.userId === userId) {
          clearReservation(payload.dropId);
          toast.error('Reservation expired.');
        }
      },
      onPurchaseComplete: (payload: PurchaseCompletePayload) => {
        appendRecentPurchase(payload.dropId, {
          userId: `purchase-${payload.dropId}-${Date.now()}`,
          username: payload.username,
          createdAt: new Date().toISOString(),
        });
      },
      onDropCreated: (payload: DropCreatedPayload) => {
        const createdLocally = localCreatedIdsRef.current.has(payload.id);
        if (createdLocally) {
          localCreatedIdsRef.current.delete(payload.id);
          if (meta.page === 1) {
            prependDrop(payload, DROPS_PAGE_SIZE);
          }
          return;
        }

        const existsInPage = drops.some((drop) => drop.id === payload.id);
        if (existsInPage) {
          prependDrop(payload, DROPS_PAGE_SIZE);
          return;
        }

        setMeta((prev) => {
          const totals = getNextTotals(prev.totalItems + 1, prev.pageSize);
          return {
            ...prev,
            ...totals,
          };
        });

        if (meta.page === 1) {
          prependDrop(payload, DROPS_PAGE_SIZE);
        }
      },
    }),
    [appendRecentPurchase, clearReservation, drops, meta.page, prependDrop, updateDropStock, userId],
  );

  useSocket(socketHandlers);

  const canGoPrevious = meta.page > 1;
  const canGoNext = meta.page < meta.totalPages;

  const goToPage = useCallback(async (newPage: number) => {
    if (isPageLoading || newPage === meta.page || newPage < 1 || newPage > meta.totalPages) {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    window.history.pushState({}, '', url.toString());
    await loadPage(newPage);
  }, [isPageLoading, loadPage, meta.page, meta.totalPages]);

  const goToPreviousPage = useCallback(async () => {
    if (!canGoPrevious) return;
    await goToPage(meta.page - 1);
  }, [canGoPrevious, goToPage, meta.page]);

  const goToNextPage = useCallback(async () => {
    if (!canGoNext) return;
    await goToPage(meta.page + 1);
  }, [canGoNext, goToPage, meta.page]);

  const retryInitialLoad = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const initialPage = parseInt(params.get('page') || '1', 10) || 1;
    await loadPage(initialPage, { initial: true });
  }, [loadPage]);

  return {
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
  };
}

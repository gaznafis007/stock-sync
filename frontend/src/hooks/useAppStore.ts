import { create } from 'zustand';
import type { Drop, RecentPurchase } from '../types';
import { getOrCreateUserId } from '../services/api';

type LoadingAction = 'reserve' | 'purchase';

interface AppState {
  userId: string;
  drops: Drop[];
  activeReservations: Record<string, string>;
  loadingByDropAction: Record<string, boolean>;
  setDrops: (drops: Drop[]) => void;
  upsertDrop: (drop: Drop) => void;
  prependDrop: (drop: Drop, maxItems: number) => void;
  updateDropStock: (dropId: string, availableStock: number) => void;
  appendRecentPurchase: (dropId: string, purchase: RecentPurchase) => void;
  setReservation: (dropId: string, expiresAt: string) => void;
  clearReservation: (dropId: string) => void;
  setLoading: (dropId: string, action: LoadingAction, value: boolean) => void;
}

function loadingKey(dropId: string, action: LoadingAction): string {
  return `${dropId}:${action}`;
}

export const useAppStore = create<AppState>((set) => ({
  userId: getOrCreateUserId(),
  drops: [],
  activeReservations: {},
  loadingByDropAction: {},
  setDrops: (drops) => set({ drops }),
  upsertDrop: (drop) =>
    set((state) => {
      const exists = state.drops.some((item) => item.id === drop.id);
      if (exists) {
        return {
          drops: state.drops.map((item) => (item.id === drop.id ? drop : item)),
        };
      }
      return { drops: [drop, ...state.drops] };
    }),
  prependDrop: (drop, maxItems) =>
    set((state) => {
      const next = [drop, ...state.drops.filter((item) => item.id !== drop.id)];
      return { drops: next.slice(0, maxItems) };
    }),
  updateDropStock: (dropId, availableStock) =>
    set((state) => ({
      drops: state.drops.map((drop) =>
        drop.id === dropId ? { ...drop, availableStock } : drop,
      ),
    })),
  appendRecentPurchase: (dropId, purchase) =>
    set((state) => ({
      drops: state.drops.map((drop) =>
        drop.id === dropId
          ? {
              ...drop,
              recentPurchases: [purchase, ...drop.recentPurchases].slice(0, 3),
            }
          : drop,
      ),
    })),
  setReservation: (dropId, expiresAt) =>
    set((state) => ({
      activeReservations: { ...state.activeReservations, [dropId]: expiresAt },
    })),
  clearReservation: (dropId) =>
    set((state) => {
      const { [dropId]: _, ...rest } = state.activeReservations;
      return { activeReservations: rest };
    }),
  setLoading: (dropId, action, value) =>
    set((state) => ({
      loadingByDropAction: {
        ...state.loadingByDropAction,
        [loadingKey(dropId, action)]: value,
      },
    })),
}));

export function getLoadingState(
  loadingByDropAction: Record<string, boolean>,
  dropId: string,
  action: LoadingAction,
): boolean {
  return Boolean(loadingByDropAction[loadingKey(dropId, action)]);
}

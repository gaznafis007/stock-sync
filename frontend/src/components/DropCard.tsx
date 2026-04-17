import { ActivityFeed } from './ActivityFeed';
import { CountdownTimer } from './CountdownTimer';
import type { Drop } from '../types';

interface DropCardProps {
  drop: Drop;
  hasReservation: boolean;
  expiresAt?: string;
  reserveLoading: boolean;
  purchaseLoading: boolean;
  onReserve: (dropId: string) => void;
  onPurchase: (dropId: string) => void;
  onClearReservationLocal?: (dropId: string) => void;
}

export function DropCard({
  drop,
  hasReservation,
  expiresAt,
  reserveLoading,
  purchaseLoading,
  onReserve,
  onPurchase,
  onClearReservationLocal,
}: DropCardProps) {
  const soldOut = drop.availableStock <= 0;
  const lowStock = drop.availableStock > 0 && drop.availableStock <= 3;
  const isReservedForMe = hasReservation;
  const stockStatus = isReservedForMe
    ? 'Reserved'
    : soldOut
      ? 'Sold Out'
      : lowStock
        ? 'Low Stock'
        : 'In Stock';
  const baseButtonClass =
    'inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45';

  return (
    <article className="section-card space-y-4 rounded-[var(--ui-radius-xl)] p-5 transition duration-200">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-bold tracking-tight text-slate-900">
            {drop.name}
          </h3>
          <p className="text-sm font-semibold text-slate-600">
            ${Number(drop.price).toFixed(2)}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                isReservedForMe
                  ? 'border border-indigo-200 bg-indigo-50 text-indigo-700'
                  : soldOut
                  ? 'border border-rose-200 bg-rose-50 text-rose-700'
                  : lowStock
                    ? 'border border-amber-200 bg-amber-50 text-amber-700'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {stockStatus}
            </span>
          </div>
        </div>
        {hasReservation && expiresAt && (
          <CountdownTimer
            expiresAt={expiresAt}
            onExpire={() => onClearReservationLocal?.(drop.id)}
          />
        )}
      </header>

      <div className="rounded-[var(--ui-radius-lg)] border border-slate-200/90 bg-slate-50/80 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Available Stock
        </p>
        <p className="text-xl font-bold text-slate-900">{drop.availableStock}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={soldOut || hasReservation || reserveLoading || purchaseLoading}
          onClick={() => onReserve(drop.id)}
          className={`${baseButtonClass} btn-primary`}
        >
          {reserveLoading ? 'Reserving...' : 'Reserve'}
        </button>
        <button
          type="button"
          disabled={!hasReservation || purchaseLoading || reserveLoading}
          onClick={() => onPurchase(drop.id)}
          className={`${baseButtonClass} btn-secondary`}
        >
          {purchaseLoading ? 'Purchasing...' : 'Complete Purchase'}
        </button>
      </div>

      <ActivityFeed recentPurchases={drop.recentPurchases} />
    </article>
  );
}

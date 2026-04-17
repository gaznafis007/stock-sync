import type { RecentPurchase } from '../types';

interface ActivityFeedProps {
  recentPurchases: RecentPurchase[];
}

export function ActivityFeed({ recentPurchases }: ActivityFeedProps) {
  return (
    <div className="rounded-[var(--ui-radius-lg)] border border-slate-200/80 bg-slate-50/80 p-3 text-sm">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Recent purchasers
      </h4>
      {recentPurchases.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No purchases yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {recentPurchases.map((item) => (
            <li
              key={`${item.userId}-${item.createdAt}`}
              className="flex items-center gap-2 text-slate-700"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                {item.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate">{item.username}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

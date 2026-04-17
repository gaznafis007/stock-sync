import { useEffect, useRef, useState } from 'react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const difference = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(difference / 1000));
  });

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const end = new Date(expiresAt).getTime();
      const difference = end - now;
      const remaining = Math.max(0, Math.ceil(difference / 1000));

      setTimeLeft(remaining);

      if (difference <= 0) {
        clearInterval(timer);
        onExpireRef.current?.();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft > 0 && timeLeft <= 10;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
        isUrgent
          ? 'border border-amber-200 bg-amber-50 text-amber-700'
          : 'border border-indigo-200 bg-indigo-50 text-indigo-700'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isUrgent ? 'animate-pulse bg-amber-500' : 'bg-indigo-500'
        }`}
      />
      <span>
        {timeLeft > 0
          ? `Reserved: ${minutes}:${seconds.toString().padStart(2, '0')}`
          : 'Expiring...'}
      </span>
    </div>
  );
}

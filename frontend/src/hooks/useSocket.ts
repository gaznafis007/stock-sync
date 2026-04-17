import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  DropCreatedPayload,
  PurchaseCompletePayload,
  ReservationExpiredPayload,
  StockUpdatedPayload,
} from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

let socketInstance: Socket | null = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      randomizationFactor: 0.2,
      autoConnect: false,
    });
  }
  return socketInstance;
}

interface UseSocketHandlers {
  onStockUpdated: (payload: StockUpdatedPayload) => void;
  onReservationExpired: (payload: ReservationExpiredPayload) => void;
  onPurchaseComplete: (payload: PurchaseCompletePayload) => void;
  onDropCreated: (payload: DropCreatedPayload) => void;
}

export function useSocket(handlers: UseSocketHandlers): void {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    const handleStockUpdated = (payload: StockUpdatedPayload) => {
      handlersRef.current.onStockUpdated(payload);
    };

    const handleReservationExpired = (payload: ReservationExpiredPayload) => {
      handlersRef.current.onReservationExpired(payload);
    };

    const handlePurchaseComplete = (payload: PurchaseCompletePayload) => {
      handlersRef.current.onPurchaseComplete(payload);
    };

    const handleDropCreated = (payload: DropCreatedPayload) => {
      handlersRef.current.onDropCreated(payload);
    };

    socket.on('stock-updated', handleStockUpdated);
    socket.on('reservation-expired', handleReservationExpired);
    socket.on('purchase-complete', handlePurchaseComplete);
    socket.on('drop-created', handleDropCreated);

    return () => {
      socket.off('stock-updated', handleStockUpdated);
      socket.off('reservation-expired', handleReservationExpired);
      socket.off('purchase-complete', handlePurchaseComplete);
      socket.off('drop-created', handleDropCreated);
    };
  }, []);
}

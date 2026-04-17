export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'SOLD_OUT'
  | 'DROP_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'ALREADY_RESERVED'
  | 'NO_ACTIVE_RESERVATION'
  | 'INTERNAL_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export interface StockUpdatedPayload {
  dropId: string;
  availableStock: number;
  reserved: number;
}

export interface ReservationExpiredPayload {
  dropId: string;
  userId: string;
}

export interface PurchaseCompletePayload {
  dropId: string;
  username: string;
}

export interface DropCreatedPayload {
  id: string;
  name: string;
  price: number;
  totalStock: number;
  availableStock: number;
  userReservationExpiresAt?: string;
  recentPurchases: Array<{
    userId: string;
    username: string;
    createdAt: Date;
  }>;
}

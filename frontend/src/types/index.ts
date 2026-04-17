export interface RecentPurchase {
  userId: string;
  username: string;
  createdAt: string;
}

export interface Drop {
  id: string;
  name: string;
  price: number;
  totalStock: number;
  availableStock: number;
  userReservationExpiresAt?: string;
  recentPurchases: RecentPurchase[];
}

export interface CreateDropInput {
  name: string;
  price: number;
  totalStock: number;
}

export interface Reservation {
  id: string;
  userId: string;
  dropId: string;
  expiresAt: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedDropsResponse {
  items: Drop[];
  meta: PaginationMeta;
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

export type DropCreatedPayload = Drop;

import type {
  ApiError,
  CreateDropInput,
  Drop,
  PaginatedDropsResponse,
  Reservation,
} from '../types';
import { API_URL } from '../config/endpoints';

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });

    const contentType = response.headers.get('content-type') ?? '';
    const hasJson = contentType.includes('application/json');
    const payload = hasJson ? ((await response.json()) as unknown) : undefined;

    if (!response.ok) {
      if (
        payload &&
        typeof payload === 'object' &&
        'code' in payload &&
        'message' in payload
      ) {
        return { ok: false, error: payload as ApiError };
      }

      return {
        ok: false,
        error: {
          code: 'HTTP_ERROR',
          message: `Request failed with status ${response.status}.`,
        },
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message:
          error instanceof Error ? error.message : 'Network request failed.',
      },
    };
  }
}

export function getOrCreateUserId(): string {
  const key = 'stock-sync-user-id';
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const generated = crypto.randomUUID();
  localStorage.setItem(key, generated);
  return generated;
}

export async function fetchDrops(
  userId?: string,
  page = 1,
  pageSize = 4,
): Promise<PaginatedDropsResponse> {
  const params = new URLSearchParams();
  if (userId) {
    params.set('userId', userId);
  }
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  const result = await request<PaginatedDropsResponse>(`/drops?${params.toString()}`);
  if (result.ok === false) {
    throw result.error;
  }
  return result.data;
}

export async function reserveDrop(input: {
  userId: string;
  dropId: string;
}): Promise<Reservation> {
  const result = await request<Reservation>('/reserve', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok === false) {
    throw result.error;
  }
  return result.data;
}

export async function createDrop(input: CreateDropInput): Promise<Drop> {
  const result = await request<Drop>('/drops', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok === false) {
    throw result.error;
  }
  return result.data;
}

export async function purchaseDrop(input: {
  userId: string;
  dropId: string;
}): Promise<void> {
  const result = await request<unknown>('/purchase', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (result.ok === false) {
    throw result.error;
  }
}

export function toApiError(error: unknown): ApiError {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error
  ) {
    return error as ApiError;
  }
  return {
    code: 'INTERNAL_ERROR',
    message: 'Unexpected error.',
  };
}

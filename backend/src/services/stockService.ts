import { Drop } from '../models/index.js';
import type { StockUpdatedPayload } from '../types/index.js';

export function createStockPayload(drop: Drop): StockUpdatedPayload {
  return {
    dropId: drop.id,
    availableStock: drop.availableStock,
    reserved: Math.max(drop.totalStock - drop.availableStock, 0),
  };
}

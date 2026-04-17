import type { CreateDropInput } from '../types';

export interface CreateDropFormValues {
  name: string;
  price: string;
  totalStock: string;
}

type CreateDropValidationResult =
  | { ok: true; input: CreateDropInput }
  | { ok: false; message: string };

export function validateCreateDrop(
  values: CreateDropFormValues,
): CreateDropValidationResult {
  const name = values.name.trim();
  const price = Number(values.price);
  const totalStock = Number(values.totalStock);

  if (!name) {
    return { ok: false, message: 'Product name is required.' };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, message: 'Price must be a number greater than 0.' };
  }

  if (!Number.isInteger(totalStock) || totalStock <= 0) {
    return {
      ok: false,
      message: 'Total stock must be a whole number greater than 0.',
    };
  }

  return {
    ok: true,
    input: {
      name,
      price,
      totalStock,
    },
  };
}

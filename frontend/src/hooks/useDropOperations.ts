import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createDrop as createDropApi,
  purchaseDrop as purchaseDropApi,
  reserveDrop as reserveDropApi,
  toApiError,
} from '../services/api';
import { useAppStore } from './useAppStore';
import {
  type CreateDropFormValues,
  validateCreateDrop,
} from '../utils/createDropValidation';
import type { Drop } from '../types';

const DEFAULT_FORM_MESSAGE = {
  type: 'info' as const,
  text: 'Name should be clear, price > 0, stock should be a whole number.',
};

type FormMessage = {
  type: 'info' | 'error' | 'success';
  text: string;
};

interface UseDropOperationsInput {
  onResyncCurrentPage: () => Promise<void>;
  onCreatedDrop: (drop: Drop) => void;
}

export function useDropOperations(input: UseDropOperationsInput) {
  const { onResyncCurrentPage, onCreatedDrop } = input;
  const {
    userId,
    setLoading,
    setReservation,
    clearReservation,
    loadingByDropAction,
  } = useAppStore();

  const [isCreatingDrop, setIsCreatingDrop] = useState(false);
  const [formMessage, setFormMessage] = useState<FormMessage>(DEFAULT_FORM_MESSAGE);
  const [createDropForm, setCreateDropForm] = useState<CreateDropFormValues>({
    name: '',
    price: '',
    totalStock: '',
  });

  const updateCreateDropField = useCallback(
    (field: keyof CreateDropFormValues, value: string) => {
      setCreateDropForm((state) => ({ ...state, [field]: value }));
      setFormMessage(DEFAULT_FORM_MESSAGE);
    },
    [],
  );

  const resetCreateDropForm = useCallback(() => {
    setCreateDropForm({ name: '', price: '', totalStock: '' });
  }, []);

  const handleReserve = useCallback(
    async (dropId: string) => {
      setLoading(dropId, 'reserve', true);
      try {
        const reservation = await reserveDropApi({ userId, dropId });
        setReservation(dropId, reservation.expiresAt);
        toast.success('Reservation successful.');
      } catch (error) {
        const apiError = toApiError(error);
        if (apiError.code === 'ALREADY_RESERVED') {
          toast('Item already reserved.');
          await onResyncCurrentPage();
        } else {
          toast.error(apiError.message);
        }
      } finally {
        setLoading(dropId, 'reserve', false);
      }
    },
    [onResyncCurrentPage, setLoading, setReservation, userId],
  );

  const handlePurchase = useCallback(
    async (dropId: string) => {
      setLoading(dropId, 'purchase', true);
      try {
        await purchaseDropApi({ userId, dropId });
        clearReservation(dropId);
        toast.success('Purchase complete.');
      } catch (error) {
        const apiError = toApiError(error);
        toast.error(apiError.message);
      } finally {
        setLoading(dropId, 'purchase', false);
      }
    },
    [clearReservation, setLoading, userId],
  );

  const handleCreateDrop = useCallback(async () => {
    const validation = validateCreateDrop(createDropForm);

    if (validation.ok === false) {
      setFormMessage({ type: 'error', text: validation.message });
      toast.error(validation.message);
      return false;
    }

    setIsCreatingDrop(true);
    try {
      const createdDrop = await createDropApi(validation.input);
      onCreatedDrop({
        ...createdDrop,
        userReservationExpiresAt: undefined,
        recentPurchases: createdDrop.recentPurchases ?? [],
      });
      setFormMessage({
        type: 'success',
        text: `Added "${validation.input.name}" successfully.`,
      });
      toast.success('Product added successfully.');
      resetCreateDropForm();
      return true;
    } catch (error) {
      const apiError = toApiError(error);
      setFormMessage({ type: 'error', text: apiError.message });
      toast.error(apiError.message);
      return false;
    } finally {
      setIsCreatingDrop(false);
    }
  }, [createDropForm, onCreatedDrop, resetCreateDropForm]);

  return {
    userId,
    loadingByDropAction,
    isCreatingDrop,
    formMessage,
    createDropForm,
    updateCreateDropField,
    handleReserve,
    handlePurchase,
    handleCreateDrop,
  };
}

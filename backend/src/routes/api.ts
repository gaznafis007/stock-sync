import { Router } from 'express';
import type { Server } from 'socket.io';
import { logger } from '../logger.js';
import { Drop, Purchase, Reservation, User } from '../models/index.js';
import {
  ServiceError,
  cleanupExpiredReservations,
  purchaseDrop,
  reserveDrop,
} from '../services/reservationService.js';
import type { DropCreatedPayload } from '../types/index.js';

function parseNumber(input: unknown): number {
  if (typeof input === 'number') return input;
  if (typeof input === 'string') return Number(input);
  return Number.NaN;
}

function parsePositiveInt(
  input: unknown,
  fallback: number,
  max?: number,
): number {
  const parsed = parseNumber(input);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  if (typeof max === 'number' && parsed > max) {
    return max;
  }
  return parsed;
}

export function createApiRouter(io: Server): Router {
  const router = Router();

  router.post('/drops', async (req, res) => {
    try {
      const { name, price, totalStock } = req.body as {
        name?: string;
        price?: number | string;
        totalStock?: number | string;
      };

      const normalizedPrice = parseNumber(price);
      const normalizedTotalStock = parseNumber(totalStock);
      const trimmedName = name?.trim();

      logger.info(
        `Create drop requested: name="${trimmedName ?? ''}", price="${String(
          price ?? '',
        )}", totalStock="${String(totalStock ?? '')}"`,
      );

      if (
        !trimmedName ||
        !Number.isFinite(normalizedPrice) ||
        !Number.isInteger(normalizedTotalStock) ||
        normalizedTotalStock <= 0
      ) {
        logger.warn('Create drop rejected: invalid name, price, or totalStock');
        return res.status(400).json({
          code: 'BAD_REQUEST',
          message: 'name, price and totalStock are required.',
        });
      }

      const drop = await Drop.create({
        name: trimmedName,
        price: normalizedPrice,
        totalStock: normalizedTotalStock,
        availableStock: normalizedTotalStock,
      });

      const createdDropPayload = {
        id: drop.id,
        name: drop.name,
        price: drop.price,
        totalStock: drop.totalStock,
        availableStock: drop.availableStock,
        recentPurchases: [],
      } satisfies DropCreatedPayload;

      io.emit('drop-created', createdDropPayload);
      logger.success(`Create drop success: dropId=${drop.id}`);

      return res.status(201).json(drop);
    } catch (error) {
      logger.error(
        `Create drop failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to create drop.',
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  router.get('/drops', async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const page = parsePositiveInt(req.query.page, 1);
      const pageSize = parsePositiveInt(req.query.pageSize, 4, 50);
      const offset = (page - 1) * pageSize;

      logger.info(
        `Fetch drops requested: page=${page}, pageSize=${pageSize}, userId=${userId ?? 'none'}`,
      );

      await cleanupExpiredReservations(io);

      const [totalItems, drops, userReservations] = await Promise.all([
        Drop.count(),
        Drop.findAll({
          order: [['createdAt', 'DESC']],
          limit: pageSize,
          offset,
          include: [
            {
              model: Purchase,
              as: 'purchases',
              include: [{ model: User, as: 'user', attributes: ['username'] }],
              order: [['createdAt', 'DESC']],
              limit: 3,
              separate: true,
            },
          ],
        }),
        userId
          ? Reservation.findAll({ where: { userId } })
          : Promise.resolve([]),
      ]);

      const reservationMap = new Map(
        userReservations.map((r) => [r.dropId, r.expiresAt.toISOString()]),
      );

      const items = drops.map((drop) => ({
        id: drop.id,
        name: drop.name,
        price: drop.price,
        totalStock: drop.totalStock,
        availableStock: drop.availableStock,
        userReservationExpiresAt: reservationMap.get(drop.id),
        recentPurchases: (drop.purchases ?? []).map((purchase) => ({
          userId: purchase.userId,
          username: purchase.user?.username ?? 'unknown',
          createdAt: purchase.createdAt,
        })),
      }));

      const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);

      logger.debug(
        `Fetch drops result: page=${page}, pageSize=${pageSize}, totalItems=${totalItems}, returned=${items.length}`,
      );

      return res.json({
        items,
        meta: {
          page,
          pageSize,
          totalItems,
          totalPages,
        },
      });
    } catch (error) {
      logger.error(
        `Fetch drops failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch drops.',
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  router.post('/reserve', async (req, res) => {
    try {
      const { userId, dropId, username } = req.body as {
        userId?: string;
        dropId?: string;
        username?: string;
      };

      if (!userId || !dropId) {
        return res.status(400).json({
          code: 'BAD_REQUEST',
          message: 'userId and dropId are required.',
        });
      }

      const result = await reserveDrop({ userId, dropId, username, io });
      return res.status(201).json({
        id: result.reservation.id,
        userId: result.reservation.userId,
        dropId: result.reservation.dropId,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.status).json({
          code: error.code,
          message: error.message,
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to reserve item.',
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  router.post('/purchase', async (req, res) => {
    try {
      const { userId, dropId } = req.body as {
        userId?: string;
        dropId?: string;
      };

      if (!userId || !dropId) {
        return res.status(400).json({
          code: 'BAD_REQUEST',
          message: 'userId and dropId are required.',
        });
      }

      const result = await purchaseDrop({ userId, dropId, io });
      return res.status(201).json({
        id: result.purchase.id,
        userId: result.purchase.userId,
        dropId: result.purchase.dropId,
        username: result.username,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.status).json({
          code: error.code,
          message: error.message,
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Failed to complete purchase.',
        details: error instanceof Error ? error.message : undefined,
      });
    }
  });

  return router;
}

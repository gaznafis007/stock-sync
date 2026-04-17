import { Op, Transaction } from 'sequelize';
import type { Server } from 'socket.io';
import { sequelize } from '../database.js';
import { Drop, Purchase, Reservation, User } from '../models/index.js';
import type {
  ApiErrorCode,
  PurchaseCompletePayload,
  ReservationExpiredPayload,
} from '../types/index.js';
import { createStockPayload } from './stockService.js';

const TTL_SECONDS = parseInt(process.env.RESERVATION_TTL_SECONDS || '60', 10);

export class ServiceError extends Error {
  code: ApiErrorCode;
  status: number;

  constructor(code: ApiErrorCode, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function ensureUser(
  userId: string,
  username: string | undefined,
  transaction: Transaction,
): Promise<User> {
  const fallbackName = `user-${userId.slice(0, 8)}`;
  const [user] = await User.findOrCreate({
    where: { id: userId },
    defaults: { id: userId, username: username ?? fallbackName },
    transaction,
  });

  if (username && user.username !== username) {
    user.username = username;
    await user.save({ transaction });
  }

  return user;
}

export async function cleanupExpiredReservations(
  io?: Server,
): Promise<ReservationExpiredPayload[]> {
  return sequelize.transaction(async (transaction) => {
    const now = new Date();
    const expired = await Reservation.findAll({
      where: { expiresAt: { [Op.lt]: now } },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!expired.length) {
      return [];
    }

    const droppedById = new Map<string, Drop>();
    for (const item of expired) {
      const drop = await Drop.findByPk(item.dropId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!drop) {
        continue;
      }

      drop.availableStock = Math.min(drop.availableStock + 1, drop.totalStock);
      await drop.save({ transaction });
      droppedById.set(drop.id, drop);
    }

    await Reservation.destroy({
      where: { id: expired.map((item) => item.id) },
      transaction,
    });

    if (io) {
      for (const drop of droppedById.values()) {
        io.emit('stock-updated', createStockPayload(drop));
      }

      for (const item of expired) {
        io.emit('reservation-expired', {
          dropId: item.dropId,
          userId: item.userId,
        } satisfies ReservationExpiredPayload);
      }
    }

    return expired.map((item) => ({ dropId: item.dropId, userId: item.userId }));
  });
}

export async function reserveDrop(input: {
  userId: string;
  dropId: string;
  username?: string;
  io?: Server;
}): Promise<{
  reservation: Reservation;
  drop: Drop;
  expiresAt: Date;
}> {
  const { userId, dropId, username, io } = input;
  await cleanupExpiredReservations(io);

  return sequelize.transaction(async (transaction) => {
    const user = await ensureUser(userId, username, transaction);

    const existing = await Reservation.findOne({
      where: { userId: user.id, dropId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existing) {
      throw new ServiceError(
        'ALREADY_RESERVED',
        'User already has an active reservation for this drop.',
        409,
      );
    }

    const drop = await Drop.findByPk(dropId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!drop) {
      throw new ServiceError('DROP_NOT_FOUND', 'Drop not found.', 404);
    }
    if (drop.availableStock <= 0) {
      throw new ServiceError('SOLD_OUT', 'Item sold out.', 409);
    }

    drop.availableStock -= 1;
    await drop.save({ transaction });

    const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);
    const reservation = await Reservation.create(
      { userId: user.id, dropId: drop.id, expiresAt },
      { transaction },
    );

    io?.emit('stock-updated', createStockPayload(drop));

    return { reservation, drop, expiresAt };
  });
}

export async function purchaseDrop(input: {
  userId: string;
  dropId: string;
  io?: Server;
}): Promise<{ purchase: Purchase; drop: Drop; username: string }> {
  const { userId, dropId, io } = input;
  await cleanupExpiredReservations(io);

  return sequelize.transaction(async (transaction) => {
    const reservation = await Reservation.findOne({
      where: { userId, dropId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!reservation) {
      throw new ServiceError(
        'NO_ACTIVE_RESERVATION',
        'No active reservation found.',
        409,
      );
    }

    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw new ServiceError('USER_NOT_FOUND', 'User not found.', 404);
    }

    const drop = await Drop.findByPk(dropId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!drop) {
      throw new ServiceError('DROP_NOT_FOUND', 'Drop not found.', 404);
    }

    const purchase = await Purchase.create({ userId, dropId }, { transaction });
    await reservation.destroy({ transaction });

    io?.emit('purchase-complete', {
      dropId: drop.id,
      username: user.username,
    } satisfies PurchaseCompletePayload);
    io?.emit('stock-updated', createStockPayload(drop));

    return { purchase, drop, username: user.username };
  });
}

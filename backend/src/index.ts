import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { connectDatabase, sequelize } from './database.js';
import { logger } from './logger.js';
import './models/index.js';
import { createApiRouter } from './routes/api.js';
import { cleanupExpiredReservations } from './services/reservationService.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST'],
  },
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? '*',
  }),
);
app.use(express.json());

app.use('/api', (req, res, next) => {
  const startedAt = Date.now();

  logger.info(`API ${req.method} ${req.originalUrl} started`);

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    const msg = `API ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`;

    if (res.statusCode >= 500) {
      logger.error(msg);
      return;
    }
    if (res.statusCode >= 400) {
      logger.warn(msg);
      return;
    }
    if (res.statusCode >= 200 && res.statusCode < 300) {
      logger.success(msg);
      return;
    }
    logger.info(msg);
  });

  next();
});

app.get('/', (_req, res) => {
  res.redirect('/api');
});

app.get('/api', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'stock-sync-api',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', createApiRouter(io));

io.on('connection', (socket) => {
  logger.info(
    `Socket connected: id=${socket.id}, transport=${socket.conn.transport.name}`,
  );

  socket.conn.on('upgrade', (transport) => {
    logger.success(
      `Socket upgraded to transport=${transport.name} for id=${socket.id}`,
    );
  });

  socket.on('disconnect', (reason) => {
    logger.warn(`Socket disconnected: id=${socket.id}, reason=${reason}`);
  });

  socket.emit('connected', { ok: true });
});

const port = Number(process.env.PORT ?? 5000);
const cleanupIntervalMs = Number(process.env.CLEANUP_INTERVAL_MS ?? 5000);

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await sequelize.sync();

  let cleanupRunning = false;
  const interval = setInterval(async () => {
    if (cleanupRunning) return;
    cleanupRunning = true;
    try {
      await cleanupExpiredReservations(io);
    } catch (error) {
      logger.error(
        `Reservation cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      cleanupRunning = false;
    }
  }, cleanupIntervalMs);

  interval.unref();

  server.listen(port, () => {
    logger.success(`Backend is running on http://localhost:${port}`);
  });
}

bootstrap().catch((error: unknown) => {
  logger.error(
    `Failed to start backend: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
});

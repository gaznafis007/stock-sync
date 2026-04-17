import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

// Load env vars from backend/.env
dotenv.config({ path: '.env' });

function buildDatabaseUrl(): { url: string; servername?: string } {
  const raw = process.env.DATABASE_URL ?? '';
  if (!raw) {
    return { url: '' };
  }

  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname;
    const hostaddr = process.env.DATABASE_HOSTADDR;

    if (hostaddr) {
      parsed.hostname = hostaddr;
      // Preserve original hostname for TLS SNI when connecting by IP.
      return { url: parsed.toString(), servername: hostname };
    }

    return { url: raw };
  } catch {
    return { url: raw };
  }
}

const built = buildDatabaseUrl();

export const sequelize = new Sequelize(built.url, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: built.servername
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
          servername: built.servername,
        },
      }
    : undefined,
});

export async function connectDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required. Create backend/.env (copy from backend/.env.example) and set DATABASE_URL.',
    );
  }
  await sequelize.authenticate();
}

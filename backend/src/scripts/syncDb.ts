import dotenv from 'dotenv';
import { connectDatabase, sequelize } from '../database.js';
import '../models/index.js';

dotenv.config();

async function main(): Promise<void> {
  await connectDatabase();
  await sequelize.sync();
  await sequelize.close();
  console.log('Database tables are synced.');
}

main().catch((error: unknown) => {
  console.error('Failed to sync database tables.', error);
  process.exit(1);
});

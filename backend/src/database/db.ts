import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined!');
  console.error('Current env:', process.env);
  throw new Error('DATABASE_URL environment variable is required');
}

console.log('✅ Database connection string loaded:', connectionString.replace(/:[^:]*@/, ':****@'));

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
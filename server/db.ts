import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

// Configure neon to use fetch
neonConfig.fetchConnectionCache = true;

// Create a SQL database connection
const sql = neon(process.env.DATABASE_URL!);

// Create a Drizzle instance with our schema
export const db = drizzle(sql, { schema });
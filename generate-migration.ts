import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from './shared/schema';

// Configure neon to use fetch
neonConfig.fetchConnectionCache = true;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('Generating migration...');
  
  // Create a SQL database connection
  const sql = neon(process.env.DATABASE_URL);
  
  // Create a Drizzle instance with our schema
  const db = drizzle(sql, { schema });

  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

main();
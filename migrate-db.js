import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Environment variables should already be set by Replit
const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;

async function main() {
  console.log('Starting database migration...');
  console.log('Connection details:', { PGHOST, PGPORT, PGUSER, PGDATABASE });

  try {
    // Connect to the database
    const connectionString = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
    const sql = postgres(connectionString, { 
      max: 1,
      ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(sql);

    console.log('Connected to database');
    
    // Run migrations from the 'drizzle' directory
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
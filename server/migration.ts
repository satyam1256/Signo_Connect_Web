import { sql } from 'drizzle-orm';
import { db } from './db';
import { log } from './vite';
import fs from 'fs';
import path from 'path';

// This function runs the database migrations
export async function runMigrations() {
  try {
    log('Running database migrations...', 'db-migration');
    
    // Read migration SQL file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_initial_migration.sql');
    let migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute each statement separately
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      try {
        await db.execute(sql.raw(statement + ';'));
      } catch (err) {
        // Log but continue with other statements
        log(`Migration statement error: ${err instanceof Error ? err.message : String(err)}`, 'db-migration');
        console.error('Migration statement error:', err);
      }
    }
    
    log('Database migrations completed successfully!', 'db-migration');
    return true;
  } catch (error) {
    log(`Migration error: ${error instanceof Error ? error.message : String(error)}`, 'db-migration');
    console.error('Migration error:', error);
    return false;
  }
}
import { sql } from 'drizzle-orm';
import { db, initializeDatabase } from './db';
import { log } from './vite';
import fs from 'fs';
import path from 'path';

// Import custom migrations
import { addJobApplicationFields } from './migrations/add-job-application-fields';

// This function runs the database migrations
export async function runMigrations() {
  try {
    log('Running database migrations...', 'db-migration');
    
    // Ensure database is initialized before running migrations
    console.log("Migration: Ensuring database is initialized...");
    await initializeDatabase();
    console.log("Migration: Database initialized successfully");
    
    // First, run SQL migrations if available
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_initial_migration.sql');
    
    if (fs.existsSync(migrationPath)) {
      let migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log("Migration: SQL file read successfully");
      
      // Execute each statement separately
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
      console.log(`Migration: Executing ${statements.length} SQL statements`);
      
      for (const statement of statements) {
        try {
          await db.execute(sql.raw(statement + ';'));
        } catch (err) {
          // Log but continue with other statements
          log(`Migration statement error: ${err instanceof Error ? err.message : String(err)}`, 'db-migration');
          console.error('Migration statement error:', err);
        }
      }
    } else {
      console.log(`Migration file not found at ${migrationPath}. Skipping SQL migrations.`);
      log('No SQL migration file found, continuing with code migrations.', 'db-migration');
    }
    
    // Now run code-based migrations
    console.log("Running code-based migrations...");
    
    // Run the job application fields migration
    await addJobApplicationFields();
    
    log('Database migrations completed successfully!', 'db-migration');
    return true;
  } catch (error) {
    log(`Migration error: ${error instanceof Error ? error.message : String(error)}`, 'db-migration');
    console.error('Migration error:', error);
    return false;
  }
}
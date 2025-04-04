import { initializeDatabase } from './db';
import { addProfileFields } from './migrations/add-profile-fields';

async function runMigrations() {
  console.log("Starting database migrations...");
  
  try {
    // Initialize database connection first
    await initializeDatabase();
    
    // Run migrations in sequence
    await addProfileFields();
    
    console.log("All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
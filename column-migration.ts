import { sql } from 'drizzle-orm';
import { db } from './server/db';
import { log } from './server/vite';

// This function adds our new columns to the database
export async function addMissingColumns() {
  try {
    log('Adding missing columns to database...', 'db-migration');
    
    // Define all the alter table statements
    const alterStatements = [
      // Driver columns
      `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_image TEXT`,
      `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS about TEXT`,
      `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS location TEXT`,
      `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS availability TEXT`,
      `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS skills TEXT[]`,
      
      // Fleet owner columns
      `ALTER TABLE fleet_owners ADD COLUMN IF NOT EXISTS profile_image TEXT`,
      `ALTER TABLE fleet_owners ADD COLUMN IF NOT EXISTS about TEXT`,
      `ALTER TABLE fleet_owners ADD COLUMN IF NOT EXISTS location TEXT`,
      `ALTER TABLE fleet_owners ADD COLUMN IF NOT EXISTS business_type TEXT`,
      `ALTER TABLE fleet_owners ADD COLUMN IF NOT EXISTS reg_number TEXT`
    ];
    
    // Execute each statement separately
    for (const statement of alterStatements) {
      try {
        await db.execute(sql.raw(statement));
        log(`Executed: ${statement}`, 'db-migration');
      } catch (err) {
        // Log but continue with other statements
        log(`Migration statement error: ${err instanceof Error ? err.message : String(err)}`, 'db-migration');
        console.error('Migration statement error:', err);
      }
    }
    
    log('Database column additions completed successfully!', 'db-migration');
    return true;
  } catch (error) {
    log(`Migration error: ${error instanceof Error ? error.message : String(error)}`, 'db-migration');
    console.error('Migration error:', error);
    return false;
  }
}

// Run the migration
addMissingColumns().then(success => {
  if (success) {
    console.log('Column migration completed successfully!');
  } else {
    console.error('Column migration failed!');
  }
});
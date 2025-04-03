import { sql } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

async function runMigration() {
  try {
    console.log('Starting migration...');
    const client = sql(process.env.DATABASE_URL);
    const db = drizzle(client);

    // Check if columns exist in drivers table
    const driversColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' AND 
      column_name IN ('profile_image', 'about', 'location', 'availability', 'skills')
    `);

    // Add missing columns to drivers table
    if (driversColumns.rows.length < 5) {
      console.log('Adding missing columns to drivers table...');
      
      if (!driversColumns.rows.find(row => row.column_name === 'profile_image')) {
        await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_image TEXT`);
        console.log('- Added profile_image column');
      }
      
      if (!driversColumns.rows.find(row => row.column_name === 'about')) {
        await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS about TEXT`);
        console.log('- Added about column');
      }
      
      if (!driversColumns.rows.find(row => row.column_name === 'location')) {
        await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS location TEXT`);
        console.log('- Added location column');
      }
      
      if (!driversColumns.rows.find(row => row.column_name === 'availability')) {
        await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS availability TEXT`);
        console.log('- Added availability column');
      }
      
      if (!driversColumns.rows.find(row => row.column_name === 'skills')) {
        await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS skills TEXT[]`);
        console.log('- Added skills column');
      }
    } else {
      console.log('All required columns already exist in drivers table');
    }

    // Check if columns exist in fleet_owners table
    const fleetOwnersColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fleet_owners' AND 
      column_name IN ('profile_image', 'about', 'location', 'business_type', 'reg_number')
    `);

    // Add missing columns to fleet_owners table
    if (fleetOwnersColumns.rows.length < 5) {
      console.log('Adding missing columns to fleet_owners table...');
      
      if (!fleetOwnersColumns.rows.find(row => row.column_name === 'profile_image')) {
        await db.execute(sql`ALTER TABLE fleet_owners ADD COLUMN IF NOT EXISTS profile_image TEXT`);
        console.log('- Added profile_image column');
      }
      
      if (!fleetOwnersColumns.rows.find(row => row.column_name === 'about')) {
        await db.execute(sql`ALTER TABLE fleet_owners ADD COLUMN IF NOT EXISTS about TEXT`);
        console.log('- Added about column');
      }
      
      if (!fleetOwnersColumns.rows.find(row => row.column_name === 'location')) {
        await db.execute(sql`ALTER TABLE fleet_owners ADD COLUMN IF NOT EXISTS location TEXT`);
        console.log('- Added location column');
      }
      
      if (!fleetOwnersColumns.rows.find(row => row.column_name === 'business_type')) {
        await db.execute(sql`ALTER TABLE fleet_owners ADD COLUMN IF NOT EXISTS business_type TEXT`);
        console.log('- Added business_type column');
      }
      
      if (!fleetOwnersColumns.rows.find(row => row.column_name === 'reg_number')) {
        await db.execute(sql`ALTER TABLE fleet_owners ADD COLUMN IF NOT EXISTS reg_number TEXT`);
        console.log('- Added reg_number column');
      }
    } else {
      console.log('All required columns already exist in fleet_owners table');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
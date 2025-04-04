import { sql } from 'drizzle-orm';
import { db } from '../db';
import { drivers, fleetOwners } from '@shared/schema';

export async function addProfileFields() {
  console.log("Adding new profile fields to drivers and fleet owners tables...");
  
  // Add missing columns to drivers table
  try {
    // First, check if column exists to avoid errors
    const checkAboutColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' AND column_name = 'about'
    `);
    
    // Check if the result has rows and the rows property
    if (!checkAboutColumn.rows || checkAboutColumn.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE drivers 
        ADD COLUMN IF NOT EXISTS about TEXT,
        ADD COLUMN IF NOT EXISTS location TEXT,
        ADD COLUMN IF NOT EXISTS availability TEXT,
        ADD COLUMN IF NOT EXISTS skills TEXT[]
      `);
      console.log("Added about, location, availability, and skills columns to drivers table");
    } else {
      console.log("Columns already exist in drivers table");
    }
    
    // Check if column exists in fleet_owners table
    const checkFleetOwnerColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fleet_owners' AND column_name = 'about'
    `);
    
    if (!checkFleetOwnerColumn.rows || checkFleetOwnerColumn.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE fleet_owners 
        ADD COLUMN IF NOT EXISTS about TEXT,
        ADD COLUMN IF NOT EXISTS location TEXT,
        ADD COLUMN IF NOT EXISTS contact_email TEXT
      `);
      console.log("Added about, location, and contact_email columns to fleet_owners table");
    } else {
      console.log("Columns already exist in fleet_owners table");
    }
    
    // Check for other columns that need to be removed or renamed
    const checkName1Column = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' AND column_name = 'name1'
    `);
    
    if (checkName1Column.rows && checkName1Column.rows.length > 0) {
      await db.execute(sql`
        ALTER TABLE drivers 
        DROP COLUMN IF EXISTS name1,
        DROP COLUMN IF EXISTS email,
        DROP COLUMN IF EXISTS phone_number
      `);
      console.log("Removed obsolete columns (name1, email, phone_number) from drivers table");
    }
    
    const checkFleetOwnerName1Column = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fleet_owners' AND column_name = 'name1'
    `);
    
    if (checkFleetOwnerName1Column.rows && checkFleetOwnerName1Column.rows.length > 0) {
      await db.execute(sql`
        ALTER TABLE fleet_owners 
        DROP COLUMN IF EXISTS name1,
        DROP COLUMN IF EXISTS email,
        DROP COLUMN IF EXISTS phone_number
      `);
      console.log("Removed obsolete columns (name1, email, phone_number) from fleet_owners table");
    }
    
    console.log("Profile fields migration completed successfully");
    
  } catch (error) {
    console.error("Error adding profile fields:", error);
    throw error;
  }
}
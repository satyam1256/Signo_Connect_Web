import { db } from "./server/db";

export async function addMissingColumns() {
  console.log("Checking and adding any missing columns...");

  try {
    // Check if users table needs updating with language field
    try {
      await db.execute(`
        DO $$
        BEGIN
          -- First check if the table exists
          IF EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'users'
          ) THEN
            -- Only try to add columns if the table exists
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'language'
            ) THEN
              ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en';
              RAISE NOTICE 'Added language column to users table';
            END IF;
          ELSE
            RAISE NOTICE 'Users table does not exist yet, skipping column alterations';
          END IF;
        END $$;
      `);
      console.log("✅ Users table checked");
    } catch (error) {
      console.error("⚠️ Error checking users table:", error);
      // Continue with other tables
    }

    // Check if driver table needs updating with fields
    try {
      await db.execute(`
        DO $$
        BEGIN
          -- First check if the table exists
          IF EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'drivers'
          ) THEN
            -- Only try to add columns if the table exists
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'drivers' AND column_name = 'location'
            ) THEN
              ALTER TABLE drivers ADD COLUMN location TEXT DEFAULT '';
              RAISE NOTICE 'Added location column to drivers table';
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'drivers' AND column_name = 'about'
            ) THEN
              ALTER TABLE drivers ADD COLUMN about TEXT DEFAULT 'Professional driver looking for opportunities';
              RAISE NOTICE 'Added about column to drivers table';
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'drivers' AND column_name = 'availability'
            ) THEN
              ALTER TABLE drivers ADD COLUMN availability TEXT DEFAULT 'full-time';
              RAISE NOTICE 'Added availability column to drivers table';
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'drivers' AND column_name = 'skills'
            ) THEN
              ALTER TABLE drivers ADD COLUMN skills TEXT[] DEFAULT ARRAY['Driving'];
              RAISE NOTICE 'Added skills column to drivers table';
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'drivers' AND column_name = 'profile_image'
            ) THEN
              ALTER TABLE drivers ADD COLUMN profile_image TEXT DEFAULT NULL;
              RAISE NOTICE 'Added profile_image column to drivers table';
            END IF;
          ELSE
            RAISE NOTICE 'Drivers table does not exist yet, skipping column alterations';
          END IF;
        END $$;
      `);
      console.log("✅ Drivers table checked");
    } catch (error) {
      console.error("⚠️ Error checking drivers table:", error);
      // Continue with other tables
    }

    // Check if fleet_owners table needs updating with fields
    try {
      await db.execute(`
        DO $$
        BEGIN
          -- First check if the table exists
          IF EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'fleet_owners'
          ) THEN
            -- Only try to add columns if the table exists
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'fleet_owners' AND column_name = 'location'
            ) THEN
              ALTER TABLE fleet_owners ADD COLUMN location TEXT DEFAULT '';
              RAISE NOTICE 'Added location column to fleet_owners table';
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'fleet_owners' AND column_name = 'about'
            ) THEN
              ALTER TABLE fleet_owners ADD COLUMN about TEXT DEFAULT 'Fleet owner looking for reliable drivers';
              RAISE NOTICE 'Added about column to fleet_owners table';
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'fleet_owners' AND column_name = 'business_type'
            ) THEN
              ALTER TABLE fleet_owners ADD COLUMN business_type TEXT DEFAULT 'Transportation';
              RAISE NOTICE 'Added business_type column to fleet_owners table';
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'fleet_owners' AND column_name = 'reg_number'
            ) THEN
              ALTER TABLE fleet_owners ADD COLUMN reg_number TEXT DEFAULT '';
              RAISE NOTICE 'Added reg_number column to fleet_owners table';
            END IF;

            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'fleet_owners' AND column_name = 'profile_image'
            ) THEN
              ALTER TABLE fleet_owners ADD COLUMN profile_image TEXT DEFAULT NULL;
              RAISE NOTICE 'Added profile_image column to fleet_owners table';
            END IF;
          ELSE
            RAISE NOTICE 'Fleet owners table does not exist yet, skipping column alterations';
          END IF;
        END $$;
      `);
      console.log("✅ Fleet owners table checked");
    } catch (error) {
      console.error("⚠️ Error checking fleet owners table:", error);
      // Continue with other tables
    }

    console.log("✅ All column checks completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error checking or adding columns:", error);
    throw error;
  }
}

// Run the function if this file is executed directly
// When using ES modules, we can't access require.main
// So we'll check if this file is being executed directly by looking at import.meta
if (import.meta.url.endsWith('column-migration.ts')) {
  addMissingColumns()
    .then(() => {
      console.log("Column migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Column migration failed:", error);
      process.exit(1);
    });
}
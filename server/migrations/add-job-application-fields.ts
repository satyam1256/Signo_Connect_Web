import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * This migration adds additional fields to the job_applications table
 * to match the updated schema:
 * - expected_salary: integer
 * - preferred_joining_date: timestamp
 * - additional_notes: text
 */
export async function addJobApplicationFields() {
  try {
    console.log("Starting migration: Adding fields to job_applications table...");

    // Check if columns already exist - safer approach with PostgreSQL's information_schema
    const columnsResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_applications' 
      AND (column_name = 'expected_salary' OR column_name = 'preferred_joining_date' OR column_name = 'additional_notes');
    `);

    // Safely handle result structure
    let existingColumns: string[] = [];
    if (columnsResult && Array.isArray(columnsResult.rows)) {
      existingColumns = columnsResult.rows.map((row: any) => 
        row && typeof row === 'object' && row.column_name ? row.column_name : ''
      ).filter(Boolean);
    }
    console.log("Existing columns found:", existingColumns);

    // Add expected_salary if not exists
    if (!existingColumns.includes('expected_salary')) {
      console.log("Adding expected_salary column to job_applications");
      try {
        await db.execute(sql`
          ALTER TABLE job_applications 
          ADD COLUMN expected_salary INTEGER;
        `);
        console.log("Added expected_salary column successfully");
      } catch (err) {
        console.error("Error adding expected_salary column:", err);
      }
    }

    // Add preferred_joining_date if not exists
    if (!existingColumns.includes('preferred_joining_date')) {
      console.log("Adding preferred_joining_date column to job_applications");
      try {
        await db.execute(sql`
          ALTER TABLE job_applications 
          ADD COLUMN preferred_joining_date TIMESTAMP;
        `);
        console.log("Added preferred_joining_date column successfully");
      } catch (err) {
        console.error("Error adding preferred_joining_date column:", err);
      }
    }

    // Add additional_notes if not exists
    if (!existingColumns.includes('additional_notes')) {
      console.log("Adding additional_notes column to job_applications");
      try {
        await db.execute(sql`
          ALTER TABLE job_applications 
          ADD COLUMN additional_notes TEXT;
        `);
        console.log("Added additional_notes column successfully");
      } catch (err) {
        console.error("Error adding additional_notes column:", err);
      }
    }

    console.log("Migration completed successfully: added fields to job_applications table");
    return true;
  } catch (error) {
    console.error("Error during job_applications migration:", error);
    // Log but don't throw so subsequent migrations can run
    return false;
  }
}
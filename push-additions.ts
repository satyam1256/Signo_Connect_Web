import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { documents, vehicleTypes } from "./schema-additions";

async function main() {
  console.log("Initializing database connection...");
  // Create a PostgreSQL client
  const connectionString = process.env.DATABASE_URL || "";
  const queryClient = postgres(connectionString, { ssl: 'require' });
  console.log("SQL client created");

  // Create a Drizzle ORM instance
  const db = drizzle(queryClient);
  console.log("Drizzle ORM instance created successfully");

  try {
    // Create documents table if it doesn't exist
    console.log("Pushing documents table schema...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" SERIAL PRIMARY KEY,
        "document_id" TEXT NOT NULL UNIQUE,
        "user_id" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "document_number" TEXT,
        "front_image" TEXT,
        "back_image" TEXT,
        "is_verified" BOOLEAN DEFAULT FALSE,
        "verified_by" TEXT,
        "verified_at" TIMESTAMP,
        "expiry_date" TIMESTAMP,
        "date" TIMESTAMP,
        "remarks" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Documents table created successfully");

    // Create vehicle_types table if it doesn't exist
    console.log("Pushing vehicle_types table schema...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "vehicle_types" (
        "id" SERIAL PRIMARY KEY,
        "vehicle_type" TEXT NOT NULL UNIQUE,
        "is_active" BOOLEAN DEFAULT TRUE,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Vehicle types table created successfully");

    console.log("Schema updates completed successfully");
  } catch (error) {
    console.error("Error pushing schema updates:", error);
    throw error;
  } finally {
    // Close the database connection
    await queryClient.end();
    console.log("Database connection closed");
  }
}

main().catch(console.error);
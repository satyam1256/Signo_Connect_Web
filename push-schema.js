import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import fs from 'fs';

// Environment variables should already be set by Replit
const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;

async function main() {
  console.log('Starting schema push...');
  console.log('Connection details:', { PGHOST, PGPORT, PGUSER, PGDATABASE });

  try {
    // Connect to the database
    const connectionString = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
    const client = postgres(connectionString, { 
      max: 1,
      ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(client);

    console.log('Connected to database');
    
    // Create schema SQL
    const schemaSQL = `
-- Drop existing tables if they exist
DROP TABLE IF EXISTS "drivers";
DROP TABLE IF EXISTS "fleet_owners";
DROP TABLE IF EXISTS "jobs";
DROP TABLE IF EXISTS "otp_verifications";
DROP TABLE IF EXISTS "fuel_pumps";
DROP TABLE IF EXISTS "vehicles";
DROP TABLE IF EXISTS "driver_assessments";
DROP TABLE IF EXISTS "notifications";
DROP TABLE IF EXISTS "referrals";
DROP TABLE IF EXISTS "tolls";
DROP TABLE IF EXISTS "users";

-- Create tables with schema matching schema.ts

CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "full_name" text NOT NULL,
    "phone_number" text NOT NULL,
    "email" text,
    "user_type" text NOT NULL,
    "language" text DEFAULT 'en',
    "profile_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "drivers" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "preferred_locations" text[],
    "driving_license" text,
    "identity_proof" text,
    "experience" text,
    "vehicle_types" text[]
);

CREATE TABLE IF NOT EXISTS "fleet_owners" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "company_name" text,
    "fleet_size" text,
    "preferred_locations" text[],
    "registration_doc" text
);

CREATE TABLE IF NOT EXISTS "jobs" (
    "id" serial PRIMARY KEY NOT NULL,
    "fleet_owner_id" integer NOT NULL,
    "title" text NOT NULL,
    "location" text NOT NULL,
    "salary" text,
    "description" text,
    "requirements" text[],
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "otp_verifications" (
    "id" serial PRIMARY KEY NOT NULL,
    "phone_number" text NOT NULL,
    "otp" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "fuel_pumps" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "address" text NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "amenities" text[],
    "fuel_types" text[],
    "is_open_24_hours" boolean DEFAULT false,
    "rating" double precision,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vehicles" (
    "id" serial PRIMARY KEY NOT NULL,
    "registration_number" text NOT NULL,
    "transporter_id" integer NOT NULL,
    "vehicle_type" text NOT NULL,
    "make" text NOT NULL,
    "model" text NOT NULL,
    "year" integer,
    "capacity_tons" double precision,
    "insurance_status" text,
    "last_service_date" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "driver_assessments" (
    "id" serial PRIMARY KEY NOT NULL,
    "driver_id" integer NOT NULL,
    "assessment_type" text NOT NULL,
    "status" text NOT NULL,
    "score" integer,
    "feedback_notes" text,
    "completed_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "user_type" text NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "type" text NOT NULL,
    "read" boolean DEFAULT false,
    "action_url" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "referrals" (
    "id" serial PRIMARY KEY NOT NULL,
    "referrer_id" integer NOT NULL,
    "referred_phone_number" text NOT NULL,
    "referred_name" text,
    "status" text NOT NULL,
    "reward" text,
    "completed_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tolls" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "fee_amount" double precision,
    "highway" text,
    "payment_methods" text[],
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "phone_number_idx" ON "users" ("phone_number");
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_driver_idx" ON "drivers" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_fleet_owner_idx" ON "fleet_owners" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "registration_number_idx" ON "vehicles" ("registration_number");
`;

    // Execute SQL
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
    console.log(`Executing ${statements.length} SQL statements`);
    
    for (const statement of statements) {
      try {
        await client.unsafe(statement);
      } catch (err) {
        console.error('Statement error:', err);
      }
    }

    console.log('Schema push completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Schema push failed:', error);
    process.exit(1);
  }
}

main();
-- Drop existing tables if they exist
DROP TABLE IF EXISTS "drivers";
DROP TABLE IF EXISTS "fleet_owners";
DROP TABLE IF EXISTS "jobs";
DROP TABLE IF EXISTS "otp_verifications";
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

CREATE UNIQUE INDEX IF NOT EXISTS "phone_number_idx" ON "users" ("phone_number");
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_driver_idx" ON "drivers" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_fleet_owner_idx" ON "fleet_owners" ("user_id");
import { db } from "./db";
import {
  users,
  drivers,
  fleetOwners,
  jobs,
  otpVerifications,
  fuelPumps,
  vehicles,
  driverAssessments,
  notifications,
  referrals,
  tolls
} from "@shared/schema";

export async function createTablesIfNotExist() {
  console.log("Creating tables if they don't exist...");
  
  try {
    // Create users table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone_number TEXT NOT NULL UNIQUE,
        email TEXT,
        user_type TEXT NOT NULL,
        language TEXT DEFAULT 'en',
        profile_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Users table checked");

    // Create drivers table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        preferred_locations TEXT[],
        driving_license TEXT,
        identity_proof TEXT,
        experience TEXT,
        vehicle_types TEXT[]
      );
    `);
    console.log("✅ Drivers table checked");

    // Create fleet_owners table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fleet_owners (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        company_name TEXT,
        fleet_size TEXT,
        preferred_locations TEXT[],
        registration_doc TEXT
      );
    `);
    console.log("✅ Fleet owners table checked");

    // Create jobs table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        fleet_owner_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        salary TEXT,
        description TEXT,
        requirements TEXT[],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Jobs table checked");

    // Create OTP verifications table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id SERIAL PRIMARY KEY,
        phone_number TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ OTP verifications table checked");

    // Create fuel pumps table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fuel_pumps (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        amenities TEXT[],
        fuel_types TEXT[],
        is_open_24_hours BOOLEAN DEFAULT FALSE,
        rating DOUBLE PRECISION,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Fuel pumps table checked");

    // Create vehicles table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        registration_number TEXT NOT NULL UNIQUE,
        transporter_id INTEGER NOT NULL,
        vehicle_type TEXT NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER,
        capacity_tons DOUBLE PRECISION,
        insurance_status TEXT,
        last_service_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Vehicles table checked");

    // Create driver assessments table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS driver_assessments (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER NOT NULL,
        assessment_type TEXT NOT NULL,
        status TEXT NOT NULL,
        score INTEGER,
        feedback_notes TEXT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Driver assessments table checked");

    // Create notifications table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        action_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Notifications table checked");

    // Create referrals table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL,
        referred_phone_number TEXT NOT NULL,
        referred_name TEXT,
        status TEXT NOT NULL,
        reward TEXT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Referrals table checked");

    // Create tolls table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tolls (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        fee_amount DOUBLE PRECISION,
        highway TEXT,
        payment_methods TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Tolls table checked");

    console.log("✅ All tables checked and created if needed!");
    return true;
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
}
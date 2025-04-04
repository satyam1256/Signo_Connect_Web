import { db } from "./db";
import { initializeDatabase } from "./db";
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
  tolls,
  trips,
  chalans,
  serviceLocations,
  documents,
  vehicleTypes,
  vehicleChecklists,
  jobImages,
  jobQuestions,
  jobApplications,
  jobHiredDrivers,
  driverAttendance,
  reviews,
  driverFeed,
  transporterFeed,
  tripExpenses
} from "@shared/schema";

async function main() {
  console.log("Initializing database connection...");
  await initializeDatabase();
  
  console.log("Pushing schema to database...");

  try {
    // Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone_number TEXT NOT NULL UNIQUE,
        email TEXT,
        user_type TEXT NOT NULL,
        language TEXT DEFAULT 'en',
        profile_completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        preferred_locations TEXT[],
        driving_license TEXT,
        identity_proof TEXT,
        experience TEXT,
        vehicle_types TEXT[],
        about TEXT,
        location TEXT,
        availability TEXT,
        skills TEXT[]
      );

      CREATE TABLE IF NOT EXISTS fleet_owners (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        company_name TEXT,
        fleet_size TEXT,
        preferred_locations TEXT[],
        registration_doc TEXT,
        about TEXT,
        location TEXT,
        contact_email TEXT
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        fleet_owner_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        salary TEXT,
        description TEXT,
        requirements TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otp_verifications (
        id SERIAL PRIMARY KEY,
        phone_number TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fuel_pumps (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        amenities TEXT[],
        fuel_types TEXT[],
        is_open_24_hours BOOLEAN DEFAULT false,
        rating DOUBLE PRECISION,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        registration_number TEXT NOT NULL UNIQUE,
        transporter_id INTEGER NOT NULL,
        vehicle_type TEXT NOT NULL,
        driver_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER,
        capacity_tons DOUBLE PRECISION,
        insurance_status TEXT,
        last_service_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS driver_assessments (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER NOT NULL,
        assessment_type TEXT NOT NULL,
        status TEXT NOT NULL,
        score INTEGER,
        feedback_notes TEXT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        action_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL,
        referred_phone_number TEXT NOT NULL,
        referred_name TEXT,
        status TEXT NOT NULL,
        reward TEXT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tolls (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        fee_amount DOUBLE PRECISION,
        highway TEXT,
        payment_methods TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        naming_series TEXT DEFAULT 'TR-.#####.',
        trip_id TEXT NOT NULL UNIQUE,
        vehicle_id TEXT NOT NULL,
        vehicle_type TEXT,
        driver_id TEXT NOT NULL,
        driver_name TEXT,
        driver_phone_number TEXT,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        eta TIMESTAMP,
        eta_str TEXT,
        trip_cost DOUBLE PRECISION NOT NULL,
        paid_amount DOUBLE PRECISION DEFAULT 0,
        pending_amount DOUBLE PRECISION,
        status TEXT NOT NULL DEFAULT 'Upcoming',
        created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_on TIMESTAMP,
        ended_on TIMESTAMP,
        transporter_id TEXT NOT NULL,
        transporter_name TEXT,
        odo_start TEXT,
        odo_start_pic TEXT,
        odo_end TEXT,
        odo_end_pic TEXT,
        trip_pic TEXT,
        share_text TEXT,
        started_by TEXT,
        is_active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS chalans (
        id SERIAL PRIMARY KEY,
        vehicle_id TEXT NOT NULL,
        chalan_number TEXT NOT NULL,
        issued_date TIMESTAMP NOT NULL,
        offense TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        status TEXT NOT NULL,
        payment_date TIMESTAMP,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS service_locations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        phone TEXT,
        rating DOUBLE PRECISION,
        open_hours TEXT,
        amenities TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        document_id TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        document_number TEXT,
        front_image TEXT,
        back_image TEXT,
        is_verified BOOLEAN DEFAULT false,
        verified_by TEXT,
        verified_at TIMESTAMP,
        expiry_date TIMESTAMP,
        date TIMESTAMP,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vehicle_types (
        id SERIAL PRIMARY KEY,
        vehicle_type TEXT NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vehicle_checklists (
        id SERIAL PRIMARY KEY,
        item TEXT NOT NULL,
        is_available BOOLEAN DEFAULT false,
        remarks TEXT,
        description TEXT,
        vehicle_id TEXT,
        trip_id TEXT,
        driver_id INTEGER,
        date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_images (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        preview TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_questions (
        id SERIAL PRIMARY KEY,
        job_id INTEGER,
        question TEXT NOT NULL,
        type TEXT,
        options TEXT,
        answer TEXT,
        is_required BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        naming_series TEXT DEFAULT 'SIGJA-.####.',
        job_id INTEGER NOT NULL,
        feed_id INTEGER,
        driver_id INTEGER NOT NULL,
        driver_name TEXT,
        driver_mobile TEXT,
        driver_status TEXT,
        transporter_status TEXT,
        applied_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        call_now_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        expected_salary DOUBLE PRECISION,
        preferred_joining_date TIMESTAMP,
        additional_notes TEXT,
        updated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_hired_drivers (
        id SERIAL PRIMARY KEY,
        naming_series TEXT DEFAULT 'SIGJA-.####.',
        feed_id INTEGER,
        job_id INTEGER NOT NULL,
        driver_id INTEGER NOT NULL,
        driver_name TEXT,
        remarks TEXT,
        transporter_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS driver_attendance (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER NOT NULL,
        driver_name TEXT,
        date TIMESTAMP NOT NULL,
        status TEXT NOT NULL,
        marked_by TEXT,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        document_type TEXT NOT NULL,
        document_name TEXT NOT NULL,
        review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rating DOUBLE PRECISION,
        comments TEXT,
        review_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS driver_feed (
        id SERIAL PRIMARY KEY,
        naming_series TEXT DEFAULT 'SIGDF-.####.',
        transporter_id INTEGER NOT NULL,
        job_id INTEGER,
        title TEXT NOT NULL,
        subtitle TEXT,
        feed_type TEXT,
        share_text TEXT,
        likes INTEGER DEFAULT 0,
        applications INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        questions_json JSONB,
        description TEXT,
        images_json JSONB,
        logo_url TEXT,
        register_url_text TEXT,
        register_url TEXT,
        is_active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS transporter_feed (
        id SERIAL PRIMARY KEY,
        naming_series TEXT DEFAULT 'SIGTF-.####.',
        company_name TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT,
        feed_type TEXT,
        share_text TEXT,
        likes INTEGER DEFAULT 0,
        applications INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        questions_json JSONB,
        description TEXT,
        images_json JSONB,
        logo_url TEXT,
        register_url_text TEXT,
        register_url TEXT,
        is_active BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS trip_expenses (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL,
        linked_expenses TEXT,
        transporter_id INTEGER NOT NULL,
        driver_id INTEGER NOT NULL,
        purpose TEXT,
        amount INTEGER NOT NULL,
        paid_amount INTEGER DEFAULT 0,
        pending_amount INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        approval_date TIMESTAMP,
        approved_by TEXT,
        payment_date TIMESTAMP,
        payment_method TEXT,
        reference_number TEXT,
        receipt_image TEXT,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Schema pushed successfully!");
  } catch (error) {
    console.error("Failed to push schema:", error);
  } finally {
    process.exit(0);
  }
}

main().catch(error => {
  console.error("Error in main:", error);
  process.exit(1);
});
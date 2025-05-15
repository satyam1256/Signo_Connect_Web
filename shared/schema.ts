import { pgTable, text, serial, integer, boolean, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types
export const UserType = {
  DRIVER: "driver",
  FLEET_OWNER: "fleet_owner",
} as const;

export type UserTypeValue = typeof UserType[keyof typeof UserType];

// Base users table with common fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  email: text("email"),
  userType: text("user_type").notNull(),
  language: text("language").default("en"),
  profileCompleted: boolean("profile_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Driver-specific information
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  preferredLocations: text("preferred_locations").array(),
  drivingLicense: text("driving_license"),
  identityProof: text("identity_proof"),
  experience: text("experience"),
  vehicleTypes: text("vehicle_types").array(),
});

// Fleet owner-specific information
export const fleetOwners = pgTable("fleet_owners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyName: text("company_name"),
  fleetSize: text("fleet_size"),
  preferredLocations: text("preferred_locations").array(),
  registrationDoc: text("registration_doc"),
});

// Job postings by fleet owners
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  fleetOwnerId: integer("fleet_owner_id").notNull(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  salary: text("salary"),
  description: text("description"),
  requirements: text("requirements").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP Verification
export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const userInsertSchema = createInsertSchema(users).pick({
  fullName: true,
  phoneNumber: true,
  email: true,
  userType: true,
  language: true,
});

export const driverInsertSchema = createInsertSchema(drivers).pick({
  userId: true,
  preferredLocations: true,
  drivingLicense: true,
  identityProof: true,
  experience: true,
  vehicleTypes: true,
});

export const fleetOwnerInsertSchema = createInsertSchema(fleetOwners).pick({
  userId: true,
  companyName: true,
  fleetSize: true,
  preferredLocations: true,
  registrationDoc: true,
});

export const jobInsertSchema = createInsertSchema(jobs).pick({
  fleetOwnerId: true,
  title: true,
  location: true,
  salary: true,
  description: true,
  requirements: true,
});

export const otpVerificationSchema = createInsertSchema(otpVerifications).pick({
  phoneNumber: true,
  otp: true,
  expiresAt: true,
});

export const verifyOtpSchema = z.object({
  phoneNumber: z.string(),
  otp: z.string().length(6),
});

// Extend schemas with additional validation
export const userRegistrationSchema = userInsertSchema.extend({
  userType: z.enum([UserType.DRIVER, UserType.FLEET_OWNER]),
  phoneNumber: z.string().min(10).max(15),
  email: z.string().email().optional(),
});

// Driver trips
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  namingSeriesId: integer("naming_series_id"),
  namingSeries: text("naming_series"), // TR-#####
  vehicleId: integer("vehicle_id"), // Link to Vehicles
  vehicleTypeId: integer("vehicle_type_id"), // Link to Vehicle Types
  driverId: integer("driver_id").notNull(), // Link to Drivers
  driverName: text("driver_name"), // Data
  driverPhoneNumber: text("driver_phone_number"), // Data
  origin: text("origin").notNull(), // Data
  destination: text("destination").notNull(), // Data
  tripCost: doublePrecision("trip_cost"), // Float
  pendingAmount: doublePrecision("pending_amount"), // Float
  paidAmount: doublePrecision("paid_amount"), // Float
  handoverChecklist: jsonb("handover_checklist"), // Table as JSON
  status: text("status", { enum: ["upcoming", "waiting", "completed", "in-progress", "cancelled"] }).notNull(),
  createdOn: timestamp("created_on").defaultNow(), // Datetime
  startedOn: timestamp("started_on"), // Datetime
  endedOn: timestamp("ended_on"), // Datetime
  eta: timestamp("eta"), // Datetime
  etaStr: text("eta_str"), // Data
  transporterId: integer("transporter_id"), // Link to Transporters
  transporterName: text("transporter_name"), // Data
  odoStart: text("odo_start"), // Data
  odoStartPic: text("odo_start_pic"), // Attach Image (stored as path/URL)
  odoEnd: text("odo_end"), // Data
  odoEndPic: text("odo_end_pic"), // Attach Image (stored as path/URL)
  tripPic: text("trip_pic"), // Attach Image (stored as path/URL)
  documents: jsonb("documents"), // Table as JSON
  shareText: text("share_text"), // Small Text
  startedBy: text("started_by", { enum: ["Driver", "Transporter"] }), // Select
  isActive: boolean("is_active").default(true), // Check
  
  // Additional fields to maintain backward compatibility
  startDate: timestamp("start_date"), // alias for startedOn
  endDate: timestamp("end_date"), // alias for endedOn
  distance: doublePrecision("distance"), // in kilometers (calculated or derived)
  duration: doublePrecision("duration"), // in hours (calculated or derived)
  vehicleType: text("vehicle_type"), // from vehicleTypeId
  earnings: doublePrecision("earnings"), // alias for tripCost
  rating: doublePrecision("rating"), // optional rating out of 5
  createdAt: timestamp("created_at").defaultNow(), // alias for createdOn
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const tripInsertSchema = createInsertSchema(trips).pick({
  namingSeriesId: true,
  namingSeries: true,
  vehicleId: true, 
  vehicleTypeId: true,
  driverId: true,
  driverName: true,
  driverPhoneNumber: true,
  origin: true,
  destination: true,
  tripCost: true,
  pendingAmount: true,
  paidAmount: true,
  handoverChecklist: true,
  status: true,
  createdOn: true,
  startedOn: true,
  endedOn: true,
  eta: true,
  etaStr: true,
  transporterId: true,
  transporterName: true,
  odoStart: true,
  odoStartPic: true,
  odoEnd: true,
  odoEndPic: true,
  tripPic: true,
  documents: true,
  shareText: true,
  startedBy: true,
  isActive: true,
  
  // Keeping these for backward compatibility
  startDate: true,
  endDate: true,
  distance: true,
  duration: true,
  vehicleType: true,
  earnings: true,
  rating: true,
});

// Types for TypeScript
export type InsertUser = z.infer<typeof userInsertSchema>;
export type InsertDriver = z.infer<typeof driverInsertSchema>;
export type InsertFleetOwner = z.infer<typeof fleetOwnerInsertSchema>;
export type InsertJob = z.infer<typeof jobInsertSchema>;
export type InsertOtpVerification = z.infer<typeof otpVerificationSchema>;
export type InsertTrip = z.infer<typeof tripInsertSchema>;

export type User = typeof users.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type FleetOwner = typeof fleetOwners.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type Trip = typeof trips.$inferSelect;

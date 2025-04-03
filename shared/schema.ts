import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
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
  // Additional profile fields
  profileImage: text("profile_image"),
  about: text("about"),
  location: text("location"),
  availability: text("availability"),
  skills: text("skills").array(),
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
  profileImage: true,
  about: true,
  location: true,
  availability: true,
  skills: true,
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

// Types for TypeScript
export type InsertUser = z.infer<typeof userInsertSchema>;
export type InsertDriver = z.infer<typeof driverInsertSchema>;
export type InsertFleetOwner = z.infer<typeof fleetOwnerInsertSchema>;
export type InsertJob = z.infer<typeof jobInsertSchema>;
export type InsertOtpVerification = z.infer<typeof otpVerificationSchema>;

export type User = typeof users.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type FleetOwner = typeof fleetOwners.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type OtpVerification = typeof otpVerifications.$inferSelect;

import { pgTable, text, serial, integer, boolean, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define status constants
export const TripStatus = {
  UPCOMING: "Upcoming",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const AssessmentStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const LocationType = {
  FUEL_PUMP: "fuel_pump",
  HOSPITAL: "hospital",
  REST_AREA: "rest_area",
  SERVICE_CENTER: "service_center",
} as const;

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

// Fuel pumps/stations for the nearby_fuel_pumps API
export const fuelPumps = pgTable("fuel_pumps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  amenities: text("amenities").array(),
  fuelTypes: text("fuel_types").array(),
  isOpen24Hours: boolean("is_open_24_hours").default(false),
  rating: doublePrecision("rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicles for the get_vehicle_details API
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  transporterId: integer("transporter_id").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  capacityTons: doublePrecision("capacity_tons"),
  insuranceStatus: text("insurance_status"),
  lastServiceDate: timestamp("last_service_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Driver assessment records
export const driverAssessments = pgTable("driver_assessments", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  assessmentType: text("assessment_type").notNull(),
  status: text("status").notNull(), // "pending", "completed", "failed"
  score: integer("score"),
  feedbackNotes: text("feedback_notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications for both drivers and fleet owners
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userType: text("user_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // "job", "payment", "system", etc.
  read: boolean("read").default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referrals for the driver referral program
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  referredPhoneNumber: text("referred_phone_number").notNull(),
  referredName: text("referred_name"),
  status: text("status").notNull(), // "pending", "registered", "completed"
  reward: text("reward"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tolls for route planning
export const tolls = pgTable("tolls", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  feeAmount: doublePrecision("fee_amount"),
  highway: text("highway"),
  paymentMethods: text("payment_methods").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trips table for tracking trips
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  tripId: text("trip_id").notNull().unique(), // Format: TR-00001
  driverId: text("driver_id").notNull(), // Format: SIG00001
  vehicleId: text("vehicle_id").notNull(), // Registration number like SAH2831
  transporterId: text("transporter_id").notNull(), // Format: SIG00001
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  status: text("status").notNull().default(TripStatus.UPCOMING),
  tripCost: doublePrecision("trip_cost").notNull(),
  paidAmount: doublePrecision("paid_amount").default(0),
  pendingAmount: doublePrecision("pending_amount"),
  odoStart: integer("odo_start"),
  odoEnd: integer("odo_end"),
  odoStartPic: text("odo_start_pic"),
  odoEndPic: text("odo_end_pic"),
  startedBy: text("started_by"),
  startedOn: timestamp("started_on"),
  endedOn: timestamp("ended_on"),
  etaStr: text("eta_str"),
  createdOn: timestamp("created_on").defaultNow(),
});

// Chalans/Tickets for vehicles
export const chalans = pgTable("chalans", {
  id: serial("id").primaryKey(),
  vehicleId: text("vehicle_id").notNull(), // Registration number like SAH2831
  chalanNumber: text("chalan_number").notNull(),
  issuedDate: timestamp("issued_date").notNull(),
  offense: text("offense").notNull(),
  amount: doublePrecision("amount").notNull(),
  status: text("status").notNull(), // "paid", "unpaid", "contested"
  paymentDate: timestamp("payment_date"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service locations (hospitals, rest areas, service centers)
export const serviceLocations = pgTable("service_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "hospital", "rest_area", "service_center"
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  phone: text("phone"),
  rating: doublePrecision("rating"),
  openHours: text("open_hours"),
  amenities: text("amenities").array(),
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

export const fuelPumpInsertSchema = createInsertSchema(fuelPumps).pick({
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  amenities: true,
  fuelTypes: true,
  isOpen24Hours: true,
  rating: true,
});

export const vehicleInsertSchema = createInsertSchema(vehicles).pick({
  registrationNumber: true,
  transporterId: true,
  vehicleType: true,
  make: true,
  model: true,
  year: true,
  capacityTons: true,
  insuranceStatus: true,
  lastServiceDate: true,
});

export const driverAssessmentInsertSchema = createInsertSchema(driverAssessments).pick({
  driverId: true,
  assessmentType: true,
  status: true,
  score: true,
  feedbackNotes: true,
  completedAt: true,
});

export const notificationInsertSchema = createInsertSchema(notifications).pick({
  userId: true,
  userType: true,
  title: true,
  content: true,
  type: true,
  actionUrl: true,
});

export const referralInsertSchema = createInsertSchema(referrals).pick({
  referrerId: true,
  referredPhoneNumber: true,
  referredName: true,
  status: true,
  reward: true,
  completedAt: true,
});

export const tollInsertSchema = createInsertSchema(tolls).pick({
  name: true,
  latitude: true,
  longitude: true,
  feeAmount: true,
  highway: true,
  paymentMethods: true,
});

export const tripInsertSchema = createInsertSchema(trips).pick({
  tripId: true,
  driverId: true,
  vehicleId: true,
  transporterId: true,
  origin: true,
  destination: true,
  status: true,
  tripCost: true,
  paidAmount: true,
  pendingAmount: true,
  odoStart: true,
  odoEnd: true,
  odoStartPic: true,
  odoEndPic: true,
  startedBy: true,
  startedOn: true,
  endedOn: true,
  etaStr: true,
});

export const chalanInsertSchema = createInsertSchema(chalans).pick({
  vehicleId: true,
  chalanNumber: true,
  issuedDate: true,
  offense: true,
  amount: true,
  status: true,
  paymentDate: true,
  location: true,
});

export const serviceLocationInsertSchema = createInsertSchema(serviceLocations).pick({
  name: true,
  type: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  rating: true,
  openHours: true,
  amenities: true,
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

// Schemas for API endpoints
export const nearbyFuelPumpsSchema = z.object({
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

export const routesWithTollsSchema = z.object({
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

export const submitAssessmentSchema = z.object({
  driverId: z.number(),
  assessmentType: z.string(),
  score: z.number().optional(),
  feedbackNotes: z.string().optional(),
});

// Types for TypeScript
export type InsertUser = z.infer<typeof userInsertSchema>;
export type InsertDriver = z.infer<typeof driverInsertSchema>;
export type InsertFleetOwner = z.infer<typeof fleetOwnerInsertSchema>;
export type InsertJob = z.infer<typeof jobInsertSchema>;
export type InsertOtpVerification = z.infer<typeof otpVerificationSchema>;
export type InsertFuelPump = z.infer<typeof fuelPumpInsertSchema>;
export type InsertVehicle = z.infer<typeof vehicleInsertSchema>;
export type InsertDriverAssessment = z.infer<typeof driverAssessmentInsertSchema>;
export type InsertNotification = z.infer<typeof notificationInsertSchema>;
export type InsertReferral = z.infer<typeof referralInsertSchema>;
export type InsertToll = z.infer<typeof tollInsertSchema>;
export type InsertTrip = z.infer<typeof tripInsertSchema>;
export type InsertChalan = z.infer<typeof chalanInsertSchema>;
export type InsertServiceLocation = z.infer<typeof serviceLocationInsertSchema>;

export type User = typeof users.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type FleetOwner = typeof fleetOwners.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type FuelPump = typeof fuelPumps.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type DriverAssessment = typeof driverAssessments.$inferSelect; 
export type Notification = typeof notifications.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type Toll = typeof tolls.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Chalan = typeof chalans.$inferSelect;
export type ServiceLocation = typeof serviceLocations.$inferSelect;

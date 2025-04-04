import { pgTable, text, serial, integer, boolean, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define status constants
export const TripStatus = {
  UPCOMING: "Upcoming",
  WAITING: "Waiting",
  RUNNING: "Running",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const DocumentType = {
  DL: "Driving License",
  AADHAR: "Aadhar Card",
  PAN: "PAN Card",
  BANK: "Bank Details",
  REGISTRATION: "Vehicle Registration",
  PROFILE: "Profile Picture",
  OTHER: "Other",
} as const;

export const VerificationStatus = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
} as const;

export const ExpenseStatus = {
  PENDING: "Pending",
  PAID: "Paid", 
  REJECTED: "Rejected",
} as const;

export const JobApplicationStatus = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  HIRED: "Hired",
  REJECTED: "Rejected",
} as const;

export const StartedBy = {
  DRIVER: "Driver",
  TRANSPORTER: "Transporter",
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

export const DocType = {
  DRIVING_LICENSE: "driving_license",
  AADHAR_CARD: "aadhar_card",
  PAN_CARD: "pan_card",
  BANK_DETAILS: "bank_details",
  VEHICLE_REGISTRATION: "vehicle_registration",
  PROFILE_PIC: "profile_pic",
  OTHER: "other",
} as const;

export const DocumentVerificationStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
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
  namingSeries: text("naming_series").default("SIG"),
  name1: text("name1").notNull(),
  userId: integer("user_id").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number").notNull(),
  emergencyContactNumber: text("emergency_contact_number"),
  address: text("address"),
  lastLocation: text("last_location"),
  experience: text("experience"),
  remarks: text("remarks"),
  catagory: text("catagory"),
  fcmToken: text("fcm_token"),
  latLong: text("lat_long"),
  isActive: boolean("is_active").default(true),
  referenceNumber: text("reference_number"),
  
  // KYC fields
  profilePic: text("profile_pic"),
  bankPic: text("bank_pic"),
  dlFrontPic: text("dl_front_pic"),
  dlBackPic: text("dl_back_pic"),
  aadharFrontPic: text("aadhar_front_pic"),
  aadharBackPic: text("aadhar_back_pic"),
  pfPic: text("pf_pic"),
  
  // Bank details
  bankAcNumber: text("bank_ac_number"),
  bankIFSC: text("bank_ifsc"),
  bankHolderName: text("bank_holder_name"),
  upiId: text("upi_id"),
  
  // ID verification
  dlNumber: text("dl_number"),
  dob: timestamp("dob"),
  aadharNumber: text("aadhar_number"),
  
  // Verification status
  isBankVerified: boolean("is_bank_verified").default(false),
  isKycVerified: boolean("is_kyc_verified").default(false),
  isDlVerified: boolean("is_dl_verified").default(false),
  isAadharVerified: boolean("is_aadhar_verified").default(false),
  
  // Original fields from previous schema
  preferredLocations: text("preferred_locations").array(),
  vehicleTypes: text("vehicle_types").array(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Fleet owner-specific information (Transporters)
export const fleetOwners = pgTable("fleet_owners", {
  id: serial("id").primaryKey(),
  namingSeries: text("naming_series").default("SIG"),
  name1: text("name1").notNull(),
  userId: integer("user_id").notNull(),
  email: text("email"),
  companyName: text("company_name"),
  fleetSize: text("fleet_size"),
  phoneNumber: text("phone_number").notNull(),
  emergencyContactNumber: text("emergency_contact_number"),
  address: text("address"),
  lastLocation: text("last_location"),
  remarks: text("remarks"),
  catagory: text("catagory"),
  fcmToken: text("fcm_token"),
  latLong: text("lat_long"),
  
  // Identification
  logoPic: text("logo_pic"),
  gst: text("gst"),
  pan: text("pan"),
  
  // Original fields
  preferredLocations: text("preferred_locations").array(),
  registrationDoc: text("registration_doc"),
  
  createdAt: timestamp("created_at").defaultNow(),
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
  driverId: integer("driver_id"),
  isActive: boolean("is_active").default(true),
  
  // Original fields
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
  namingSeries: text("naming_series").default("TR-.#####."),
  tripId: text("trip_id").notNull().unique(), // Format: TR-00001
  
  // Vehicle details
  vehicleId: text("vehicle_id").notNull(), // Registration number like SAH2831
  vehicleType: text("vehicle_type"),
  
  // Driver details
  driverId: text("driver_id").notNull(), // Format: SIG00001
  driverName: text("driver_name"),
  driverPhoneNumber: text("driver_phone_number"),
  
  // Trip details
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  eta: timestamp("eta"),
  etaStr: text("eta_str"),
  
  // Trip financials
  tripCost: doublePrecision("trip_cost").notNull(),
  paidAmount: doublePrecision("paid_amount").default(0),
  pendingAmount: doublePrecision("pending_amount"),
  
  // Trip metadata
  status: text("status").notNull().default(TripStatus.UPCOMING),
  createdOn: timestamp("created_on").defaultNow(),
  startedOn: timestamp("started_on"),
  endedOn: timestamp("ended_on"),
  
  // Transporter details
  transporterId: text("transporter_id").notNull(), // Format: SIG00001
  transporterName: text("transporter_name"),
  
  // Odometer readings
  odoStart: text("odo_start"),
  odoStartPic: text("odo_start_pic"),
  odoEnd: text("odo_end"),
  odoEndPic: text("odo_end_pic"),
  
  // Additional info
  tripPic: text("trip_pic"),
  shareText: text("share_text"),
  startedBy: text("started_by"),
  isActive: boolean("is_active").default(true),
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

// Documents table for storing user documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  documentId: text("document_id").notNull().unique(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // Using the DocumentType enum
  documentNumber: text("document_number"),
  frontImage: text("front_image"),
  backImage: text("back_image"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at"),
  expiryDate: timestamp("expiry_date"),
  date: timestamp("date"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicle type reference table
export const vehicleTypes = pgTable("vehicle_types", {
  id: serial("id").primaryKey(),
  vehicleType: text("vehicle_type").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicle checklist items for inspection
export const vehicleChecklists = pgTable("vehicle_checklists", {
  id: serial("id").primaryKey(),
  item: text("item").notNull(),
  isAvailable: boolean("is_available").default(false),
  remarks: text("remarks"),
  description: text("description"),
  vehicleId: text("vehicle_id"),
  tripId: text("trip_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job image table for job postings
export const jobImages = pgTable("job_images", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  url: text("url").notNull(),
  preview: text("preview"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job question child table
export const jobQuestions = pgTable("job_questions", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id"),
  question: text("question").notNull(),
  type: text("type"),
  options: text("options"),
  answer: text("answer"),
  isRequired: boolean("is_required").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job applications table
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  namingSeries: text("naming_series").default("SIGJA-.####."),
  jobId: integer("job_id").notNull(),
  feedId: integer("feed_id"),
  driverId: integer("driver_id").notNull(),
  driverName: text("driver_name"),
  driverMobile: text("driver_mobile"),
  driverStatus: text("driver_status"),
  transporterStatus: text("transporter_status"),
  appliedOn: timestamp("applied_on").defaultNow(),
  callNowCount: integer("call_now_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job hired drivers table
export const jobHiredDrivers = pgTable("job_hired_drivers", {
  id: serial("id").primaryKey(),
  namingSeries: text("naming_series").default("SIGJA-.####."),
  feedId: integer("feed_id"),
  jobId: integer("job_id").notNull(),
  driverId: integer("driver_id").notNull(),
  driverName: text("driver_name"),
  remarks: text("remarks"),
  transporterId: integer("transporter_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Driver attendance
export const driverAttendance = pgTable("driver_attendance", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  driverName: text("driver_name"),
  date: timestamp("date").notNull(),
  status: text("status").notNull(),
  markedBy: text("marked_by"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Review table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  documentType: text("document_type").notNull(),
  documentName: text("document_name").notNull(),
  reviewDate: timestamp("review_date").defaultNow(),
  rating: doublePrecision("rating"),
  comments: text("comments"),
  reviewBy: text("review_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Driver feed
export const driverFeed = pgTable("driver_feed", {
  id: serial("id").primaryKey(),
  namingSeries: text("naming_series").default("SIGDF-.####."),
  transporterId: integer("transporter_id").notNull(),
  jobId: integer("job_id"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  feedType: text("feed_type"), // "Apply", "Blank", "Register"
  shareText: text("share_text"),
  likes: integer("likes").default(0),
  applications: integer("applications").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  questionsJson: jsonb("questions_json"),
  description: text("description"),
  imagesJson: jsonb("images_json"),
  logoUrl: text("logo_url"),
  registerUrlText: text("register_url_text"),
  registerUrl: text("register_url"),
  isActive: boolean("is_active").default(true),
});

// Transporter feed
export const transporterFeed = pgTable("transporter_feed", {
  id: serial("id").primaryKey(),
  namingSeries: text("naming_series").default("SIGTF-.####."),
  companyName: text("company_name").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  feedType: text("feed_type"), // "Apply", "Blank", "Register"
  shareText: text("share_text"),
  likes: integer("likes").default(0),
  applications: integer("applications").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  questionsJson: jsonb("questions_json"),
  description: text("description"),
  imagesJson: jsonb("images_json"),
  logoUrl: text("logo_url"),
  registerUrlText: text("register_url_text"),
  registerUrl: text("register_url"),
  isActive: boolean("is_active").default(true),
});

// Trip expenses
export const tripExpenses = pgTable("trip_expenses", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  linkedExpenses: text("linked_expenses"),
  transporterId: integer("transporter_id").notNull(),
  driverId: integer("driver_id").notNull(),
  purpose: text("purpose"),
  amount: integer("amount").notNull(),
  paidAmount: integer("paid_amount").default(0),
  pendingAmount: integer("pending_amount"),
  date: timestamp("date").defaultNow(),
  description: text("description"),
  receipt: text("receipt"),
  status: text("status").notNull().default(ExpenseStatus.PENDING),
  referenceNo: text("reference_no"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Short URL table
export const shortUrls = pgTable("short_urls", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull().unique(),
  fullUrl: text("full_url").notNull(),
  clicks: integer("clicks").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// App settings
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  aboutHeader: text("about_header"),
  aboutDescription: text("about_description"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  logo: text("logo"),
  defaultExpensePurposes: text("default_expense_purposes"),
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
  name1: true,
  phoneNumber: true,
  email: true,
  preferredLocations: true,
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
// Let's define schemas for the newly added tables
export const jobImagesInsertSchema = createInsertSchema(jobImages).pick({
  jobId: true,
  url: true,
  preview: true,
});

export const jobQuestionsInsertSchema = createInsertSchema(jobQuestions).pick({
  jobId: true,
  question: true,
  type: true,
  options: true,
  answer: true,
  isRequired: true,
});

export const jobApplicationsInsertSchema = createInsertSchema(jobApplications).pick({
  jobId: true,
  feedId: true,
  driverId: true,
  driverName: true,
  driverMobile: true,
  driverStatus: true,
  transporterStatus: true,
  callNowCount: true,
});

export const jobHiredDriversInsertSchema = createInsertSchema(jobHiredDrivers).pick({
  feedId: true,
  jobId: true,
  driverId: true,
  driverName: true,
  remarks: true,
  transporterId: true,
});

export const driverAttendanceInsertSchema = createInsertSchema(driverAttendance).pick({
  driverId: true,
  driverName: true,
  date: true,
  status: true,
  markedBy: true,
  remarks: true,
});

export const reviewsInsertSchema = createInsertSchema(reviews).pick({
  documentType: true,
  documentName: true,
  reviewDate: true,
  rating: true,
  comments: true,
  reviewBy: true,
});

// Use z.object for custom schemas with boolean fields
export const driverFeedInsertSchema = z.object({
  transporterId: z.number(),
  jobId: z.number().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  feedType: z.string().optional(),
  shareText: z.string().optional(),
  questionsJson: z.any().optional(),
  description: z.string().optional(),
  imagesJson: z.any().optional(),
  logoUrl: z.string().optional(),
  registerUrlText: z.string().optional(),
  registerUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const transporterFeedInsertSchema = z.object({
  companyName: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  feedType: z.string().optional(),
  shareText: z.string().optional(),
  questionsJson: z.any().optional(),
  description: z.string().optional(),
  imagesJson: z.any().optional(),
  logoUrl: z.string().optional(),
  registerUrlText: z.string().optional(),
  registerUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const tripExpensesInsertSchema = createInsertSchema(tripExpenses).pick({
  tripId: true,
  linkedExpenses: true,
  transporterId: true,
  driverId: true,
  purpose: true,
  amount: true,
  paidAmount: true,
  pendingAmount: true,
  date: true,
  description: true,
  receipt: true,
  status: true,
  referenceNo: true,
});

export const shortUrlsInsertSchema = createInsertSchema(shortUrls).pick({
  hash: true,
  fullUrl: true,
  clicks: true,
});

export const appSettingsInsertSchema = createInsertSchema(appSettings).pick({
  aboutHeader: true,
  aboutDescription: true,
  contactEmail: true,
  contactPhone: true,
  logo: true,
  defaultExpensePurposes: true,
});

export const vehicleChecklistsInsertSchema = createInsertSchema(vehicleChecklists).pick({
  item: true,
  isAvailable: true,
  remarks: true,
  description: true,
  vehicleId: true,
  tripId: true,
});

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
export type InsertJobImage = z.infer<typeof jobImagesInsertSchema>;
export type InsertJobQuestion = z.infer<typeof jobQuestionsInsertSchema>;
export type InsertJobApplication = z.infer<typeof jobApplicationsInsertSchema>;
export type InsertJobHiredDriver = z.infer<typeof jobHiredDriversInsertSchema>;
export type InsertDriverAttendance = z.infer<typeof driverAttendanceInsertSchema>;
export type InsertReview = z.infer<typeof reviewsInsertSchema>;
export type InsertDriverFeed = z.infer<typeof driverFeedInsertSchema>;
export type InsertTransporterFeed = z.infer<typeof transporterFeedInsertSchema>;
export type InsertTripExpense = z.infer<typeof tripExpensesInsertSchema>;
export type InsertShortUrl = z.infer<typeof shortUrlsInsertSchema>;
export type InsertAppSetting = z.infer<typeof appSettingsInsertSchema>;
export type InsertVehicleChecklist = z.infer<typeof vehicleChecklistsInsertSchema>;

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
export type JobImage = typeof jobImages.$inferSelect;
export type JobQuestion = typeof jobQuestions.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type JobHiredDriver = typeof jobHiredDrivers.$inferSelect;
export type DriverAttendance = typeof driverAttendance.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type DriverFeed = typeof driverFeed.$inferSelect;
export type TransporterFeed = typeof transporterFeed.$inferSelect;
export type TripExpense = typeof tripExpenses.$inferSelect;
export type ShortUrl = typeof shortUrls.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type VehicleChecklist = typeof vehicleChecklists.$inferSelect;

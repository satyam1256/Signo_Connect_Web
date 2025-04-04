import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Document type constants
export const DocType = {
  DRIVING_LICENSE: "driving_license",
  AADHAR_CARD: "aadhar_card", 
  PAN_CARD: "pan_card",
  BANK_DETAILS: "bank_details",
  VEHICLE_REGISTRATION: "vehicle_registration",
  PROFILE_PIC: "profile_pic",
  OTHER: "other",
} as const;

// Verification status constants
export const VerificationStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

// Documents table for storing user documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  documentId: text("document_id").notNull().unique(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // Using the DocType enum
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

// Schema definitions for the newly added tables
export const documentsInsertSchema = createInsertSchema(documents).pick({
  documentId: true,
  userId: true,
  type: true,
  documentNumber: true,
  frontImage: true,
  backImage: true,
  isVerified: true,
  verifiedBy: true,
  expiryDate: true,
  date: true,
  remarks: true,
});

export const vehicleTypesInsertSchema = createInsertSchema(vehicleTypes).pick({
  vehicleType: true,
  isActive: true,
});

// Types for TypeScript
export type InsertDocument = z.infer<typeof documentsInsertSchema>;
export type InsertVehicleType = z.infer<typeof vehicleTypesInsertSchema>;

export type Document = typeof documents.$inferSelect;
export type VehicleType = typeof vehicleTypes.$inferSelect;
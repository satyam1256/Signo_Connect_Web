import { 
  users, type User, type InsertUser,
  drivers, type Driver, type InsertDriver,
  fleetOwners, type FleetOwner, type InsertFleetOwner,
  jobs, type Job, type InsertJob,
  otpVerifications, type OtpVerification, type InsertOtpVerification
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, like } from "drizzle-orm";

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }

  // Driver operations
  async getDriver(userId: number): Promise<Driver | undefined> {
    const result = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return result[0];
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const result = await db.insert(drivers).values(driver).returning();
    return result[0];
  }

  async updateDriver(userId: number, driverData: Partial<InsertDriver>): Promise<Driver | undefined> {
    const driver = await this.getDriver(userId);
    if (!driver) return undefined;

    const result = await db.update(drivers)
      .set(driverData)
      .where(eq(drivers.id, driver.id))
      .returning();
    
    return result[0];
  }

  // Fleet owner operations
  async getFleetOwner(userId: number): Promise<FleetOwner | undefined> {
    const result = await db.select().from(fleetOwners).where(eq(fleetOwners.userId, userId));
    return result[0];
  }

  async createFleetOwner(fleetOwner: InsertFleetOwner): Promise<FleetOwner> {
    const result = await db.insert(fleetOwners).values(fleetOwner).returning();
    return result[0];
  }

  async updateFleetOwner(userId: number, fleetOwnerData: Partial<InsertFleetOwner>): Promise<FleetOwner | undefined> {
    const fleetOwner = await this.getFleetOwner(userId);
    if (!fleetOwner) return undefined;

    const result = await db.update(fleetOwners)
      .set(fleetOwnerData)
      .where(eq(fleetOwners.id, fleetOwner.id))
      .returning();
    
    return result[0];
  }

  // Job operations
  async getJob(id: number): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id));
    return result[0];
  }

  async getJobsByFleetOwner(fleetOwnerId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.fleetOwnerId, fleetOwnerId));
  }

  async getJobsByLocation(location: string): Promise<Job[]> {
    return await db.select().from(jobs).where(like(jobs.location, `%${location}%`));
  }

  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(job).returning();
    return result[0];
  }

  async updateJob(id: number, jobData: Partial<Job>): Promise<Job | undefined> {
    const result = await db.update(jobs)
      .set(jobData)
      .where(eq(jobs.id, id))
      .returning();
    
    return result[0];
  }

  // OTP verification operations
  async createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification> {
    // First, delete any existing OTP for this phone number to avoid duplicates
    await db.delete(otpVerifications)
      .where(eq(otpVerifications.phoneNumber, verification.phoneNumber));
    
    const result = await db.insert(otpVerifications).values(verification).returning();
    return result[0];
  }

  async getOtpVerification(phoneNumber: string): Promise<OtpVerification | undefined> {
    const result = await db.select().from(otpVerifications)
      .where(eq(otpVerifications.phoneNumber, phoneNumber));
    return result[0];
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    // Allow "123456" as a default OTP for testing
    if (otp === "123456") {
      const verification = await this.getOtpVerification(phoneNumber);
      if (verification) {
        await db.update(otpVerifications)
          .set({ verified: true })
          .where(eq(otpVerifications.phoneNumber, phoneNumber));
      }
      return true;
    }

    const verification = await this.getOtpVerification(phoneNumber);
    if (!verification) return false;

    if (verification.otp === otp && verification.expiresAt > new Date()) {
      await db.update(otpVerifications)
        .set({ verified: true })
        .where(eq(otpVerifications.phoneNumber, phoneNumber));
      return true;
    }

    return false;
  }
}
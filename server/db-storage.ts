import { 
  users, type User, type InsertUser,
  drivers, type Driver, type InsertDriver,
  fleetOwners, type FleetOwner, type InsertFleetOwner,
  jobs, type Job, type InsertJob,
  jobApplications, type JobApplication, type InsertJobApplication,
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

  // Job application operations
  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const result = await db.insert(jobApplications).values(application).returning();
    return result[0];
  }

  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    const result = await db.select().from(jobApplications).where(eq(jobApplications.id, id));
    return result[0];
  }

  async getJobApplicationByDriverAndJob(driverId: number, jobId: number): Promise<JobApplication | undefined> {
    const result = await db.select().from(jobApplications).where(
      and(
        eq(jobApplications.driverId, driverId),
        eq(jobApplications.jobId, jobId)
      )
    );
    return result[0];
  }

  async getJobApplicationsByDriver(driverId: number): Promise<JobApplication[]> {
    return await db.select().from(jobApplications).where(eq(jobApplications.driverId, driverId));
  }

  async getJobApplicationsByJob(jobId: number): Promise<JobApplication[]> {
    return await db.select().from(jobApplications).where(eq(jobApplications.jobId, jobId));
  }

  async updateJobApplication(id: number, data: Partial<JobApplication>): Promise<JobApplication | undefined> {
    const result = await db.update(jobApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobApplications.id, id))
      .returning();

    return result[0];
  }

  // OTP verification operations
  async createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification> {
    // First, delete any existing OTP for this phone number to avoid duplicates
    await db.delete(otpVerifications)
      .where(eq(otpVerifications.phoneNumber, verification.phoneNumber));

    // Override the OTP with "123456"
    const modifiedVerification = { ...verification, otp: "123456" };

    const result = await db.insert(otpVerifications).values(modifiedVerification).returning();
    return result[0];
  }

  async getOtpVerification(phoneNumber: string): Promise<OtpVerification | undefined> {
    const result = await db.select().from(otpVerifications)
      .where(eq(otpVerifications.phoneNumber, phoneNumber));
    return result[0];
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    console.log(`Verifying OTP for ${phoneNumber}: entered code ${otp}`);

    // Always allow "123456" as the default OTP
    if (otp === "123456") {
      console.log(`Using default OTP for ${phoneNumber}`);
      // Optional: Update the verification record if it exists
      const verification = await this.getOtpVerification(phoneNumber);
      if (verification) {
        await db.update(otpVerifications)
          .set({ verified: true })
          .where(eq(otpVerifications.phoneNumber, phoneNumber));
      }
      return true;
    }

    console.log(`Checking database for OTP verification record for ${phoneNumber}`);
    const verification = await this.getOtpVerification(phoneNumber);

    if (!verification) {
      console.log(`No OTP verification record found for ${phoneNumber}`);
      return false;
    }

    console.log(`Found OTP record for ${phoneNumber}, stored OTP: ${verification.otp}, expires: ${verification.expiresAt}`);

    if (verification.otp === otp && verification.expiresAt > new Date()) {
      console.log(`OTP verified successfully for ${phoneNumber}`);
      await db.update(otpVerifications)
        .set({ verified: true })
        .where(eq(otpVerifications.phoneNumber, phoneNumber));
      return true;
    }

    console.log(`OTP verification failed for ${phoneNumber} - either incorrect or expired`);
    return false;
  }
}

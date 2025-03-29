import { 
  users, type User, type InsertUser,
  drivers, type Driver, type InsertDriver,
  fleetOwners, type FleetOwner, type InsertFleetOwner,
  jobs, type Job, type InsertJob,
  otpVerifications, type OtpVerification, type InsertOtpVerification
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Driver operations
  getDriver(userId: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(userId: number, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  
  // Fleet owner operations
  getFleetOwner(userId: number): Promise<FleetOwner | undefined>;
  createFleetOwner(fleetOwner: InsertFleetOwner): Promise<FleetOwner>;
  updateFleetOwner(userId: number, fleetOwner: Partial<InsertFleetOwner>): Promise<FleetOwner | undefined>;
  
  // Job operations
  getJob(id: number): Promise<Job | undefined>;
  getJobsByFleetOwner(fleetOwnerId: number): Promise<Job[]>;
  getJobsByLocation(location: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<Job>): Promise<Job | undefined>;
  
  // OTP verification operations
  createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification>;
  getOtpVerification(phoneNumber: string): Promise<OtpVerification | undefined>;
  verifyOtp(phoneNumber: string, otp: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private drivers: Map<number, Driver>;
  private fleetOwners: Map<number, FleetOwner>;
  private jobs: Map<number, Job>;
  private otpVerifications: Map<string, OtpVerification>;
  
  private userId: number;
  private driverId: number;
  private fleetOwnerId: number;
  private jobId: number;
  private otpId: number;

  constructor() {
    this.users = new Map();
    this.drivers = new Map();
    this.fleetOwners = new Map();
    this.jobs = new Map();
    this.otpVerifications = new Map();
    
    this.userId = 1;
    this.driverId = 1;
    this.fleetOwnerId = 1;
    this.jobId = 1;
    this.otpId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      profileCompleted: false,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Driver methods
  async getDriver(userId: number): Promise<Driver | undefined> {
    return Array.from(this.drivers.values()).find(
      (driver) => driver.userId === userId
    );
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.driverId++;
    const driver: Driver = { ...insertDriver, id };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(userId: number, driverData: Partial<InsertDriver>): Promise<Driver | undefined> {
    const driver = Array.from(this.drivers.values()).find(
      (driver) => driver.userId === userId
    );
    
    if (!driver) return undefined;
    
    const updatedDriver = { ...driver, ...driverData };
    this.drivers.set(driver.id, updatedDriver);
    return updatedDriver;
  }

  // Fleet owner methods
  async getFleetOwner(userId: number): Promise<FleetOwner | undefined> {
    return Array.from(this.fleetOwners.values()).find(
      (fleetOwner) => fleetOwner.userId === userId
    );
  }

  async createFleetOwner(insertFleetOwner: InsertFleetOwner): Promise<FleetOwner> {
    const id = this.fleetOwnerId++;
    const fleetOwner: FleetOwner = { ...insertFleetOwner, id };
    this.fleetOwners.set(id, fleetOwner);
    return fleetOwner;
  }

  async updateFleetOwner(userId: number, fleetOwnerData: Partial<InsertFleetOwner>): Promise<FleetOwner | undefined> {
    const fleetOwner = Array.from(this.fleetOwners.values()).find(
      (fleetOwner) => fleetOwner.userId === userId
    );
    
    if (!fleetOwner) return undefined;
    
    const updatedFleetOwner = { ...fleetOwner, ...fleetOwnerData };
    this.fleetOwners.set(fleetOwner.id, updatedFleetOwner);
    return updatedFleetOwner;
  }

  // Job methods
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobsByFleetOwner(fleetOwnerId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.fleetOwnerId === fleetOwnerId
    );
  }

  async getJobsByLocation(location: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.jobId++;
    const now = new Date();
    const job: Job = { 
      ...insertJob, 
      id, 
      isActive: true,
      createdAt: now
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: number, jobData: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...jobData };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  // OTP verification methods
  async createOtpVerification(insertOtpVerification: InsertOtpVerification): Promise<OtpVerification> {
    const id = this.otpId++;
    const now = new Date();
    const verification: OtpVerification = { 
      ...insertOtpVerification, 
      id, 
      verified: false,
      createdAt: now
    };
    this.otpVerifications.set(verification.phoneNumber, verification);
    return verification;
  }

  async getOtpVerification(phoneNumber: string): Promise<OtpVerification | undefined> {
    return this.otpVerifications.get(phoneNumber);
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const verification = this.otpVerifications.get(phoneNumber);
    
    if (!verification) return false;
    
    if (verification.otp === otp && verification.expiresAt > new Date()) {
      const updatedVerification = { ...verification, verified: true };
      this.otpVerifications.set(phoneNumber, updatedVerification);
      return true;
    }
    
    return false;
  }
}

export const storage = new MemStorage();

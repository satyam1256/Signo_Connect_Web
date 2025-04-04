import { 
  users, type User, type InsertUser,
  drivers, type Driver, type InsertDriver,
  fleetOwners, type FleetOwner, type InsertFleetOwner,
  jobs, type Job, type InsertJob,
  otpVerifications, type OtpVerification, type InsertOtpVerification,
  fuelPumps, type FuelPump, type InsertFuelPump,
  vehicles, type Vehicle, type InsertVehicle,
  driverAssessments, type DriverAssessment, type InsertDriverAssessment,
  notifications, type Notification, type InsertNotification,
  referrals, type Referral, type InsertReferral,
  tolls, type Toll, type InsertToll
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
  getDriverRatings(driverId: number): Promise<any>;

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

  // Fuel pump operations
  getNearbyFuelPumps(coordinates: [number, number][]): Promise<any>;
  createFuelPump(fuelPump: InsertFuelPump): Promise<FuelPump>;

  // Vehicle operations
  getVehicleByRegistration(registrationNumber: string): Promise<Vehicle | undefined>;
  getVehiclesByTransporter(transporterId: number): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle | undefined>;

  // Driver assessment operations
  getDriverAssessment(id: number): Promise<DriverAssessment | undefined>;
  getDriverAssessmentsByDriver(driverId: number, status?: string): Promise<DriverAssessment[]>;
  createDriverAssessment(assessment: InsertDriverAssessment): Promise<DriverAssessment>;
  updateDriverAssessment(id: number, assessment: Partial<DriverAssessment>): Promise<DriverAssessment | undefined>;

  // Notification operations
  getNotifications(userId: number, userType: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;

  // Referral operations
  getReferralsByReferrer(referrerId: number): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferral(id: number, referral: Partial<Referral>): Promise<Referral | undefined>;

  // Toll operations
  getTollsAlongRoute(coordinates: [number, number][]): Promise<any>;
  createToll(toll: InsertToll): Promise<any>;
}

export class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private drivers = new Map<number, Driver>();
  private fleetOwners = new Map<number, FleetOwner>();
  private jobs = new Map<number, Job>();
  private otpVerifications = new Map<string, OtpVerification>();
  private fuelPumps = new Map<number, FuelPump>();
  private vehicles = new Map<number, Vehicle>();
  private driverAssessments = new Map<number, DriverAssessment>();
  private notifications = new Map<number, Notification>();
  private referrals = new Map<number, Referral>();
  private tolls = new Map<number, Toll>();

  private userId = 1;
  private driverId = 1;
  private fleetOwnerId = 1;
  private jobId = 1;
  private otpId = 1;
  private fuelPumpId = 1;
  private vehicleId = 1;
  private assessmentId = 1;
  private notificationId = 1;
  private referralId = 1;
  private tollId = 1;

  constructor() {
    this.resetData();
  }

  // Reset all data (useful for development/testing)
  resetData() {
    this.users = new Map();
    this.drivers = new Map();
    this.fleetOwners = new Map();
    this.jobs = new Map();
    this.otpVerifications = new Map();
    this.fuelPumps = new Map();
    this.vehicles = new Map();
    this.driverAssessments = new Map();
    this.notifications = new Map();
    this.referrals = new Map();
    this.tolls = new Map();

    this.userId = 1;
    this.driverId = 1;
    this.fleetOwnerId = 1;
    this.jobId = 1;
    this.otpId = 1;
    this.fuelPumpId = 1;
    this.vehicleId = 1;
    this.assessmentId = 1;
    this.notificationId = 1;
    this.referralId = 1;
    this.tollId = 1;

    console.log('[MemStorage] Data has been reset');
    return true;
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
      email: insertUser.email ?? null,
      language: insertUser.language ?? null,
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
    const driver: Driver = { 
      ...insertDriver, 
      id,
      preferredLocations: insertDriver.preferredLocations ?? null,
      drivingLicense: insertDriver.drivingLicense ?? null,
      identityProof: insertDriver.identityProof ?? null,
      experience: insertDriver.experience ?? null,
      vehicleTypes: insertDriver.vehicleTypes ?? null
    };
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
    const fleetOwner: FleetOwner = { 
      ...insertFleetOwner, 
      id,
      preferredLocations: insertFleetOwner.preferredLocations ?? null,
      companyName: insertFleetOwner.companyName ?? null,
      fleetSize: insertFleetOwner.fleetSize ?? null,
      registrationDoc: insertFleetOwner.registrationDoc ?? null
    };
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
      createdAt: now,
      salary: insertJob.salary ?? null,
      description: insertJob.description ?? null,
      requirements: insertJob.requirements ?? null
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
    // Allow "123456" as a default OTP for testing
    if (otp === "123456") {
      const verification = this.otpVerifications.get(phoneNumber);
      if (verification) {
        const updatedVerification = { ...verification, verified: true };
        this.otpVerifications.set(phoneNumber, updatedVerification);
      }
      return true;
    }

    const verification = this.otpVerifications.get(phoneNumber);

    if (!verification) return false;

    if (verification.otp === otp && verification.expiresAt > new Date()) {
      const updatedVerification = { ...verification, verified: true };
      this.otpVerifications.set(phoneNumber, updatedVerification);
      return true;
    }

    return false;
  }

  // Fuel pump methods
  async getNearbyFuelPumps(coordinates: [number, number][]): Promise<any> {
    // Return a hard-coded response matching the structure from Frappe API
    return {
      message: "Fuel pumps found successfully",
      data: [
        {
          id: 1,
          name: "Bharat Petroleum - Mumbai Central",
          location: "Mumbai Central, Mumbai",
          coordinates: [18.969266, 72.819591],
          isOpen24Hours: true,
          fuelTypes: ["Petrol", "Diesel", "CNG"],
          amenities: ["Restroom", "Food", "ATM"],
          rating: 4.2,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Hindustan Petroleum - Bandra East",
          location: "Bandra East, Mumbai",
          coordinates: [19.059824, 72.855173],
          isOpen24Hours: true,
          fuelTypes: ["Petrol", "Diesel"],
          amenities: ["Restroom", "Service Center"],
          rating: 4.0,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          name: "Indian Oil - Andheri West",
          location: "Andheri West, Mumbai",
          coordinates: [19.120101, 72.847859],
          isOpen24Hours: false,
          fuelTypes: ["Petrol", "Diesel", "Electric Charging"],
          amenities: ["Restroom", "Food", "Convenience Store"],
          rating: 4.5,
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  async createFuelPump(fuelPump: InsertFuelPump): Promise<FuelPump> {
    const id = this.fuelPumpId++;
    const now = new Date();
    const newFuelPump: FuelPump = {
      ...fuelPump,
      id,
      createdAt: now,
      amenities: fuelPump.amenities ?? null,
      fuelTypes: fuelPump.fuelTypes ?? null,
      isOpen24Hours: fuelPump.isOpen24Hours ?? null,
      rating: fuelPump.rating ?? null
    };
    this.fuelPumps.set(id, newFuelPump);
    return newFuelPump;
  }

  // Vehicle methods
  async getVehicleByRegistration(registrationNumber: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(
      (vehicle) => vehicle.registrationNumber === registrationNumber
    );
  }

  async getVehiclesByTransporter(transporterId: number): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(
      (vehicle) => vehicle.transporterId === transporterId
    );
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleId++;
    const now = new Date();
    const newVehicle: Vehicle = {
      ...vehicle,
      id,
      createdAt: now,
      year: vehicle.year ?? null,
      capacityTons: vehicle.capacityTons ?? null,
      insuranceStatus: vehicle.insuranceStatus ?? null,
      lastServiceDate: vehicle.lastServiceDate ?? null
    };
    this.vehicles.set(id, newVehicle);
    return newVehicle;
  }

  async updateVehicle(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;

    const updatedVehicle = { ...vehicle, ...vehicleData };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  // Driver assessment methods
  async getDriverAssessment(id: number): Promise<DriverAssessment | undefined> {
    return this.driverAssessments.get(id);
  }

  async getDriverAssessmentsByDriver(driverId: number, status?: string): Promise<DriverAssessment[]> {
    const assessments = Array.from(this.driverAssessments.values()).filter(
      (assessment) => assessment.driverId === driverId
    );
    
    if (status) {
      return assessments.filter(assessment => assessment.status === status);
    }
    
    return assessments;
  }

  async createDriverAssessment(assessment: InsertDriverAssessment): Promise<DriverAssessment> {
    const id = this.assessmentId++;
    const now = new Date();
    const newAssessment: DriverAssessment = {
      ...assessment,
      id,
      createdAt: now,
      score: assessment.score ?? null,
      feedbackNotes: assessment.feedbackNotes ?? null,
      completedAt: assessment.completedAt ?? null
    };
    this.driverAssessments.set(id, newAssessment);
    return newAssessment;
  }

  async updateDriverAssessment(id: number, assessmentData: Partial<DriverAssessment>): Promise<DriverAssessment | undefined> {
    const assessment = this.driverAssessments.get(id);
    if (!assessment) return undefined;

    const updatedAssessment = { ...assessment, ...assessmentData };
    this.driverAssessments.set(id, updatedAssessment);
    return updatedAssessment;
  }

  // Notification methods
  async getNotifications(userId: number, userType: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.userId === userId && notification.userType === userType
    );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const now = new Date();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: now,
      read: false,
      actionUrl: notification.actionUrl ?? null
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // Referral methods
  async getReferralsByReferrer(referrerId: number): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(
      (referral) => referral.referrerId === referrerId
    );
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const id = this.referralId++;
    const now = new Date();
    const newReferral: Referral = {
      ...referral,
      id,
      createdAt: now,
      referredName: referral.referredName ?? null,
      reward: referral.reward ?? null,
      completedAt: referral.completedAt ?? null
    };
    this.referrals.set(id, newReferral);
    return newReferral;
  }

  async updateReferral(id: number, referralData: Partial<Referral>): Promise<Referral | undefined> {
    const referral = this.referrals.get(id);
    if (!referral) return undefined;

    const updatedReferral = { ...referral, ...referralData };
    this.referrals.set(id, updatedReferral);
    return updatedReferral;
  }

  // Toll methods
  async getTollsAlongRoute(coordinates: [number, number][]): Promise<any> {
    // Return a hard-coded response matching the structure from Frappe API
    return {
      message: "Tolls found successfully",
      data: [
        {
          id: 1,
          name: "Mumbai-Pune Expressway Toll",
          location: "Mumbai-Pune Expressway",
          coordinates: [19.033858, 73.103633],
          feeAmount: 230,
          highway: "Mumbai-Pune Expressway",
          paymentMethods: ["Cash", "FASTag", "Credit Card"],
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Vashi Toll Plaza",
          location: "Vashi, Navi Mumbai",
          coordinates: [19.075983, 72.991371],
          feeAmount: 35,
          highway: "Sion-Panvel Highway",
          paymentMethods: ["Cash", "FASTag"],
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          name: "Airoli Toll Plaza",
          location: "Airoli, Navi Mumbai",
          coordinates: [19.153688, 72.996262],
          feeAmount: 30,
          highway: "Eastern Express Highway",
          paymentMethods: ["Cash", "FASTag", "UPI"],
          createdAt: new Date().toISOString()
        }
      ],
      total_toll_fee: 295
    };
  }

  async createToll(toll: InsertToll): Promise<Toll> {
    const id = this.tollId++;
    const now = new Date();
    const newToll: Toll = {
      ...toll,
      id,
      createdAt: now,
      feeAmount: toll.feeAmount ?? null,
      highway: toll.highway ?? null,
      paymentMethods: toll.paymentMethods ?? null
    };
    this.tolls.set(id, newToll);
    return newToll;
  }
}

// Export the MemStorage instance
// This is a fallback used when database is not available
export const storage = new MemStorage();

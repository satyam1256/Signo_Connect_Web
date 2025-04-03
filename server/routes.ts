import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { IStorage, storage as memStorage } from "./storage";
import { DbStorage } from "./db-storage";
import { 
  userRegistrationSchema, 
  verifyOtpSchema, 
  driverInsertSchema, 
  fleetOwnerInsertSchema,
  jobInsertSchema,
  jobApplicationSchema,
  UserType
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

function generateOTP(): string {
  // Always return "123456" for testing
  return "123456";
}

export async function registerRoutes(app: Express, customStorage?: IStorage): Promise<Server> {
  // Use the provided storage or fall back to memory storage
  const storage = customStorage || memStorage;
  
  // Only reset memory storage if we're not using the DB storage
  if (!customStorage || !(customStorage instanceof DbStorage)) {
    (memStorage as any).resetData();
  }

  // Error handler middleware
  const handleError = (err: Error, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ error: validationError.message });
    }

    console.error("API Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  };

  // User registration
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const userData = userRegistrationSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByPhone(userData.phoneNumber);
      if (existingUser) {
        // User exists, generate and send OTP for login
        const otp = "123456"; // Fixed OTP for testing
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP valid for 15 minutes

        // Update or create OTP verification
        await storage.createOtpVerification({
          phoneNumber: userData.phoneNumber,
          otp,
          expiresAt
        });

        return res.status(409).json({ 
          error: "User with this phone number already exists",
          message: "OTP sent for login",
          userId: existingUser.id,
          otpForDemo: otp
        });
      }

      // Generate OTP for verification
      const otp = "123456"; // Fixed OTP for testing
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP valid for 15 minutes

      await storage.createOtpVerification({
        phoneNumber: userData.phoneNumber,
        otp,
        expiresAt
      });

      // Create user
      const user = await storage.createUser(userData);

      // In a real application, we would send SMS with OTP
      // For demo purposes, return the OTP directly
      return res.status(200).json({ 
        userId: user.id, 
        message: "OTP sent to your phone number", 
        otpForDemo: otp 
      });

    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Verify OTP
  app.post("/api/verify-otp", async (req: Request, res: Response) => {
    try {
      const { phoneNumber, otp } = verifyOtpSchema.parse(req.body);

      const isVerified = await storage.verifyOtp(phoneNumber, otp);

      if (isVerified) {
        const user = await storage.getUserByPhone(phoneNumber);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Create initial profile based on user type if it doesn't exist
        if (user.userType === UserType.DRIVER) {
          // Check if driver profile exists
          const existingDriver = await storage.getDriver(user.id);
          if (!existingDriver) {
            // Create initial driver profile
            await storage.createDriver({
              userId: user.id,
              preferredLocations: [],
              experience: "0", // Use string type as per schema
              vehicleTypes: []
            });
            console.log(`Created initial driver profile for user ${user.id}`);
          }
        } else if (user.userType === UserType.FLEET_OWNER) {
          // Check if fleet owner profile exists
          const existingFleetOwner = await storage.getFleetOwner(user.id);
          if (!existingFleetOwner) {
            // Create initial fleet owner profile
            await storage.createFleetOwner({
              userId: user.id,
              companyName: "",
              fleetSize: "0", // Use string type as per schema
              preferredLocations: []
            });
            console.log(`Created initial fleet owner profile for user ${user.id}`);
          }
        }

        return res.status(200).json({ 
          userId: user.id,
          userType: user.userType,
          verified: true
        });
      } else {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Create or update driver profile
  app.post("/api/driver-profile", async (req: Request, res: Response) => {
    try {
      // Handle potential file uploads from the request
      // Extract non-file data for validation with Zod schema
      const {
        profileImage,
        licenseFile,
        identityFile,
        ...nonFileData
      } = req.body;

      // Validate the standard profile data
      const driverData = driverInsertSchema.parse(nonFileData);

      // Check if user exists
      const user = await storage.getUser(driverData.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.userType !== UserType.DRIVER) {
        return res.status(403).json({ error: "User is not a driver" });
      }

      // Add any image data that was passed in the request
      const profileToUpdate = { ...driverData };
      
      // Handle profile image
      if (profileImage) {
        profileToUpdate.profileImage = profileImage;
      }
      
      // Handle license document
      if (licenseFile && driverData.drivingLicense) {
        // We're just storing the license number, the actual file would typically 
        // be uploaded to cloud storage and a URL saved here
        console.log("License file received");
      }
      
      // Handle identity document
      if (identityFile && driverData.identityProof) {
        // We're just storing the ID number, the actual file would typically 
        // be uploaded to cloud storage and a URL saved here
        console.log("Identity file received");
      }
      
      // Check if driver profile already exists
      const existingDriver = await storage.getDriver(driverData.userId);

      let driver;
      if (existingDriver) {
        // Update existing profile
        driver = await storage.updateDriver(driverData.userId, profileToUpdate);
      } else {
        // Create new profile
        driver = await storage.createDriver(profileToUpdate);
      }

      // Update user's profile completion status
      await storage.updateUser(user.id, { profileCompleted: true });

      return res.status(200).json(driver);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Create or update fleet owner profile
  app.post("/api/fleet-owner-profile", async (req: Request, res: Response) => {
    try {
      const fleetOwnerData = fleetOwnerInsertSchema.parse(req.body);

      // Check if user exists
      const user = await storage.getUser(fleetOwnerData.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.userType !== UserType.FLEET_OWNER) {
        return res.status(403).json({ error: "User is not a fleet owner" });
      }

      // Check if fleet owner profile already exists
      const existingFleetOwner = await storage.getFleetOwner(fleetOwnerData.userId);

      let fleetOwner;
      if (existingFleetOwner) {
        // Update existing profile
        fleetOwner = await storage.updateFleetOwner(fleetOwnerData.userId, fleetOwnerData);
      } else {
        // Create new profile
        fleetOwner = await storage.createFleetOwner(fleetOwnerData);
      }

      // Update user's profile completion status
      await storage.updateUser(user.id, { profileCompleted: true });

      return res.status(200).json(fleetOwner);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get user profile
  app.get("/api/user/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let profileData = null;

      if (user.userType === UserType.DRIVER) {
        profileData = await storage.getDriver(userId);
      } else if (user.userType === UserType.FLEET_OWNER) {
        profileData = await storage.getFleetOwner(userId);
      }

      return res.status(200).json({
        user,
        profile: profileData
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Create job
  app.post("/api/jobs", async (req: Request, res: Response) => {
    try {
      const jobData = jobInsertSchema.parse(req.body);

      // Check if fleet owner exists
      const fleetOwner = await storage.getFleetOwner(jobData.fleetOwnerId);
      if (!fleetOwner) {
        return res.status(404).json({ error: "Fleet owner not found" });
      }

      const job = await storage.createJob(jobData);

      return res.status(201).json(job);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get jobs by location
  app.get("/api/jobs", async (req: Request, res: Response) => {
    try {
      const { location } = req.query;

      if (typeof location !== 'string') {
        return res.status(400).json({ error: "Location parameter is required" });
      }

      const jobs = await storage.getJobsByLocation(location);

      return res.status(200).json(jobs);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get jobs by fleet owner
  app.get("/api/fleet-owner/:id/jobs", async (req: Request, res: Response) => {
    try {
      const fleetOwnerId = parseInt(req.params.id);

      if (isNaN(fleetOwnerId)) {
        return res.status(400).json({ error: "Invalid fleet owner ID" });
      }

      const jobs = await storage.getJobsByFleetOwner(fleetOwnerId);

      return res.status(200).json(jobs);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Apply for a job
  app.post("/api/job-applications", async (req: Request, res: Response) => {
    try {
      const applicationData = jobApplicationSchema.parse(req.body);

      // Check if driver exists
      const driver = await storage.getDriver(applicationData.driverId);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      // Check if job exists
      const job = await storage.getJob(applicationData.jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Check if application already exists
      const existingApplication = await storage.getJobApplicationByDriverAndJob(
        applicationData.driverId,
        applicationData.jobId
      );

      if (existingApplication) {
        return res.status(409).json({ 
          error: "Already applied to this job",
          application: existingApplication
        });
      }

      // Create the application
      const application = await storage.createJobApplication(applicationData);

      return res.status(201).json(application);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get job applications for a driver
  app.get("/api/driver/:driverId/job-applications", async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.driverId);

      if (isNaN(driverId)) {
        return res.status(400).json({ error: "Invalid driver ID" });
      }

      // Check if driver exists
      const driver = await storage.getDriver(driverId);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      const applications = await storage.getJobApplicationsByDriver(driverId);

      // Get job details for each application
      const applicationsWithJobs = await Promise.all(
        applications.map(async (application) => {
          const job = await storage.getJob(application.jobId);
          return {
            ...application,
            job
          };
        })
      );

      return res.status(200).json(applicationsWithJobs);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get job applications for a job
  app.get("/api/jobs/:jobId/applications", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId);

      if (isNaN(jobId)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }

      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const applications = await storage.getJobApplicationsByJob(jobId);

      // Get driver details for each application
      const applicationsWithDrivers = await Promise.all(
        applications.map(async (application) => {
          const driver = await storage.getDriver(application.driverId);
          // Get user data for the driver
          const user = driver ? await storage.getUser(driver.userId) : null;
          
          return {
            ...application,
            driver,
            driverName: user ? user.fullName : null
          };
        })
      );

      return res.status(200).json(applicationsWithDrivers);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Check if a driver has applied to a specific job
  app.get("/api/job-applications/check", async (req: Request, res: Response) => {
    try {
      const { driverId, jobId } = req.query;
      
      if (!driverId || !jobId) {
        return res.status(400).json({ error: "driverId and jobId are required parameters" });
      }

      const driverIdNum = parseInt(driverId as string);
      const jobIdNum = parseInt(jobId as string);

      if (isNaN(driverIdNum) || isNaN(jobIdNum)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const application = await storage.getJobApplicationByDriverAndJob(driverIdNum, jobIdNum);
      
      return res.status(200).json({
        hasApplied: !!application,
        application: application || null
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Update job application status
  app.patch("/api/job-applications/:id", async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.id);
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        return res.status(404).json({ error: "Job application not found" });
      }

      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedApplication = await storage.updateJobApplication(applicationId, { 
        status,
        updatedAt: new Date()
      });

      return res.status(200).json(updatedApplication);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

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
              experience: 0,
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
              fleetSize: 0,
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
      const driverData = driverInsertSchema.parse(req.body);

      // Check if user exists
      const user = await storage.getUser(driverData.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.userType !== UserType.DRIVER) {
        return res.status(403).json({ error: "User is not a driver" });
      }

      // Check if driver profile already exists
      const existingDriver = await storage.getDriver(driverData.userId);

      let driver;
      if (existingDriver) {
        // Update existing profile
        driver = await storage.updateDriver(driverData.userId, driverData);
      } else {
        // Create new profile
        driver = await storage.createDriver(driverData);
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

  const httpServer = createServer(app);
  return httpServer;
}

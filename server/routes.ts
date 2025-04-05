import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  userRegistrationSchema, 
  verifyOtpSchema, 
  driverInsertSchema, 
  fleetOwnerInsertSchema,
  jobInsertSchema,
  UserType,
  type User,
  type Driver
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

function generateOTP(): string {
  // Always return "123456" for testing
  return "123456";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Reset storage data on server start (for development purposes)
  storage.resetData();

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
        return res.status(409).json({ error: "User with this phone number already exists" });
      }

      // Generate OTP for verification
      const otp = generateOTP();
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

  // Get all drivers
  app.get("/api/resource/Drivers", async (req: Request, res: Response) => {
    try {
      // Get all drivers (implement a method to get all drivers in a real application)
      // Since we don't have a direct method to get all users, we'll use a workaround
      // In a real application with a database, we would use a proper query
      
      // Collect drivers by trying user IDs (simplified for demo)
      const drivers = [];
      // Assume we have a reasonable number of users to check (for demo purposes)
      for (let i = 1; i <= 100; i++) {
        const user = await storage.getUser(i);
        if (user && user.userType === UserType.DRIVER) {
          const driverProfile = await storage.getDriver(user.id);
          drivers.push({
            id: user.id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            profileCompleted: user.profileCompleted,
            ...(driverProfile || {}) // Include driver-specific details if exists
          });
        }
      }
      
      return res.status(200).json(drivers);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });
  
  // Get a specific driver by ID
  app.get("/api/resource/Drivers/:id", async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      
      if (isNaN(driverId)) {
        return res.status(400).json({ error: "Invalid driver ID" });
      }
      
      const user = await storage.getUser(driverId);
      if (!user) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      if (user.userType !== UserType.DRIVER) {
        return res.status(400).json({ error: "User is not a driver" });
      }
      
      const driverProfile = await storage.getDriver(driverId);
      
      return res.status(200).json({
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        profileCompleted: user.profileCompleted,
        ...driverProfile
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });
  
  // Create a new driver (registration endpoint)
  app.post("/api/resource/Drivers", async (req: Request, res: Response) => {
    try {
      // Extract the required fields from the request body
      const { fullName, phoneNumber } = req.body;
      
      // Validate input
      if (!fullName || !phoneNumber) {
        return res.status(400).json({ error: "Full Name and Mobile Number are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(phoneNumber);
      if (existingUser) {
        return res.status(409).json({ error: "User with this phone number already exists" });
      }
      
      // Create the user with driver type
      const user = await storage.createUser({
        fullName,
        phoneNumber,
        userType: UserType.DRIVER,
        language: "en"
      });
      
      // Generate OTP for verification
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP valid for 15 minutes
      
      await storage.createOtpVerification({
        phoneNumber: user.phoneNumber,
        otp,
        expiresAt
      });
      
      // In a real application, we would send SMS with OTP
      // For demo purposes, return the OTP directly
      return res.status(201).json({ 
        userId: user.id, 
        message: "Driver registered successfully. OTP sent to your phone number", 
        otpForDemo: otp 
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });
  
  // Update driver information
  app.put("/api/resource/Drivers/:id", async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      
      if (isNaN(driverId)) {
        return res.status(400).json({ error: "Invalid driver ID" });
      }
      
      const user = await storage.getUser(driverId);
      if (!user) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      if (user.userType !== UserType.DRIVER) {
        return res.status(400).json({ error: "User is not a driver" });
      }
      
      // Update user information if provided
      const { fullName, phoneNumber, ...driverInfo } = req.body;
      
      let updatedUser = user;
      if (fullName || phoneNumber) {
        const userUpdates: Partial<User> = {};
        if (fullName) userUpdates.fullName = fullName;
        if (phoneNumber) userUpdates.phoneNumber = phoneNumber;
        
        // Check if the new phone number is already in use
        if (phoneNumber && phoneNumber !== user.phoneNumber) {
          const existingUser = await storage.getUserByPhone(phoneNumber);
          if (existingUser) {
            return res.status(409).json({ error: "Phone number already in use" });
          }
        }
        
        updatedUser = await storage.updateUser(driverId, userUpdates) as User;
      }
      
      // Update driver-specific information if any is provided
      let driverProfile = await storage.getDriver(driverId);
      
      if (Object.keys(driverInfo).length > 0) {
        if (driverProfile) {
          driverProfile = await storage.updateDriver(driverId, driverInfo) as Driver;
        } else {
          driverProfile = await storage.createDriver({
            userId: driverId,
            ...driverInfo
          });
        }
        
        // Update profile completion status based on data completeness
        const updatedDriver = await storage.getDriver(driverId);
        
        // Check if all essential fields are filled
        const isProfileComplete = Boolean(
          updatedUser.fullName && 
          updatedUser.phoneNumber && 
          updatedDriver?.location && 
          updatedDriver?.experience && 
          updatedDriver?.about && 
          updatedDriver?.vehicleTypes && 
          updatedDriver.vehicleTypes.length > 0 && 
          updatedDriver?.preferredLocations && 
          updatedDriver.preferredLocations.length > 0
        );
        
        await storage.updateUser(driverId, { profileCompleted: isProfileComplete });
        updatedUser = { ...updatedUser, profileCompleted: isProfileComplete };
      }
      
      return res.status(200).json({
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        profileCompleted: updatedUser.profileCompleted,
        ...driverProfile
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });
  
  // Delete a driver
  app.delete("/api/resource/Drivers/:id", async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      
      if (isNaN(driverId)) {
        return res.status(400).json({ error: "Invalid driver ID" });
      }
      
      const user = await storage.getUser(driverId);
      if (!user) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      if (user.userType !== UserType.DRIVER) {
        return res.status(400).json({ error: "User is not a driver" });
      }
      
      // In a real application with proper database, we would delete the user
      // Since we don't have a method to delete users in our MemStorage interface,
      // we'll return a success response for demonstration purposes
      
      return res.status(200).json({ 
        message: "Driver deleted successfully",
        note: "In a real implementation, the driver would be removed from the database"
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}

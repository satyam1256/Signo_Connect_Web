import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { 
  UserType,
  type User,
  type Driver
} from "@shared/schema";

// Error handler function
const handleError = (err: Error, res: Response) => {
  console.error(err);
  
  if (err instanceof Error) {
    return res.status(500).json({ error: err.message });
  }
  
  return res.status(500).json({ error: "An unknown error occurred" });
};

export function registerDriverProfileRoutes(app: Express): void {
  // Get driver profile by ID
  app.get("/api/resource/drivers/profile", async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.query.driver_id as string);
      
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
      
      const responseData = {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        profileCompleted: user.profileCompleted
      };
      
      // Add driver profile data without duplicating ID
      if (driverProfile) {
        const { userId, ...driverDetails } = driverProfile;
        Object.assign(responseData, driverDetails);
      }
      
      return res.status(200).json(responseData);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });
  
  // Update driver profile
  app.put("/api/resource/drivers/profile", async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.query.driver_id as string);
      
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
          if (existingUser && existingUser.id !== driverId) {
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
          updatedDriver?.preferredLocations && 
          updatedDriver?.preferredLocations.length > 0 &&
          updatedDriver?.experience && 
          updatedDriver?.vehicleTypes && 
          updatedDriver.vehicleTypes.length > 0
        );
        
        await storage.updateUser(driverId, { profileCompleted: isProfileComplete });
        updatedUser = { ...updatedUser, profileCompleted: isProfileComplete };
      }
      
      // Create response without duplicating fields
      const responseData = {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        profileCompleted: updatedUser.profileCompleted
      };
      
      // Add driver profile data without duplicating ID
      if (driverProfile) {
        const { userId, ...driverDetails } = driverProfile;
        Object.assign(responseData, driverDetails);
      }
      
      return res.status(200).json(responseData);
    } catch (err) {
      return handleError(err as Error, res);
    }
  });
}
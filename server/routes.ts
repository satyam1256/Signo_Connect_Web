 import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { IStorage, storage as memStorage } from "./storage";
import { DbStorage } from "./db-storage";
import { 
  userRegistrationSchema, 
  verifyOtpSchema, 
  driverInsertSchema, 
  fleetOwnerInsertSchema,
  jobInsertSchema,
  nearbyFuelPumpsSchema,
  routesWithTollsSchema,
  submitAssessmentSchema,
  driverAssessmentInsertSchema,
  vehicleInsertSchema,
  referralInsertSchema,
  notificationInsertSchema,
  frappeDriverCreateSchema,
  frappeDriverUpdateSchema,
  frappeDriversQuerySchema,
  UserType,
  User
} from "@shared/schema";

import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

/**
 * Generates a Frappe-style document name based on the naming series
 * Format: {series}{5-digit sequential number}
 * Example: SIG00001, SIG00002, etc.
 */
function generateFrappeDocName(series: string): string {
  // Generate a 5-digit random number between 10000 and 99999
  // In a real implementation, this would use a database sequence
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${series}${randomNum}`;
}

function generateOTP(): string {
  // Always return "123456" for testing
  return "123456";
}

export async function registerRoutes(app: Express, customStorage?: IStorage): Promise<Server> {
  console.log("RegisterRoutes: Starting route registration process...");
  
  // Use the provided storage or fall back to memory storage
  console.log("RegisterRoutes: Storage type received:", customStorage ? customStorage.constructor.name : "none");
  const storage = customStorage || memStorage;
  console.log("RegisterRoutes: Final storage selection:", storage.constructor.name);
  
  // Only reset memory storage if we're not using the DB storage
  if (!customStorage) {
    console.log("RegisterRoutes: Using memory storage, resetting data...");
    (memStorage as any).resetData();
  } else if (customStorage instanceof DbStorage) {
    console.log("RegisterRoutes: Using database storage, not resetting memory data");
  } else {
    console.log("RegisterRoutes: Using custom storage, not resetting memory data");
  }
  
  // TypeScript type annotations for sum & toll in reduce function
  const getTotalTollFee = (tolls: any[]): number => {
    return tolls.reduce((sum: number, toll: any) => sum + (toll.feeAmount || 0), 0);
  };

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

      // Check for hardcoded test OTP "123456" first
      let isVerified = otp === "123456";
      
      // Only verify in DB if not using the test code
      if (!isVerified) {
        try {
          isVerified = await storage.verifyOtp(phoneNumber, otp);
        } catch (error) {
          console.error("Error verifying OTP in database:", error);
          // If there was a database error but the OTP is 123456, still allow login
          isVerified = otp === "123456";
        }
      }
      
      console.log("OTP verification result:", isVerified, "for otp:", otp);
      
      if (isVerified) {
        let user;
        try {
          user = await storage.getUserByPhone(phoneNumber);
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }
        } catch (error) {
          console.error("Error getting user by phone:", error);
          return res.status(500).json({ error: "Error retrieving user" });
        }

        // Create initial profile based on user type if it doesn't exist
        if (user.userType === UserType.DRIVER) {
          // Check if driver profile exists
          let existingDriver;
          try {
            existingDriver = await storage.getDriver(user.id);
          } catch (error) {
            console.error("Error checking for driver profile:", error);
            // Continue execution, we'll create the profile
          }
          
          if (!existingDriver) {
            // Create initial driver profile with required fields only
            try {
              await storage.createDriver({
                userId: user.id,
                preferredLocations: [],
                experience: "0", // Use string type as per schema
                vehicleTypes: []
              });
              console.log(`Created initial driver profile for user ${user.id}`);
            } catch (error) {
              console.error("Error creating driver profile:", error);
              // Continue execution, we still want to return the user
            }
          }
        } else if (user.userType === UserType.FLEET_OWNER) {
          // Check if fleet owner profile exists
          let existingFleetOwner;
          try {
            existingFleetOwner = await storage.getFleetOwner(user.id);
          } catch (error) {
            console.error("Error checking for fleet owner profile:", error);
            // Continue execution, we'll create the profile
          }
          
          if (!existingFleetOwner) {
            // Create initial fleet owner profile with required fields only
            try {
              await storage.createFleetOwner({
                userId: user.id,
                companyName: "",
                fleetSize: "0", // Use string type as per schema
                preferredLocations: []
              });
              console.log(`Created initial fleet owner profile for user ${user.id}`);
            } catch (error) {
              console.error("Error creating fleet owner profile:", error);
              // Continue execution, we still want to return the user
            }
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
      // Extract all data from request
      const { email, location, about, availability, skills, profileImage, ...driverRequestData } = req.body;
      
      // Create driver data object with all fields
      const driverData = {
        ...driverInsertSchema.parse(driverRequestData),
        location: location || "",
        about: about || "Professional driver looking for opportunities",
        availability: availability || "full-time",
        skills: skills || ["Driving"],
        profileImage: profileImage || null
      };

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

      // Update user's email and profile completion status
      const userUpdateData: { email?: string; profileCompleted: boolean; } = { profileCompleted: true };
      
      // Add email to user update if provided
      if (email) {
        userUpdateData.email = email;
      }
      
      // Update user record with email and completion status
      const updatedUser = await storage.updateUser(user.id, userUpdateData);

      // Return combined data including email and all the profile fields
      return res.status(200).json({
        ...driver,
        email: updatedUser?.email,
        location: driverData.location,
        about: driverData.about,
        availability: driverData.availability,
        skills: driverData.skills,
        profileImage: driverData.profileImage
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Create or update fleet owner profile
  app.post("/api/fleet-owner-profile", async (req: Request, res: Response) => {
    try {
      // Extract all data from request
      const { email, location, about, businessType, regNumber, profileImage, ...fleetOwnerRequestData } = req.body;
      
      // Create fleet owner data object with all fields
      const fleetOwnerData = {
        ...fleetOwnerInsertSchema.parse(fleetOwnerRequestData),
        location: location || "",
        about: about || "Fleet owner looking for reliable drivers",
        businessType: businessType || "Transportation",
        regNumber: regNumber || "",
        profileImage: profileImage || null
      };

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

      // Update user's email and profile completion status
      const userUpdateData: { email?: string; profileCompleted: boolean; } = { profileCompleted: true };
      
      // Add email to user update if provided
      if (email) {
        userUpdateData.email = email;
      }
      
      // Update user record with email and completion status
      const updatedUser = await storage.updateUser(user.id, userUpdateData);

      // Return combined data including email and all profile fields
      return res.status(200).json({
        ...fleetOwner,
        email: updatedUser?.email,
        location: fleetOwnerData.location,
        about: fleetOwnerData.about,
        businessType: fleetOwnerData.businessType,
        regNumber: fleetOwnerData.regNumber,
        profileImage: fleetOwnerData.profileImage
      });
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

  // Get drivers directory for transporters (fleet owners)
  app.get("/api/drivers-directory", async (req: Request, res: Response) => {
    try {
      const { transporter_id, limit_start, limit_page_length, qtype, q } = req.query;
      
      // Validate the required parameter
      if (!transporter_id) {
        return res.status(400).json({ error: "Transporter ID is required" });
      }

      // Get all drivers (in a real implementation we would filter and paginate)
      const drivers = await Promise.all((await storage.getUser(1) ? [1] : [])
        .map(async id => {
          const user = await storage.getUser(id);
          if (user?.userType === UserType.DRIVER) {
            const driver = await storage.getDriver(user.id);
            if (driver) {
              return {
                id: driver.id,
                userId: driver.userId,
                name: user.fullName,
                phone: user.phoneNumber,
                experience: driver.experience,
                vehicleTypes: driver.vehicleTypes,
                preferredLocations: driver.preferredLocations,
                availability: qtype === "availability" && q === "1" ? "available" : "busy",
                rating: 4.5 // Mock rating
              };
            }
          }
          return null;
        }));

      // Filter out null values and apply filtering based on query parameters
      const filteredDrivers = drivers.filter(driver => driver !== null);
      
      return res.status(200).json({
        message: "Drivers directory fetched successfully",
        data: filteredDrivers,
        total: filteredDrivers.length
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get nearby fuel pumps
  app.post("/api/nearby-fuel-pumps", async (req: Request, res: Response) => {
    try {
      const { coordinates } = nearbyFuelPumpsSchema.parse(req.body);
      
      // Using a single sample coordinate for demonstration purposes
      const [lat, lng] = coordinates[0] || [28.6417, 77.2178];

      // Get nearby fuel pumps (in a real world scenario, we would use geospatial queries)
      const fuelPumps = await storage.getNearbyFuelPumps(coordinates);
      
      // If no fuel pumps are found, create some sample ones
      if (fuelPumps.length === 0) {
        // Create sample fuel pumps near the provided coordinates
        const sampleFuelPumps = [
          {
            name: "Indian Oil",
            address: "Airport Road, Delhi",
            latitude: lat + 0.01,
            longitude: lng + 0.01,
            amenities: ["Restaurant", "Restroom", "Convenience Store"],
            fuelTypes: ["Petrol", "Diesel", "CNG"],
            isOpen24Hours: true,
            rating: 4.2
          },
          {
            name: "Bharat Petroleum",
            address: "NH-8, Delhi",
            latitude: lat - 0.01,
            longitude: lng - 0.01,
            amenities: ["ATM", "Restroom"],
            fuelTypes: ["Petrol", "Diesel"],
            isOpen24Hours: false,
            rating: 3.8
          },
          {
            name: "Hindustan Petroleum",
            address: "MG Road, Delhi",
            latitude: lat + 0.02,
            longitude: lng - 0.02,
            amenities: ["Service Station", "Restroom", "Car Wash"],
            fuelTypes: ["Petrol", "Diesel"],
            isOpen24Hours: true,
            rating: 4.0
          }
        ];

        // Add sample fuel pumps to storage
        await Promise.all(sampleFuelPumps.map(fp => storage.createFuelPump(fp)));
      }
      
      // Get the updated list of fuel pumps
      const nearbyFuelPumps = await storage.getNearbyFuelPumps(coordinates);
      
      return res.status(200).json({
        message: "Nearby fuel pumps fetched successfully",
        data: nearbyFuelPumps
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get routes with toll information
  app.post("/api/routes-with-tolls", async (req: Request, res: Response) => {
    try {
      const { coordinates } = routesWithTollsSchema.parse(req.body);
      
      // Get all tolls along the route
      const tolls = await storage.getTollsAlongRoute(coordinates);
      
      // If no tolls are found, create some sample ones
      if (tolls.length === 0) {
        // Create sample tolls along the route
        const [startCoord, endCoord] = coordinates;
        const [startLat, startLng] = startCoord || [19.076, 72.8777];
        const [endLat, endLng] = endCoord || [28.7041, 77.1025];
        
        // Create tolls at different points between start and end
        const midLat1 = startLat + (endLat - startLat) * 0.25;
        const midLng1 = startLng + (endLng - startLng) * 0.25;
        
        const midLat2 = startLat + (endLat - startLat) * 0.5;
        const midLng2 = startLng + (endLng - startLng) * 0.5;
        
        const midLat3 = startLat + (endLat - startLat) * 0.75;
        const midLng3 = startLng + (endLng - startLng) * 0.75;
        
        const sampleTolls = [
          {
            name: "Mumbai-Pune Expressway Toll",
            latitude: midLat1,
            longitude: midLng1,
            feeAmount: 230,
            highway: "Mumbai-Pune Expressway",
            paymentMethods: ["Cash", "FASTag", "Credit Card"]
          },
          {
            name: "Nashik Highway Toll",
            latitude: midLat2,
            longitude: midLng2,
            feeAmount: 185,
            highway: "NH-3",
            paymentMethods: ["Cash", "FASTag"]
          },
          {
            name: "Delhi-Jaipur Highway Toll",
            latitude: midLat3,
            longitude: midLng3,
            feeAmount: 220,
            highway: "NH-8",
            paymentMethods: ["Cash", "FASTag", "UPI"]
          }
        ];
        
        // Add sample tolls to storage
        await Promise.all(sampleTolls.map(toll => storage.createToll(toll)));
      }
      
      // Get the updated list of tolls
      const routeTolls = await storage.getTollsAlongRoute(coordinates);
      
      // Calculate route details
      const [startCoord, endCoord] = coordinates;
      const distanceKm = Math.floor(Math.random() * 1000) + 500; // Random distance between 500-1500 km
      const durationHours = Math.floor(distanceKm / 60); // Assuming average speed of 60 km/h
      const totalTollFee = getTotalTollFee(routeTolls);
      
      return res.status(200).json({
        message: "Route information fetched successfully",
        data: {
          distance: {
            value: distanceKm,
            unit: "kilometers"
          },
          duration: {
            value: durationHours,
            unit: "hours"
          },
          tolls: routeTolls,
          totalTollFee,
          fuelEstimate: {
            liters: Math.floor(distanceKm / 5), // Assuming 5 km/l mileage
            cost: Math.floor(distanceKm / 5) * 100 // Assuming ₹100/liter
          }
        }
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get driver assessments
  app.get("/api/driver-assessments", async (req: Request, res: Response) => {
    try {
      const { driver_id, status } = req.query;
      
      if (!driver_id) {
        return res.status(400).json({ error: "Driver ID is required" });
      }
      
      const driverId = parseInt(driver_id as string);
      if (isNaN(driverId)) {
        return res.status(400).json({ error: "Invalid driver ID" });
      }
      
      // Get assessments for the driver with optional status filter
      const assessments = await storage.getDriverAssessmentsByDriver(
        driverId, 
        status as string
      );
      
      return res.status(200).json({
        message: "Driver assessments fetched successfully",
        data: assessments
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Submit driver assessment
  app.post("/api/submit-assessment", async (req: Request, res: Response) => {
    try {
      const assessmentData = submitAssessmentSchema.parse(req.body);
      
      // Create a new assessment
      const assessment = await storage.createDriverAssessment({
        driverId: assessmentData.driverId,
        assessmentType: assessmentData.assessmentType,
        status: "completed",
        score: assessmentData.score,
        feedbackNotes: assessmentData.feedbackNotes,
        completedAt: new Date()
      });
      
      return res.status(201).json({
        message: "Assessment submitted successfully",
        data: assessment
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get vehicle details
  app.get("/api/vehicle-details", async (req: Request, res: Response) => {
    try {
      const { registration_number, transporter_id } = req.query;
      
      if (!registration_number) {
        return res.status(400).json({ error: "Vehicle registration number is required" });
      }
      
      // Get vehicle by registration number
      let vehicle = await storage.getVehicleByRegistration(registration_number as string);
      
      // If vehicle doesn't exist and transporter_id is provided, create a sample one
      if (!vehicle && transporter_id) {
        const transporterId = parseInt(transporter_id as string);
        if (!isNaN(transporterId)) {
          vehicle = await storage.createVehicle({
            registrationNumber: registration_number as string,
            transporterId,
            vehicleType: "Truck",
            make: "Tata",
            model: "Prima",
            year: 2022,
            capacityTons: 25,
            insuranceStatus: "Active",
            lastServiceDate: new Date()
          });
        }
      }
      
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      
      return res.status(200).json({
        message: "Vehicle details fetched successfully",
        data: vehicle
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get all vehicles for a transporter
  app.get("/api/vehicles", async (req: Request, res: Response) => {
    try {
      const { transporter_id } = req.query;
      
      if (!transporter_id) {
        return res.status(400).json({ error: "Transporter ID is required" });
      }
      
      const transporterId = parseInt(transporter_id as string);
      if (isNaN(transporterId)) {
        return res.status(400).json({ error: "Invalid transporter ID" });
      }
      
      // Get all vehicles for the transporter
      const vehicles = await storage.getVehiclesByTransporter(transporterId);
      
      return res.status(200).json({
        message: "Vehicles fetched successfully",
        data: vehicles
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get notifications
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const { user_id, user_type } = req.query;
      
      if (!user_id || !user_type) {
        return res.status(400).json({ error: "User ID and user type are required" });
      }
      
      const userId = parseInt(user_id as string);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Validate user type
      if (user_type !== UserType.DRIVER && user_type !== UserType.FLEET_OWNER) {
        return res.status(400).json({ error: "Invalid user type" });
      }
      
      // Get notifications for the user
      const notifications = await storage.getNotifications(userId, user_type as string);
      
      // If no notifications are found, create sample ones for demo purposes
      if (notifications.length === 0) {
        // Create sample notifications
        const sampleNotifications = [
          {
            userId,
            userType: user_type as string,
            title: "New Job Posted",
            content: "A new job matching your profile has been posted in your area.",
            type: "job",
            actionUrl: "/jobs"
          },
          {
            userId,
            userType: user_type as string,
            title: "Pending Document Verification",
            content: "Your documents are pending verification. Please complete the process.",
            type: "system",
            actionUrl: "/profile/documents"
          },
          {
            userId,
            userType: user_type as string,
            title: "Payment Received",
            content: "You have received a payment of ₹5,000 for completed trip #123.",
            type: "payment",
            actionUrl: "/payments"
          }
        ];
        
        // Add sample notifications to storage
        await Promise.all(sampleNotifications.map(notif => storage.createNotification(notif)));
        
        // Get the updated list of notifications
        const createdNotifications = await storage.getNotifications(userId, user_type as string);
        
        return res.status(200).json({
          message: "Notifications fetched successfully",
          data: createdNotifications
        });
      }
      
      return res.status(200).json({
        message: "Notifications fetched successfully",
        data: notifications
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Mark notification as read
  app.post("/api/read-notification/:id", async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      
      if (!updatedNotification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      return res.status(200).json({
        message: "Notification marked as read",
        data: updatedNotification
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Get referrals for a driver
  app.get("/api/referrals", async (req: Request, res: Response) => {
    try {
      const { driver_id } = req.query;
      
      if (!driver_id) {
        return res.status(400).json({ error: "Driver ID is required" });
      }
      
      const driverId = parseInt(driver_id as string);
      if (isNaN(driverId)) {
        return res.status(400).json({ error: "Invalid driver ID" });
      }
      
      // Get referrals for the driver
      const referrals = await storage.getReferralsByReferrer(driverId);
      
      // If no referrals are found, create sample ones for demo purposes
      if (referrals.length === 0) {
        // Create sample referrals
        const sampleReferrals = [
          {
            referrerId: driverId,
            referredPhoneNumber: "+919876543210",
            referredName: "Rahul Kumar",
            status: "registered",
            reward: "₹500"
          },
          {
            referrerId: driverId,
            referredPhoneNumber: "+919876543211",
            referredName: "Suresh Singh",
            status: "completed",
            reward: "₹1000",
            completedAt: new Date()
          },
          {
            referrerId: driverId,
            referredPhoneNumber: "+919876543212",
            referredName: "Amit Patel",
            status: "pending",
            reward: null
          }
        ];
        
        // Add sample referrals to storage
        await Promise.all(sampleReferrals.map(ref => storage.createReferral(ref)));
        
        // Get the updated list of referrals
        const createdReferrals = await storage.getReferralsByReferrer(driverId);
        
        return res.status(200).json({
          message: "Referrals fetched successfully",
          data: createdReferrals
        });
      }
      
      return res.status(200).json({
        message: "Referrals fetched successfully",
        data: referrals
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Create a new referral
  app.post("/api/referrals", async (req: Request, res: Response) => {
    try {
      const { referrer_id, referred_phone, referred_name } = req.body;
      
      if (!referrer_id || !referred_phone) {
        return res.status(400).json({ error: "Referrer ID and referred phone number are required" });
      }
      
      // Create a new referral
      const referral = await storage.createReferral({
        referrerId: parseInt(referrer_id),
        referredPhoneNumber: referred_phone,
        referredName: referred_name || null,
        status: "pending",
        reward: null,
        completedAt: null
      });
      
      return res.status(201).json({
        message: "Referral created successfully",
        data: referral
      });
    } catch (err) {
      return handleError(err as Error, res);
    }
  });

  // Frappe Driver API Routes
  
  // Get all Frappe drivers with optional filtering
  app.get("/api/frappe-drivers", async (req: Request, res: Response) => {
    try {
      const { error, data } = frappeDriversQuerySchema.safeParse(req.query);
      
      if (error) {
        return res.status(400).json({ 
          error: "Invalid query parameters", 
          details: error.format() 
        });
      }
      
      const drivers = await storage.getFrappeDrivers(data);
      res.status(200).json(drivers);
    } catch (err) {
      handleError(err as Error, res);
    }
  });
  
  // Get a Frappe driver by phone number
  app.get("/api/frappe-drivers/phone/:phoneNumber", async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.params;
      const driver = await storage.getFrappeDriverByPhone(phoneNumber);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      res.status(200).json(driver);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Get a specific Frappe driver by docName
  app.get("/api/frappe-drivers/:docName", async (req: Request, res: Response) => {
    try {
      const { docName } = req.params;
      const driver = await storage.getFrappeDriver(docName);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      res.status(200).json(driver);
    } catch (err) {
      handleError(err as Error, res);
    }
  });
  
  // Create a new Frappe driver
  app.post("/api/frappe-drivers", async (req: Request, res: Response) => {
    try {
      const { error, data } = frappeDriverCreateSchema.safeParse(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: "Invalid driver data", 
          details: error.format() 
        });
      }
      
      // Check if a driver with this phone number already exists
      if (data.phoneNumber) {
        const existingDriver = await storage.getFrappeDriverByPhone(data.phoneNumber);
        if (existingDriver) {
          return res.status(409).json({ 
            error: "A driver with this phone number already exists",
            driver: existingDriver
          });
        }
      }
      
      // Generate a unique docName using Frappe's naming convention: "SIG" followed by a sequential number
      const docName = generateFrappeDocName("SIG");
      
      // Create the driver with generated docName
      const newDriver = await storage.createFrappeDriver({
        ...data,
        docName
      });
      
      res.status(201).json(newDriver);
    } catch (err) {
      handleError(err as Error, res);
    }
  });
  
  // Update an existing Frappe driver
  app.patch("/api/frappe-drivers/:docName", async (req: Request, res: Response) => {
    try {
      const { docName } = req.params;
      const { error, data } = frappeDriverUpdateSchema.safeParse(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: "Invalid driver data", 
          details: error.format() 
        });
      }
      
      // Check if the driver exists
      const existingDriver = await storage.getFrappeDriver(docName);
      if (!existingDriver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      // If phone number is being updated, make sure it doesn't conflict
      if (data.phoneNumber && data.phoneNumber !== existingDriver.phoneNumber) {
        const driverWithPhone = await storage.getFrappeDriverByPhone(data.phoneNumber);
        if (driverWithPhone && driverWithPhone.docName !== docName) {
          return res.status(409).json({ 
            error: "Phone number already in use by another driver"
          });
        }
      }
      
      const updatedDriver = await storage.updateFrappeDriver(docName, data);
      res.status(200).json(updatedDriver);
    } catch (err) {
      handleError(err as Error, res);
    }
  });
  
  // Delete a Frappe driver
  app.delete("/api/frappe-drivers/:docName", async (req: Request, res: Response) => {
    try {
      const { docName } = req.params;
      
      // Check if the driver exists
      const existingDriver = await storage.getFrappeDriver(docName);
      if (!existingDriver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      
      const deleted = await storage.deleteFrappeDriver(docName);
      if (deleted) {
        res.status(204).send(); // No content
      } else {
        res.status(500).json({ error: "Failed to delete driver" });
      }
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  console.log("RegisterRoutes: Creating HTTP server...");
  const httpServer = createServer(app);
  console.log("RegisterRoutes: HTTP server created successfully");
  
  // Create WebSocket server but only set it up after the HTTP server is started
  // This is to make sure we don't block the server startup process
  console.log("RegisterRoutes: Setting up WebSocket server (deferred activation)");
  
  // Return the HTTP server first, and set up WebSocket after the server is started
  process.nextTick(() => {
    try {
      const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
      console.log("WebSocket server created successfully on path /ws");
      
      // Handle WebSocket connections
      wss.on('connection', (ws) => {
        console.log('WebSocket client connected');
        
        // Send welcome message to client
        ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to SIGNO Connect WebSocket server' }));
        
        // Handle incoming messages
        ws.on('message', (message) => {
          try {
            console.log('WebSocket message received:', message.toString());
            const data = JSON.parse(message.toString());
            
            // Handle different message types
            if (data.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            }
            
            // Broadcast the message to all connected clients
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ 
                  type: 'broadcast', 
                  data: data,
                  timestamp: new Date().toISOString() 
                }));
              }
            });
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
          }
        });
        
        // Handle disconnection
        ws.on('close', () => {
          console.log('WebSocket client disconnected');
        });
      });
    } catch (error) {
      console.error("Failed to create WebSocket server:", error);
    }
  });
  
  console.log("RegisterRoutes: Route registration complete, returning server");
  return httpServer;
}

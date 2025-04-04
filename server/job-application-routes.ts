import { Request, Response } from "express";
import type { Express } from "express";
import { db } from "./db";
import { jobApplications, jobs, users, drivers } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { jobApplicationsInsertSchema } from "@shared/schema";
import { z } from "zod";

// The schema is already defined in @shared/schema.ts
// We'll just create an update schema based on it
const applicationUpdateSchema = jobApplicationsInsertSchema.partial().extend({
  id: z.number(),
});

const validateApplication = (schema: any, obj: any) => {
  try {
    return { data: schema.parse(obj), error: null };
  } catch (error) {
    console.error("Validation error:", error);
    return { data: null, error: { message: "Validation failed", details: error } };
  }
};

export async function registerJobApplicationRoutes(app: Express) {
  // Get all applications for a job
  app.get("/api/jobs/:jobId/applications", async (req: Request, res: Response) => {
    try {
      const jobId = Number(req.params.jobId);
      if (isNaN(jobId)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }

      // Check if job exists
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Get all applications for this job
      const applications = await db.select().from(jobApplications).where(eq(jobApplications.jobId, jobId));
      
      // Fetch driver details for each application
      const detailedApplications = await Promise.all(applications.map(async (app: any) => {
        const [driver] = await db.select().from(drivers).where(eq(drivers.id, app.driverId));
        const [user] = driver ? await db.select().from(users).where(eq(users.id, driver.userId)) : [null];
        
        return {
          ...app,
          driver: driver ? {
            ...driver,
            name: user?.fullName || "Unknown",
            phoneNumber: user?.phoneNumber || "Unknown"
          } : null
        };
      }));

      return res.status(200).json({ applications: detailedApplications });
    } catch (error) {
      console.error("Error fetching job applications:", error);
      return res.status(500).json({ error: "Failed to fetch job applications" });
    }
  });

  // Get all applications by a driver
  app.get("/api/drivers/:driverId/applications", async (req: Request, res: Response) => {
    try {
      const driverId = Number(req.params.driverId);
      if (isNaN(driverId)) {
        return res.status(400).json({ error: "Invalid driver ID" });
      }

      // Check if driver exists
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId));
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      // Get all applications by this driver
      const applications = await db.select().from(jobApplications).where(eq(jobApplications.driverId, driverId));
      
      // Fetch job details for each application
      const detailedApplications = await Promise.all(applications.map(async (app: any) => {
        const [job] = await db.select().from(jobs).where(eq(jobs.id, app.jobId));
        
        return {
          ...app,
          job: job || null
        };
      }));

      return res.status(200).json({ applications: detailedApplications });
    } catch (error) {
      console.error("Error fetching driver applications:", error);
      return res.status(500).json({ error: "Failed to fetch driver applications" });
    }
  });

  // Get a specific application
  app.get("/api/job-applications/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const [application] = await db.select().from(jobApplications).where(eq(jobApplications.id, id));
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Fetch additional details
      const [job] = await db.select().from(jobs).where(eq(jobs.id, application.jobId));
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, application.driverId));
      const [user] = driver ? await db.select().from(users).where(eq(users.id, driver.userId)) : [null];

      const detailedApplication = {
        ...application,
        job: job || null,
        driver: driver ? {
          ...driver,
          name: user?.fullName || "Unknown",
          phoneNumber: user?.phoneNumber || "Unknown"
        } : null
      };

      return res.status(200).json({ application: detailedApplication });
    } catch (error) {
      console.error("Error fetching application:", error);
      return res.status(500).json({ error: "Failed to fetch application" });
    }
  });

  // Apply for a job
  app.post("/api/job-applications", async (req: Request, res: Response) => {
    try {
      const { data, error } = validateApplication(jobApplicationsInsertSchema, req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid application data", details: error.message });
      }

      // Check if job exists
      const [job] = await db.select().from(jobs).where(eq(jobs.id, data.jobId));
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Check if driver exists
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, data.driverId));
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      // Check if driver has already applied for this job
      const [existingApplication] = await db.select().from(jobApplications).where(
        and(
          eq(jobApplications.jobId, data.jobId),
          eq(jobApplications.driverId, data.driverId)
        )
      );

      if (existingApplication) {
        return res.status(400).json({ error: "You have already applied for this job" });
      }

      // Create the application
      // Explicitly specify the columns to match database schema
      const [application] = await db.insert(jobApplications).values({
        jobId: data.jobId,
        driverId: data.driverId,
        status: data.status || "pending",
        expectedSalary: data.expectedSalary,
        additionalNotes: data.additionalNotes,
        // Let the database handle the default timestamps for applied_at and updated_at
      }).returning();

      return res.status(201).json({ application });
    } catch (error) {
      console.error("Error creating job application:", error);
      return res.status(500).json({ error: "Failed to create job application" });
    }
  });

  // Update application status (for fleet owners/recruiters)
  app.put("/api/job-applications/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const [existingApplication] = await db.select().from(jobApplications).where(eq(jobApplications.id, id));
      if (!existingApplication) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Use a custom validation schema for updates
      const updateSchema = z.object({
        status: z.string().optional(),
        expectedSalary: z.number().optional(),
        additionalNotes: z.string().optional(),
      });

      const { data, error } = validateApplication(updateSchema, req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid application data", details: error.message });
      }

      // Only include fields that are in the database schema
      const updateData: any = {};
      if (data.status) updateData.status = data.status;
      if (data.expectedSalary) updateData.expectedSalary = data.expectedSalary;
      if (data.additionalNotes) updateData.additionalNotes = data.additionalNotes;

      const [updatedApplication] = await db.update(jobApplications)
        .set(updateData)
        .where(eq(jobApplications.id, id))
        .returning();

      return res.status(200).json({ application: updatedApplication });
    } catch (error) {
      console.error("Error updating application:", error);
      return res.status(500).json({ error: "Failed to update application" });
    }
  });

  // Cancel/withdraw an application (for drivers)
  app.delete("/api/job-applications/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }

      const [existingApplication] = await db.select().from(jobApplications).where(eq(jobApplications.id, id));
      if (!existingApplication) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Only allow cancellation if status is pending
      if (existingApplication.status !== "pending") {
        return res.status(400).json({ error: "Cannot cancel application in current status" });
      }

      await db.delete(jobApplications).where(eq(jobApplications.id, id));
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error cancelling application:", error);
      return res.status(500).json({ error: "Failed to cancel application" });
    }
  });

  console.log("Job application routes registered successfully");
}
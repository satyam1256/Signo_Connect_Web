import { Request, Response } from "express";
import type { Express } from "express";
import { db } from "./db";
import { vehicleChecklists } from "@shared/schema";
import { eq } from "drizzle-orm";
import { vehicleChecklistsInsertSchema } from "@shared/schema";
import { z } from "zod";

// Extend the schema for validation
const checklistUploadSchema = vehicleChecklistsInsertSchema.extend({
  vehicleId: z.number().or(z.string()).transform(val => val.toString()),
  driverId: z.number().optional(),
  date: z.string().transform(val => new Date(val)).optional(),
});

const checklistUpdateSchema = checklistUploadSchema.partial().extend({
  id: z.number(),
});

const validateChecklist = (schema: any, obj: any) => {
  try {
    return { data: schema.parse(obj), error: null };
  } catch (error) {
    console.error("Validation error:", error);
    return { data: null, error: { message: "Validation failed", details: error } };
  }
};

export async function registerVehicleChecklistRoutes(app: Express) {
  // Get all checklists for a vehicle
  app.get("/api/vehicle/:vehicleId/checklists", async (req: Request, res: Response) => {
    try {
      const vehicleId = req.params.vehicleId;
      if (!vehicleId) {
        return res.status(400).json({ error: "Vehicle ID is required" });
      }

      const checklists = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.vehicleId, vehicleId));
      return res.status(200).json({ checklists });
    } catch (error) {
      console.error("Error fetching vehicle checklists:", error);
      return res.status(500).json({ error: "Failed to fetch vehicle checklists" });
    }
  });

  // Get a specific checklist by ID
  app.get("/api/vehicle-checklists/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid checklist ID" });
      }

      const [checklist] = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.id, id));
      if (!checklist) {
        return res.status(404).json({ error: "Checklist not found" });
      }

      return res.status(200).json({ checklist });
    } catch (error) {
      console.error("Error fetching checklist:", error);
      return res.status(500).json({ error: "Failed to fetch checklist" });
    }
  });

  // Create a new checklist
  app.post("/api/vehicle-checklists", async (req: Request, res: Response) => {
    try {
      const { data, error } = validateChecklist(checklistUploadSchema, req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid checklist data", details: error.message });
      }

      const [checklist] = await db.insert(vehicleChecklists).values(data).returning();
      return res.status(201).json({ checklist });
    } catch (error) {
      console.error("Error creating checklist:", error);
      return res.status(500).json({ error: "Failed to create checklist" });
    }
  });

  // Update a checklist
  app.put("/api/vehicle-checklists/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid checklist ID" });
      }

      const [existingChecklist] = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.id, id));
      if (!existingChecklist) {
        return res.status(404).json({ error: "Checklist not found" });
      }

      const { data, error } = validateChecklist(checklistUpdateSchema.omit({ id: true }), req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid checklist data", details: error.message });
      }

      const [updatedChecklist] = await db.update(vehicleChecklists)
        .set(data)
        .where(eq(vehicleChecklists.id, id))
        .returning();

      return res.status(200).json({ checklist: updatedChecklist });
    } catch (error) {
      console.error("Error updating checklist:", error);
      return res.status(500).json({ error: "Failed to update checklist" });
    }
  });

  // Delete a checklist
  app.delete("/api/vehicle-checklists/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid checklist ID" });
      }

      const [existingChecklist] = await db.select().from(vehicleChecklists).where(eq(vehicleChecklists.id, id));
      if (!existingChecklist) {
        return res.status(404).json({ error: "Checklist not found" });
      }

      await db.delete(vehicleChecklists).where(eq(vehicleChecklists.id, id));
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting checklist:", error);
      return res.status(500).json({ error: "Failed to delete checklist" });
    }
  });

  console.log("Vehicle checklist routes registered successfully");
}
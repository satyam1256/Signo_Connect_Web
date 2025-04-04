import { Request, Response } from "express";
import { documentStorage } from "./db-storage-additions";
import { z } from "zod";
import { documentsInsertSchema } from "../schema-additions";

// Extend the document schema for validation
const documentUploadSchema = documentsInsertSchema.extend({
  userId: z.number(),
  documentId: z.string(),
  type: z.string(),
  // Make other fields optional
  documentNumber: z.string().optional(),
  frontImage: z.string().optional(),
  backImage: z.string().optional(),
  expiryDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  date: z.string().optional().transform(val => val ? new Date(val) : undefined),
  remarks: z.string().optional(),
});

const documentUpdateSchema = documentUploadSchema.partial().extend({
  id: z.number(),
});

const validateDocument = (schema: any, obj: any) => {
  try {
    return { data: schema.parse(obj), error: null };
  } catch (error) {
    console.error("Validation error:", error);
    return { data: null, error: { message: "Validation failed" } };
  }
};

export async function registerDocumentRoutes(app: any) {
  // Get all documents for a user
  app.get("/api/user/:userId/documents", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const documents = await documentStorage.getDocumentsByUserId(userId);
      return res.status(200).json({ documents });
    } catch (error) {
      console.error("Error fetching documents:", error);
      return res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get a document by ID
  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }

      const document = await documentStorage.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      return res.status(200).json({ document });
    } catch (error) {
      console.error("Error fetching document:", error);
      return res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // Create a new document
  app.post("/api/documents", async (req: Request, res: Response) => {
    try {
      const { data, error } = validateDocument(documentUploadSchema, req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid document data", details: error.message });
      }

      const document = await documentStorage.createDocument(data);
      return res.status(201).json({ document });
    } catch (error) {
      console.error("Error creating document:", error);
      return res.status(500).json({ error: "Failed to create document" });
    }
  });

  // Update a document
  app.put("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }

      const document = await documentStorage.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const { data, error } = validateDocument(documentUpdateSchema.omit({ id: true }), req.body);
      if (error) {
        return res.status(400).json({ error: "Invalid document data", details: error.message });
      }

      const updatedDocument = await documentStorage.updateDocument(id, data);
      return res.status(200).json({ document: updatedDocument });
    } catch (error) {
      console.error("Error updating document:", error);
      return res.status(500).json({ error: "Failed to update document" });
    }
  });

  // Delete a document
  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }

      const document = await documentStorage.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      await documentStorage.deleteDocument(id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      return res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Verify a document
  app.post("/api/documents/:id/verify", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid document ID" });
      }

      const { verifiedBy, isVerified = true } = req.body;
      
      if (!verifiedBy) {
        return res.status(400).json({ error: "Verified by is required" });
      }

      const document = await documentStorage.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      const updatedDocument = await documentStorage.updateDocument(id, {
        isVerified,
        verifiedBy,
        verifiedAt: new Date(),
      });

      return res.status(200).json({ document: updatedDocument });
    } catch (error) {
      console.error("Error verifying document:", error);
      return res.status(500).json({ error: "Failed to verify document" });
    }
  });

  // Get all vehicle types
  app.get("/api/vehicle-types", async (_req: Request, res: Response) => {
    try {
      const types = await documentStorage.getVehicleTypes();
      return res.status(200).json({ vehicleTypes: types });
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
      return res.status(500).json({ error: "Failed to fetch vehicle types" });
    }
  });

  // Get a vehicle type by ID
  app.get("/api/vehicle-types/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid vehicle type ID" });
      }

      const type = await documentStorage.getVehicleTypeById(id);
      if (!type) {
        return res.status(404).json({ error: "Vehicle type not found" });
      }

      return res.status(200).json({ vehicleType: type });
    } catch (error) {
      console.error("Error fetching vehicle type:", error);
      return res.status(500).json({ error: "Failed to fetch vehicle type" });
    }
  });

  // Create a new vehicle type
  app.post("/api/vehicle-types", async (req: Request, res: Response) => {
    try {
      const { vehicleType, isActive = true } = req.body;
      
      if (!vehicleType) {
        return res.status(400).json({ error: "Vehicle type is required" });
      }

      const newType = await documentStorage.createVehicleType({
        vehicleType,
        isActive,
      });

      return res.status(201).json({ vehicleType: newType });
    } catch (error) {
      console.error("Error creating vehicle type:", error);
      return res.status(500).json({ error: "Failed to create vehicle type" });
    }
  });

  console.log("Document routes registered successfully");
}
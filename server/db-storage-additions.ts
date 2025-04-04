import { db } from "./db";
import { eq } from "drizzle-orm";
import { documents, vehicleTypes } from "../schema-additions";
import type { Document, InsertDocument, VehicleType, InsertVehicleType } from "../schema-additions";

export interface IDocumentStorage {
  getDocumentsByUserId(userId: number): Promise<Document[]>;
  getDocumentById(id: number): Promise<Document | undefined>;
  getDocumentByDocumentId(documentId: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  getVehicleTypes(): Promise<VehicleType[]>;
  getVehicleTypeById(id: number): Promise<VehicleType | undefined>;
  createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType>;
}

export class DbDocumentStorage implements IDocumentStorage {
  async getDocumentsByUserId(userId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.userId, userId));
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentByDocumentId(documentId: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.documentId, documentId));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [createdDocument] = await db.insert(documents).values(document).returning();
    return createdDocument;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set(documentData)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return true; // Drizzle doesn't provide affected rows, so we assume success
  }

  async getVehicleTypes(): Promise<VehicleType[]> {
    return await db.select().from(vehicleTypes).where(eq(vehicleTypes.isActive, true));
  }

  async getVehicleTypeById(id: number): Promise<VehicleType | undefined> {
    const [type] = await db.select().from(vehicleTypes).where(eq(vehicleTypes.id, id));
    return type;
  }

  async createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType> {
    const [createdType] = await db.insert(vehicleTypes).values(vehicleType).returning();
    return createdType;
  }
}

export const documentStorage = new DbDocumentStorage();
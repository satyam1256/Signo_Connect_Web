import { MemStorage } from "./storage";
import { IStorage } from "./storage";

export async function createStorage(): Promise<IStorage> {
  try {
    console.log("Storage Factory: Attempting to use database storage...");
    
    // Use dynamic import to avoid circular dependencies
    console.log("Storage Factory: Dynamically importing db-storage...");
    const dbStorageModule = await import("./db-storage");
    console.log("Storage Factory: Successfully imported db-storage module:", Object.keys(dbStorageModule));
    
    const { DbStorage } = dbStorageModule;
    console.log("Storage Factory: DbStorage class extracted from module");
    
    console.log("Storage Factory: Creating new DbStorage instance...");
    const dbStorage = new DbStorage();
    console.log("Storage Factory: Successfully created database storage instance");
    
    return dbStorage;
  } catch (error) {
    console.error("Storage Factory ERROR: Failed to create database storage:", error);
    if (error instanceof Error) {
      console.error("Storage Factory ERROR Details:", error.message);
      console.error("Storage Factory ERROR Stack:", error.stack);
    }
    console.log("Storage Factory: Falling back to memory storage");
    return new MemStorage();
  }
}
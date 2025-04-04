import { MemStorage } from "./storage";
import { IStorage } from "./storage";
import { initializeDatabase } from "./db";
import { runMigrations } from "./migration";

export async function createStorage(): Promise<IStorage> {
  console.log("Storage Factory: Beginning storage creation process...");
  
  // First, explicitly check if we should use in-memory storage
  const useMemoryStorage = process.env.USE_MEMORY_STORAGE === 'true';
  
  if (useMemoryStorage) {
    console.log("Storage Factory: Using memory storage due to environment configuration");
    return new MemStorage();
  }
  
  // Try to use database storage
  try {
    console.log("Storage Factory: Attempting to use database storage...");
    
    // First ensure the database is initialized
    console.log("Storage Factory: Initializing database connection...");
    await initializeDatabase();
    console.log("Storage Factory: Database initialized successfully");
    
    // Run migrations after database is initialized
    console.log("Storage Factory: Running database migrations...");
    await runMigrations();
    console.log("Storage Factory: Migrations completed successfully");
    
    // Use dynamic import to avoid circular dependencies
    console.log("Storage Factory: Dynamically importing db-storage...");
    const dbStorageModule = await import("./db-storage");
    console.log("Storage Factory: Successfully imported db-storage module:", Object.keys(dbStorageModule));
    
    const { DbStorage } = dbStorageModule;
    console.log("Storage Factory: DbStorage class extracted from module");
    
    // Test with a simple operation before returning
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
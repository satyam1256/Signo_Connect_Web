import { IStorage, storage as memStorage } from "./storage";
import { log } from "./vite";

/**
 * Factory function to create the appropriate storage implementation.
 * For now, this simply returns the in-memory storage, but in the future
 * it could check for environment variables and create a database-backed
 * storage if configured.
 */
export async function createStorage(): Promise<IStorage> {
  try {
    log("Using in-memory storage (no database configuration found)");
    return memStorage;
  } catch (error) {
    log(`Error initializing storage: ${error}. Falling back to memory storage.`);
    return memStorage;
  }
}
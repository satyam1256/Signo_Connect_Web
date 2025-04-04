import { MemStorage } from "./storage";
import { IStorage } from "./storage";

export async function createStorage(): Promise<IStorage> {
  console.log("Storage Factory: Using in-memory storage as per requirements");
  
  // Since we're not using the database as requested, we'll always return the MemStorage
  return new MemStorage();
}
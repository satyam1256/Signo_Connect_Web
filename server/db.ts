import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

let db: any;
let dbInitialized = false;

/**
 * Explicitly initialize the database connection
 * This function is called before using the database in any way
 */
export async function initializeDatabase() {
  if (dbInitialized) {
    console.log("Database already initialized, skipping...");
    return db;
  }

  console.log("Explicitly initializing database connection...");
  
  try {
    // Create a SQL database connection
    const sql = postgres(process.env.DATABASE_URL!, { 
      ssl: { rejectUnauthorized: false },
      max: 10
    });
    console.log("SQL client created successfully");

    // Create a Drizzle instance with our schema
    console.log("Creating Drizzle ORM instance...");
    db = drizzle(sql, { schema });
    console.log("Drizzle ORM instance created successfully");
    
    // Test the connection to ensure it's working
    console.log("Testing database connection...");
    await sql`SELECT 1 as test`;
    console.log("Database connection test successful");
    
    dbInitialized = true;
    return db;
  } catch (error) {
    console.error("Critical error initializing database:", error);
    // Create a placeholder db object that will throw errors when used
    // This allows the app to at least start up even if DB is not working
    const errorHandler = () => {
      throw new Error("Database connection failed during initialization");
    };
    
    const placeholderDb = new Proxy({}, {
      get: () => errorHandler
    });
    
    db = placeholderDb as any;
    throw error; // Re-throw to let the caller handle it
  }
}

// Initialize the db object immediately for backward compatibility
try {
  console.log("Initializing database connection...");

  // Create a SQL database connection
  const sql = postgres(process.env.DATABASE_URL!, { 
    ssl: { rejectUnauthorized: false },
    max: 10
  });
  console.log("SQL client created");

  // Create a Drizzle instance with our schema
  console.log("Creating Drizzle ORM instance...");
  db = drizzle(sql, { schema });
  console.log("Drizzle ORM instance created successfully");

} catch (error) {
  console.error("Critical error initializing database:", error);
  // Create a placeholder db object that will throw errors when used
  // This allows the app to at least start up even if DB is not working
  const errorHandler = () => {
    throw new Error("Database connection failed during initialization");
  };
  
  const placeholderDb = new Proxy({}, {
    get: () => errorHandler
  });
  
  db = placeholderDb as any;
}

export { db };
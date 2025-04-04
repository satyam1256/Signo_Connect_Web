import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

// Configure neon to use fetch
neonConfig.fetchConnectionCache = true;

let db: any;

try {
  console.log("Initializing database connection...");

  // Create a SQL database connection
  const sql = neon(process.env.DATABASE_URL!);
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
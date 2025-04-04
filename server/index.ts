import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./migration";
import { createTablesIfNotExist } from "./create-tables";
import { addMissingColumns } from "../column-migration";
import type { IStorage } from "./storage";

// Use storage factory to avoid circular dependencies
import { createStorage } from "./storage-factory";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("Starting server initialization...");
    
    // Run database migrations and table setup
    try {
      console.log("Running database migrations...");
      await runMigrations();
      console.log("Database migrations completed");
    } catch (migrationError) {
      console.error("Migration error:", migrationError);
      console.log("Continuing despite migration errors...");
    }
    
    try {
      // Create tables if they don't exist
      console.log("Creating tables if they don't exist...");
      await createTablesIfNotExist();
      console.log("Table creation check completed");
    } catch (tableError) {
      console.error("Table creation error:", tableError);
      console.log("Continuing despite table creation errors...");
    }
    
    try {
      // After tables are created, then add any missing columns
      console.log("Adding any missing columns...");
      await addMissingColumns();
      console.log("Column migration completed");
    } catch (columnError) {
      console.error("Column migration error:", columnError);
      console.log("Continuing despite column migration errors...");
    }
    
    // Create a storage instance using the factory
    console.log("Creating storage instance using factory...");
    const selectedStorage = await createStorage();
    console.log("Storage instance created successfully. Continuing with server setup...");
    
    // Register routes with the selected storage
    console.log("Registering routes...");
    const server = await registerRoutes(app, selectedStorage);
    console.log("Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Error middleware caught:", err);
      res.status(status).json({ message });
      // Don't throw the error after handling it
      // This was causing the server to crash
      // throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    console.log("Setting up Vite...");
    if (app.get("env") === "development") {
      try {
        console.log("Environment is development, setting up Vite development server...");
        await setupVite(app, server);
        console.log("Vite setup successful");
      } catch (error) {
        console.error("Vite setup error:", error);
        // Log more details about the error
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        console.log("Continuing execution despite Vite setup failure");
      }
    } else {
      try {
        console.log("Environment is production, setting up static file serving...");
        serveStatic(app);
        console.log("Static files setup successful");
      } catch (error) {
        console.error("Static files setup error:", error);
        // Log more details about the error
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        console.log("Continuing execution despite static files setup failure");
      }
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    console.log("Starting server on port", port);
    
    // Add error handler to server
    server.on('error', (err) => {
      console.error("Server error occurred:", err);
      if (err.message.includes('EADDRINUSE')) {
        console.error("Port 5000 is already in use. Check if another process is running.");
      }
    });
    
    // Add a special process.on handler for uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('CRITICAL: Uncaught exception occurred:', err);
      console.error('The server will continue running, but may be in an unstable state');
    });
    
    // Try to start the server with extra error handling
    try {
      const serverStartCallback = () => {
        try {
          log(`Server successfully started and serving on port ${port}`);
          console.log("Server is ready to accept connections");
        } catch (callbackError) {
          console.error("Error in server callback:", callbackError);
        }
      };
      
      console.log("Calling server.listen()...");
      // Create a timer to check if the server is running after 2 seconds
      const timer = setTimeout(() => {
        console.log("SERVER_STATUS_CHECK: Still waiting for server to start...");
        
        // Check again in another 3 seconds
        const secondTimer = setTimeout(() => {
          console.log("SERVER_STATUS_CHECK: Server may be stalled or blocked. Check for issues with port binding or middleware.");
        }, 3000);
        
        // Make sure this timer doesn't keep the process alive
        secondTimer.unref();
      }, 2000);
      
      // Make sure this timer doesn't keep the process alive
      timer.unref();
      
      server.listen({
        port,
        host: "0.0.0.0",
      }, serverStartCallback);
      console.log("Server listen call completed");
    } catch (listenError) {
      console.error("Error in server.listen():", listenError);
      if (listenError instanceof Error) {
        console.error("Error message:", listenError.message);
        console.error("Error stack:", listenError.stack);
      }
      
      // Try an alternative listen method in case the object form is causing issues
      try {
        console.log("Trying alternative server.listen method...");
        server.listen(port, "0.0.0.0", () => {
          log(`Server started with alternative method on port ${port}`);
        });
      } catch (alternativeError) {
        console.error("Alternative listen method also failed:", alternativeError);
      }
    }
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();

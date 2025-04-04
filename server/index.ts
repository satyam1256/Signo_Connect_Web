import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { createStorage } from "./storage-factory";

// Create a simple Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });
  
  next();
});

// Immediately-invoking async function to allow top-level await
(async () => {
  try {
    console.log("Starting simplified server initialization...");
    
    // Create storage using factory (will try database first, then fall back to memory)
    console.log("Creating storage using factory...");
    const storage = await createStorage();
    
    // Register routes with storage from factory
    console.log("Registering routes...");
    const server = await registerRoutes(app, storage);
    console.log("Routes registered successfully");
    
    // Add global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Error caught:", err);
      res.status(500).json({ error: "Internal server error" });
    });
    
    // Setup Vite development server
    console.log("Setting up Vite...");
    try {
      await setupVite(app, server);
      console.log("Vite setup successful");
    } catch (error) {
      console.error("Vite setup error:", error);
      console.log("Continuing despite Vite errors...");
    }
    
    // Start server on port 5000
    const port = 5000;
    console.log("Starting server on port", port);
    
    server.listen(port, "0.0.0.0", () => {
      console.log(`Server started and running on port ${port}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
})();

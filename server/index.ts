import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
// Enable CORS for all origins
// Configure CORS with full options for external access
app.use(cors({
  origin: ['*', 'https://localhost:3000', 'http://localhost:5000', 'postman://', 'null', 'https://localhost', 'http://localhost'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Origin', 'Accept', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Enable preflight requests for all routes
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add API key validation middleware for endpoints that need protection
// For security in a production app, use a proper secret key stored in environment variables
const API_KEY = '982b6d71c35c4c8';

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Check API key for external access to resource endpoints
  if (path.startsWith("/api/resource")) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    // For testing purposes, require API key for all requests to resource endpoints
    // In production, you might want to allow localhost without API key
    if (apiKey === API_KEY) {
      // Valid API key, proceed
      next();
    } else {
      log(`Unauthorized API access attempt: ${req.method} ${path}`);
      return res.status(403).json({ error: "Unauthorized: Invalid or missing API key" });
    }
  } else {
    next();
  }

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
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

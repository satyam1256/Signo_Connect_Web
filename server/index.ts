import express from 'express';
import { createServer, type Server } from 'http';
import { registerRoutes } from './routes';
import { setupVite } from './vite'; // Ensure you import setupVite to serve your frontend correctly.

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware for API calls
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
    // Log API calls
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      console.log(logLine);
    }
  });

  next();
});

// Start the server
(async () => {
  const server = createServer(app);
  const port = 5000; // Use port 5000

  // Register your routes
  await registerRoutes(app);

  // Setup Vite for development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  }

  // Listening on the specified port
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
})();
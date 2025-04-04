// This is a simple frontend server to serve our React app
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(express.json());

// Serve static files from the client build directory
app.use(express.static(path.join(__dirname, 'dist/public')));

// Mock API responses for frontend testing
app.get('/api/user', (req, res) => {
  res.json({
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    userType: 'driver',
    phoneNumber: '+911234567890',
    isVerified: true
  });
});

// Driver rating API mock
app.get('/api/driver-ratings/:driverId', (req, res) => {
  res.json({
    message: "Driver ratings retrieved successfully",
    data: {
      driver_id: parseInt(req.params.driverId),
      average_rating: 4.3,
      total_ratings: 28,
      ratings_breakdown: {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 10,
        "5": 15
      },
      recent_ratings: [
        {
          id: 1,
          rating: 5,
          comment: "Excellent driver, very professional and punctual.",
          rater_name: "Rahul Sharma",
          rater_type: "Fleet Owner",
          trip_id: 12345,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          rating: 4,
          comment: "Good communication and driving skills.",
          rater_name: "Priya Patel",
          rater_type: "Fleet Owner",
          trip_id: 12346,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  });
});

// Submit driver rating API mock
app.post('/api/driver-ratings/:driverId', (req, res) => {
  const { rating, comment, rater_id, rater_name, rater_type, trip_id } = req.body || {};
  
  res.status(201).json({
    message: "Rating submitted successfully",
    data: {
      id: Math.floor(Math.random() * 10000),
      driver_id: parseInt(req.params.driverId),
      rating: rating || 5,
      comment: comment || "Great service!",
      rater_id: rater_id || 123,
      rater_name: rater_name || "Test Fleet Owner",
      rater_type: rater_type || "Fleet Owner",
      trip_id: trip_id || 456,
      created_at: new Date().toISOString()
    }
  });
});

// Mock API for authentication
app.post('/api/login', (req, res) => {
  res.json({
    id: 1, 
    name: 'Demo User',
    phoneNumber: '+911234567890',
    userType: 'driver', 
    isVerified: true
  });
});

// SIGNO Connect API mock responses
app.get('/api/drivers-directory', (req, res) => {
  res.json({
    message: "Drivers directory fetched successfully",
    data: [
      {
        id: 1,
        name: "Rajesh Kumar",
        phoneNumber: "+919876543210",
        experience: "5+ years",
        rating: 4.8,
        available: true,
        location: "Mumbai, Maharashtra",
        preferredRoutes: ["Mumbai-Delhi", "Mumbai-Bangalore"],
        vehicleType: "Heavy Truck"
      },
      {
        id: 2,
        name: "Amit Singh",
        phoneNumber: "+919876543211",
        experience: "3 years",
        rating: 4.5,
        available: true,
        location: "Delhi, NCR",
        preferredRoutes: ["Delhi-Jaipur", "Delhi-Chandigarh"],
        vehicleType: "Medium Truck"
      },
      {
        id: 3,
        name: "Suresh Patel",
        phoneNumber: "+919876543212",
        experience: "7+ years",
        rating: 4.9,
        available: false,
        location: "Ahmedabad, Gujarat",
        preferredRoutes: ["Ahmedabad-Mumbai", "Ahmedabad-Delhi"],
        vehicleType: "Heavy Truck"
      }
    ]
  });
});

// Default API response for any other endpoints
app.use('/api/*', (req, res) => {
  // For demo purposes, return mock success responses for all API calls
  res.json({
    message: 'Success',
    data: {
      id: Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString()
    }
  });
});

// For any other request, serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

// Create HTTP server
const httpServer = createServer(app);

// Create WebSocket server on /ws path
const wss = new WebSocketServer({ 
  server: httpServer, 
  path: '/ws' 
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send welcome message to client
  ws.send(JSON.stringify({ 
    type: 'welcome', 
    message: 'Connected to SIGNO Connect WebSocket server' 
  }));
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      console.log('WebSocket message received:', message.toString());
      const data = JSON.parse(message.toString());
      
      // Handle different message types
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ 
          type: 'pong', 
          timestamp: new Date().toISOString() 
        }));
      }
      
      // Broadcast the message to all connected clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) { // WebSocket.OPEN is 1
          client.send(JSON.stringify({ 
            type: 'broadcast', 
            data: data,
            timestamp: new Date().toISOString() 
          }));
        }
      });
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Start server
httpServer.listen(port, () => {
  console.log(`SIGNO Connect frontend server running on port ${port}`);
});
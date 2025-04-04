import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(express.json());

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

// Serve static files from the dist directory (after build)
app.use(express.static(path.join(__dirname, 'dist/public')));

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
const server = createServer(app);

// Start server
server.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
});
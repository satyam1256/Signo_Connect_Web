import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to ensure a directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Build the frontend
try {
  console.log('Building frontend...');
  
  // Since we're using Vite at the project root, we can run the build from here
  console.log('Building the React application with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('Frontend build completed successfully!');

  // Now let's start the server
  console.log('Starting the frontend server...');
  execSync('node server.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error during build or server start:', error.message);
  process.exit(1);
}
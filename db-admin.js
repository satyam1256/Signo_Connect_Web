// db-admin.js - Database management utilities
const { db } = require('./server/db');
const { users, drivers, fleetOwners, jobs, otpVerifications } = require('./shared/schema');
const { eq } = require('drizzle-orm');

async function runQuery() {
  // Get the command line arguments (node db-admin.js [command] [params])
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  try {
    switch (command) {
      case 'list-users':
        const allUsers = await db.select().from(users);
        console.table(allUsers);
        break;
        
      case 'list-drivers':
        const allDrivers = await db.select().from(drivers);
        console.table(allDrivers);
        break;
        
      case 'list-fleet-owners':
        const allFleetOwners = await db.select().from(fleetOwners);
        console.table(allFleetOwners);
        break;
        
      case 'list-jobs':
        const allJobs = await db.select().from(jobs);
        console.table(allJobs);
        break;
        
      case 'get-user':
        if (!args[1]) {
          console.error('Please provide a user ID');
          break;
        }
        const userId = parseInt(args[1]);
        const user = await db.select().from(users).where(eq(users.id, userId));
        console.table(user);
        break;
      
      case 'delete-user':
        if (!args[1]) {
          console.error('Please provide a user ID');
          break;
        }
        const deleteUserId = parseInt(args[1]);
        await db.delete(users).where(eq(users.id, deleteUserId));
        console.log(`User ${deleteUserId} deleted successfully`);
        break;
        
      case 'add-job':
        // Expected format: add-job [fleet_owner_id] [title] [location] [salary]
        if (args.length < 5) {
          console.error('Usage: add-job [fleet_owner_id] [title] [location] [salary]');
          break;
        }
        
        const newJob = {
          fleetOwnerId: parseInt(args[1]),
          title: args[2],
          location: args[3],
          salary: args[4],
          description: args[5] || '',
          requirements: args[6] ? args[6].split(',') : []
        };
        
        const insertedJob = await db.insert(jobs).values(newJob).returning();
        console.log('Job added successfully:');
        console.table(insertedJob);
        break;
        
      case 'help':
      default:
        console.log(`
Database Management Commands:
----------------------------
list-users            - List all users
list-drivers          - List all drivers
list-fleet-owners     - List all fleet owners
list-jobs             - List all jobs
get-user [id]         - Get a specific user by ID
delete-user [id]      - Delete a user by ID
add-job [owner_id] [title] [location] [salary] [description] [requirements] - Add a new job

Usage:
node db-admin.js [command] [params]
        `);
        break;
    }
  } catch (error) {
    console.error('Error executing command:', error);
  } finally {
    process.exit(0);
  }
}

runQuery();
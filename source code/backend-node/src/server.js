import { env } from './config/env.js';
import { createDatabaseManager } from './database/db.js';
import { createApp } from './app.js';

// Create the database manager with the MongoDB connection string
const dbManager = createDatabaseManager({ mongoDbUri: env.mongoDbUri });

const startServer = async () => {
  try {
    // Connect to the database before starting the server
    await dbManager.connect();

   // Create the Express application
    const app = createApp({ env, dbManager });

    // 4. Start listening for incoming HTTP TCP port sockets 
    const server = app.listen(env.port, () => {
      console.log(`[BOOTUP] Server successfully listening on network port: ${env.port} in [${env.nodeEnv}] mode.`);
    });

   // Gracefully shut down the server and release resources
    const gracefulShutdown = (signal) => {
      console.log(`\n[SHUTDOWN] Intercepted ${signal} signal. Starting graceful teardown sequence...`);
      
      server.close(async () => {
        console.log('[SHUTDOWN] HTTP Socket connection channels closed.');
        await dbManager.disconnect();      // Stop accepting new requests
        console.log('[SHUTDOWN] Execution process exiting safely. Goodbye!');
        process.exit(0);
      });
    };

    // Listen for system termination signals
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    // Exit the application if startup fails
    console.error('FATAL SYSTEM EXCEPTION: Server bootstrap failed!', error);
    process.exit(1);
  }
};

// Handle unexpected synchronous errors
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION CRITICAL ERROR] System level failure:', err.message);
  console.error(err.stack);
  process.exit(1);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED PROMISE REJECTION WARNING] Async trace failed:', reason);
});

// Start the application
startServer();
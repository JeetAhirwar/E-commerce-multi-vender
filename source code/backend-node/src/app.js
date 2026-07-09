import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { createErrorHandlerMiddleware } from './middlewares/errorHandler.js';
import { createApiError } from './utils/apiError.js';

/**
 * Creates and configures the Express application.
 * All dependencies are injected to keep the app modular and easy to test.
 */
export const createApp = ({ env, dbManager }) =>
{
    const app = express();

    // Apply security-related HTTP headers
    app.use(helmet());
    app.use(cors({
        origin: env.corsOrigins,
        credentials: true, // Allow cookies and authentication credentials
    }));

     // Compress API responses to improve performance
    app.use(compression());
    // Parse incoming JSON request bodies
    app.use(express.json()); 
    app.use(express.urlencoded({ extended: true }));// Parse URL-encoded form data
    app.use(cookieParser());   // Parse cookies from incoming requests

   // Health check route to verify that the API is running
    app.get('/', (req, res) =>
    {
        res.status(200).json({
            message: 'Welcome to Jeet Ahirwar Marketplace API Gateway',
            online: true,
            databaseConnected: dbManager.isConnected(),       // Show current database connection status
        });
    });

    // Handle requests for routes that do not exist
    app.use((req, res, next) =>
    {
        next(createApiError({
            statusCode: 404,
            code: 'ROUTE_NOT_FOUND',
            message: `The requested endpoint ${req.originalUrl} does not exist on this server.`
        }));
    });

    // Global error handler (must be registered after all routes)
    app.use(createErrorHandlerMiddleware({ nodeEnv: env.nodeEnv }));

    return app;
};
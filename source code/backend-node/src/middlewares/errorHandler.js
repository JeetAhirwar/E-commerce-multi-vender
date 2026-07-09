/**
 * Global Centralized Error Handling Middleware for Express 5.
 * Handles all application errors in one place.
 */
export const createErrorHandlerMiddleware = ({ nodeEnv } = { nodeEnv: 'development' }) =>
{
    return (err, req, res, next) =>
    {
        // Use default values if the error object doesn't provide them
        const statusCode = err.statusCode || 500;
        const message = err.message || 'An unexpected server error occurred.';
        const code = err.code || 'INTERNAL_SERVER_ERROR';

        // Log server errors differently from client/operational errors
        if (statusCode >= 500)
        {
            console.error(`[CRITICAL APPLICATION EXCEPTION] Trace:`, err.stack || err);
        } else
        {
            console.warn(`[OPERATIONAL SYSTEM WARNING] Code: ${code} | Message: ${message}`);
        }

        // Standard error response sent to the client
        const responsePayload = {
            success: false,
            message,
            code,
            timestamp: new Date().toISOString(),
        };

        // Include stack trace only while developing the application
        if (nodeEnv === 'development')
        {
            responsePayload.stack = err.stack;
        }

        // Send the error response with the appropriate HTTP status code
        res.status(statusCode).json(responsePayload);
    };
};
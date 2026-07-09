
// Creates a custom API error object.
// Used to return consistent error information across the application.

export const createApiError = ({ statusCode, message, code = 'INTERNAL_ERROR' }) =>
{
    // Create a normal JavaScript Error object
    const error = new Error(message);

    // Add custom properties to the error object
    return Object.assign(error, {
        statusCode,             // HTTP status code (e.g. 400, 404, 500)
        code,                  // Custom error code
        isOperational: true,  // Marks this as an expected application error
    });
};
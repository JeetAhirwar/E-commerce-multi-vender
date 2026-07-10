/**
 * Pure function-based factory representing the Route Authentication Security Middleware.
 * Decouples JWT checks and error definitions using Dependency Injection.
 */
export const createAuthenticateMiddleware = ({ verifyToken, jwtAccessSecret, createApiError }) =>
{

    // Standard middleware signature execution block
    return (req, res, next) =>
    {
        const authHeader = req.headers.authorization;

        // 1. Enforces strict presence of dynamic Authorization Bearer headers
        if (!authHeader || !authHeader.startsWith('Bearer '))
        {
            return next(createApiError({
                statusCode: 401,
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Access Denied: Standard HTTP Bearer Token authorization is required to access this resource.'
            }));
        }

        // 2. Extracts pure base64 JWT token from Authorization string
        const token = authHeader.split(' ')[1];

        try
        {
            // 3. Cryptographic signature and expiration checks evaluation
            const decodedPayload = verifyToken({ token, secret: jwtAccessSecret });

            // 4. Identity Context Injection: Mounts verified principal data inside current request flow
            req.user = decodedPayload;

            // Moves execution safely to the next mapped controller handler
            next();
        } catch (error)
        {
            // 5. Safely forwards TokenExpired or InvalidSignature exceptions to Global Error Middleware
            next(error);
        }
    };
};
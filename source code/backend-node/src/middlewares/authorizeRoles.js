/**
 * Pure function-based factory representing the Role-based Access Control (RBAC) Security Middleware.
 * Decouples authorization rules and custom exception messages utilizing Dependency Injection.
 */
export const createAuthorizeRolesMiddleware = ({ createApiError }) =>
{

    /**
     * Functional currying pattern: Receives permitted roles lists and returns suitable Express middleware.
     */
    return (...allowedRoles) =>
    {

        // Assembled Express middleware returned mapping pipeline
        return (req, res, next) =>
        {

            // 1. Edge Case: Enforce that user session context is registered (Authenticate middleware must run first)
            if (!req.user)
            {
                return next(createApiError({
                    statusCode: 401,
                    code: 'AUTHENTICATION_REQUIRED',
                    message: 'Access Denied: Standard user credentials authentication has not been verified.'
                }));
            }

            // 2. Evaluates if user's role is present inside the authorized limits arrays
            const isRoleApproved = allowedRoles.includes(req.user.role);

            if (!isRoleApproved)
            {
                return next(createApiError({
                    statusCode: 403, // 403 Forbidden: Standard HTTP code for authorized rule violations
                    code: 'ACCESS_FORBIDDEN',
                    message: `Access Forbidden: Your account role (${req.user.role}) does not possess authorizations to execute this operational run.`
                }));
            }

            // 3. Clear pass: Identity is authentic and role matches criteria. Proceeds to logical controller
            next();
        };
    };
};
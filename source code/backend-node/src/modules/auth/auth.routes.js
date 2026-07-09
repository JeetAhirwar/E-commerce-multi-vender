/**
 * Pure function-based routing factory representing the Authentication API gateways.
 * Decouples router allocations using dependency injection. Enforces strict typo preservation.
 */
export const createAuthRoutes = ({
    router,
    authController,
    sellerAuthController,
    asyncHandler
}) =>
{

    // ==========================================
    // CUSTOMER AUTHENTICATION PATHWAYS (/auth/*)
    // ==========================================

    // Triggers sending login/signup OTP directly to customer email
    router.post('/auth/sent/login-signup-otp', asyncHandler(authController.sendOTP));

    // Validates OTP to register a new customer profile and empty cart atomically
    router.post('/auth/signup', asyncHandler(authController.signup));

    // Validates OTP to authorize logins for existing customers
    router.post('/auth/signin', asyncHandler(authController.signin));


    // ============================================
    // SELLER AUTHENTICATION PATHWAYS (/sellers/*)
    // ============================================

    // Dispatch OTP to registered merchant business emails. Typo preserved: 'login-top'
    router.post('/sellers/sent/login-top', asyncHandler(sellerAuthController.sendOTP));

    // Verifies OTP and generates session tokens for authorized merchants
    router.post('/sellers/verify/login-top', asyncHandler(sellerAuthController.signin));

    // Validates URL path parameter code to confirm and finalize merchant onboarding
    router.patch('/sellers/verify/:otp', asyncHandler(sellerAuthController.verifyEmail));


    return Object.freeze(router); // Freezes assembled router routes structures to prevent dynamic runtime tampering
};
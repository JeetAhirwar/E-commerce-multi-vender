/**
 * Pure function-based routing factory representing the Authentication API gateways.
 * Binds public browsing endpoints and locks administrative controllers under strict guards.
 */
export const createAuthRoutes = ({
    router,
    authController,
    sellerAuthController,
    authenticate,
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

    // Customer Endpoint: Initiates forgot-password workflow generating a temporary secure recovery link (Public Route)
    router.post('/auth/reset-password-request', asyncHandler(authController.requestPasswordReset));

    // Customer Endpoint: Commits the password modifications after validating the recovery token (Public Route)
    router.post('/auth/reset-password', asyncHandler(authController.resetPassword));

    // Customer Endpoint: Executes Session Token Rotation (RTR) (Public Route - Reads Cookie)
    router.post('/auth/refresh', asyncHandler(authController.refreshSession));

    // Customer Endpoint: Manual session logout terminator (Guarded - Requires Authentication)
    router.post('/auth/logout', authenticate, asyncHandler(authController.logout));


    // ============================================
    // SELLER AUTHENTICATION PATHWAYS (/sellers/*)
    // ============================================

    // Seller Onboarding: Onboard a new merchant seller account (Public Route)
    router.post('/sellers', asyncHandler(sellerAuthController.createSeller));

    // Dispatch OTP to registered merchant business emails. Typo preserved: 'login-top'
    router.post('/sellers/sent/login-top', asyncHandler(sellerAuthController.sendOTP));

    // Verifies OTP and generates session tokens for authorized merchants
    router.post('/sellers/verify/login-top', asyncHandler(sellerAuthController.signin));

    // Validates URL path parameter code to confirm and finalize merchant onboarding
    router.patch('/sellers/verify/:otp', asyncHandler(sellerAuthController.verifyEmail));


    return Object.freeze(router); // Freezes assembled router routes structures
};
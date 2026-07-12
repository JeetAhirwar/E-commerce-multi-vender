/**
 * Pure function-based routing factory representing the Merchant Seller API gateways.
 * Binds seller profile paths and locks administrative moderation panels under strict guards.
 */
export const createSellerRoutes = ({
    router,
    sellerController,
    authenticate,
    authorizeRoles,
    asyncHandler
}) =>
{

    // ============================================
    // SECURED MERCHANT PROFILE GATEWAYS (/sellers/*)
    // ============================================

    // Seller Endpoint: Retrieve own merchant account profile (Authentication and ROLE_SELLER required)
    router.get(
        '/sellers/profile',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(sellerController.getProfile)
    );

    // Seller Endpoint: Modify own merchant account profile details
    router.patch(
        '/sellers',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(sellerController.updateProfile)
    );

    // Seller Endpoint: Retrieve or lazy-initialize active analytical report card summary (Authentication and ROLE_SELLER required)
    router.get(
        '/sellers/report',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(sellerController.getSellerReport)
    );


    // ========================================================
    // SECURED ADMINISTRATIVE SELLER GATEWAYS (Admin Locks)
    // ========================================================

    // Admin Endpoint: Pull complete list of registered merchant profiles (Requires Admin Privileges)
    router.get(
        '/sellers',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(sellerController.listSellers)
    );

    // Public/Admin Endpoint: Public/Admin merchant account profile lookup by unique database ObjectId
    router.get(
        '/sellers/:id',
        asyncHandler(sellerController.getSellerById)
    );

    // Admin Endpoint: Erase specific merchant profile from database registries
    router.delete(
        '/sellers/:id',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(sellerController.deleteSeller)
    );

    return router;
};
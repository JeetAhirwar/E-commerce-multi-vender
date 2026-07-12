/**
 * Pure function-based routing factory representing the Merchant Revenue API gateways.
 * Binds revenue paths directly to authenticators and RBAC filters using dependency injection.
 */
export const createRevenueRoutes = ({
    router,
    revenueController,
    authenticate,
    authorizeRoles,
    asyncHandler
}) =>
{

    // ===============================================
    // SECURED MERCHANT REVENUE GATEWAYS (/api/seller/revenue/chart*)
    // ===============================================

    // Seller Endpoint: Retrieve dynamic chronological sales analytics dataset (Authentication and ROLE_SELLER required)
    router.get(
        '/api/seller/revenue/chart',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(revenueController.getRevenueChart)
    );

    return router;
};
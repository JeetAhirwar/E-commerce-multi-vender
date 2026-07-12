/**
 * Pure function-based routing factory representing the Deal campaigns API gateways.
 * Binds public campaign paths openly and locks administrative controllers under strict guards.
 */
export const createDealRoutes = ({
    router,
    dealController,
    authenticate,
    authorizeRoles,
    asyncHandler
}) =>
{

    // ==========================================
    // PUBLIC CAMPAIGNS GATEWAYS (Unrestricted Paths)
    // ==========================================

    // Public Endpoint: Pull complete list of active registered campaign deals (newest first)
    router.get(
        '/admin/deals',
        asyncHandler(dealController.listDeals)
    );

    // =======================================================
    // SECURED ADMINISTRATIVE CAMPAIGNS GATEWAYS (Admin Locks)
    // =======================================================

    // Admin Endpoint: Onboard a new e-commerce promotional campaign deal (Requires Admin Privileges)
    router.post(
        '/admin/deals',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(dealController.createDeal)
    );

    // Admin Endpoint: Modify discount percentage on an already existing campaign deal
    router.patch(
        '/admin/deals/:id',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(dealController.updateDeal)
    );

    // Admin Endpoint: Erase specific campaign asset from database registries
    router.delete(
        '/admin/deals/:id',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(dealController.deleteDeal)
    );

    return router;
};
/**
 * Pure function-based routing factory representing the Administrative API gateways.
 * Binds admin paths directly to authenticators and RBAC filters using dependency injection.
 */
export const createAdminRoutes = ({
    router,
    adminController,
    authenticate,
    authorizeRoles,
    asyncHandler
}) =>
{

    // ==========================================
    // SECURED ADMINISTRATIVE GATEWAYS (/admin/*)
    // ==========================================

    // Admin Endpoint: Commits operational status updates (e.g. ACTIVE, SUSPENDED, BANNED) (Authentication & ROLE_ADMIN required)
    router.patch(
        '/admin/seller/:id/status/:status',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(adminController.updateSellerStatus)
    );

    return router;
};
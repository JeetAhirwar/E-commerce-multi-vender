/**
 * Pure function-based routing factory representing the Homepage Merchandising API gateways.
 * Binds public landing paths openly and locks administrative controllers under strict guards.
 */
export const createHomeRoutes = ({
    router,
    homeController,
    authenticate,
    authorizeRoles,
    asyncHandler
}) =>
{

    // ==========================================
    // PUBLIC CAMPAIGNS GATEWAYS (Unrestricted Paths)
    // ==========================================

    // Public Endpoint: Pull unified homepage landing page metadata payload (newest first)
    router.get(
        '/home-page',
        asyncHandler(homeController.getHomePageData)
    );

    // =======================================================
    // SECURED ADMINISTRATIVE CAMPAIGNS GATEWAYS (Admin Locks)
    // =======================================================

    // Admin Endpoint: Onboard a list of home categories merchandising banners (Requires Admin Privileges)
    router.post(
        '/home/categories',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(homeController.createHomeCategories)
    );

    // Admin Endpoint: Pull complete list of registered HomeCategory layout documents
    router.get(
        '/admin/home-category',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(homeController.listHomeCategories)
    );

    // Admin Endpoint: Modify an existing homepage category document image or categoryTarget
    router.patch(
        '/admin/home-category/:id',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(homeController.updateHomeCategory)
    );

    return router;
};
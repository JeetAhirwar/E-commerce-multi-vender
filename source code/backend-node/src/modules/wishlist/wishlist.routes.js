/**
 * Pure function-based routing factory representing the Wishlist API gateways.
 * Binds wishlist paths directly to authenticators filters using dependency injection.
 */
export const createWishlistRoutes = ({
    router,
    wishlistController,
    authenticate,
    asyncHandler
}) =>
{

    // ==========================================
    // SECURED WISHLIST GATEWAYS (/api/wishlist/*)
    // ==========================================

    // Customer Endpoint: Recalculates and pulls active user wishlist favorites details (Authentication required)
    router.get(
        '/api/wishlist',
        authenticate,
        asyncHandler(wishlistController.findUserWishlist)
    );

    // Customer Endpoint: Toggles product membership inside user favorites array
    router.post(
        '/api/wishlist/add-product/:productId',
        authenticate,
        asyncHandler(wishlistController.toggleProductInWishlist)
    );

    // Customer Endpoint: Initializes a brand-new, empty wishlist record linked to a specific user (Legacy route)
    router.post(
        '/api/wishlist/create',
        authenticate,
        asyncHandler(wishlistController.createWishlist)
    );

    return router;
};
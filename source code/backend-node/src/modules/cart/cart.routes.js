/**
 * Pure function-based routing factory representing the Shopping Cart API gateways.
 * Binds shopping cart paths directly to authenticators filters using dependency injection.
 */
export const createCartRoutes = ({
    router,
    cartController,
    authenticate,
    asyncHandler
}) =>
{

    // ==========================================
    // SECURED SHOPPING CART GATEWAYS (/api/cart/*)
    // ==========================================

    // Customer Endpoint: Recalculates and pulls active user shopping cart details (Authentication required)
    router.get(
        '/api/cart',
        authenticate,
        asyncHandler(cartController.findUserCart)
    );

    // Customer Endpoint: Appends a specific catalog item snapshot inside user cart items array
    router.put(
        '/api/cart/add',
        authenticate,
        asyncHandler(cartController.addCartItem)
    );

    // Customer Endpoint: Modifies quantity metrics on already embedded items snapshot
    router.put(
        '/api/cart/item/:cartItemId',
        authenticate,
        asyncHandler(cartController.updateCartItem)
    );

    // Customer Endpoint: Removals target items snapshots cleanly from user shopping arrays
    router.delete(
        '/api/cart/item/:cartItemId',
        authenticate,
        asyncHandler(cartController.removeCartItem)
    );

    return router;
};
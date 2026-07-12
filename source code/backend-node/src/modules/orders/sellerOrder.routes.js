/**
 * Pure function-based routing factory representing the Merchant Seller Order API gateways.
 * Binds seller orders paths directly to authenticators and RBAC filters using dependency injection.
 */
export const createSellerOrderRoutes = ({
    router,
    sellerOrderController,
    authenticate,
    authorizeRoles,
    asyncHandler
}) =>
{

    // ==========================================
    // SECURED SELLER ORDER GATEWAYS (/seller/orders/*)
    // ==========================================

    // Seller Endpoint: Retrieve own store items catalog list chronologically newest first (Authentication & ROLE_SELLER required)
    router.get(
        '/seller/orders',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(sellerOrderController.getSellerOrders)
    );

    // Seller Endpoint: Commits operational status updates (e.g. SHIPPED, DELIVERED) (Authentication & ROLE_SELLER required)
    router.patch(
        '/seller/orders/:orderId/status/:orderStatus',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(sellerOrderController.updateStatus)
    );

    // Seller Endpoint: Executes soft-deletion cancellations on owned order
    router.delete(
        '/seller/orders/:orderId/delete',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(sellerOrderController.deleteOrder)
    );

    return router;
};
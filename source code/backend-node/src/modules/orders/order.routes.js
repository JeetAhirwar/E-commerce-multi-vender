/**
 * Pure function-based routing factory representing the Customer Sales Order API gateways.
 * Binds order paths directly to authenticators filters using dependency injection.
 */
export const createOrderRoutes = ({
    router,
    orderController,
    authenticate,
    asyncHandler
}) =>
{

    // ==========================================
    // SECURED SALES ORDER GATEWAYS (/api/orders/*)
    // ==========================================

    // Customer Endpoint: Split checkout from cart generating dynamic parent payment link url (Authentication required)
    router.post(
        '/api/orders',
        authenticate,
        asyncHandler(orderController.createOrders)
    );

    // Customer Endpoint: Pull purchase history list chronologically newest first
    router.get(
        '/api/orders/user',
        authenticate,
        asyncHandler(orderController.getUserOrders)
    );

    // Customer Endpoint: Retrieve specific order details enforcing role permissions checks
    router.get(
        '/api/orders/:orderId',
        authenticate,
        asyncHandler(orderController.getOrderById)
    );

    // Customer Endpoint: Retrieve single ordered product snapshot details (Authentication required)
    router.get(
        '/api/orders/item/:orderItemId',
        authenticate,
        asyncHandler(orderController.getOrderItemById)
    );

    // Customer Endpoint: Executes order cancellations and refunds updates inside transactions
    router.put(
        '/api/orders/:orderId/cancel',
        authenticate,
        asyncHandler(orderController.cancelOrder)
    );

    return router;
};
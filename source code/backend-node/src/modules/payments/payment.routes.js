/**
 * Pure function-based routing factory representing the Payment Verification API gateways.
 * Binds payment paths directly to authenticators filters using dependency injection.
 */
export const createPaymentRoutes = ({
    router,
    paymentController,
    authenticate,
    asyncHandler
}) =>
{

    // ==========================================
    // SECURED PAYMENTS GATEWAYS (/api/payment/*)
    // ==========================================

    // Customer Endpoint: Validates captured transaction success, running atomic double-entry accounting ledgers inside transaction sessions
    router.get(
        '/api/payment/:paymentId',
        authenticate,
        asyncHandler(paymentController.verifyPayment)
    );

    // Customer Endpoint: Re-issues a brand-new, active checkout payment link URL for a pending split order
    router.post(
        '/api/payment/:paymentMethod/order/:orderId',
        authenticate,
        asyncHandler(paymentController.reissuePaymentLink)
    );

    return router;
};
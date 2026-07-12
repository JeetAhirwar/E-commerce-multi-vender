/**
 * Pure function-based routing factory representing the Customer Reviews API gateways.
 * Binds public reviews path openly and locks user-gated modifications under strict guards.
 */
export const createReviewRoutes = ({
    router,
    reviewController,
    authenticate,
    asyncHandler
}) =>
{

    // ==========================================
    // PUBLIC REVIEWS GATEWAYS (Unrestricted Paths)
    // ==========================================

    // Public Endpoint: Pull product-specific reviews list chronologically newest first
    router.get(
        '/api/products/:productId/reviews',
        asyncHandler(reviewController.getProductReviews)
    );

    // ===============================================
    // SECURED REVIEWS GATEWAYS (/api/reviews/*)
    // ===============================================

    // Customer Endpoint: Onboard a new product review and rating (Authentication required)
    router.post(
        '/api/products/:productId/reviews',
        authenticate,
        asyncHandler(reviewController.createReview)
    );

    // Customer Endpoint: Modify an existing review rating or feedback owned by the customer
    router.patch(
        '/api/reviews/:reviewId',
        authenticate,
        asyncHandler(reviewController.updateReview)
    );

    // Customer Endpoint: Erase specific review record from database collections
    router.delete(
        '/api/reviews/:reviewId',
        authenticate,
        asyncHandler(reviewController.deleteReview)
    );

    return router;
};
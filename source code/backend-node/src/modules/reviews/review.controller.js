/**
 * Pure function-based factory representing the Customer Reviews HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createReviewController = ({ reviewService }) =>
{

    /**
     * Retrieves product-specific reviews and ratings listings.
     * Maps exactly to: GET /api/products/:productId/reviews (Public route - No auth required)
     */
    const getProductReviews = async (req, res) =>
    {
        const { productId } = req.params;

        const reviews = await reviewService.getProductReviews({ productId });

        // 200 OK: Delivers complete feedback lists back to client UI
        res.status(200).json(reviews);
    };

    /**
     * Appends a new product review and rating securely.
     * Maps exactly to: POST /api/products/:productId/reviews (Authentication required)
     */
    const createReview = async (req, res) =>
    {
        const userId = req.user.id;
        const { productId } = req.params;
        const { reviewText, rating, productImages } = req.body;

        const newReview = await reviewService.createReview({
            reviewText,
            rating,
            productImages,
            productId,
            userId,
        });

        // 200 OK: Matches expected e-commerce return code for successful review onboarding
        res.status(200).json(newReview);
    };

    /**
     * Modifies an existing review feedback and rating owned by the customer.
     * Maps exactly to: PATCH /api/reviews/:reviewId (Ownership required)
     */
    const updateReview = async (req, res) =>
    {
        const userId = req.user.id;
        const { reviewId } = req.params;
        const { reviewText, rating } = req.body;

        const updatedReview = await reviewService.updateReview({
            reviewId,
            reviewText,
            rating,
            userId,
        });

        res.status(200).json(updatedReview);
    };

    /**
     * Erases an existing review record cleanly.
     * Maps exactly to: DELETE /api/reviews/:reviewId (Ownership required)
     */
    const deleteReview = async (req, res) =>
    {
        const userId = req.user.id;
        const { reviewId } = req.params;

        const outcome = await reviewService.deleteReview({
            reviewId,
            userId,
        });

        res.status(200).json(outcome);
    };

    return Object.freeze({
        getProductReviews,
        createReview,
        updateReview,
        deleteReview,
    });
};
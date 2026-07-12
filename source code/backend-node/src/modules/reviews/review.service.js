/**
 * Pure function-based factory representing the Customer Reviews Business Service layer.
 * Enforces strict security ownership checks and catalog verification workflows.
 */
export const createReviewService = ({
    reviewRepository,
    productRepository,
    createApiError
}) =>
{

    /**
     * Onboards a brand-new customer product review and rating.
     * Validates product existence prior to creation.
     */
    const createReview = async ({ reviewText, rating, productImages = [], productId, userId }) =>
    {

        // 1. Core Validation: Ensure targeted product exists in catalog registries
        const product = await productRepository.findById(productId);
        if (!product)
        {
            throw createApiError({
                statusCode: 404,
                code: 'PRODUCT_NOT_FOUND',
                message: 'Review creation failed. The targeted product catalog listing does not exist.'
            });
        }

        // 2. Prepare review attributes linking active customer user and product IDs
        const preparedReviewData = {
            reviewText,
            rating: parseInt(rating, 10),
            productImages,
            product: productId,
            user: userId, // Binds verified reviewer customer ID
        };

        // 3. Commit review write operations
        return reviewRepository.create(preparedReviewData);
    };

    /**
     * Modifies an existing review record safely.
     * Enforces strict reviewer-ownership checks prior to writing updates.
     */
    const updateReview = async ({ reviewId, reviewText, rating, userId }) =>
    {

        // 1. Locate dynamic targeted review document
        const review = await reviewRepository.findById(reviewId);
        if (!review)
        {
            throw createApiError({
                statusCode: 404,
                code: 'REVIEW_NOT_FOUND',
                message: 'Review modification failed. The requested review was not found.'
            });
        }

        // 2. Core Security Check: Validate that the requesting user owns this review listing
        const isOwner = review.user.toString() === userId.toString();
        if (!isOwner)
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCESS_FORBIDDEN',
                message: 'Access Denied: You do not possess authorizations to modify another customer’s review.'
            });
        }

        // 3. Assemble updates payload
        const updateData = {};
        if (reviewText !== undefined) updateData.reviewText = reviewText;
        if (rating !== undefined) updateData.rating = parseInt(rating, 10);

        // 4. Commit updates safely in database
        return reviewRepository.update(reviewId, updateData);
    };

    /**
     * Erases a review listing permanently.
     * Enforces strict customer-ownership validation barriers.
     */
    const deleteReview = async ({ reviewId, userId }) =>
    {

        // 1. Locate target document
        const review = await reviewRepository.findById(reviewId);
        if (!review)
        {
            throw createApiError({
                statusCode: 404,
                code: 'REVIEW_NOT_FOUND',
                message: 'Review deletion failed. The targeted record does not exist.'
            });
        }

        // 2. Security Check: Enforce customer ownership limits
        const isOwner = review.user.toString() === userId.toString();
        if (!isOwner)
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCESS_FORBIDDEN',
                message: 'Deletion rejected: You can only remove reviews belonging to your own account.'
            });
        }

        // 3. Trigger hard deletion pipeline
        await reviewRepository.delete(reviewId);

        return { success: true, message: 'Review successfully removed.' };
    };

    /**
     * Displays product-specific reviews list.
     */
    const getProductReviews = async ({ productId }) =>
    {
        return reviewRepository.findByProductId(productId);
    };

    return Object.freeze({
        createReview,
        updateReview,
        deleteReview,
        getProductReviews,
    });
};
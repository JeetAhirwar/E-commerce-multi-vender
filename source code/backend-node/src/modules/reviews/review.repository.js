/**
 * Pure function-based factory representing the Review Persistence database interface.
 * Decouples database collections lookup pipelines using Dependency Injection.
 */
export const createReviewRepository = ({ Review }) =>
{

    /**
     * Commits a new product review document directly into the database.
     */
    const create = async (reviewData, options = {}) =>
    {
        const [newReview] = await Review.create([reviewData], options);
        return newReview ? newReview.toObject() : null;
    };

    /**
     * Discovers a review document by its unique database ObjectId.
     */
    const findById = async (id, options = {}) =>
    {
        return Review.findById(id, null, options).lean();
    };

    /**
     * Pulls product-specific reviews list chronologically descending (newest first).
     * Populates associated customer reviewer details securely.
     */
    const findByProductId = async (productId, options = {}) =>
    {
        return Review.find({ product: productId }, null, options)
            .sort({ createdAt: -1 })
            .populate('user', 'fullName') // Populates customer details securely (Masking other private properties)
            .lean(); // Returns plain lightweight JS objects for fast memory rendering
    };

    /**
     * Modifies an existing review document. Returns the newly updated state.
     */
    const update = async (id, updateData, options = {}) =>
    {
        return Review.findByIdAndUpdate(
            id,
            { $set: updateData },
            { ...options, new: true, runValidators: true } // Returns updated record enforcing schema validations
        ).lean();
    };

    /**
     * Erases a review document permanently from the collection.
     */
    const deleteReview = async (id, options = {}) =>
    {
        return Review.findByIdAndDelete(id, options).lean();
    };

    return Object.freeze({
        create,
        findById,
        findByProductId,
        update,
        delete: deleteReview,
    });
};
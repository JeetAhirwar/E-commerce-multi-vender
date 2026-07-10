/**
 * Pure function-based factory representing the Wishlist Persistence database interface.
 * Implements loose-coupling by accepting Mongoose Model through Dependency Injection.
 */
export const createWishlistRepository = ({ Wishlist }) =>
{

    /**
     * Initializes a brand-new, empty wishlist record linked to a specific user.
     */
    const createWishlist = async ({ userId }, options = {}) =>
    {
        const [newWishlist] = await Wishlist.create([{
            user: userId,
            products: [], // Onboarding setups start with clean empty favorites arrays
        }], options);

        return newWishlist ? newWishlist.toObject() : null;
    };

    /**
     * Discovers and retrieves a customer's active wishlist based on their User ID.
     * Populates full dynamic Product details inside the products reference list.
     */
    const findByUserId = async ({ userId }, options = {}) =>
    {
        return Wishlist.findOne({ user: userId }, null, options)
            .populate('products') // Populates full product details inside array reference list
            .lean(); // Returns weightless standard plain Javascript memory objects
    };

    /**
     * Appends a product ID atomically to the customer's favorites array.
     * Employs $addToSet to natively prevent duplicate entries.
     */
    const addProductToWishlist = async ({ userId, productId }, options = {}) =>
    {
        return Wishlist.findOneAndUpdate(
            { user: userId },
            { $addToSet: { products: productId } }, // Native MongoDB unique insertion operator
            { ...options, new: true } // Returns newly updated document
        )
            .populate('products')
            .lean();
    };

    /**
     * Erases a specific product ID cleanly from customer's favorites array.
     * Employs $pull to atomically remove single reference keys.
     */
    const removeProductFromWishlist = async ({ userId, productId }, options = {}) =>
    {
        return Wishlist.findOneAndUpdate(
            { user: userId },
            { $pull: { products: productId } }, // Native MongoDB atomic array extraction operator
            { ...options, new: true }
        )
            .populate('products')
            .lean();
    };

    return Object.freeze({
        createWishlist,
        findByUserId,
        addProductToWishlist,
        removeProductFromWishlist,
    });
};
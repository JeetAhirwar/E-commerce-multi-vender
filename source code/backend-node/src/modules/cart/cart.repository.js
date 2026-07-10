/**
 * Pure function-based factory representing the Shopping Cart Persistence interface.
 * Implements loose-coupling and supports complex atomic modifications query wrappers.
 */
export const createCartRepository = ({ Cart }) =>
{

    /**
     * Initializes a brand-new, empty shopping cart record linked to a specific user.
     */
    const createCart = async ({ userId }, options = {}) =>
    {
        const [newCart] = await Cart.create([{
            user: userId,
            items: [], // Onboarding setups start with clean empty shopping registers
            totalSellingPrice: 0,
            totalItem: 0,
            totalMrpPrice: 0,
            discount: 0,
        }], options);

        return newCart ? newCart.toObject() : null;
    };

    /**
     * Discovers and retrieves a customer's active shopping cart based on their User ID.
     * Populates deep references to nested Product catalog detail inside cart elements.
     */
    const findByUserId = async ({ userId }, options = {}) =>
    {
        return Cart.findOne({ user: userId }, null, options)
            .populate('items.product') // Dynamically populates nested product catalog data inside items arrays
            .lean(); // Returns weightless plain Javascript objects
    };

    /**
     * Dynamic Cart State Writer.
     * Commits computed totals, embedded items listings, and coupon properties into database cleanly.
     * Employs atomic Mongoose update operations to guarantee data isolation levels.
     */
    const updateCart = async ({ userId, cartData }, options = {}) =>
    {
        return Cart.findOneAndUpdate(
            { user: userId },
            { $set: cartData }, // Overwrites structural data metrics with recalculated server outputs
            {
                ...options,
                new: true, // Returns updated document state
                runValidators: true, // Enforces schema safety rules on target fields
            }
        )
            .populate('items.product')
            .lean();
    };

    return Object.freeze({
        createCart,
        findByUserId,
        updateCart,
    });
};
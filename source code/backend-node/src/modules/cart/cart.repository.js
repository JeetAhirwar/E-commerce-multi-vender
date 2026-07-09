/**
 * Creates a repository for managing shopping carts.
 */
export const createCartRepository = ({ Cart }) =>
{

    /**
     * Create a new cart for a user.
     */
    const createCart = async ({ userId }, options = {}) =>
    {
        // Using an array supports MongoDB transactions.
        const [newCart] = await Cart.create([{
            user: userId,
            items: [], // Cart starts empty.
            totalSellingPrice: 0,
            totalItem: 0,
            totalMrpPrice: 0,
            discount: 0,
        }], options);

        // Convert the document to a plain object.
        return newCart ? newCart.toObject() : null;
    };

    /**
     * Find a cart by user ID.
     */
    const findByUserId = async ({ userId }, options = {}) =>
    {
        return Cart.findOne(
            { user: userId },
            null, // Return all fields.
            options // Optional query options (e.g. session).
        ).lean(); // Return a plain object.
    };

    return Object.freeze({
        createCart,
        findByUserId,
    });
};
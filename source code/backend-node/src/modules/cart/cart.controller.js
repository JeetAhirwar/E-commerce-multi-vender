/**
 * Pure function-based factory representing the Shopping Cart HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createCartController = ({ cartService }) =>
{

    /**
     * Recalculates and retrieves customer's active shopping cart summaries.
     * Maps exactly to: GET /api/cart
     */
    const findUserCart = async (req, res) =>
    {
        // Standard secure claims extraction: Pulls user identity ID directly from decoded Bearer claims
        const userId = req.user.id;

        const cart = await cartService.findUserCart({ userId });

        // 200 OK: Standard e-commerce cart response code delivery
        res.status(200).json(cart);
    };

    /**
     * Appends an item snapshot into customer's shopping cart array.
     * Maps exactly to: PUT /api/cart/add
     */
    const addCartItem = async (req, res) =>
    {
        const userId = req.user.id;
        const { productId, size, quantity } = req.body;

        const cartItem = await cartService.addCartItem({
            userId,
            productId,
            size,
            quantity: quantity ? parseInt(quantity, 10) : 1, // Restricts quantity parameter conversions cleanly
        });

        // 202 Accepted: Standard expected e-commerce return code for async cart processing commits
        res.status(202).json(cartItem);
    };

    /**
     * Modifies quantities allocations on an already embedded item snapshot inside cart.
     * Maps exactly to: PUT /api/cart/item/:cartItemId
     */
    const updateCartItem = async (req, res) =>
    {
        const userId = req.user.id;
        const { cartItemId } = req.params;
        const { quantity } = req.body;

        const updatedItem = await cartService.updateCartItem({
            userId,
            cartItemId,
            quantity,
        });

        res.status(202).json(updatedItem);
    };

    /**
     * Erases an item snapshot cleanly from shopping cart array.
     * Maps exactly to: DELETE /api/api/cart/item/:cartItemId
     */
    const removeCartItem = async (req, res) =>
    {
        const userId = req.user.id;
        const { cartItemId } = req.params;

        const outcome = await cartService.removeCartItem({
            userId,
            cartItemId,
        });

        res.status(202).json(outcome);
    };

    return Object.freeze({
        findUserCart,
        addCartItem,
        updateCartItem,
        removeCartItem,
    });
};
/**
 * Pure function-based factory representing the Wishlist HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createWishlistController = ({ wishlistService }) =>
{

    /**
     * Retrieves or lazy-initializes customer's active wishlist favorites lists.
     * Maps exactly to: GET /api/wishlist
     */
    const findUserWishlist = async (req, res) =>
    {
        // Standard secure claims extraction: Pulls user identity ID directly from decoded Bearer claims
        const userId = req.user.id;

        const wishlist = await wishlistService.getOrCreateWishlist({ userId });

        // 200 OK: Standard customer favorites response payload delivery
        res.status(200).json(wishlist);
    };

    /**
     * Toggles product membership inside customer's wishlist favorites array.
     * Maps exactly to: POST /api/wishlist/add-product/:productId
     */
    const toggleProductInWishlist = async (req, res) =>
    {
        const userId = req.user.id;
        const { productId } = req.params; // Captures target product ID from URL path variables

        const updatedWishlist = await wishlistService.toggleProductInWishlist({
            userId,
            productId,
        });

        res.status(200).json(updatedWishlist);
    };

    return Object.freeze({
        findUserWishlist,
        toggleProductInWishlist,
    });
};
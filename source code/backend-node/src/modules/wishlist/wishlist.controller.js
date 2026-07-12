/**
 * Pure function-based factory representing the Wishlist HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createWishlistController = ({ wishlistService }) =>
{

    /**
     * Retrieves or lazy-initializes customer's active wishlist favorites lists.
     * Maps exactly to: GET /api/wishlist (Authentication required)
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
     * Maps exactly to: POST /api/wishlist/add-product/:productId (Authentication required)
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

    /**
     * Legacy Wishlist Creator.
     * Initializes a brand-new, empty wishlist record linked to a specific user.
     * Maps exactly to: POST /api/wishlist/create (Authentication/Admin required)
     */
    const createWishlist = async (req, res) =>
    {
        // Reads targeted user ID from request body payload stream (legacy compatibility)
        const userId = req.body.user || req.user.id;

        const wishlist = await wishlistService.getOrCreateWishlist({ userId });

        // 200 OK: Matches expected e-commerce return code for successful wishlist creations
        res.status(200).json(wishlist);
    };

    return Object.freeze({
        findUserWishlist,
        toggleProductInWishlist,
        createWishlist, // Added legacy wishlist creator controller method
    });
};
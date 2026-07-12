/**
 * Pure function-based factory representing the Merchant Seller HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createSellerController = ({ sellerService, sellerReportRepository }) =>
{

    /**
     * Retrieves authenticated merchant's own account profile.
     * Maps exactly to: GET /sellers/profile (Authentication required)
     */
    const getProfile = async (req, res) =>
    {
        // Reads authenticated vendor ID directly from decoded Bearer claims
        const sellerId = req.user.id;

        const profile = await sellerService.getSellerProfile({ sellerId });

        // 200 OK: Standard profile response payload delivery
        res.status(200).json(profile);
    };

    /**
     * Modifies an existing merchant's profile.
     * Maps exactly to: PATCH /sellers (Authentication required)
     */
    const updateProfile = async (req, res) =>
    {
        const sellerId = req.user.id;
        const updatePayload = req.body;

        const updatedProfile = await sellerService.updateSeller({
            id: sellerId,
            updateData: updatePayload,
        });

        res.status(200).json(updatedProfile);
    };

    /**
     * Public/Admin merchant account profile lookup by unique database ObjectId.
     * Maps exactly to: GET /sellers/:id
     */
    const getSellerById = async (req, res) =>
    {
        const { id } = req.params;

        const profile = await sellerService.getSellerProfile({ sellerId: id });

        res.status(200).json(profile);
    };

    /**
     * Administrative CRUD: Displays all registered merchant profiles (Optionally filtered by status).
     * Maps exactly to: GET /sellers
     */
    const listSellers = async (req, res) =>
    {
        const { status } = req.query;

        const sellersList = await sellerService.listSellers({ status });

        res.status(200).json(sellersList);
    };

    /**
     * Administrative CRUD: Erases targeted merchant profile cleanly.
     * Maps exactly to: DELETE /sellers/:id (Admin privileges required)
     */
    const deleteSeller = async (req, res) =>
    {
        const { id } = req.params;

        await sellerService.deleteSeller({ id });

        // 204 No Content: Standard expected e-commerce return code for admin deletions commits
        res.status(204).send();
    };

    /**
     * Retrieves or lazy-initializes authenticated merchant's active analytical report card.
     * Maps exactly to: GET /sellers/report (Authentication & ROLE_SELLER required)
     */
    const getSellerReport = async (req, res) =>
    {
        const sellerId = req.user.id;

        // Direct repository delegation (Lazy-creates record atomically if absent in database)
        const report = await sellerReportRepository.getOrCreateReport({ sellerId });

        res.status(200).json(report);
    };

    return Object.freeze({
        getProfile,
        updateProfile,
        getSellerById,
        listSellers,
        deleteSeller,
        getSellerReport, // Added report panel controller method
    });
};
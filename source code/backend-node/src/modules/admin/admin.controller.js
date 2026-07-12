/**
 * Pure function-based factory representing the Administrative HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createAdminController = ({ sellerService }) =>
{

    /**
     * Admin Seller Account Moderation Status Modifier.
     * Maps exactly to: PATCH /admin/seller/:id/status/:status (Admin authorization required)
     */
    const updateSellerStatus = async (req, res) =>
    {
        // Extracts targets from URL path variables parameters
        const { id, status } = req.params;

        // Direct business delegation: Calls core seller service layer status update blocks
        const updatedSeller = await sellerService.updateAccountStatus({
            id,
            status,
        });

        // 200 OK: Standard customer response payload delivery
        res.status(200).json(updatedSeller);
    };

    return Object.freeze({
        updateSellerStatus,
    });
};
/**
 * Pure function-based factory representing the Merchant Seller Order HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createSellerOrderController = ({ orderService }) =>
{

    /**
     * Retrieves merchant store orders list chronologically newest first.
     * Maps exactly to: GET /seller/orders (Seller authorization required)
     */
    const getSellerOrders = async (req, res) =>
    {
        // Reads authenticated vendor ID directly from decoded Bearer claims (req.user)
        const sellerId = req.user.id;

        const ordersList = await orderService.getSellerOrders({ sellerId });

        // 202 Accepted: Matches expected e-commerce return code for successful lists retrieval
        res.status(202).json(ordersList);
    };

    /**
     * Merchant Order Status Transitions Modifier.
     * Maps exactly to: PATCH /seller/orders/:orderId/status/:orderStatus (Seller authorization required)
     */
    const updateStatus = async (req, res) =>
    {
        // Extracts targets from URL path variables parameters
        const { orderId, orderStatus } = req.params;
        const sellerId = req.user.id;

        const updatedOrder = await orderService.updateOrderStatus({
            orderId,
            orderStatus,
            sellerId,
        });

        res.status(202).json(updatedOrder);
    };

    /**
     * Merchant Order Deletions (Soft-cancel allocations).
     * Maps exactly to: DELETE /seller/orders/:orderId/delete (Seller ownership required)
     */
    const deleteOrder = async (req, res) =>
    {
        const { orderId } = req.params;
        const sellerId = req.user.id;

        const outcome = await orderService.deleteOrder({
            orderId,
            sellerId,
        });

        res.status(202).json(outcome);
    };

    return Object.freeze({
        getSellerOrders,
        updateStatus,
        deleteOrder,
    });
};
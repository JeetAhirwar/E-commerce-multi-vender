/**
 * Pure function-based factory representing the Sales Order HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createOrderController = ({ orderService, paymentService }) =>
{

    /**
     * Master Split Checkout Controller.
     * Generates multiple seller-split orders and handshakes with gateway to return payment link URL.
     * Maps exactly to: POST /api/orders?paymentMethod=RAZORPAY|STRIPE
     */
    const createOrders = async (req, res) =>
    {
        const userId = req.user.id;
        const shippingAddress = req.body;
        const { paymentMethod } = req.query;

        const { splitOrders, finalPayableAmount } = await orderService.createOrdersFromCart({
            userId,
            shippingAddress,
            paymentMethod,
        });

        const ordersList = splitOrders.map((order) => order._id);

        const { payment_link_url } = await paymentService.createPaymentOrder({
            userId,
            amount: finalPayableAmount,
            orders: ordersList,
            paymentMethod,
        });

        res.status(200).json({ payment_link_url });
    };

    /**
     * Retrieves purchase history of a customer.
     * Maps exactly to: GET /api/orders/user
     */
    const getUserOrders = async (req, res) =>
    {
        const userId = req.user.id;

        const ordersList = await orderService.getUserOrders({ userId });

        res.status(202).json(ordersList);
    };

    /**
     * Retrieves merchant store orders panel.
     * Maps exactly to: GET /seller/orders
     */
    const getSellerOrders = async (req, res) =>
    {
        const sellerId = req.user.id;

        const ordersList = await orderService.getSellerOrders({ sellerId });

        res.status(202).json(ordersList);
    };

    /**
     * Retrieves single order details, enforcing access controls for actors.
     * Maps exactly to: GET /api/orders/:orderId
     */
    const getOrderById = async (req, res) =>
    {
        const { orderId } = req.params;
        const actorId = req.user.id;
        const actorRole = req.user.role;

        const orderDetail = await orderService.getOrderById({
            orderId,
            actorId,
            actorRole,
        });

        res.status(202).json(orderDetail);
    };

    /**
     * Executes order cancellations.
     * Maps exactly to: PUT /api/orders/:orderId/cancel
     */
    const cancelOrder = async (req, res) =>
    {
        const { orderId } = req.params;
        const userId = req.user.id;

        const cancelledOrder = await orderService.cancelOrder({
            orderId,
            userId,
        });

        res.status(200).json(cancelledOrder);
    };

    /**
     * Retrieves single order item snapshot details.
     * Maps exactly to: GET /api/orders/item/:orderItemId (Authentication required)
     */
    const getOrderItemById = async (req, res) =>
    {
        const { orderItemId } = req.params; // Captures unique subdocument ID from URL path variables

        const itemSnapshot = await orderService.getOrderItemById({ orderItemId });

        // 202 Accepted: Matches expected e-commerce return code for successful item retrieval
        res.status(202).json(itemSnapshot);
    };

    return Object.freeze({
        createOrders,
        getUserOrders,
        getSellerOrders,
        getOrderById,
        cancelOrder,
        getOrderItemById, // Added single item snapshot controller method
    });
};
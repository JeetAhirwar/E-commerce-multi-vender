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
        const { paymentMethod } = req.query; // Reads from query parameter: ?paymentMethod=RAZORPAY

        // 1. Process and persist individual split orders inside database registries
        const { splitOrders, finalPayableAmount } = await orderService.createOrdersFromCart({
            userId,
            shippingAddress,
            paymentMethod,
        });

        // 2. Map split orders database IDs to build parent payment order aggregate container
        const ordersList = splitOrders.map((order) => order._id);

        // 3. Handshake with Stripe/Razorpay SDKs to generate dynamic checkout URL
        const { payment_link_url } = await paymentService.createPaymentOrder({
            userId,
            amount: finalPayableAmount,
            orders: ordersList,
            paymentMethod,
        });

        // 200 OK: Delivers exact payload structure expected by React Frontend to redirect customer browser
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

        // 202 Accepted: Match Spring Boot return statuses spec cleanly
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

    return Object.freeze({
        createOrders,
        getUserOrders,
        getSellerOrders,
        getOrderById,
        cancelOrder,
    });
};
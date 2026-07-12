/**
 * Pure function-based factory representing the Order Persistence database interface.
 * Decouples database collections lookup pipelines using Dependency Injection.
 */
export const createOrderRepository = ({ Order }) =>
{

    /**
     * Commits a new split order document directly into database.
     */
    const createOrder = async (orderData, options = {}) =>
    {
        const [newOrder] = await Order.create([orderData], options);
        return newOrder ? newOrder.toObject() : null;
    };

    /**
     * Pulls customer purchase order history sorted newest first.
     */
    const findByUser = async ({ userId }, options = {}) =>
    {
        return Order.find({ user: userId }, null, options)
            .sort({ orderDate: -1 })
            .populate('seller', 'sellerName email mobile businessDetails')
            .lean();
    };

    /**
     * Pulls merchant store orders board sorted newest first.
     */
    const findBySeller = async ({ sellerId }, options = {}) =>
    {
        return Order.find({ seller: sellerId }, null, options)
            .sort({ orderDate: -1 })
            .populate('user', 'fullName email mobile')
            .lean();
    };

    /**
     * Discovers a single order document by its unique database ObjectId.
     */
    const findById = async (id, options = {}) =>
    {
        return Order.findById(id, null, options)
            .populate('user', 'fullName email mobile')
            .populate('seller', 'sellerName email mobile businessDetails')
            .lean();
    };

    /**
     * Commits administrative account status changes (e.g., ACTIVE, SUSPENDED, BANNED) into database.
     */
    const updateStatus = async ({ orderId, orderStatus }, options = {}) =>
    {
        return Order.findByIdAndUpdate(
            orderId,
            { orderStatus },
            { ...options, new: true, runValidators: true }
        ).lean();
    };

    /**
     * Commits payment status updates into database.
     */
    const updatePaymentStatus = async ({ orderId, paymentStatus }, options = {}) =>
    {
        return Order.findByIdAndUpdate(
            orderId,
            { paymentStatus },
            { ...options, new: true }
        ).lean();
    };

    /**
     * Locates and retrieves a specific embedded ordered product snapshot by its unique subdocument ID.
     * Leverages MongoDB Positional Projection Operator ($) to avoid loading unrelated array elements.
     */
    const findOrderItemById = async (orderItemId, options = {}) =>
    {
        const order = await Order.findOne(
            { 'orderItems._id': orderItemId }, // Locates order containing target subdocument item ID
            { 'orderItems.$': 1 }, // Positional Projection: Returns only the matching array element!
            options
        ).lean();

        return order && order.orderItems ? order.orderItems[0] : null;
    };

    return Object.freeze({
        createOrder,
        findByUser,
        findBySeller,
        findById,
        updateStatus,
        updatePaymentStatus,
        findOrderItemById, // Added positional ordered item subdocument lookup
    });
};
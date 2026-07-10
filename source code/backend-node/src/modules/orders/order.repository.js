/**
 * Pure function-based factory representing the Order Persistence database interface.
 * Decouples database collections lookup pipelines using Dependency Injection.
 */
export const createOrderRepository = ({ Order }) =>
{

    /**
     * Commits a new split order document directly into database.
     * Supports array-wrap configurations to run smoothly inside transactions.
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
            .populate('seller', 'sellerName email mobile businessDetails') // Populates seller metadata securely
            .lean(); // Returns plain lightweight JS objects for fast memory rendering
    };

    /**
     * Pulls merchant store orders board sorted newest first.
     */
    const findBySeller = async ({ sellerId }, options = {}) =>
    {
        return Order.find({ seller: sellerId }, null, options)
            .sort({ orderDate: -1 })
            .populate('user', 'fullName email mobile') // Populates customer details
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
     * Commits operational order status updates (e.g., SHIPPED, DELIVERED) into database.
     */
    const updateStatus = async ({ orderId, orderStatus }, options = {}) =>
    {
        return Order.findByIdAndUpdate(
            orderId,
            { orderStatus },
            { ...options, new: true, runValidators: true } // Returns updated record enforcing schema validations
        ).lean();
    };

    /**
     * Commits payment status updates (e.g., COMPLETED, FAILED) into database.
     */
    const updatePaymentStatus = async ({ orderId, paymentStatus }, options = {}) =>
    {
        return Order.findByIdAndUpdate(
            orderId,
            { paymentStatus },
            { ...options, new: true }
        ).lean();
    };

    return Object.freeze({
        createOrder,
        findByUser,
        findBySeller,
        findById,
        updateStatus,
        updatePaymentStatus,
    });
};
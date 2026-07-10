/**
 * Pure function-based factory representing the PaymentOrder Persistence database interface.
 * Decouples database collections lookup pipelines using Dependency Injection.
 */
export const createPaymentOrderRepository = ({ PaymentOrder }) =>
{

    /**
     * Commits a new parent payment order document directly into database.
     * Supports array-wrap configurations to run smoothly inside transactions.
     */
    const createPaymentOrder = async (paymentOrderData, options = {}) =>
    {
        const [newPaymentOrder] = await PaymentOrder.create([paymentOrderData], options);
        return newPaymentOrder ? newPaymentOrder.toObject() : null;
    };

    /**
     * Locates a payment order container using unique sparse provider link ID.
     * Populates linked split child orders cleanly to allow inline atomic updates.
     */
    const findByPaymentLinkId = async (paymentLinkId, options = {}) =>
    {
        return PaymentOrder.findOne({ paymentLinkId }, null, options)
            .populate('orders') // Populates split child orders list to enable mass updates
            .lean(); // Returns plain lightweight JS objects for fast memory rendering
    };

    /**
     * Commits final transaction status (e.g., SUCCESS, FAILED) and attaches gateway payment ID.
     */
    const updateStatus = async ({ paymentOrderId, status, providerPaymentId }, options = {}) =>
    {
        return PaymentOrder.findByIdAndUpdate(
            paymentOrderId,
            {
                status,
                providerPaymentId
            },
            { ...options, new: true, runValidators: true } // Returns updated record enforcing schema validations
        ).lean();
    };

    return Object.freeze({
        createPaymentOrder,
        findByPaymentLinkId,
        updateStatus,
    });
};
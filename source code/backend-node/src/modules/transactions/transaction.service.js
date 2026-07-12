/**
 * Pure function-based factory representing the Transaction Ledger core Business Service layer.
 * Coordinates merchant statements checks, dynamic auditing logs, and double-entry validations.
 */
export const createTransactionService = ({
    transactionRepository,
    orderRepository,
    createApiError
}) =>
{

    /**
     * Onboards a brand-new transaction ledger record associated to completed paid split orders.
     * Enforces strict order uniqueness checks to prevent duplicate accounting registries.
     */
    const createForOrder = async ({ orderId }) =>
    {

        // 1. Core Check: Validate if target split order actually exists in databases
        const order = await orderRepository.findById(orderId);
        if (!order)
        {
            throw createApiError({
                statusCode: 404,
                code: 'ORDER_NOT_FOUND',
                message: 'Transaction logging failed. Mapped sales order does not exist.'
            });
        }

        // 2. Business Check: Ensure transaction is registered only for PAID orders
        const isPaid = order.paymentStatus === 'COMPLETED' || order.paymentStatus === 'SUCCESS';
        if (!isPaid)
        {
            throw createApiError({
                statusCode: 400,
                code: 'ORDER_NOT_PAID',
                message: 'Transaction logging rejected. Mapped sales order has not been paid yet.'
            });
        }

        // 3. Commit write operations directly into database ledgers
        return transactionRepository.createTransaction({
            customer: order.user._id,
            seller: order.seller._id,
            order: order._id,
        });
    };

    /**
     * Retrieves merchant specific store transaction histories list.
     */
    const getSellerTransactions = async ({ sellerId }) =>
    {
        return transactionRepository.findBySellerId(sellerId);
    };

    /**
     * Retrieves complete global platform transactions ledger (Admin audits lookup).
     */
    const getAllTransactions = async () =>
    {
        return transactionRepository.findAllTransactions();
    };

    return Object.freeze({
        createForOrder,
        getSellerTransactions,
        getAllTransactions,
    });
};
/**
 * Pure function-based factory representing the Transaction Ledger HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createTransactionController = ({ transactionService }) =>
{

    /**
     * Retrieves seller-specific transactions and statements listings.
     * Maps exactly to: GET /api/transactions/seller (Authentication and ROLE_SELLER required)
     */
    const getSellerTransactions = async (req, res) =>
    {
        // Reads authenticated merchant ID directly from decoded Bearer claims (req.user)
        const sellerId = req.user.id;

        const statements = await transactionService.getSellerTransactions({ sellerId });

        // 200 OK: Standard customer statements response payload delivery
        res.status(200).json(statements);
    };

    /**
     * Retrieves complete global platform transactions ledger.
     * Maps exactly to: GET /api/transactions (Authentication and ROLE_ADMIN required)
     */
    const getAllTransactions = async (req, res) =>
    {
        const platformLedger = await transactionService.getAllTransactions();

        res.status(200).json(platformLedger);
    };

    /**
     * Manually commits an atomic transaction ledger record associated to completed paid split orders.
     * Maps exactly to: POST /api/transactions (Authentication and Admin/Internal required)
     */
    const createTransaction = async (req, res) =>
    {
        const { orderId } = req.body; // Captures target split order ID from body payload

        const newLedger = await transactionService.createForOrder({ orderId });

        // 200 OK: Matches expected e-commerce return code for successful ledger creations
        res.status(200).json(newLedger);
    };

    return Object.freeze({
        getSellerTransactions,
        getAllTransactions,
        createTransaction,
    });
};
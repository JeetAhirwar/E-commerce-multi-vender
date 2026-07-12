/**
 * Pure function-based routing factory representing the Transaction Ledger API gateways.
 * Binds customer statements applications and locks administrative ledgers controls under strict guards.
 */
export const createTransactionRoutes = ({
    router,
    transactionController,
    authenticate,
    authorizeRoles,
    asyncHandler
}) =>
{

    // ===============================================
    // SECURED MERCHANT STATEMENTS GATEWAYS (/api/transactions/*)
    // ===============================================

    // Seller Endpoint: Pull seller-specific completed transaction logs (Authentication and ROLE_SELLER required)
    router.get(
        '/api/transactions/seller',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(transactionController.getSellerTransactions)
    );


    // =======================================================
    // SECURED ADMINISTRATIVE CAMPAIGNS GATEWAYS (Admin Locks)
    // =======================================================

    // Admin Endpoint: Pull complete global platform transactions ledger (Requires Admin Privileges)
    router.get(
        '/api/transactions',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(transactionController.getAllTransactions)
    );

    // Admin Endpoint: Manually onboard a new transaction ledger record associated to completed paid split orders
    router.post(
        '/api/transactions',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(transactionController.createTransaction)
    );

    return router;
};
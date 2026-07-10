/**
 * Pure function-based routing factory representing the Product Catalog API gateways.
 * Binds public browsing endpoints and secures merchant catalogs using dependency injection.
 */
export const createProductRoutes = ({
    router,
    productController,
    authenticate,
    authorizeRoles,
    asyncHandler
}) =>
{

    // ==========================================
    // PUBLIC CATALOG GATEWAYS (Unrestricted Paths)
    // ==========================================

    // Public Endpoint: Triggers dynamic query filters, ranges scans and page listings
    router.get('/products', asyncHandler(productController.getAllProducts));

    // Public Endpoint: Runs full-text relevance keyword searching query maps
    router.get('/products/search', asyncHandler(productController.searchProducts));

    // Public Endpoint: Discover single product detail using unique ObjectId params
    router.get('/products/:productId', asyncHandler(productController.getProductById));


    // ========================================================
    // PRIVATE MERCHANT CATALOG GATEWAYS (Seller Guarded Paths)
    // ========================================================

    // Seller Endpoint: Retrieve own store items catalog lists (Seller verification required)
    router.get(
        '/sellers/product',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(productController.getSellerProducts)
    );

    // Seller Endpoint: Create and list a new catalog product (Onboarding category auto-resolve)
    router.post(
        '/sellers/product',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(productController.createProduct)
    );

    // Seller Endpoint: Safe modify properties updates on owned catalog listing (Enforces seller-ownership validation)
    router.put(
        '/sellers/product/:productId',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(productController.updateProduct)
    );

    // Seller Endpoint: Erase catalog listing owned by active merchant (Enforces seller-ownership validation)
    router.delete(
        '/sellers/product/:productId',
        authenticate,
        authorizeRoles('ROLE_SELLER'),
        asyncHandler(productController.deleteProduct)
    );

    return router;
};
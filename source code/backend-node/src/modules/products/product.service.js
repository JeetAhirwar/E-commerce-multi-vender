/**
 * Pure function-based factory representing the Product Catalog Business Service layer.
 * Enforces strict security ownership checks and cascade classification workflows.
 */
export const createProductService = ({
    productRepository,
    categoryService,
    createApiError
}) =>
{

    /**
     * Onboards a brand-new product listing.
     * Automatically resolves and registers hierarchical categories prior to creation.
     */
    const createProduct = async ({ productData, categoryParams, sellerId }) =>
    {

        // 1. Service Orchestration: Calls category service to resolve and find/create leaf Level 3 Category
        const leafCategory = await categoryService.resolveCategoryHierarchy(categoryParams);

        // 2. Assemble product attributes linking resolved Category and active Seller IDs
        const preparedProductData = {
            ...productData,
            category: leafCategory._id,
            seller: sellerId, // Strictly binds seller tracking identity
        };

        // 3. Commit product write operations
        return productRepository.create(preparedProductData);
    };

    /**
     * Modifies an existing product record safely.
     * Enforces strict merchant-ownership checks prior to writing updates.
     */
    const updateProduct = async ({ productId, updateData, sellerId }) =>
    {

        // 1. Locate dynamic targeted catalog document
        const product = await productRepository.findById(productId);
        if (!product)
        {
            throw createApiError({
                statusCode: 404,
                code: 'PRODUCT_NOT_FOUND',
                message: 'Product modification failed. The requested product catalogue item was not found.'
            });
        }

        // 2. Core Security Check: Validate that the requesting seller owns this product listing
        const isOwner = product.seller._id.toString() === sellerId.toString();
        if (!isOwner)
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCESS_FORBIDDEN',
                message: 'Access Denied: You do not possess authorizations to modify another vendor’s catalogue listing.'
            });
        }

        // 3. Commit updates safely in database
        return productRepository.update(productId, updateData);
    };

    /**
     * Erases a catalog listing permanently.
     * Enforces strict merchant-ownership validation barriers.
     */
    const deleteProduct = async ({ productId, sellerId }) =>
    {

        // 1. Locate target document
        const product = await productRepository.findById(productId);
        if (!product)
        {
            throw createApiError({
                statusCode: 404,
                code: 'PRODUCT_NOT_FOUND',
                message: 'Product deletion failed. The targeted listing does not exist.'
            });
        }

        // 2. Security Check: Enforce seller ownership limits
        const isOwner = product.seller._id.toString() === sellerId.toString();
        if (!isOwner)
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCESS_FORBIDDEN',
                message: 'Access Denied: Deletion rejected. You can only remove catalogue items belonging to your own store.'
            });
        }

        // 3. Trigger hard deletion pipeline
        await productRepository.delete(productId);

        return { success: true, message: 'Catalog listing successfully erased.' };
    };

    /**
     * Retrieves single product detail.
     * Throws standard 404 exceptions on missing database entries.
     */
    const getProductById = async ({ productId }) =>
    {
        const product = await productRepository.findById(productId);

        if (!product)
        {
            throw createApiError({
                statusCode: 404,
                code: 'PRODUCT_NOT_FOUND',
                message: 'The requested product catalogue item was not found in the database.'
            });
        }

        return product;
    };

    /**
     * Leverages text scoring metrics sorting algorithms to execute textual searches.
     */
    const searchProducts = async ({ query }) =>
    {
        if (!query || query.trim() === '')
        {
            return []; // Return empty dataset immediately on blank parameters search
        }

        return productRepository.searchProducts({ searchQuery: query.trim() });
    };

    /**
     * Custom dynamic listing filter compiler.
     * Passes parameters smoothly to persistence pipelines.
     */
    const getAllProducts = async (filterParams) =>
    {
        return productRepository.getAllProducts(filterParams);
    };

    return Object.freeze({
        createProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        searchProducts,
        getAllProducts,
    });
};
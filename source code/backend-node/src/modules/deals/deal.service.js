/**
 * Pure function-based factory representing the Deal Business Service layer.
 * Enforces strict validation parameters constraints and administrative campaign workflows.
 */
export const createDealService = ({
    dealRepository,
    createApiError
}) =>
{

    /**
     * Onboards a brand-new daily flash deal.
     * Enforces strict discount range limits.
     */
    const createDeal = async ({ discount, categoryId }) =>
    {

        // 1. Core Validation: Ensure discount is mathematically consistent
        const parsedDiscount = parseInt(discount, 10);
        if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100)
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_DISCOUNT_PERCENTAGE',
                message: 'Promo campaign onboarding failed. Discount percentages must strictly range between 0% to 100%.'
            });
        }

        if (!categoryId)
        {
            throw createApiError({
                statusCode: 400,
                code: 'MISSING_CATEGORY_REFERENCE',
                message: 'Promo campaign onboarding failed. Target HomeCategory reference link is required.'
            });
        }

        // 2. Prepare deal payload structure
        const preparedDealData = {
            discount: parsedDiscount,
            category: categoryId,
        };

        // 3. Commit deal write operations
        return dealRepository.create(preparedDealData);
    };

    /**
     * Modifies discount values of an existing active deal.
     */
    const updateDeal = async ({ id, discount }) =>
    {

        // 1. Locate dynamic targeted deal document
        const deal = await dealRepository.findById(id);
        if (!deal)
        {
            throw createApiError({
                statusCode: 404,
                code: 'DEAL_NOT_FOUND',
                message: 'Campaign modification failed. The requested promo deal was not found.'
            });
        }

        // 2. Validate proposed new discount percentage
        const parsedDiscount = parseInt(discount, 10);
        if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100)
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_DISCOUNT_PERCENTAGE',
                message: 'Modification failed. Discount percentages must strictly range between 0% to 100%.'
            });
        }

        // 3. Commit updates safely in database
        return dealRepository.update(id, { discount: parsedDiscount });
    };

    /**
     * Erases a promo campaign deal permanently.
     */
    const deleteDeal = async ({ id }) =>
    {

        // 1. Locate target document
        const deal = await dealRepository.findById(id);
        if (!deal)
        {
            throw createApiError({
                statusCode: 404,
                code: 'DEAL_NOT_FOUND',
                message: 'Campaign deletion failed. The targeted record does not exist.'
            });
        }

        // 2. Trigger hard deletion pipeline
        await dealRepository.delete(id);

        return { success: true, message: 'Promotional flash deal successfully removed.' };
    };

    /**
     * Displays all active registered campaign deals.
     */
    const listDeals = async () =>
    {
        return dealRepository.findAll();
    };

    return Object.freeze({
        createDeal,
        updateDeal,
        deleteDeal,
        listDeals,
    });
};
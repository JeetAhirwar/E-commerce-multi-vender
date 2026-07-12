/**
 * Pure function-based factory representing the Home Merchandising Business Service layer.
 * Coordinates dynamic landing page configurations and aggregates multi-section parameters concurrently.
 */
export const createHomeService = ({
    homeCategoryRepository,
    dealRepository,
    createApiError,
}) =>
{

    /**
     * Administrative CRUD: Onboards a list of home categories merchandising banners.
     */
    const createHomeCategories = async (categoryList) =>
    {
        if (!Array.isArray(categoryList) || categoryList.length === 0)
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_CATEGORY_LIST',
                message: 'Onboarding failed. Category list payload must be a non-empty array.'
            });
        }

        const savedList = [];

        // Commits individual items sequentially into the database
        for (const item of categoryList)
        {
            const savedItem = await homeCategoryRepository.create(item);
            savedList.push(savedItem);
        }

        return savedList;
    };

    /**
     * Public Landing Page Aggregator.
     * Pulls all required sections and deals concurrently using parallel database cursor streams.
     */
    const getHomePageData = async () =>
    {
        try
        {
            // Parallel execution pipeline (Saves immense server execution overhead)
            const [
                gridCategories,
                electricCategories,
                shopByCategories,
                deals
            ] = await Promise.all([
                homeCategoryRepository.findBySection('GRID'),
                homeCategoryRepository.findBySection('ELECTRIC_CATEGORIES'),
                homeCategoryRepository.findBySection('SHOP_BY_CATEGORIES'),
                dealRepository.findAll()
            ]);

            // Returns compiled unified payload exactly matching React UI expectations
            return {
                gridCategories,
                electricCategories,
                shopByCategories,
                deals,
            };
        } catch (error)
        {
            console.error('[HOMEPAGE COMPILATION EXCEPTION] Failed to aggregate resources:', error.message);
            throw createApiError({
                statusCode: 500,
                code: 'HOMEPAGE_COMPILATION_FAILED',
                message: 'An unexpected error occurred while compiling the homepage layout.'
            });
        }
    };

    return Object.freeze({
        createHomeCategories,
        getHomePageData,
    });
};
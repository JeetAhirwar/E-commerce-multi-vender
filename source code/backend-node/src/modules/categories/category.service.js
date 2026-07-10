/**
 * Pure function-based factory representing the Category Business Service layer.
 * Implements loose coupling architectures by accepting repository instances as parameters.
 */
export const createCategoryService = ({ categoryRepository, createApiError }) =>
{

    /**
     * Transforms raw dynamic text inputs into clean, alphanumeric URL-friendly slugs.
     * Removes special character vectors to prevent database script injection vulnerabilities.
     * Example: 'Computers & Laptops' -> 'computers_laptops'
     */
    const buildCategoryId = (name) =>
    {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_') // Isolates special symbols/spaces, substituting with underscores
            .replace(/^_+|_+$/g, '');   // Erases residue trailing or leading underscore elements
    };

    /**
     * Automatic Cascading Hierarchy Resolver.
     * Resolves and registers 3-level categories tree recursively under database.
     * Supports transactional sessions context options flawlessly.
     */
    const resolveCategoryHierarchy = async ({ category, category2, category3 }, options = {}) =>
    {

        // 1. Inputs validation checks boundary
        if (!category || !category2 || !category3)
        {
            throw createApiError({
                statusCode: 400,
                code: 'INCOMPLETE_CATEGORY_INPUTS',
                message: 'Platform onboarding requires explicit specifications across Level 1, Level 2, and Level 3 category structures.'
            });
        }

        // 2. Generate standardised string IDs slugs keys
        const lvl1Id = buildCategoryId(category);
        const lvl2Id = buildCategoryId(category2);
        const lvl3Id = buildCategoryId(category3);

        // ==========================================
        // LAYER 1: Root Node Resolution (Level 1)
        // ==========================================
        let lvl1Node = await categoryRepository.findByCategoryId(lvl1Id, options);

        if (!lvl1Node)
        {
            // Auto registers Root Level node if absent in system
            lvl1Node = await categoryRepository.createCategory({
                name: category.trim(),
                categoryId: lvl1Id,
                level: 1,
            }, options);
        }

        // ==========================================
        // LAYER 2: Sub Node Resolution (Level 2)
        // ==========================================
        let lvl2Node = await categoryRepository.findByCategoryId(lvl2Id, options);

        if (!lvl2Node)
        {
            // Creates Sub category linking parent Level 1 identity key
            lvl2Node = await categoryRepository.createCategory({
                name: category2.trim(),
                categoryId: lvl2Id,
                parentCategory: lvl1Node._id,
                level: 2,
            }, options);
        }

        // ==========================================
        // LAYER 3: Leaf Node Resolution (Level 3)
        // ==========================================
        let lvl3Node = await categoryRepository.findByCategoryId(lvl3Id, options);

        if (!lvl3Node)
        {
            // Creates leaf node targeting parent Level 2 identity key
            lvl3Node = await categoryRepository.createCategory({
                name: category3.trim(),
                categoryId: lvl3Id,
                parentCategory: lvl2Node._id,
                level: 3,
            }, options);
        }

        // Returns absolute final resolved Level 3 leaf document for product mapping assignment
        return lvl3Node;
    };

    /**
     * Fetches active category records grouping by structural levels.
     */
    const getCategoriesByLevel = async ({ level }) =>
    {
        const numericLevel = parseInt(level, 10);

        if (isNaN(numericLevel) || numericLevel < 1 || numericLevel > 3)
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_LEVEL_PARAMETER',
                message: 'Invalid inquiry: Level parameters must strictly range between 1 to 3.'
            });
        }

        return categoryRepository.findByLevel(numericLevel);
    };

    return Object.freeze({
        resolveCategoryHierarchy,
        getCategoriesByLevel,
    });
};

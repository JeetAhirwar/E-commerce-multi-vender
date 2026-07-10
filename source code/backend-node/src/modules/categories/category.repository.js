/**
 * Pure function-based factory representing the Category Persistence database interface.
 * Strictly abstracts query pipelines from business levels utilizing Dependency Injection.
 */
export const createCategoryRepository = ({ Category }) =>
{

    /**
     * Discovers a unique category document matching its URL-friendly business identifier string.
     * Employs standard casing normalizations to prevent duplicate route check mismatches.
     */
    const findByCategoryId = async (categoryId, options = {}) =>
    {
        return Category.findOne(
            { categoryId: categoryId.toLowerCase().trim() },
            null, // Project complete document mapping
            options
        ).lean(); // Returns plain lightweight JS objects for fast memory rendering
    };

    /**
     * Persists a new category node under database.
     * Supports array-wrap formats to execute flawlessly within atomic transaction sessions.
     */
    const createCategory = async ({ name, categoryId, parentCategory = null, level }, options = {}) =>
    {
        const [newCategory] = await Category.create([{
            name,
            categoryId: categoryId.toLowerCase().trim(),
            parentCategory,
            level,
        }], options);

        return newCategory ? newCategory.toObject() : null;
    };

    /**
     * Pulls category listings belonging to a specific hierarchy depth level (1, 2, or 3).
     * Sorts listings alphabetically by name for polished UI renderings.
     */
    const findByLevel = async (level, options = {}) =>
    {
        return Category.find(
            { level },
            null,
            options
        ).sort({ name: 1 }).lean(); // Descending index sorting order bypasses system overheads
    };

    return Object.freeze({
        findByCategoryId,
        createCategory,
        findByLevel,
    });
};
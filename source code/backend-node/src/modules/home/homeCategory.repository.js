/**
 * Pure function-based factory representing the HomeCategory Persistence database interface.
 * Decouples database collections lookup pipelines using Dependency Injection.
 */
export const createHomeCategoryRepository = ({ HomeCategory }) =>
{

    /**
     * Commits a new homepage category item document directly into the database.
     * Supports array-wrap configurations to run smoothly inside transactions.
     */
    const create = async (homeCategoryData, options = {}) =>
    {
        const [newHomeCategory] = await HomeCategory.create([homeCategoryData], options);
        return newHomeCategory ? newHomeCategory.toObject() : null;
    };

    /**
     * Discovers a home category layout document by its unique database ObjectId.
     */
    const findById = async (id, options = {}) =>
    {
        return HomeCategory.findById(id, null, options).lean();
    };

    /**
     * Pulls all registered homepage categories configurations list.
     */
    const findAll = async (options = {}) =>
    {
        return HomeCategory.find({}, null, options).lean();
    };

    /**
     * Pulls category listings belonging to a specific homepage design section (e.g. GRID, DEALS).
     */
    const findBySection = async (section, options = {}) =>
    {
        return HomeCategory.find({ section }, null, options).lean();
    };

    /**
     * Modifies an existing homepage category document. Returns the newly updated state.
     */
    const update = async (id, updateData, options = {}) =>
    {
        return HomeCategory.findByIdAndUpdate(
            id,
            { $set: updateData },
            { ...options, new: true, runValidators: true } // Returns updated record enforcing schema validations
        ).lean();
    };

    return Object.freeze({
        create,
        findById,
        findAll,
        findBySection,
        update,
    });
};
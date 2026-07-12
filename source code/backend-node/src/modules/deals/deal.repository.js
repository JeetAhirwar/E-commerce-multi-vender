/**
 * Pure function-based factory representing the Deal Persistence database interface.
 * Decouples database collections lookup pipelines using Dependency Injection.
 */
export const createDealRepository = ({ Deal }) =>
{

    /**
     * Commits a new campaign deal document directly into the database.
     * Supports array-wrap configurations to run smoothly inside transactions.
     */
    const create = async (dealData, options = {}) =>
    {
        const [newDeal] = await Deal.create([dealData], options);
        return newDeal ? newDeal.toObject() : null;
    };

    /**
     * Discovers a deal document by its unique database ObjectId.
     */
    const findById = async (id, options = {}) =>
    {
        return Deal.findById(id, null, options).lean();
    };

    /**
     * Pulls all registered deals, sorted descending (newest first).
     * Populates associated HomeCategory details.
     */
    const findAll = async (options = {}) =>
    {
        return Deal.find({}, null, options)
            .sort({ createdAt: -1 })
            .populate('category') // Populates target HomeCategory details (images, classification sections)
            .lean(); // Returns plain lightweight JS objects for fast memory rendering
    };

    /**
     * Modifies an existing deal document. Returns the newly updated state.
     */
    const update = async (id, updateData, options = {}) =>
    {
        return Deal.findByIdAndUpdate(
            id,
            { $set: updateData },
            { ...options, new: true, runValidators: true } // Returns updated record enforcing schema validations
        ).lean();
    };

    /**
     * Erases a deal document permanently from the collection.
     */
    const deleteDeal = async (id, options = {}) =>
    {
        return Deal.findByIdAndDelete(id, options).lean();
    };

    return Object.freeze({
        create,
        findById,
        findAll,
        update,
        delete: deleteDeal,
    });
};
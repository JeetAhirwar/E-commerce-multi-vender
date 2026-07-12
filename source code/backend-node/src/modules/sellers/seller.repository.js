/**
 * Pure function-based factory representing the Seller Persistence database interface.
 * Decouples database collections lookup pipelines using Dependency Injection.
 */
export const createSellerRepository = ({ Seller }) =>
{

    /**
     * Locates a registered merchant seller using unique business email.
     */
    const findByEmail = async (email, options = {}) =>
    {
        return Seller.findOne(
            { email: email.toLowerCase() },
            null, // Fetches entire schema layout fields
            options
        ).lean(); // Returns plain lightweight Javascript object instead of Mongoose documents
    };

    /**
     * Resolves a seller profile using unique database ObjectId.
     */
    const findById = async (id, options = {}) =>
    {
        return Seller.findById(
            id,
            { 'bankDetails.accountNumber': 0 }, // Projections Mask: Hides sensitive dynamic bank values
            options
        ).lean();
    };

    /**
     * Commits a new seller/merchant register profile into database.
     */
    const create = async (sellerData, options = {}) =>
    {
        const [newSeller] = await Seller.create([sellerData], options);
        return newSeller ? newSeller.toObject() : null;
    };

    /**
     * Commits verification states, flagging seller email confirmed inside database registries.
     */
    const updateVerificationStatus = async ({ id, isEmailVerified }, options = {}) =>
    {
        return Seller.findByIdAndUpdate(
            id,
            { isEmailVerified },
            { ...options, new: true } // Returns updated record state
        ).lean();
    };

    /**
     * Commits administrative account status changes (e.g., ACTIVE, SUSPENDED, BANNED) into database.
     * Enforces schema enum validations on target state parameter inputs.
     */
    const updateAccountStatus = async ({ id, status }, options = {}) =>
    {
        return Seller.findByIdAndUpdate(
            id,
            { accountStatus: status },
            {
                ...options,
                new: true, // Returns newly updated document state
                runValidators: true, // Forces Mongoose to run enum checks validations on update
            }
        ).lean();
    };

    return Object.freeze({
        findByEmail,
        findById,
        create,
        updateVerificationStatus,
        updateAccountStatus,
    });
};
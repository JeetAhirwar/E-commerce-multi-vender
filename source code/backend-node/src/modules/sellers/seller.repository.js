/**
 * Creates a repository for managing sellers.
 */
export const createSellerRepository = ({ Seller }) =>
{

    /**
     * Find a seller by email.
     */
    const findByEmail = async (email, options = {}) =>
    {
        return Seller.findOne(
            { email: email.toLowerCase() },
            null, // Return all fields.
            options // Optional query options (e.g. session).
        ).lean(); // Return a plain object.
    };

    /**
     * Find a seller by ID.
     */
    const findById = async (id, options = {}) =>
    {
        return Seller.findById(
            id,
            { 'bankDetails.accountNumber': 0 }, // Hide the bank account number.
            options
        ).lean();
    };

    /**
     * Create a new seller.
     */
    const create = async (sellerData, options = {}) =>
    {
        // Using an array supports MongoDB transactions.
        const [newSeller] = await Seller.create([sellerData], options);

        // Convert the document to a plain object.
        return newSeller ? newSeller.toObject() : null;
    };

    /**
     * Update the seller's email verification status.
     */
    const updateVerificationStatus = async ({ id, isEmailVerified }, options = {}) =>
    {
        return Seller.findByIdAndUpdate(
            id,
            { isEmailVerified },
            { ...options, new: true } // Return the updated document.
        ).lean();
    };

    return Object.freeze({
        findByEmail,
        findById,
        create,
        updateVerificationStatus,
    });
};
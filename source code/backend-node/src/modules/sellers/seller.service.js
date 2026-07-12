import mongoose from 'mongoose';

/**
 * Pure function-based factory representing the Seller core Business Service layer.
 * Coordinates merchant profiles verifications, dashboard listings, and administrative moderations.
 */
export const createSellerService = ({ sellerRepository, createApiError }) =>
{

    /**
     * Onboards a brand-new merchant seller account.
     */
    const createSeller = async (sellerData) =>
    {
        const targetEmail = sellerData.email.toLowerCase().trim();

        const existingSeller = await sellerRepository.findByEmail(targetEmail);
        if (existingSeller)
        {
            throw createApiError({
                statusCode: 409,
                code: 'DUPLICATE_SELLER_EMAIL',
                message: `Onboarding failed: A business merchant profile is already registered under '${targetEmail}'.`
            });
        }

        return sellerRepository.create({
            ...sellerData,
            email: targetEmail,
        });
    };

    /**
     * Retrieves single merchant details.
     */
    const getSellerProfile = async ({ sellerId }) =>
    {
        const seller = await sellerRepository.findById(sellerId);
        if (!seller)
        {
            throw createApiError({
                statusCode: 404,
                code: 'SELLER_NOT_FOUND',
                message: 'The requested merchant account profile does not exist.'
            });
        }
        return seller;
    };

    /**
     * Modifies an existing merchant's profile.
     * Enforces schema constraints and returns the newly updated state.
     */
    const updateSeller = async ({ id, updateData }) =>
    {
        const SellerMongooseModel = mongoose.model('Seller');

        // 1. Locate dynamic targeted seller profile
        const seller = await sellerRepository.findById(id);
        if (!seller)
        {
            throw createApiError({
                statusCode: 404,
                code: 'SELLER_NOT_FOUND',
                message: 'Profile update failed. The requested merchant account was not found.'
            });
        }

        // 2. Commit updates safely in database (Using findByIdAndUpdate natively for performance)
        const updatedProfile = await SellerMongooseModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true } // Returns updated record enforcing Mongoose validations
        ).lean();

        return updatedProfile;
    };

    /**
     * Administrative CRUD: Erases targeted merchant profile cleanly.
     */
    const deleteSeller = async ({ id }) =>
    {
        const SellerMongooseModel = mongoose.model('Seller');

        const deleted = await SellerMongooseModel.findByIdAndDelete(id).lean();
        if (!deleted)
        {
            throw createApiError({
                statusCode: 404,
                code: 'SELLER_NOT_FOUND',
                message: 'Deletion failed. Targeted merchant account does not exist.'
            });
        }

        return { success: true, message: 'Merchant seller profile successfully erased.' };
    };

    /**
     * Retrieves registered merchant profiles list.
     */
    const listSellers = async ({ status = null } = {}) =>
    {
        const queryFilter = status ? { accountStatus: status.toUpperCase().trim() } : {};

        const MongooseModel = mongoose.model('Seller');
        return MongooseModel.find(queryFilter).lean();
    };

    /**
     * Administrative Moderation status commits.
     */
    const updateAccountStatus = async ({ id, status }) =>
    {
        const targetStatus = status.toUpperCase().trim();
        const allowedStatuses = ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED'];

        if (!allowedStatuses.includes(targetStatus))
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_MODERATION_STATUS',
                message: `${targetStatus} is not a valid e-commerce account status configuration.`
            });
        }

        const seller = await sellerRepository.findById(id);
        if (!seller)
        {
            throw createApiError({
                statusCode: 404,
                code: 'SELLER_NOT_FOUND',
                message: 'Moderation failed. Targeted merchant account does not exist.'
            });
        }

        return sellerRepository.updateAccountStatus({ id, status: targetStatus });
    };

    return Object.freeze({
        createSeller,
        getSellerProfile,
        updateSeller, // Added profile updater
        deleteSeller, // Added admin delete
        listSellers,
        updateAccountStatus,
    });
};
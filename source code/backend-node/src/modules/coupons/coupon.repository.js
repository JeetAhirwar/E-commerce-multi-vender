/**
 * Pure function-based factory representing the Coupon Persistence database interface.
 * Decouples database collections lookup pipelines using Dependency Injection.
 */
export const createCouponRepository = ({ Coupon }) =>
{

    /**
     * Discovers a promotional coupon document matching its unique code.
     * Normalizes casing internally prior to lookup execution.
     */
    const findByCode = async (code, options = {}) =>
    {
        return Coupon.findOne(
            { code: code.toUpperCase().trim() },
            null, // Fetch complete fields mappings
            options
        ).lean(); // Returns weightless standard plain Javascript memory objects
    };

    /**
     * Persists a new administrative coupon document under database.
     * Supports array-wrap configurations to run smoothly inside transactions.
     */
    const createCoupon = async (couponData, options = {}) =>
    {
        const [newCoupon] = await Coupon.create([couponData], options);
        return newCoupon ? newCoupon.toObject() : null;
    };

    /**
     * Pulls all registered coupons, sorted descending chronologically (newest first).
     * Used exclusively by system admins for analytical tables view.
     */
    const findAllCoupons = async (options = {}) =>
    {
        return Coupon.find({}, null, options)
            .sort({ createdAt: -1 })
            .lean();
    };

    /**
     * Erases a promo-code document permanently from the collection.
     */
    const deleteCoupon = async (id, options = {}) =>
    {
        return Coupon.findByIdAndDelete(id, options).lean();
    };

    return Object.freeze({
        findByCode,
        createCoupon,
        findAllCoupons,
        deleteCoupon,
    });
};
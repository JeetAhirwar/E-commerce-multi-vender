/**
 * Pure function-based factory representing the Coupon Business Service layer.
 * Coordinates dynamic checkout discounts applying and administrative campaign assets controls.
 */
export const createCouponService = ({
    couponRepository,
    cartRepository,
    userRepository,
    createApiError,
}) =>
{

    /**
     * Evaluates and applies a validated promo-code directly to user shopping cart.
     * Enforces strict chronological, spending threshold, and single-use constraints.
     */
    const applyCoupon = async ({ userId, code }) =>
    {
        const targetCode = code.toUpperCase().trim();

        // 1. Core Lookup: Locate coupon record inside database
        const coupon = await couponRepository.findByCode(targetCode);
        if (!coupon)
        {
            throw createApiError({
                statusCode: 404,
                code: 'COUPON_NOT_FOUND',
                message: `Promotion failed: The promo code '${targetCode}' does not exist.`
            });
        }

        // 2. Security Check: Verify coupon is explicitly active
        if (!coupon.isActive)
        {
            throw createApiError({
                statusCode: 400,
                code: 'COUPON_INACTIVE',
                message: 'This promo code has been deactivated by system administrators.'
            });
        }

        // 3. Chronological Check: Verify current clock lies within validity window
        const now = new Date();
        if (now < new Date(coupon.validityStartDate) || now > new Date(coupon.validityEndDate))
        {
            throw createApiError({
                statusCode: 400,
                code: 'COUPON_EXPIRED',
                message: 'This promotional campaign session has expired or is not yet active.'
            });
        }

        // 4. Load and verify customer shopping cart properties
        const cart = await cartRepository.findByUserId({ userId });
        if (!cart)
        {
            throw createApiError({
                statusCode: 404,
                code: 'CART_NOT_FOUND',
                message: 'Cart session is missing.'
            });
        }

        // Cart value must be calculated server-side prior to comparing thresholds (Anti Price-Tampering)
        let currentSellingPriceSum = 0;
        cart.items.forEach((item) =>
        {
            // Re-calculates actual values safely
            const unitSelling = item.product ? item.product.sellingPrice : (item.sellingPrice / item.quantity);
            currentSellingPriceSum += unitSelling * item.quantity;
        });

        // 5. Spending Limit Check: Verifies total cart value qualifies minimum threshold
        if (currentSellingPriceSum < coupon.minimumOrderValue)
        {
            throw createApiError({
                statusCode: 400,
                code: 'MINIMUM_ORDER_VALUE_NOT_MET',
                message: `Minimum spend required to unlock this discount is Rs. ${coupon.minimumOrderValue}. Your current cart subtotal is Rs. ${currentSellingPriceSum}.`
            });
        }

        // 6. Double Redemption Abuse Check: Verify user history records
        const user = await userRepository.findById(userId);
        if (!user)
        {
            throw createApiError({
                statusCode: 404,
                code: 'USER_NOT_FOUND',
                message: 'User profile verification failed.'
            });
        }

        const hasAlreadyRedeemed = user.usedCoupons.some(
            (usedCouponId) => usedCouponId.toString() === coupon._id.toString()
        );

        if (hasAlreadyRedeemed)
        {
            throw createApiError({
                statusCode: 400,
                code: 'COUPON_ALREADY_USED',
                message: 'Access Denied: You have already redeemed this promotional code. Limit exactly 1 use per customer.'
            });
        }

        // 7. Calculate rounded discount cash allocations
        const discountAmount = Math.round(currentSellingPriceSum * (coupon.discountPercentage / 100));

        // 8. Update Cart schema: Inject promo code variables and deduct selling subtotals
        const updatedCartPayload = {
            couponCode: coupon.code,
            couponPrice: discountAmount,
            totalSellingPrice: Math.max(0, currentSellingPriceSum - discountAmount),
            discount: Math.round(((cart.totalMrpPrice - (currentSellingPriceSum - discountAmount)) / cart.totalMrpPrice) * 100),
        };

        // Commit state updates in Cart database table
        const finalCart = await cartRepository.updateCart({ userId, cartData: updatedCartPayload });

        // 9. Update User schema: Lock coupon ID inside history array to prevent re-use
        // (We will update the user's usedCoupons array using Mongoose direct operations or standard repo update if exists)
        user.usedCoupons.push(coupon._id);
        await User.findByIdAndUpdate(userId, { usedCoupons: user.usedCoupons }); // Direct atomic updates

        return finalCart;
    };

    /**
     * Resets applied promotional cuts, restoring standard cart selling subtotals.
     */
    const removeCoupon = async ({ userId }) =>
    {
        const cart = await cartRepository.findByUserId({ userId });
        if (!cart)
        {
            throw createApiError({
                statusCode: 404,
                code: 'CART_NOT_FOUND',
                message: 'Cart session is missing.'
            });
        }

        if (!cart.couponCode)
        {
            return cart; // Returns untouched if no coupon is active
        }

        // 1. Locate applied coupon ID using code string
        const coupon = await couponRepository.findByCode(cart.couponCode);

        // 2. Remove coupon tracking ID from user's redeem history
        if (coupon)
        {
            const user = await userRepository.findById(userId);
            if (user)
            {
                user.usedCoupons = user.usedCoupons.filter(
                    (id) => id.toString() !== coupon._id.toString()
                );
                await User.findByIdAndUpdate(userId, { usedCoupons: user.usedCoupons });
            }
        }

        // 3. Recalculate basic cart totals resetting discount price variables
        let originalSellingPriceSum = 0;
        cart.items.forEach((item) =>
        {
            const unitSelling = item.product ? item.product.sellingPrice : (item.sellingPrice / item.quantity);
            originalSellingPriceSum += unitSelling * item.quantity;
        });

        const resetCartPayload = {
            couponCode: null,
            couponPrice: 0,
            totalSellingPrice: originalSellingPriceSum,
            discount: Math.round(((cart.totalMrpPrice - originalSellingPriceSum) / cart.totalMrpPrice) * 100),
        };

        return cartRepository.updateCart({ userId, cartData: resetCartPayload });
    };

    /**
     * Administrative CRUD: Onboards a new promo campaign asset.
     */
    const createCoupon = async (couponData) =>
    {
        const existing = await couponRepository.findByCode(couponData.code);
        if (existing)
        {
            throw createApiError({
                statusCode: 409,
                code: 'DUPLICATE_COUPON_CODE',
                message: `Onboarding failed: A promo campaign code '${couponData.code.toUpperCase()}' is already active.`
            });
        }

        return couponRepository.createCoupon(couponData);
    };

    /**
     * Administrative CRUD: Erases promo asset from collections.
     */
    const deleteCoupon = async ({ id }) =>
    {
        const deleted = await couponRepository.deleteCoupon(id);
        if (!deleted)
        {
            throw createApiError({
                statusCode: 404,
                code: 'COUPON_NOT_FOUND',
                message: 'Deletion failed. Targeted coupon was not found.'
            });
        }
        return { success: true, message: 'Promotional coupon successfully deleted.' };
    };

    /**
     * Administrative CRUD: Displays list of all campaigns.
     */
    const listCoupons = async () =>
    {
        return couponRepository.findAllCoupons();
    };

    return Object.freeze({
        applyCoupon,
        removeCoupon,
        createCoupon,
        deleteCoupon,
        listCoupons,
    });
};
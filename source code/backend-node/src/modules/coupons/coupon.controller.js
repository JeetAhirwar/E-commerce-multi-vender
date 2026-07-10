/**
 * Pure function-based factory representing the Coupon campaign HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createCouponController = ({ couponService }) =>
{

    /**
     * Dual-Action Coupon Gateway.
     * Applies or Removes coupon on current customer's cart based on "apply" query/body parameter.
     * Maps exactly to: POST /api/coupons/apply
     */
    const applyCoupon = async (req, res) =>
    {
        const userId = req.user.id;

        // Supports query parameters fallback structure to maintain 100% backward compatibility
        const code = req.query.code || req.body.code;
        const applyFlag = req.query.apply || req.body.apply;

        // Parse boolean checks safely
        const shouldApply = applyFlag === 'true' || applyFlag === true;

        let updatedCart = null;

        if (shouldApply)
        {
            // Scenario A: apply=true -> Trigger core apply coupons business rules
            updatedCart = await couponService.applyCoupon({ userId, code });
        } else
        {
            // Scenario B: apply=false -> Trigger standard coupons removals and subtotals reset
            updatedCart = await couponService.removeCoupon({ userId });
        }

        res.status(200).json(updatedCart);
    };

    /**
     * Administrative CRUD: Onboards a new promotional campaign code asset.
     * Maps exactly to: POST /api/coupons/admin/create
     */
    const createCoupon = async (req, res) =>
    {
        const couponPayload = req.body;

        const newCoupon = await couponService.createCoupon(couponPayload);

        // 201 Created: New promotion asset successfully registered inside collections
        res.status(201).json(newCoupon);
    };

    /**
     * Administrative CRUD: Displays all created promo campaigns listings.
     * Maps exactly to: GET /api/coupons/admin/all
     */
    const listCoupons = async (req, res) =>
    {
        const couponsList = await couponService.listCoupons();

        res.status(200).json(couponsList);
    };

    /**
     * Administrative CRUD: Erases targeted campaign asset cleanly.
     * Maps exactly to: DELETE /api/coupons/admin/delete/:id
     */
    const deleteCoupon = async (req, res) =>
    {
        const { id } = req.params; // Captures target ID from path parameters

        const outcome = await couponService.deleteCoupon({ id });

        res.status(200).json(outcome);
    };

    return Object.freeze({
        applyCoupon,
        createCoupon,
        listCoupons,
        deleteCoupon,
    });
};
/**
 * Pure function-based routing factory representing the Coupon API gateways.
 * Binds customer promo applications and locks administrative campaigns controls under strict guards.
 */
export const createCouponRoutes = ({
    router,
    couponController,
    authenticate,
    authorizeRoles,
    asyncHandler
}) =>
{

    // ===============================================
    // SECURED CUSTOMER PROMO GATEWAYS (/api/coupons/*)
    // ===============================================

    // Customer Endpoint: Applies or Removes coupon on active cart based on apply flag (Authentication required)
    router.post(
        '/api/coupons/apply',
        authenticate,
        asyncHandler(couponController.applyCoupon)
    );


    // =======================================================
    // SECURED ADMINISTRATIVE CAMPAIGNS GATEWAYS (Admin Locks)
    // =======================================================

    // Admin Endpoint: Onboard a new e-commerce promotional coupon asset (Requires Admin Privileges)
    router.post(
        '/api/coupons/admin/create',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(couponController.createCoupon)
    );

    // Admin Endpoint: Pull complete list of registered campaign codes
    router.get(
        '/api/coupons/admin/all',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(couponController.listCoupons)
    );

    // Admin Endpoint: Erase specific campaign asset from database registries
    router.delete(
        '/api/coupons/admin/delete/:id',
        authenticate,
        authorizeRoles('ROLE_ADMIN'),
        asyncHandler(couponController.deleteCoupon)
    );

    return router;
};
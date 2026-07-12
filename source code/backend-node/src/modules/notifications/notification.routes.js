/**
 * Pure function-based routing factory representing the Customer Notifications API gateways.
 * Binds notification paths directly to authenticators filters using dependency injection.
 */
export const createNotificationRoutes = ({ 
  router, 
  notificationController, 
  authenticate, 
  asyncHandler 
}) => {

  // ==========================================
  // SECURED NOTIFICATIONS GATEWAYS (/api/notifications/*)
  // ==========================================

  // Customer Endpoint: Recalculates and pulls active user notification alerts details (Authentication required)
  router.get(
    '/api/notifications', 
    authenticate, 
    asyncHandler(notificationController.getCustomerNotifications)
  );

  // Customer Endpoint: Toggles notification readStatus inside user alerts array
  router.patch(
    '/api/notifications/:notificationId/read', 
    authenticate, 
    asyncHandler(notificationController.markAsRead)
  );

  return router;
};
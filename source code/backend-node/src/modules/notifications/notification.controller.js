/**
 * Pure function-based factory representing the Customer Notifications HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createNotificationController = ({ notificationService }) =>
{

    /**
     * Retrieves customer-specific notifications and alerts listings.
     * Maps exactly to: GET /api/notifications (Authentication required)
     */
    const getCustomerNotifications = async (req, res) =>
    {
        // Reads authenticated customer ID directly from decoded Bearer claims (req.user)
        const customerId = req.user.id;

        const notifications = await notificationService.getCustomerNotifications({ customerId });

        // 200 OK: Delivers complete feedback lists back to client UI
        res.status(200).json(notifications);
    };

    /**
     * Modifies an existing notification readStatus owned by the customer.
     * Maps exactly to: PATCH /api/notifications/:notificationId/read (Ownership required)
     */
    const markAsRead = async (req, res) =>
    {
        const userId = req.user.id;
        const { notificationId } = req.params;

        const updatedNotification = await notificationService.markAsRead({
            notificationId,
            userId,
        });

        res.status(200).json(updatedNotification);
    };

    return Object.freeze({
        getCustomerNotifications,
        markAsRead,
    });
};
/**
 * Pure function-based factory representing the Notification Persistence database interface.
 * Decouples database collections lookup pipelines using Dependency Injection.
 */
export const createNotificationRepository = ({ Notification }) =>
{

    /**
     * Commits a new in-app alert notification document directly into database.
     * Supports array-wrap configurations to run smoothly inside transactions.
     */
    const createNotification = async (notificationData, options = {}) =>
    {
        const [newNotification] = await Notification.create([notificationData], options);
        return newNotification ? newNotification.toObject() : null;
    };

    /**
     * Pulls customer-specific notification statements chronologically descending (newest first).
     */
    const findByCustomerId = async ({ customerId }, options = {}) =>
    {
        return Notification.find({ customer: customerId }, null, options)
            .sort({ sentAt: -1 }) // Sorts chronologically newest first
            .lean(); // Returns plain lightweight JS objects for fast memory rendering
    };

    /**
     * Commits operational read status update (readStatus: true) atomically on specific notification document.
     */
    const markAsRead = async ({ id }, options = {}) =>
    {
        return Notification.findByIdAndUpdate(
            id,
            { readStatus: true },
            { ...options, new: true, runValidators: true } // Returns updated record enforcing schema validations
        ).lean();
    };

    /**
     * Erases a notification document permanently from the collection.
     */
    const deleteNotification = async (id, options = {}) =>
    {
        return Notification.findByIdAndDelete(id, options).lean();
    };

    return Object.freeze({
        createNotification,
        findByCustomerId,
        markAsRead,
        delete: deleteNotification,
    });
};
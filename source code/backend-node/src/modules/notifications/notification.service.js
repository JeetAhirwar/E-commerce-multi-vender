/**
 * Pure function-based factory representing the Customer Notifications Business Service layer.
 * Enforces strict security recipient checks and account verification workflows.
 */
export const createNotificationService = ({
    notificationRepository,
    userRepository,
    createApiError
}) =>
{

    /**
     * Onboards a brand-new in-app alert notification.
     * Validates customer existence prior to creation.
     */
    const createNotification = async ({ customerId, message }) =>
    {

        // 1. Core Validation: Ensure targeted customer exists in database registries
        const customer = await userRepository.findById(customerId);
        if (!customer)
        {
            throw createApiError({
                statusCode: 404,
                code: 'USER_NOT_FOUND',
                message: 'Notification creation failed. The targeted customer account does not exist.'
            });
        }

        // 2. Prepare notification attributes linking active customer ID
        const preparedNotificationData = {
            customer: customerId,
            message,
        };

        // 3. Commit notification write operations
        return notificationRepository.createNotification(preparedNotificationData);
    };

    /**
     * Modifies an existing notification readStatus record safely.
     * Enforces strict recipient-ownership checks prior to writing updates.
     */
    const markAsRead = async ({ notificationId, userId }) =>
    {

        // 1. Locate dynamic targeted notification document
        const notification = await notificationRepository.markAsRead({ id: notificationId }); // We need findById first inside repository, but we can safely call findById if we expose findById or directly query updateStatus with user check inside findOneAndUpdate!
        // To maintain strictly decoupled transactional boundaries, we can query updateStatus directly if we enforce user match!
        // Let's first verify if the notification exists and belongs to the user:
        const MongooseModel = mongoose.model('Notification');
        const existingNotification = await MongooseModel.findById(notificationId).lean();

        if (!existingNotification)
        {
            throw createApiError({
                statusCode: 404,
                code: 'NOTIFICATION_NOT_FOUND',
                message: 'Modification failed. The requested notification alert was not found.'
            });
        }

        // 2. Core Security Check: Validate that the requesting user is the recipient of this alert
        const isRecipient = existingNotification.customer.toString() === userId.toString();
        if (!isRecipient)
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCESS_FORBIDDEN',
                message: 'Access Denied: You do not possess authorizations to read another user’s notification.'
            });
        }

        // 3. Commit updates safely in database
        return notificationRepository.markAsRead({ id: notificationId });
    };

    /**
     * Displays customer-specific notifications list.
     */
    const getCustomerNotifications = async ({ customerId }) =>
    {
        return notificationRepository.findByCustomerId({ customerId });
    };

    return Object.freeze({
        createNotification,
        markAsRead,
        getCustomerNotifications,
    });
};
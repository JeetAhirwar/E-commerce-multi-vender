import mongoose from 'mongoose';

/**
 * Pure function-based factory representing the Payment Verification & Settlements Business Service.
 * Orchestrates high-stakes checkout payments and manages multi-vendor cash-flow reconciliations.
 */
export const createPaymentService = ({
    paymentOrderRepository,
    orderRepository, // Injected dependency repository
    transactionRepository,
    sellerReportRepository,
    cartRepository,
    razorpayClient,
    stripeClient,
    createApiError,
}) =>
{

    /**
     * Internal SHA-256 generator.
     */
    const hashString = (data) =>
    {
        return crypto.createHash('sha256').update(data).digest('hex');
    };

    /**
     * Registers a parent payment container and handshakes with payment processors.
     */
    const createPaymentOrder = async ({ userId, amount, orders, paymentMethod }) =>
    {
        const paymentOrder = await paymentOrderRepository.createPaymentOrder({
            amount,
            status: 'PENDING',
            paymentMethod,
            user: userId,
            orders,
        });

        let paymentLinkUrl = '';
        let providerLinkId = '';

        if (paymentMethod === 'RAZORPAY')
        {
            const rzpResponse = await razorpayClient.createPaymentLink({
                amount,
                paymentOrderId: paymentOrder._id,
            });
            paymentLinkUrl = rzpResponse.payment_link_url;
            providerLinkId = rzpResponse.id;
        } else if (paymentMethod === 'STRIPE')
        {
            const stripeResponse = await stripeClient.createCheckoutSession({
                amount,
                paymentOrderId: paymentOrder._id,
            });
            paymentLinkUrl = stripeResponse.url;
            providerLinkId = stripeResponse.id;
        }

        const updatedPayment = await paymentOrderRepository.updateStatus({
            paymentOrderId: paymentOrder._id,
            status: 'PENDING',
            providerPaymentId: null,
        });

        // Directly update the paymentLinkId
        const PaymentOrderModel = mongoose.model('PaymentOrder');
        await PaymentOrderModel.findByIdAndUpdate(paymentOrder._id, { paymentLinkId: providerLinkId });

        return { payment_link_url: paymentLinkUrl };
    };

    /**
     * Idempotent Payment Verification & Settlements Engine.
     */
    const verifyRazorpayPayment = async ({ paymentId, paymentLinkId }) =>
    {
        const paymentOrder = await paymentOrderRepository.findByPaymentLinkId(paymentLinkId);
        if (!paymentOrder)
        {
            throw createApiError({
                statusCode: 404,
                code: 'PAYMENT_RECORD_NOT_FOUND',
                message: 'Payment verification failed. No transaction record matches the provided link ID.'
            });
        }

        if (paymentOrder.status === 'COMPLETED')
        {
            return { success: true, message: 'This transaction has already been successfully verified and settled.' };
        }

        const paymentDetails = await razorpayClient.fetchPaymentDetails(paymentId);
        if (paymentDetails.status !== 'captured')
        {
            throw createApiError({
                statusCode: 400,
                code: 'PAYMENT_NOT_CAPTURED',
                message: `Verification rejected: Payment state is currently reported as '${paymentDetails.status}' by gateway.`
            });
        }

        const session = await mongoose.startSession();

        try
        {
            await session.withTransaction(async () =>
            {
                await paymentOrderRepository.updateStatus({
                    paymentOrderId: paymentOrder._id,
                    status: 'COMPLETED',
                    providerPaymentId: paymentId,
                }, { session });

                for (const order of paymentOrder.orders)
                {
                    await orderRepository.updatePaymentStatus({
                        orderId: order._id,
                        paymentStatus: 'COMPLETED',
                    }, { session });

                    await orderRepository.updateStatus({
                        orderId: order._id,
                        orderStatus: 'PLACED',
                    }, { session });

                    await transactionRepository.createTransaction({
                        customer: paymentOrder.user,
                        seller: order.seller,
                        order: order._id,
                    }, { session });

                    await sellerReportRepository.applyPaymentSuccess({
                        sellerId: order.seller,
                        earnings: order.totalSellingPrice,
                        sales: order.totalMrpPrice,
                    }, { session });
                }

                await cartRepository.updateCart({
                    userId: paymentOrder.user,
                    cartData: {
                        items: [],
                        totalSellingPrice: 0,
                        totalItem: 0,
                        totalMrpPrice: 0,
                        discount: 0,
                        couponCode: null,
                        couponPrice: 0,
                    }
                }, { session });
            });
        } finally
        {
            await session.endSession();
        }

        return { success: true, message: 'Payment successfully captured and all merchant accounts settled.' };
    };

    /**
     * Payment Re-issuance Engine.
     * Generates a brand-new, active checkout payment link URL for a pending split order.
     * Maps exactly to: POST /api/payment/:paymentMethod/order/:orderId
     */
    const reissuePaymentLink = async ({ orderId, paymentMethod, userId }) =>
    {
        // 1. Locate the dynamic split order details
        const order = await orderRepository.findById(orderId);
        if (!order)
        {
            throw createApiError({
                statusCode: 404,
                code: 'ORDER_NOT_FOUND',
                message: 'Reissue failed: Targeted sales order does not exist.'
            });
        }

        // 2. Security Check: Enforce user-ownership validations
        if (order.user._id.toString() !== userId.toString())
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCESS_FORBIDDEN',
                message: 'Reissue rejected: You can only request payment links for your own orders.'
            });
        }

        // 3. Business Check: Cannot reissue payment for already paid or cancelled orders
        if (order.paymentStatus === 'COMPLETED' || order.orderStatus === 'CANCELLED')
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_ORDER_STATE_FOR_REISSUE',
                message: `Reissue rejected: Orders marked as ${order.paymentStatus} cannot be re-paid.`
            });
        }

        // 4. Handshake with processors to generate fresh checkout link url
        const amount = order.totalSellingPrice;

        // Register the new aggregate parent container
        const { payment_link_url } = await createPaymentOrder({
            userId,
            amount,
            orders: [order._id],
            paymentMethod,
        });

        return { payment_link_url };
    };

    return Object.freeze({
        createPaymentOrder,
        verifyRazorpayPayment,
        reissuePaymentLink, // Added payment link reissue service method
    });
};
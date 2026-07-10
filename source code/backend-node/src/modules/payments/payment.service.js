import mongoose from 'mongoose';

/**
 * Pure function-based factory representing the Payment Verification & Settlements Business Service.
 * Orchestrates high-stakes checkout payments and manages multi-vendor cash-flow reconciliations.
 */
export const createPaymentService = ({
    paymentOrderRepository,
    orderRepository,
    transactionRepository,
    sellerReportRepository,
    cartRepository,
    razorpayClient, // Decoupled external SDK adapters passed via Dependency Injection
    stripeClient,
    createApiError,
}) =>
{

    /**
     * Registers a parent payment container and handshakes with payment processors (Razorpay/Stripe)
     * to generate a dynamic checkout payment link URL.
     */
    const createPaymentOrder = async ({ userId, amount, orders, paymentMethod }) =>
    {

        // 1. Persist the parent payment order aggregate document inside database
        const paymentOrder = await paymentOrderRepository.createPaymentOrder({
            amount,
            status: 'PENDING',
            paymentMethod,
            user: userId,
            orders,
        });

        let paymentLinkUrl = '';
        let providerLinkId = '';

        // 2. Handshake with external processors using dynamic injection clients
        if (paymentMethod === 'RAZORPAY')
        {
            const rzpResponse = await razorpayClient.createPaymentLink({
                amount,
                paymentOrderId: paymentOrder._id,
            });
            paymentLinkUrl = rzpResponse.payment_link_url;
            providerLinkId = rzpResponse.id; // Razorpay Link ID
        } else if (paymentMethod === 'STRIPE')
        {
            const stripeResponse = await stripeClient.createCheckoutSession({
                amount,
                paymentOrderId: paymentOrder._id,
            });
            paymentLinkUrl = stripeResponse.url;
            providerLinkId = stripeResponse.id; // Stripe Session ID
        }

        // 3. Update the parent payment order record with the returned provider link ID
        await paymentOrderRepository.updateStatus({
            paymentOrderId: paymentOrder._id,
            status: 'PENDING',
            providerPaymentId: null, // Not paid yet
        });

        // Binds the dynamic provider link ID cleanly
        await PaymentOrder.findByIdAndUpdate(paymentOrder._id, { paymentLinkId: providerLinkId });

        return { payment_link_url: paymentLinkUrl };
    };

    /**
     * Idempotent Payment Verification & Settlements Engine.
     * Verifies captured state with gateway, then runs 5-steps atomic settlements inside a transaction session.
     */
    const verifyRazorpayPayment = async ({ paymentId, paymentLinkId }) =>
    {

        // 1. Locate the parent payment order aggregate container
        const paymentOrder = await paymentOrderRepository.findByPaymentLinkId(paymentLinkId);
        if (!paymentOrder)
        {
            throw createApiError({
                statusCode: 404,
                code: 'PAYMENT_RECORD_NOT_FOUND',
                message: 'Payment verification failed. No transaction record matches the provided link ID.'
            });
        }

        // 2. Idempotency Lock: If transaction is already successful, return success immediately
        if (paymentOrder.status === 'COMPLETED')
        {
            return { success: true, message: 'This transaction has already been successfully verified and settled.' };
        }

        // 3. Handshake with Razorpay API: Verify if the payment is indeed successfully 'captured'
        const paymentDetails = await razorpayClient.fetchPaymentDetails(paymentId);
        if (paymentDetails.status !== 'captured')
        {
            throw createApiError({
                statusCode: 400,
                code: 'PAYMENT_NOT_CAPTURED',
                message: `Verification rejected: Payment state is currently reported as '${paymentDetails.status}' by gateway.`
            });
        }

        // 4. Atomic Mongoose Transaction Session: Settle all accounts or rollback on failures
        const session = await mongoose.startSession();

        try
        {
            await session.withTransaction(async () =>
            {

                // --- STEP A: Mark Parent Payment Order SUCCESS ---
                await paymentOrderRepository.updateStatus({
                    paymentOrderId: paymentOrder._id,
                    status: 'COMPLETED',
                    providerPaymentId: paymentId,
                }, { session });

                // Iterate through all associated split child orders to run cascade settlements
                for (const order of paymentOrder.orders)
                {

                    // --- STEP B: Update individual split child order status ---
                    await orderRepository.updatePaymentStatus({
                        orderId: order._id,
                        paymentStatus: 'COMPLETED',
                    }, { session });

                    await orderRepository.updateStatus({
                        orderId: order._id,
                        orderStatus: 'PLACED',
                    }, { session });

                    // --- STEP C: Create a unique accounting Transaction ledger log ---
                    await transactionRepository.createTransaction({
                        customer: paymentOrder.user,
                        seller: order.seller,
                        order: order._id,
                    }, { session });

                    // --- STEP D: Update Merchant Seller Report card counters atomically ---
                    await sellerReportRepository.applyPaymentSuccess({
                        sellerId: order.seller,
                        earnings: order.totalSellingPrice, // Revenue payout share
                        sales: order.totalMrpPrice, // Gross sales GMV volume
                    }, { session });
                }

                // --- STEP E: Flush and empty the customer's Shopping Cart ---
                await cartRepository.updateCart({
                    userId: paymentOrder.user,
                    cartData: {
                        items: [], // Empties checkout items array
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

    return Object.freeze({
        createPaymentOrder,
        verifyRazorpayPayment,
    });
};
/**
 * Pure function-based factory representing the Payment Verification HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createPaymentController = ({ paymentService }) =>
{

    /**
     * Payment Verification & Settlement Controller.
     * Validates Razorpay captured payment success and triggers atomic accounting adjustments.
     * Maps exactly to: GET /api/payment/:paymentId
     */
    const verifyPayment = async (req, res) =>
    {
        // Captures standard dynamic payment ID from URL path variables parameters
        const { paymentId } = req.params;

        // Captures unique aggregate parent link ID from query string parameters: ?paymentLinkId=...
        const { paymentLinkId } = req.query;

        const outcome = await paymentService.verifyRazorpayPayment({
            paymentId,
            paymentLinkId,
        });

        // 201 Created: Matches expected e-commerce return code for successful payment captures
        res.status(201).json({
            message: outcome.message || 'Payment successfully captured and settled.',
            status: true,
        });
    };

    /**
     * Re-issues a brand-new, active checkout payment link URL for a pending split order.
     * Maps exactly to: POST /api/payment/:paymentMethod/order/:orderId (Authentication required)
     */
    const reissuePaymentLink = async (req, res) =>
    {
        const userId = req.user.id;
        const { paymentMethod, orderId } = req.params; // Captures path parameters from URL

        const outcome = await paymentService.reissuePaymentLink({
            orderId,
            paymentMethod: paymentMethod.toUpperCase().trim(),
            userId,
        });

        // 201 Created: Matches expected e-commerce return code for successful payment link re-issuances
        res.status(201).json(outcome);
    };

    return Object.freeze({
        verifyPayment,
        reissuePaymentLink, // Added payment link reissue controller method
    });
};
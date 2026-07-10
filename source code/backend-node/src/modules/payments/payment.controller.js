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

    return Object.freeze({
        verifyPayment,
    });
};
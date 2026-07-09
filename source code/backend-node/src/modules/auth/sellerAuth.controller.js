/**
 * Pure function-based factory representing the Merchant Seller Authentication HTTP Controllers.
 * Strictly enforces clean isolation architectures, acting as a lightweight API gate.
 */
export const createSellerAuthController = ({ sellerAuthService }) =>
{

    /**
     * Dispatches login OTP to registered merchant business email ids.
     * Maps exactly to: POST /sellers/sent/login-top
     */
    const sendOTP = async (req, res) =>
    {
        const { email } = req.body;

        // Standard business delegation
        const outcome = await sellerAuthService.sendSellerLoginOtp({ email });

        // 201 Created: Dynamic verification resource successfully allocated
        res.status(201).json(outcome);
    };

    /**
     * Verifies login OTP codes to authorize merchant login sessions.
     * Maps exactly to: POST /sellers/verify/login-top
     */
    const signin = async (req, res) =>
    {
        const { email, otp } = req.body;

        const outcome = await sellerAuthService.verifySellerLoginOtp({ email, otp });

        // 200 OK: Emits standard AuthResponse token payload to React Client
        res.status(200).json(outcome);
    };

    /**
     * Finalizes email verification pipeline to confirm merchant onboarding setups.
     * Maps exactly to: PATCH /sellers/verify/:otp
     */
    const verifyEmail = async (req, res) =>
    {
        // Captures standard dynamic OTP tokens from URL path parameter variables
        const { otp } = req.params;

        // Support email extraction from either body context or optional query string structures
        const email = req.body.email || req.query.email;

        const outcome = await sellerAuthService.verifySellerEmailByOtp({ email, otp });

        res.status(200).json(outcome);
    };

    return Object.freeze({
        sendOTP,
        signin,
        verifyEmail,
    });
};
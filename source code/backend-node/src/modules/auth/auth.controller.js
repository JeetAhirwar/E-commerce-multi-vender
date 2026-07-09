/**
 * Pure function-based factory representing the Customer Authentication HTTP API Controllers.
 * Strictly enforces thin controller architectures containing zero inline business logic.
 */
export const createAuthController = ({ authService }) =>
{

    /**
     * Dispatches verification OTP code to target customer emails.
     * Maps exactly to: POST /auth/sent/login-signup-otp
     */
    const sendOTP = async (req, res) =>
    {
        const { email } = req.body;

        // Direct business delegation: Calls core service layer execution blocks
        const outcome = await authService.sendLoginOtp({ email });

        // 201 Created: Standard HTTP code for successful resource creation (OTP dispatch token generated)
        res.status(201).json(outcome);
    };

    /**
     * Registers a new customer profile and allocates initial shopping assets atomically.
     * Maps exactly to: POST /auth/signup
     */
    const signup = async (req, res) =>
    {
        const { fullName, email, otp } = req.body;

        const outcome = await authService.signupCustomer({ fullName, email, otp });

        // 200 OK: Returns dynamic AuthResponse containing JWT standard keys back to React Client
        res.status(200).json(outcome);
    };

    /**
     * Validates credentials OTP to authorize existing customers into active system.
     * Maps exactly to: POST /auth/signin
     */
    const signin = async (req, res) =>
    {
        const { email, otp } = req.body;

        const outcome = await authService.signinCustomer({ email, otp });

        res.status(200).json(outcome);
    };

    return Object.freeze({
        sendOTP,
        signup,
        signin,
    });
};
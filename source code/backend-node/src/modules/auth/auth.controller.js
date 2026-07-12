// Standard cookie options configuration (Ensures maximum CSRF and XSS protection)
const COOKIE_OPTIONS = {
    httpOnly: true, // Prevents client-side scripts (XSS) from accessing the cookie
    secure: process.env.NODE_ENV === 'production', // True if SSL production environment is active
    sameSite: 'none', // Essential to support cross-origin frontend-backend cookie transfers (Vercel to Localhost)
    maxAge: 7 * 24 * 60 * 60 * 1000, // Valid for exactly 7 days
};

/**
 * Pure function-based factory representing the Customer Authentication HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createAuthController = ({ authService }) =>
{

    /**
     * Dispatches verification OTP code to target customer emails.
     */
    const sendOTP = async (req, res) =>
    {
        const { email } = req.body;

        const outcome = await authService.sendLoginOtp({ email });

        res.status(201).json(outcome);
    };

    /**
     * Registers a new customer profile and allocates initial shopping assets atomically.
     */
    const signup = async (req, res) =>
    {
        const { fullName, email, otp } = req.body;

        const { jwt, refreshToken, status, message, role } = await authService.signupCustomer({ fullName, email, otp });

        // Sets the newly rotated refresh token directly inside secure HttpOnly Cookie
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

        // Returns standard AuthResponse back to React Client
        res.status(200).json({
            jwt,
            status,
            message,
            role,
        });
    };

    /**
     * Validates credentials OTP to authorize existing customers into active system.
     */
    const signin = async (req, res) =>
    {
        const { email, otp } = req.body;

        const { jwt, refreshToken, status, message, role } = await authService.signinCustomer({ email, otp });

        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

        res.status(200).json({
            jwt,
            status,
            message,
            role,
        });
    };

    /**
     * Initiates forgot-password workflow generating a temporary secure recovery link.
     */
    const requestPasswordReset = async (req, res) =>
    {
        const { email } = req.body;

        const outcome = await authService.requestPasswordReset({ email });

        res.status(200).json(outcome);
    };

    /**
     * Commits the password modifications after validating the recovery token.
     */
    const resetPassword = async (req, res) =>
    {
        const { token, password } = req.body;

        const outcome = await authService.resetPassword({
            token,
            newPassword: password,
        });

        res.status(200).json(outcome);
    };

    /**
     * Executes Session Token Rotation (RTR).
     * Extracts current refresh cookie, validates authenticity, sets new cookie and returns access token.
     * Maps exactly to: POST /auth/refresh
     */
    const refreshSession = async (req, res) =>
    {
        // Reads cookie from client request parsed by cookie-parser middleware
        const { refreshToken } = req.cookies;

        if (!refreshToken)
        {
            return res.status(401).json({
                success: false,
                code: 'MISSING_REFRESH_TOKEN',
                message: 'Access Denied: Refresh token cookie is missing.'
            });
        }

        const { jwt, refreshToken: newRefreshToken } = await authService.refreshSession({ refreshToken });

        // Rotate Cookie: Sets newly rotated refresh token cleanly
        res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

        res.status(200).json({ jwt });
    };

    /**
     * Manual session logout terminator.
     * Purges database tokens and clears browser cookies cleanly.
     * Maps exactly to: POST /auth/logout
     */
    const logout = async (req, res) =>
    {
        const userId = req.user.id;

        // Trigger database session cleanups
        await authService.logout({ userId });

        // Purge browser Cookie
        res.clearCookie('refreshToken', COOKIE_OPTIONS);

        // 204 No Content: Standard expected REST code for successful session termination
        res.status(204).send();
    };

    return Object.freeze({
        sendOTP,
        signup,
        signin,
        requestPasswordReset,
        resetPassword,
        refreshSession, // Added session rotation controller method
        logout,         // Added logout controller method
    });
};
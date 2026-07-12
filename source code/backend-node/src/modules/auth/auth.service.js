import crypto from 'crypto';
import mongoose from 'mongoose';

/**
 * Pure function-based factory representing the Customer Authentication Business Service.
 * Implements Dependency Injection cleanly to enforce decoupled architectures.
 */
export const createAuthService = ({
    userRepository,
    cartRepository,
    verificationCodeRepository,
    passwordResetTokenRepository,
    refreshTokenRepository, // Injected dependency repository
    generateOTP,
    emailClient,
    signToken,
    verifyToken, // Injected verifyToken helper
    createApiError,
    jwtAccessSecret,
    jwtAccessExpiresIn,
    jwtRefreshSecret, // Injected refresh secrets config settings
    jwtRefreshExpiresIn,
}) =>
{

    /**
     * Internal SHA-256 generator. Protects OTP, reset links and session tokens by hashing them.
     */
    const hashString = (data) =>
    {
        return crypto.createHash('sha256').update(data).digest('hex');
    };

    /**
     * Internal Helper: Generates and registers a new rotatable refresh token session.
     */
    const issueRefreshToken = async ({ userId, familyId }, options = {}) =>
    {
        const rawRefreshToken = crypto.randomBytes(40).toString('hex');
        const tokenHash = hashString(rawRefreshToken);

        // Default Refresh Token expiry set to 7 days
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await refreshTokenRepository.saveToken({
            userId,
            tokenHash,
            familyId,
            expiresAt,
        }, options);

        return rawRefreshToken;
    };

    /**
     * Dispatches login OTP.
     */
    const sendLoginOtp = async ({ email }) =>
    {
        let targetEmail = email.toLowerCase().trim();
        let requireExistingUser = false;

        if (targetEmail.startsWith('signing_'))
        {
            targetEmail = targetEmail.replace('signing_', '');
            requireExistingUser = true;
        }

        if (requireExistingUser)
        {
            const userExists = await userRepository.findByEmail(targetEmail);
            if (!userExists)
            {
                throw createApiError({
                    statusCode: 404,
                    code: 'USER_NOT_FOUND',
                    message: 'Authentication failed. No customer profile registered under this email.'
                });
            }
        }

        const otp = generateOTP();
        const otpHash = hashString(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

        await verificationCodeRepository.deleteExistingCodes({ email: targetEmail, purpose: 'CUSTOMER_AUTH' });
        await verificationCodeRepository.saveCode({
            email: targetEmail,
            otpHash,
            purpose: 'CUSTOMER_AUTH',
            expiresAt,
        });

        await emailClient.sendOTPEmail({ toEmail: targetEmail, otp });

        return { message: 'A secure verification code has been successfully dispatched to your inbox.' };
    };

    /**
     * Standard signup business stream.
     */
    const signupCustomer = async ({ fullName, email, otp }) =>
    {
        const targetEmail = email.toLowerCase().trim();

        const activeCode = await verificationCodeRepository.findActiveCode({
            email: targetEmail,
            purpose: 'CUSTOMER_AUTH'
        });

        if (!activeCode)
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_OR_EXPIRED_OTP',
                message: 'The verification token has expired or is invalid. Please request a new OTP.'
            });
        }

        if (activeCode.attemptCount >= 3)
        {
            await verificationCodeRepository.markAsConsumed({ id: activeCode._id });
            throw createApiError({
                statusCode: 429,
                code: 'MAX_OTP_ATTEMPTS_EXCEEDED',
                message: 'Security Alert: Maximum validation failures reached. Session terminated.'
            });
        }

        const inputHash = hashString(otp);
        if (activeCode.otpHash !== inputHash)
        {
            await verificationCodeRepository.incrementAttempts({ id: activeCode._id });
            throw createApiError({
                statusCode: 400,
                code: 'INCORRECT_OTP',
                message: 'The entered OTP code is incorrect.'
            });
        }

        await verificationCodeRepository.markAsConsumed({ id: activeCode._id });

        let onboardedUser = null;
        const session = await mongoose.startSession();

        try
        {
            await session.withTransaction(async () =>
            {
                const userExists = await userRepository.findByEmail(targetEmail, { session });
                if (userExists)
                {
                    onboardedUser = userExists;
                    return;
                }

                onboardedUser = await userRepository.create({
                    fullName,
                    email: targetEmail,
                }, { session });

                await cartRepository.createCart({ userId: onboardedUser._id }, { session });
            });
        } finally
        {
            await session.endSession();
        }

        // Generate rotated Access and Refresh tokens
        const tokenPayload = { id: onboardedUser._id, email: onboardedUser.email, role: onboardedUser.role };
        const accessToken = signToken({ payload: tokenPayload, secret: jwtAccessSecret, expiresIn: jwtAccessExpiresIn });

        const familyId = crypto.randomUUID(); // Unique family identifier for the initial session
        const refreshToken = await issueRefreshToken({ userId: onboardedUser._id, familyId });

        return {
            jwt: accessToken,
            refreshToken, // Export refresh token to be attached as HttpOnly cookie in controllers
            status: true,
            message: 'Registration process successfully completed.',
            role: onboardedUser.role,
        };
    };

    /**
     * Standard signin validation logic.
     */
    const signinCustomer = async ({ email, otp }) =>
    {
        const targetEmail = email.toLowerCase().trim();

        const existingUser = await userRepository.findByEmail(targetEmail);
        if (!existingUser)
        {
            throw createApiError({
                statusCode: 404,
                code: 'USER_NOT_FOUND',
                message: 'No active profile found registered under this email address.'
            });
        }

        const activeCode = await verificationCodeRepository.findActiveCode({
            email: targetEmail,
            purpose: 'CUSTOMER_AUTH'
        });

        if (!activeCode)
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_OR_EXPIRED_OTP',
                message: 'The verification session is invalid or expired.'
            });
        }

        if (activeCode.attemptCount >= 3)
        {
            await verificationCodeRepository.markAsConsumed({ id: activeCode._id });
            throw createApiError({
                statusCode: 429,
                code: 'MAX_OTP_ATTEMPTS_EXCEEDED',
                message: 'Maximum verification failures reached. Code locked.'
            });
        }

        const inputHash = hashString(otp);
        if (activeCode.otpHash !== inputHash)
        {
            await verificationCodeRepository.incrementAttempts({ id: activeCode._id });
            throw createApiError({
                statusCode: 400,
                code: 'INCORRECT_OTP',
                message: 'Incorrect OTP.'
            });
        }

        await verificationCodeRepository.markAsConsumed({ id: activeCode._id });

        // Generate rotated tokens
        const tokenPayload = { id: existingUser._id, email: existingUser.email, role: existingUser.role };
        const accessToken = signToken({ payload: tokenPayload, secret: jwtAccessSecret, expiresIn: jwtAccessExpiresIn });

        const familyId = crypto.randomUUID();
        const refreshToken = await issueRefreshToken({ userId: existingUser._id, familyId });

        return {
            jwt: accessToken,
            refreshToken,
            status: true,
            message: 'Login successfully verified.',
            role: existingUser.role,
        };
    };

    /**
     * Custom Credentials Forgot Password Handler.
     */
    const requestPasswordReset = async ({ email }) =>
    {
        const targetEmail = email.toLowerCase().trim();

        const user = await userRepository.findByEmail(targetEmail);
        if (!user)
        {
            throw createApiError({
                statusCode: 404,
                code: 'USER_NOT_FOUND',
                message: 'Reset failed. No customer profile registered under this email address.'
            });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashString(rawToken);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Link valid for exactly 15 minutes

        await passwordResetTokenRepository.deleteExistingTokens({ email: targetEmail });
        await passwordResetTokenRepository.saveToken({
            email: targetEmail,
            tokenHash,
            expiresAt,
        });

        const recoveryLink = `http://localhost:3000/reset-password?token=${rawToken}`;

        const htmlEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">
            Jeet Ahirwar Marketplace
          </h2>
        </div>
        <p style="font-size: 16px; color: #334155; margin: 0 0 15px 0;">Hello ${user.fullName},</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
          We received a request to recover your account credentials password. Click the secure button below to choose a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 30px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 25px 0;">
          If the button does not work, copy and paste this URL into your browser: <br />
          <a href="${recoveryLink}" style="color: #3b82f6; word-break: break-all;">${recoveryLink}</a>
        </p>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.6; margin: 0 0 25px 0; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          * Security Notice: This password reset link is highly confidential and valid for exactly <strong>15 minutes</strong>. If you did not request this recovery run, please ignore this transmission securely.
        </p>
      </div>
    `;

        const mailOptions = {
            from: '"Jeet Ahirwar Security" <security@jeet-ahirwar.com>',
            to: targetEmail,
            subject: 'Password Recovery Request - Jeet Ahirwar Marketplace',
            html: htmlEmailContent,
        };

        await emailClient.sendOTPEmail({ toEmail: targetEmail, otp: `RECOVERY_LINK_DISPATCHED\nLink: ${recoveryLink}` });

        return { success: true, message: 'A secure password recovery link has been dispatched to your email inbox.' };
    };

    /**
     * Password Reset Executer.
     */
    const resetPassword = async ({ token, newPassword }) =>
    {
        const tokenHash = hashString(token);

        const activeToken = await passwordResetTokenRepository.findByTokenHash(tokenHash);
        if (!activeToken)
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_OR_EXPIRED_TOKEN',
                message: 'The password reset link is invalid or has expired. Please request a new recovery link.'
            });
        }

        const encryptedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

        const user = await userRepository.findByEmail(activeToken.email);
        if (!user)
        {
            throw createApiError({
                statusCode: 404,
                code: 'USER_NOT_FOUND',
                message: 'System updates failed. User account associated with this token was not found.'
            });
        }

        const UserMongooseModel = mongoose.model('User');
        await UserMongooseModel.findByIdAndUpdate(user._id, { passwordHash: encryptedPassword });

        await passwordResetTokenRepository.deleteExistingTokens({ email: activeToken.email });

        return { success: true, message: 'Your password has been successfully reset. Please log in with your new credentials.' };
    };

    /**
     * Refresh Token Rotation (RTR) Engine.
     * Decrypts current session token, detects and blocks replay attacks,
     * and issues rotated Access and Refresh tokens.
     */
    const refreshSession = async ({ refreshToken }) =>
    {
        // 1. Core Cryptographic Decryption and Signature check
        let decoded = null;
        try
        {
            decoded = verifyToken({ token: refreshToken, secret: jwtRefreshSecret });
        } catch (error)
        {
            throw createApiError({
                statusCode: 401,
                code: 'REFRESH_TOKEN_EXPIRED',
                message: 'Your refresh token session has expired or is invalid. Please log in again.'
            });
        }

        // 2. Hash input token to locate database record
        const tokenHash = hashString(refreshToken);
        const sessionToken = await refreshTokenRepository.findByTokenHash(tokenHash);

        // Dynamic security checks
        if (!sessionToken || sessionToken.isRevoked)
        {
            throw createApiError({
                statusCode: 401,
                code: 'SESSION_REVOKED',
                message: 'This session has been revoked. Re-authentication required.'
            });
        }

        // 3. Replay Attack Detection: If token is already used, ban the entire family lineage immediately!
        if (sessionToken.isUsed)
        {
            await refreshTokenRepository.revokeFamily({ familyId: sessionToken.familyId });
            throw createApiError({
                statusCode: 401,
                code: 'SECURITY_ALERT_REPLAY_ATTEMPT',
                message: 'Security Alert: This refresh token has already been rotated. Suspicious reuse detected. Session terminated.'
            });
        }

        // 4. Token is valid and unused -> Trigger Rotation
        const userId = sessionToken.user;
        const familyId = sessionToken.familyId;

        // Flag current token as used
        await refreshTokenRepository.markAsUsed({ id: sessionToken._id });

        // 5. Generate fresh rotated tokens under same family lineage
        const userProfile = await userRepository.findById(userId);
        if (!userProfile)
        {
            throw createApiError({
                statusCode: 404,
                code: 'USER_NOT_FOUND',
                message: 'User profile associated with this session was not found.'
            });
        }

        const tokenPayload = { id: userProfile._id, email: userProfile.email, role: userProfile.role };
        const newAccessToken = signToken({ payload: tokenPayload, secret: jwtAccessSecret, expiresIn: jwtAccessExpiresIn });
        const newRefreshToken = await issueRefreshToken({ userId: userProfile._id, familyId });

        return {
            jwt: newAccessToken,
            refreshToken: newRefreshToken,
        };
    };

    /**
     * Manual session logout terminator.
     * Completely drops and purges all active refresh token registries for the user.
     */
    const logout = async ({ userId }) =>
    {
        await refreshTokenRepository.deleteByUser({ userId });
        return { success: true, message: 'Logged out successfully. All active sessions terminated.' };
    };

    return Object.freeze({
        sendLoginOtp,
        signupCustomer,
        signinCustomer,
        requestPasswordReset,
        resetPassword,
        refreshSession, // Added session rotation action
        logout,         // Added logout action
    });
};
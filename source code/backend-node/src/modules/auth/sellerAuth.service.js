import crypto from 'crypto';

/**
 * Pure function-based factory representing the Merchant Seller Authentication Business Service.
 * Implements strict modular boundaries using Dependency Injection.
 */
export const createSellerAuthService = ({
    sellerRepository,
    verificationCodeRepository,
    generateOTP,
    emailClient,
    signToken,
    createApiError,
    jwtAccessSecret,
    jwtAccessExpiresIn,
}) =>
{

    /**
     * Internal high-speed SHA-256 OTP hashing utility.
     */
    const hashOTP = (otp) =>
    {
        return crypto.createHash('sha256').update(otp).digest('hex');
    };

    /**
     * Dispatched verification OTP for existing onboarded sellers.
     * Verifies if merchant exists and is not banned/suspended prior to transmission.
     */
    const sendSellerLoginOtp = async ({ email }) =>
    {
        const targetEmail = email.toLowerCase().trim();

        // 1. Core Check: Vendor must exist in registries
        const sellerExists = await sellerRepository.findByEmail(targetEmail);
        if (!sellerExists)
        {
            throw createApiError({
                statusCode: 404,
                code: 'SELLER_NOT_FOUND',
                message: 'No registered merchant profile matches the provided email address.'
            });
        }

        // 2. Security Check: Vendor must have an active moderation status (not banned/suspended)
        if (sellerExists.accountStatus === 'BANNED' || sellerExists.accountStatus === 'SUSPENDED')
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCOUNT_SUSPENDED',
                message: 'Access Denied: This merchant account has been suspended or banned due to compliance violations.'
            });
        }

        // 3. Compile new secure verification OTP
        const otp = generateOTP();
        const otpHash = hashOTP(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Valid for exactly 10 minutes

        // 4. Update data tables and send security email
        await verificationCodeRepository.deleteExistingCodes({ email: targetEmail, purpose: 'SELLER_LOGIN' });
        await verificationCodeRepository.saveCode({
            email: targetEmail,
            otpHash,
            purpose: 'SELLER_LOGIN',
            expiresAt,
        });

        await emailClient.sendOTPEmail({ toEmail: targetEmail, otp });

        return { message: 'Verification OTP has been successfully transmitted to your merchant email.' };
    };

    /**
     * Validates merchant login OTP inputs and issues system authorization tokens.
     */
    const verifySellerLoginOtp = async ({ email, otp }) =>
    {
        const targetEmail = email.toLowerCase().trim();

        // 1. Locate seller profiles parameters
        const sellerExists = await sellerRepository.findByEmail(targetEmail);
        if (!sellerExists)
        {
            throw createApiError({
                statusCode: 404,
                code: 'SELLER_NOT_FOUND',
                message: 'No registered merchant account found matching this email.'
            });
        }

        // 2. Pull active verification token
        const activeCode = await verificationCodeRepository.findActiveCode({
            email: targetEmail,
            purpose: 'SELLER_LOGIN',
        });

        if (!activeCode)
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_OR_EXPIRED_OTP',
                message: 'The verification token has expired or is invalid. Please request a new OTP.'
            });
        }

        // 3. Brute force defense throttling limits check
        if (activeCode.attemptCount >= 3)
        {
            await verificationCodeRepository.markAsConsumed({ id: activeCode._id });
            throw createApiError({
                statusCode: 429,
                code: 'MAX_OTP_ATTEMPTS_EXCEEDED',
                message: 'Security Alert: Maximum login attempts exceeded. This login token has been locked.'
            });
        }

        // 4. Crypto SHA256 matches evaluation checks
        const inputHash = hashOTP(otp);
        if (activeCode.otpHash !== inputHash)
        {
            await verificationCodeRepository.incrementAttempts({ id: activeCode._id });
            throw createApiError({
                statusCode: 400,
                code: 'INCORRECT_OTP',
                message: 'The entered OTP code is incorrect.'
            });
        }

        // Terminate validation code securely
        await verificationCodeRepository.markAsConsumed({ id: activeCode._id });

        // 5. Generate secure standard system tokens payload
        const tokenPayload = { id: sellerExists._id, email: sellerExists.email, role: sellerExists.role };
        const accessToken = signToken({ payload: tokenPayload, secret: jwtAccessSecret, expiresIn: jwtAccessExpiresIn });

        return {
            jwt: accessToken,
            status: true,
            message: 'Merchant session successfully verified.',
            role: sellerExists.role,
        };
    };

    /**
     * Standard Email Verification Pipeline (Finalizes merchant registers).
     * Locates verification code and flags merchant email confirmed inside database registries.
     */
    const verifySellerEmailByOtp = async ({ email, otp }) =>
    {
        const targetEmail = email.toLowerCase().trim();

        // 1. Pull dynamic active registration email verification code
        const activeCode = await verificationCodeRepository.findActiveCode({
            email: targetEmail,
            purpose: 'SELLER_EMAIL_VERIFICATION',
        });

        if (!activeCode)
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_OR_EXPIRED_OTP',
                message: 'The email verification code is invalid or expired. Onboarding verification failed.'
            });
        }

        // 2. Brute force check
        if (activeCode.attemptCount >= 3)
        {
            await verificationCodeRepository.markAsConsumed({ id: activeCode._id });
            throw createApiError({
                statusCode: 429,
                code: 'MAX_OTP_ATTEMPTS_EXCEEDED',
                message: 'Maximum email verification attempts exceeded. Code locked.'
            });
        }

        // 3. Crypto Hash check matching
        const inputHash = hashOTP(otp);
        if (activeCode.otpHash !== inputHash)
        {
            await verificationCodeRepository.incrementAttempts({ id: activeCode._id });
            throw createApiError({
                statusCode: 400,
                code: 'INCORRECT_OTP',
                message: 'Incorrect verification OTP.'
            });
        }

        // Terminate active verification session
        await verificationCodeRepository.markAsConsumed({ id: activeCode._id });

        // 4. Update dynamic state: Pull seller and set isEmailVerified: true
        const seller = await sellerRepository.findByEmail(targetEmail);
        if (!seller)
        {
            throw createApiError({
                statusCode: 404,
                code: 'SELLER_NOT_FOUND',
                message: 'No registered seller matches the email associated with this verification code.'
            });
        }

        // Commit changes into database
        const verifiedSeller = await sellerRepository.updateVerificationStatus({ id: seller._id, isEmailVerified: true });

        return {
            success: true,
            message: 'Merchant email successfully verified and onboarded.',
            seller: verifiedSeller,
        };
    };

    return Object.freeze({
        sendSellerLoginOtp,
        verifySellerLoginOtp,
        verifySellerEmailByOtp,
    });
};
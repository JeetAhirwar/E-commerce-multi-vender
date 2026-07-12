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
    const hashString = (data) =>
    {
        return crypto.createHash('sha256').update(data).digest('hex');
    };

    /**
     * Onboards a brand-new merchant seller account.
     * Generates email verification OTP and dispatches welcome verification mail atomically.
     */
    const createSeller = async (sellerData) =>
    {
        const targetEmail = sellerData.email.toLowerCase().trim();

        // 1. Core Check: Prevent duplicate email registration attempts
        const existingSeller = await sellerRepository.findByEmail(targetEmail);
        if (existingSeller)
        {
            throw createApiError({
                statusCode: 409,
                code: 'DUPLICATE_SELLER_EMAIL',
                message: `Onboarding failed: A business merchant profile is already registered under '${targetEmail}'.`
            });
        }

        // 2. Hash credential password securely prior to saving
        const encryptedPassword = sellerData.password
            ? hashString(sellerData.password)
            : null;

        // 3. Commit seller write operations directly into database
        const newSeller = await sellerRepository.create({
            ...sellerData,
            email: targetEmail,
            passwordHash: encryptedPassword,
            role: 'ROLE_SELLER',
            isEmailVerified: false,
            accountStatus: 'PENDING_VERIFICATION' // Starts as pending moderation
        });

        // 4. Generate dynamic 6-digit email-verification OTP
        const otp = generateOTP();
        const otpHash = hashString(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Valid for exactly 10 minutes

        // 5. Persist code state using verification repository
        await verificationCodeRepository.deleteExistingCodes({ email: targetEmail, purpose: 'SELLER_EMAIL_VERIFICATION' });
        await verificationCodeRepository.saveCode({
            email: targetEmail,
            otpHash,
            purpose: 'SELLER_EMAIL_VERIFICATION',
            expiresAt,
        });

        // 6. Deliver welcome verification OTP directly to the merchant inbox
        await emailClient.sendOTPEmail({ toEmail: targetEmail, otp });

        return newSeller;
    };

    /**
     * Dispatched verification OTP for existing onboarded sellers.
     */
    const sendSellerLoginOtp = async ({ email }) =>
    {
        const targetEmail = email.toLowerCase().trim();

        const sellerExists = await sellerRepository.findByEmail(targetEmail);
        if (!sellerExists)
        {
            throw createApiError({
                statusCode: 404,
                code: 'SELLER_NOT_FOUND',
                message: 'No registered merchant profile matches the provided email address.'
            });
        }

        if (sellerExists.accountStatus === 'BANNED' || sellerExists.accountStatus === 'SUSPENDED')
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCOUNT_SUSPENDED',
                message: 'Access Denied: This merchant account has been suspended or banned due to compliance violations.'
            });
        }

        const otp = generateOTP();
        const otpHash = hashString(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Valid for exactly 10 minutes

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

        const sellerExists = await sellerRepository.findByEmail(targetEmail);
        if (!sellerExists)
        {
            throw createApiError({
                statusCode: 404,
                code: 'SELLER_NOT_FOUND',
                message: 'No registered merchant account found matching this email.'
            });
        }

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

        if (activeCode.attemptCount >= 3)
        {
            await verificationCodeRepository.markAsConsumed({ id: activeCode._id });
            throw createApiError({
                statusCode: 429,
                code: 'MAX_OTP_ATTEMPTS_EXCEEDED',
                message: 'Security Alert: Maximum login attempts exceeded. This login token has been locked.'
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
     */
    const verifySellerEmailByOtp = async ({ email, otp }) =>
    {
        const targetEmail = email.toLowerCase().trim();

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

        if (activeCode.attemptCount >= 3)
        {
            await verificationCodeRepository.markAsConsumed({ id: activeCode._id });
            throw createApiError({
                statusCode: 429,
                code: 'MAX_OTP_ATTEMPTS_EXCEEDED',
                message: 'Maximum email verification attempts exceeded. Code locked.'
            });
        }

        const inputHash = hashString(otp);
        if (activeCode.otpHash !== inputHash)
        {
            await verificationCodeRepository.incrementAttempts({ id: activeCode._id });
            throw createApiError({
                statusCode: 400,
                code: 'INCORRECT_OTP',
                message: 'Incorrect verification OTP.'
            });
        }

        await verificationCodeRepository.markAsConsumed({ id: activeCode._id });

        const seller = await sellerRepository.findByEmail(targetEmail);
        if (!seller)
        {
            throw createApiError({
                statusCode: 404,
                code: 'SELLER_NOT_FOUND',
                message: 'No registered seller matches the email associated with this verification code.'
            });
        }

        const verifiedSeller = await sellerRepository.updateVerificationStatus({ id: seller._id, isEmailVerified: true });

        return {
            success: true,
            message: 'Merchant email successfully verified and onboarded.',
            seller: verifiedSeller,
        };
    };

    return Object.freeze({
        createSeller, // Added onboarding action
        sendSellerLoginOtp,
        verifySellerLoginOtp,
        verifySellerEmailByOtp,
    });
};
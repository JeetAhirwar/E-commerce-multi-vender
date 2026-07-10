import crypto from 'crypto';
import mongoose from 'mongoose'; // Essential to initiate dynamic atomic Transaction Sessions

/**
 * Pure function-based factory representing the Customer Authentication Business Service.
 * Implements Dependency Injection cleanly to enforce decoupled architectures.
 */
export const createAuthService = ({
    userRepository,
    cartRepository,
    verificationCodeRepository,
    generateOTP,
    emailClient,
    signToken,
    createApiError,
    jwtAccessSecret,
    jwtAccessExpiresIn,
    jwtRefreshSecret,
    jwtRefreshExpiresIn,
}) =>
{

    /**
     * Internal SHA-256 generator. Protects OTP strings by hashing them prior to db writes.
     * Leverages native Node.js:crypto for ultra-fast, dependency-free executions.
     */
    const hashOTP = (otp) =>
    {
        return crypto.createHash('sha256').update(otp).digest('hex');
    };

    /**
     * Generates a secure OTP, manages previous residual cleanups, 
     * commits dynamic verification state, and dispatches email directly to user inbox.
     */
    const sendLoginOtp = async ({ email }) =>
    {
        let targetEmail = email.toLowerCase().trim();
        let requireExistingUser = false;

        // Custom operational rule: Checks "signing_" credentials markers to enforce user limits
        if (targetEmail.startsWith('signing_'))
        {
            targetEmail = targetEmail.replace('signing_', '');
            requireExistingUser = true;
        }

        // Resolves user registration limits prior to sending the verification OTP
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

        // Build fresh verification code
        const otp = generateOTP();
        const otpHash = hashOTP(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Valid for exactly 10 minutes

        // Persist code state using verification repository
        await verificationCodeRepository.deleteExistingCodes({ email: targetEmail, purpose: 'CUSTOMER_AUTH' });
        await verificationCodeRepository.saveCode({
            email: targetEmail,
            otpHash,
            purpose: 'CUSTOMER_AUTH',
            expiresAt,
        });

        // Deliver secure OTP email directly to the recipient inbox
        await emailClient.sendOTPEmail({ toEmail: targetEmail, otp });

        return { message: 'A secure verification code has been successfully dispatched to your inbox.' , otp};
    };

    /**
     * Standard signup business stream.
     * Creates custom customer profile and associated empty cart atomically using Mongoose Transactions.
     */
    const signupCustomer = async ({ fullName, email, otp }) =>
    {
        const targetEmail = email.toLowerCase().trim();

        // 1. Fetch active verification record
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

        // 2. Anti Brute-Force Rate Limiting Lock (Max: 3 Attempts)
        if (activeCode.attemptCount >= 3)
        {
            await verificationCodeRepository.markAsConsumed({ id: activeCode._id });
            throw createApiError({
                statusCode: 429,
                code: 'MAX_OTP_ATTEMPTS_EXCEEDED',
                message: 'Security Alert: Maximum validation failures reached. This verification session has been terminated.'
            });
        }

        // 3. Cryptographic Matching evaluation
        const inputHash = hashOTP(otp);
        if (activeCode.otpHash !== inputHash)
        {
            await verificationCodeRepository.incrementAttempts({ id: activeCode._id });
            throw createApiError({
                statusCode: 400,
                code: 'INCORRECT_OTP',
                message: 'The entered OTP code is incorrect. Please verify and try again.'
            });
        }

        // Consume verification session cleanly
        await verificationCodeRepository.markAsConsumed({ id: activeCode._id });

        // 4. Atomic Mongoose Onboarding Transaction Session Execution
        let onboardedUser = null;
        const session = await mongoose.startSession();

        try
        {
            await session.withTransaction(async () =>
            {
                // Enforces unique accounts checks under active isolation locks
                const userExists = await userRepository.findByEmail(targetEmail, { session });
                if (userExists)
                {
                    onboardedUser = userExists; // Simple logins flow transition
                    return;
                }

                // Register profile securely
                onboardedUser = await userRepository.create({
                    fullName,
                    email: targetEmail,
                }, { session });

                // Initialize empty shopping cart linked to the newly created user profile
                await cartRepository.createCart({ userId: onboardedUser._id }, { session });
            });
        } finally
        {
            await session.endSession();
        }

        // 5. Generate compatible system authorization dynamic token sets
        const tokenPayload = { id: onboardedUser._id, email: onboardedUser.email, role: onboardedUser.role };
        const accessToken = signToken({ payload: tokenPayload, secret: jwtAccessSecret, expiresIn: jwtAccessExpiresIn });

        // Client integration format compatible to React frontend configurations
        return {
            jwt: accessToken,
            status: true,
            message: 'Registration process successfully completed.',
            role: onboardedUser.role,
        };
    };

    /**
     * Standard signin validation logic.
     * Authorizes existing verified customers into the platform.
     */
    const signinCustomer = async ({ email, otp }) =>
    {
        const targetEmail = email.toLowerCase().trim();

        // 1. Verify if user profiles exist under target registries
        const existingUser = await userRepository.findByEmail(targetEmail);
        if (!existingUser)
        {
            throw createApiError({
                statusCode: 404,
                code: 'USER_NOT_FOUND',
                message: 'No active profile found registered under this email address.'
            });
        }

        // 2. Fetch active verification code
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

        // 3. Brute force thresholds checks
        if (activeCode.attemptCount >= 3)
        {
            await verificationCodeRepository.markAsConsumed({ id: activeCode._id });
            throw createApiError({
                statusCode: 429,
                code: 'MAX_OTP_ATTEMPTS_EXCEEDED',
                message: 'Maximum verification failures reached. Code locked.'
            });
        }

        // 4. Evaluate cryptography hashes match
        const inputHash = hashOTP(otp);
        if (activeCode.otpHash !== inputHash)
        {
            await verificationCodeRepository.incrementAttempts({ id: activeCode._id });
            throw createApiError({
                statusCode: 400,
                code: 'INCORRECT_OTP',
                message: 'Incorrect OTP. Session attempts updated.'
            });
        }

        // Terminate validation session cleanly
        await verificationCodeRepository.markAsConsumed({ id: activeCode._id });

        // 5. Build dynamic security session signatures
        const tokenPayload = { id: existingUser._id, email: existingUser.email, role: existingUser.role };
        const accessToken = signToken({ payload: tokenPayload, secret: jwtAccessSecret, expiresIn: jwtAccessExpiresIn });

        return {
            jwt: accessToken,
            status: true,
            message: 'Login successfully verified.',
            role: existingUser.role,
        };
    };

    return Object.freeze({
        sendLoginOtp,
        signupCustomer,
        signinCustomer,
    });
};
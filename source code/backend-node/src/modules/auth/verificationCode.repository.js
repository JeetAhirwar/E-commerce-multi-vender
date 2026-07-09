/**
 * Creates a repository for managing verification codes.
 */
export const createVerificationCodeRepository = ({ VerificationCode }) =>
{

    /**
     * Delete existing verification codes for the given email and purpose.
     */
    const deleteExistingCodes = async ({ email, purpose }) =>
    {
        return VerificationCode.deleteMany({
            email: email.toLowerCase(),
            purpose
        });
    };

    /**
     * Save a new verification code.
     */
    const saveCode = async ({ email, otpHash, purpose, expiresAt }) =>
    {
        return VerificationCode.create({
            email: email.toLowerCase(),
            otpHash,
            purpose,
            expiresAt,
        });
    };

    /**
     * Find an active verification code.
     */
    const findActiveCode = async ({ email, purpose }) =>
    {
        return VerificationCode.findOne({
            email: email.toLowerCase(),
            purpose,
            consumedAt: null, // Only unused codes.
            expiresAt: { $gt: new Date() }, // Only non-expired codes.
        }).lean(); // Return a plain JavaScript object.
    };

    /**
     * Increase the verification attempt count.
     */
    const incrementAttempts = async ({ id }) =>
    {
        return VerificationCode.findByIdAndUpdate(
            id,
            { $inc: { attemptCount: 1 } }, // Increment attempt count.
            { new: true } // Return the updated document.
        ).lean();
    };

    /**
     * Mark the verification code as used.
     */
    const markAsConsumed = async ({ id }) =>
    {
        return VerificationCode.findByIdAndUpdate(
            id,
            { consumedAt: new Date() },
            { new: true }
        ).lean();
    };

    return Object.freeze({
        deleteExistingCodes,
        saveCode,
        findActiveCode,
        incrementAttempts,
        markAsConsumed,
    });
};
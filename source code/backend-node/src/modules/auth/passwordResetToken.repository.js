/**
 * Pure function-based factory representing the PasswordResetToken Persistence interface.
 * Implements loose-coupling by accepting Mongoose Model through Dependency Injection.
 */
export const createPasswordResetTokenRepository = ({ PasswordResetToken }) =>
{

    /**
     * Drops all existing password reset tokens registered for a specific email.
     * Ensures clean slate prior to dispatching a new recovery link.
     */
    const deleteExistingTokens = async ({ email }) =>
    {
        return PasswordResetToken.deleteMany({
            email: email.toLowerCase().trim()
        });
    };

    /**
     * Persists a securely hashed password reset token under database registers.
     */
    const saveToken = async ({ email, tokenHash, expiresAt }) =>
    {
        return PasswordResetToken.create({
            email: email.toLowerCase().trim(),
            tokenHash,
            expiresAt,
        });
    };

    /**
     * Discovers and retrieves an active, un-expired recovery token using its unique hash.
     */
    const findByTokenHash = async (tokenHash, options = {}) =>
    {
        return PasswordResetToken.findOne({
            tokenHash,
            expiresAt: { $gt: new Date() } // Verifies token has not expired yet
        }, null, options).lean(); // Returns plain lightweight JS objects for performance
    };

    return Object.freeze({
        deleteExistingTokens,
        saveToken,
        findByTokenHash,
    });
};
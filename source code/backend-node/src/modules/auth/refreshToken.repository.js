/**
 * Pure function-based factory representing the RefreshToken Persistence interface.
 * Implements loose-coupling by accepting Mongoose Model through Dependency Injection.
 */
export const createRefreshTokenRepository = ({ RefreshToken }) =>
{

    /**
     * Persists a securely hashed refresh token under database registers.
     */
    const saveToken = async ({ userId, tokenHash, familyId, expiresAt }) =>
    {
        return RefreshToken.create({
            user: userId,
            tokenHash,
            familyId,
            expiresAt,
        });
    };

    /**
     * Discovers and retrieves an active, un-expired session token using its unique hash.
     */
    const findByTokenHash = async (tokenHash, options = {}) =>
    {
        return RefreshToken.findOne({
            tokenHash,
            expiresAt: { $gt: new Date() } // Verifies token has not expired yet
        }, null, options).lean(); // Returns plain lightweight JS objects for performance
    };

    /**
     * Flags a specific refresh token as used (rotated).
     */
    const markAsUsed = async ({ id }, options = {}) =>
    {
        return RefreshToken.findByIdAndUpdate(
            id,
            { isUsed: true },
            { ...options, new: true }
        ).lean();
    };

    /**
     * Revokes and bans an entire token family (lineage) Belongs to same login session.
     * Triggered immediately when a replay attack (token reuse) is detected.
     */
    const revokeFamily = async ({ familyId }, options = {}) =>
    {
        return RefreshToken.updateMany(
            { familyId },
            { isRevoked: true },
            options
        ).lean();
    };

    /**
     * Drops all session tokens registered for a specific user ID.
     * Triggered during manual logouts or global security resets.
     */
    const deleteByUser = async ({ userId }, options = {}) =>
    {
        return RefreshToken.deleteMany({ user: userId }, options);
    };

    return Object.freeze({
        saveToken,
        findByTokenHash,
        markAsUsed,
        revokeFamily,
        deleteByUser,
    });
};
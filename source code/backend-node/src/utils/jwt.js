import jwt from 'jsonwebtoken';

/**
 * JWT utility functions for signing and verifying tokens.
 */

/**
 * Creates a signed JWT token.
 */
export const signToken = ({ payload, secret, expiresIn }) =>
{
    try
    {
        // Generate and sign the token.
        return jwt.sign(payload, secret, { expiresIn });
    } catch (error)
    {
        console.error('[JWT ENCODING FAILURE] Error during signing:', error.message);
        throw error;
    }
};

/**
 * Verifies and decodes a JWT token.
 */
export const verifyToken = ({ token, secret }) =>
{
    try
    {
        // Verify the token and return its payload.
        return jwt.verify(token, secret);
    } catch (error)
    {
        // Handle expired token.
        if (error.name === 'TokenExpiredError')
        {
            const expiredError = new Error('The authorization session has expired. Please authenticate again.');
            expiredError.code = 'TOKEN_EXPIRED';
            expiredError.statusCode = 401;
            throw expiredError;
        }

        // Handle invalid or tampered token.
        const invalidError = new Error('The secure authorization signature is invalid or compromised.');
        invalidError.code = 'INVALID_TOKEN_SIGNATURE';
        invalidError.statusCode = 401;
        throw invalidError;
    }
};
import crypto from 'crypto';

/**
 * Generates a secure 6-digit OTP.
 */
export const generateOTP = () =>
{
    // Generate a random 6-digit number.
    const secureRandomInt = crypto.randomInt(100000, 1000000);

    // Return the OTP as a string.
    return secureRandomInt.toString();
};
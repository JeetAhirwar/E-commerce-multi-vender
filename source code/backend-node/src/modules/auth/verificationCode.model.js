import mongoose from 'mongoose';

/**
 * Verification code schema for storing OTP details.
 */
const VerificationCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Verification destination email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    otpHash: {
        type: String,
        required: [true, 'Cryptographic OTP verification hash is required'],
    },
    purpose: {
        type: String,
        required: [true, 'Verification tracking purpose is required'],
        trim: true, // Example: CUSTOMER_LOGIN, SELLER_LOGIN, EMAIL_VERIFICATION
    },
    expiresAt: {
        type: Date,
        required: [true, 'Verification temporal expiration timestamp is required'],
    },
    attemptCount: {
        type: Number,
        default: 0,
        required: true,
        min: 0,
    },
    consumedAt: {
        type: Date,
        default: null, // Set when the OTP is successfully used.
    },
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Index to improve lookup performance.
VerificationCodeSchema.index({ email: 1, purpose: 1 });

/**
 * Automatically deletes expired OTP records.
 */
VerificationCodeSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'VerificationCodeTTLIndex' }
);

export const VerificationCode = mongoose.model('VerificationCode', VerificationCodeSchema);
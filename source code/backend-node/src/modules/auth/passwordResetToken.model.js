import mongoose from 'mongoose';

/**
 * Password Reset Token Schema representing secured, temporal recovery session data.
 * Integrates native MongoDB TTL (Time To Live) index allocations for automated cleanup.
 */
const PasswordResetTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Reset password destination email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    tokenHash: {
        type: String,
        required: [true, 'Cryptographic token validation hash is required'],
        unique: true, // Prevents duplicate active tokens collisions
    },
    expiresAt: {
        type: Date,
        required: [true, 'Verification temporal expiration timestamp is required'],
    },
}, {
    timestamps: true, // Captures 'createdAt' and 'updatedAt' for platform security audits
});

// Database Lookup Performance Indexing
PasswordResetTokenSchema.index({ email: 1 });

/**
 * MongoDB Native TTL (Time To Live) Index Setup.
 * Tells MongoDB engine to automatically drop documents from storage collections
 * once system date values exceed the 'expiresAt' timestamp value.
 */
PasswordResetTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'PasswordResetTokenTTLIndex' }
);

export const PasswordResetToken = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
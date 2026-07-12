import mongoose from 'mongoose';

/**
 * Refresh Token Schema representing secure, rotatable login session tracks.
 * Implements Token Family Rotation (RTR) and native MongoDB TTL indices for automatic cleaning.
 */
const RefreshTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Points directly to the User collection target profile
        required: [true, 'Refresh token session must connect to a valid user'],
    },
    tokenHash: {
        type: String,
        required: [true, 'Cryptographic token validation hash is required'],
        unique: true, // Prevents duplicate active session token collisions
    },
    familyId: {
        type: String,
        required: [true, 'Token rotation lineage familyId is required'],
        trim: true, // Groups rotated tokens belonging to the same root login session
    },
    isUsed: {
        type: Boolean,
        default: false,
        required: true, // Set to true once rotated to detect and block replay attacks
    },
    isRevoked: {
        type: Boolean,
        default: false,
        required: true, // Set to true if family is compromised and banned
    },
    expiresAt: {
        type: Date,
        required: [true, 'Verification temporal expiration timestamp is required'],
    },
}, {
    timestamps: true, // Captures 'createdAt' and 'updatedAt' for platform security audits
});

// Database Lookup Performance Indexing
RefreshTokenSchema.index({ user: 1 });
RefreshTokenSchema.index({ familyId: 1 });

/**
 * MongoDB Native TTL (Time To Live) Index Setup.
 * Tells MongoDB engine to automatically drop documents from storage collections
 * once system date values exceed the 'expiresAt' timestamp value.
 */
RefreshTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'RefreshTokenTTLIndex' }
);

export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
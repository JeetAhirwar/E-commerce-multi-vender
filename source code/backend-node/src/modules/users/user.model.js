import mongoose from 'mongoose';
import { ROLES } from '../../constants/enums.js';

/**
 * Address subdocument stored inside the User document.
 * Used to manage multiple shipping/billing addresses.
 */
const AddressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name for address is required'],
        trim: true,
    },
    mobile: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true,
    },
    streetAddress: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
    },
    pinCode: {
        type: String,
        required: [true, 'Pin code is required'],
        trim: true,
    },
}, {
    // Each address gets its own unique ID.
    _id: true,
});

/**
 * User schema containing authentication and profile information.
 */
const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
        // Can remain empty for passwordless/OTP authentication.
        type: String,
    },
    mobile: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.CUSTOMER,
    },

    // Embedded list of user addresses.
    addresses: [AddressSchema],

    // References to coupons already used by the user.
    usedCoupons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
    }],
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Indexes to improve query performance.
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

export const User = mongoose.model('User', UserSchema);
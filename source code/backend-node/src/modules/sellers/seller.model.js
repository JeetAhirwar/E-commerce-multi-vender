import mongoose from 'mongoose';
import { ROLES, ACCOUNT_STATUS } from '../../constants/enums.js';

/**
 * Pickup address used for order collection.
 */
const PickupAddressSchema = new mongoose.Schema({
    streetAddress: {
        type: String,
        required: [true, 'Pickup street address is required'],
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'Pickup city is required'],
        trim: true,
    },
    state: {
        type: String,
        required: [true, 'Pickup state is required'],
        trim: true,
    },
    pinCode: {
        type: String,
        required: [true, 'Pickup pin code is required'],
        trim: true,
    },
}, {
    // A seller has only one pickup address.
    _id: false,
});

/**
 * Business registration details.
 */
const BusinessDetailsSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: [true, 'Business legal name is required'],
        trim: true,
    },
    GSTIN: {
        type: String,
        required: [true, 'Tax GSTIN identifier code is required'],
        trim: true,
        uppercase: true,
    },
    businessAddress: {
        type: String,
        required: [true, 'Business registration office address is required'],
        trim: true,
    },
}, {
    _id: false,
});

/**
 * Seller bank account details for payouts.
 */
const BankDetailsSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: [true, 'Bank account number is required'],
        trim: true,
    },
    accountHolderName: {
        type: String,
        required: [true, 'Bank account holder name is required'],
        trim: true,
    },
    IFSC: {
        type: String,
        required: [true, 'Bank IFSC routing code is required'],
        trim: true,
        uppercase: true,
    },
}, {
    _id: false,
});

/**
 * Seller account and business information.
 */
const SellerSchema = new mongoose.Schema({
    sellerName: {
        type: String,
        required: [true, 'Seller representative name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Seller business email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid business email address'],
    },
    mobile: {
        type: String,
        required: [true, 'Seller mobile number is required'],
        trim: true,
    },
    passwordHash: {
        // Empty for OTP/passwordless authentication if needed.
        type: String,
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.SELLER,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    accountStatus: {
        type: String,
        enum: Object.values(ACCOUNT_STATUS),
        default: ACCOUNT_STATUS.PENDING_VERIFICATION,
    },
    businessDetails: {
        type: BusinessDetailsSchema,
        required: [true, 'Business registration details are required'],
    },
    bankDetails: {
        type: BankDetailsSchema,
        required: [true, 'Bank routing details are required'],
    },
    pickupAddress: {
        type: PickupAddressSchema,
        required: [true, 'Pickup inventory address is required'],
    },
}, {
    // Automatically manages createdAt and updatedAt.
    timestamps: true,
});

// Indexes for faster database queries.
// SellerSchema.index({ email: 1 });
SellerSchema.index({ accountStatus: 1 });

export const Seller = mongoose.model('Seller', SellerSchema);
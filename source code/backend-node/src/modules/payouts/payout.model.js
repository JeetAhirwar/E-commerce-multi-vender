import mongoose from 'mongoose';

// Available payout statuses
const PAYOUT_STATUS = Object.freeze([
    'PENDING',
    'SUCCESS',
    'FAILED'
]);

/**
 * Payout schema for storing seller payout details.
 */
const PayoutSchema = new mongoose.Schema({
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction', // Transactions included in this payout.
        required: [true, 'Payout batch must refer to at least one accounting transaction record'],
    }],
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller', // Reference to the seller receiving the payout.
        required: [true, 'Payout must connect to a valid active merchant seller'],
    },
    amount: {
        type: Number,
        required: [true, 'Payout settlement total clear amount is required'],
        min: [0, 'Payout clear amount cannot be negative'],
    },
    status: {
        type: String,
        enum: {
            values: PAYOUT_STATUS,
            message: '{VALUE} is not a valid bank settlement status'
        },
        default: 'PENDING', // New payouts start with a pending status.
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Indexes to improve query performance.
PayoutSchema.index({ seller: 1, date: -1 }); // For seller payout history.
PayoutSchema.index({ status: 1 }); // For filtering payouts by status.

export const Payout = mongoose.model('Payout', PayoutSchema);
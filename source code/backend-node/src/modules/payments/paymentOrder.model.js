import mongoose from 'mongoose';
import { PAYMENT_STATUS, PAYMENT_METHODS } from '../../constants/enums.js';

/**
 * Payment order schema.
 * Stores payment details and links one payment to one or more orders.
 */
const PaymentOrderSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: [true, 'Final transactional payable amount is required'],
        min: [0, 'Transaction amount cannot be negative'],
    },
    status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PAYMENT_METHODS),
        required: [true, 'Payment processor method is required'],
    },
    paymentLinkId: {
        type: String,
        default: null, // Payment link ID returned by the payment gateway.
        trim: true,
    },
    providerPaymentId: {
        type: String,
        default: null, // Payment ID received after a successful payment.
        trim: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Payment transaction must link to an active purchasing customer'],
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', // Orders included in this payment.
        required: [true, 'Payment order container must link to at least one split order record'],
    }],
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Indexes to improve query performance.
PaymentOrderSchema.index({ user: 1, createdAt: -1 });
PaymentOrderSchema.index({ status: 1 });

// Ensures paymentLinkId is unique when it exists.
PaymentOrderSchema.index(
    { paymentLinkId: 1 },
    { unique: true, sparse: true, name: 'PaymentOrderLinkIdSparseIndex' }
);

export const PaymentOrder = mongoose.model('PaymentOrder', PaymentOrderSchema);
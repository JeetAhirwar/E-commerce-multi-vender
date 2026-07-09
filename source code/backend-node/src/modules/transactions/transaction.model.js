import mongoose from 'mongoose';

/**
 * Transaction schema for recording completed order transactions.
 */
const TransactionSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Transaction ledger must link to an active purchasing customer'],
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: [true, 'Transaction ledger must link to an active merchant seller'],
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Transaction ledger must link to a valid finalized split order'],
        unique: true, // One transaction record is allowed per order.
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
TransactionSchema.index({ seller: 1, date: -1 });
TransactionSchema.index({ customer: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', TransactionSchema);
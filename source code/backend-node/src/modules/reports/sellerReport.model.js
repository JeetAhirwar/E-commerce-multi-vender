import mongoose from 'mongoose';

/**
 * Seller report schema for storing sales and earnings summary.
 */
const SellerReportSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: [true, 'Report card must link to an active merchant seller'],
        unique: true, // Each seller has only one report.
    },
    totalEarnings: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalSales: {
        type: Number,
        default: 0, // Total sales amount.
        min: 0,
    },
    totalRefunds: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalTax: {
        type: Number,
        default: 0,
        min: 0,
    },
    netEarnings: {
        type: Number,
        default: 0, // Earnings after deductions.
    },
    totalOrders: {
        type: Number,
        default: 0, // Total completed orders.
        min: 0,
    },
    canceledOrders: {
        type: Number,
        default: 0, // Total canceled orders.
        min: 0,
    },
    totalTransactions: {
        type: Number,
        default: 0, // Total successful transactions.
        min: 0,
    },
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Index to improve query performance.
SellerReportSchema.index({ seller: 1 });

export const SellerReport = mongoose.model('SellerReport', SellerReportSchema);
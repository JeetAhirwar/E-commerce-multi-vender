import mongoose from 'mongoose';

/**
 * Coupon schema for managing discount offers.
 */
const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true, // Ensures every coupon code is unique.
        uppercase: true, // Automatically converts the code to uppercase.
        trim: true,
    },
    discountPercentage: {
        type: Number,
        required: [true, 'Discount percentage is required'],
        min: [0, 'Discount percentage cannot be less than 0%'],
        max: [100, 'Discount percentage cannot exceed 100%'],
    },
    validityStartDate: {
        type: Date,
        required: [true, 'Validity start date is required'],
    },
    validityEndDate: {
        type: Date,
        required: [true, 'Validity end date is required'],
        validate: {
            // End date must be later than the start date.
            validator: function (value)
            {
                return value > this.validityStartDate;
            },
            message: 'Validity end date must be scheduled after the validity start date'
        }
    },
    minimumOrderValue: {
        type: Number,
        required: [true, 'Minimum order value is required to apply the coupon'],
        min: [0, 'Minimum order value cannot be negative'],
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    usedByUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Stores users who have used this coupon.
    }],
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Indexes to improve query performance.
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, validityStartDate: 1, validityEndDate: 1 });

export const Coupon = mongoose.model('Coupon', CouponSchema);
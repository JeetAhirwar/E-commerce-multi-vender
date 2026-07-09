import mongoose from 'mongoose';

/**
 * Deal schema for storing homepage deals and promotional offers.
 */
const DealSchema = new mongoose.Schema({
    discount: {
        type: Number,
        required: [true, 'Deal promotional discount percentage is required'],
        min: [0, 'Promotional discount cannot be less than 0%'],
        max: [100, 'Promotional discount cannot exceed 100%'],
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HomeCategory', // Reference to the homepage category.
        required: [true, 'Deal campaign must link to a valid HomeCategory panel'],
    },
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Index to improve query performance.
DealSchema.index({ category: 1 });

export const Deal = mongoose.model('Deal', DealSchema);
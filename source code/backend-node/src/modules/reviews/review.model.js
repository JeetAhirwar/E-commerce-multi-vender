import mongoose from 'mongoose';

/**
 * Review schema for storing customer reviews and ratings.
 */
const ReviewSchema = new mongoose.Schema({
    reviewText: {
        type: String,
        required: [true, 'Review feedback description text is required'],
        trim: true,
    },
    rating: {
        type: Number,
        required: [true, 'Rating star score is required'],
        min: [1, 'Product rating cannot be less than 1 star'],
        max: [5, 'Product rating cannot exceed 5 stars'],
    },
    productImages: [{
        type: String, // Stores review image URLs.
    }],
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Review feedback must connect to a valid catalog product'],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review feedback must connect to a valid active customer user'],
    },
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Indexes to improve query performance.
ReviewSchema.index({ product: 1, createdAt: -1 }); // For loading product reviews.
ReviewSchema.index({ user: 1, product: 1 }); // For finding a user's review on a product.

export const Review = mongoose.model('Review', ReviewSchema);
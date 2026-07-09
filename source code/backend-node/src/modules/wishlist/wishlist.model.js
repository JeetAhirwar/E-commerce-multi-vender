import mongoose from 'mongoose';

/**
 * Wishlist schema for storing a user's favorite products.
 */
const WishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Wishlist must connect to a valid active customer user'],
        unique: true, // Each user can have only one wishlist.
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // References the saved products.
        required: [true, 'Saved items products references list is required'],
    }],
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Index to improve query performance.
WishlistSchema.index({ user: 1 });

export const Wishlist = mongoose.model('Wishlist', WishlistSchema);
import mongoose from 'mongoose';

/**
 * Schema for a single item in the user's shopping cart.
 */
const CartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the selected product.
        required: [true, 'Product reference is required for cart item'],
    },
    size: {
        type: String,
        required: [true, 'Selected product variant size is required'],
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Cart quantity cannot be less than 1'],
        default: 1,
    },
    mrpPrice: {
        type: Number, // Total MRP for this cart item.
        required: [true, 'MRP line total is required'],
    },
    sellingPrice: {
        type: Number, // Total selling price for this cart item.
        required: [true, 'Selling price line total is required'],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Optional reference kept for compatibility.
    }
}, {
    // Each cart item gets its own unique ID.
    _id: true,
});

/**
 * Shopping cart schema for a user.
 */
const CartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Cart must belong to an active user'],
        unique: true, // One cart per user.
    },
    items: [CartItemSchema], // List of cart items.
    totalSellingPrice: {
        type: Number,
        default: 0,
    },
    totalItem: {
        type: Number,
        default: 0, // Total quantity of all items.
    },
    totalMrpPrice: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0, // Overall discount percentage.
    },
    couponCode: {
        type: String,
        default: null,
    },
    couponPrice: {
        type: Number,
        default: 0,
    }
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Indexes to improve query performance.
// CartSchema.index({ user: 1 });
CartSchema.index({ 'items.product': 1 }); // Helps search cart items by product.

export const Cart = mongoose.model('Cart', CartSchema);
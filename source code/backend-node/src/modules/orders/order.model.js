import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../constants/enums.js';

/**
 * Snapshot of a product at the time the order is placed.
 * This keeps the original order details even if the product changes later.
 */
const OrderItemSnapshotSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the original product.
        required: [true, 'Product reference in ordered snapshot is required'],
    },
    title: {
        type: String,
        required: [true, 'Product title snapshot is required'],
        trim: true,
    },
    size: {
        type: String,
        required: [true, 'Ordered size snapshot is required'],
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Ordered quantity is required'],
        min: [1, 'Quantity cannot be less than 1'],
    },
    mrpPrice: {
        type: Number, // MRP at the time of purchase.
        required: [true, 'Ordered MRP total snapshot is required'],
    },
    sellingPrice: {
        type: Number, // Selling price at the time of purchase.
        required: [true, 'Ordered selling price snapshot is required'],
    },
}, { _id: false });

/**
 * Snapshot of the shipping address used for this order.
 * Changes to the user's address won't affect past orders.
 */
const ShippingAddressSnapshotSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    streetAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },
}, { _id: false });

/**
 * Order schema for storing customer orders.
 */
const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: [true, 'Human-readable business orderId is required'],
        unique: true, // Ensures every order ID is unique.
        trim: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Order must connect to an active purchasing customer'],
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: [true, 'Order must connect to an active merchant vendor'],
    },
    orderItems: [OrderItemSnapshotSchema], // List of ordered products.
    shippingAddress: {
        type: ShippingAddressSnapshotSchema,
        required: [true, 'Logistics delivery destination snapshots are required'],
    },
    totalMrpPrice: {
        type: Number,
        required: [true, 'Aggregated invoice MRP is required'],
        min: 0,
    },
    totalSellingPrice: {
        type: Number,
        required: [true, 'Aggregated invoice Selling Price is required'],
        min: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    orderStatus: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.PENDING,
    },
    totalItem: {
        type: Number,
        required: [true, 'Invoice total articles count is required'],
        min: 1,
    },
    paymentStatus: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
    },
    orderDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    deliverDate: {
        type: Date,
        required: true,
    },
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

/**
 * Set the expected delivery date if it is not provided.
 */
OrderSchema.pre('validate', function (next)
{
    if (!this.deliverDate && this.orderDate)
    {
        const computedDelivery = new Date(this.orderDate);
        computedDelivery.setDate(computedDelivery.getDate() + 7); // Default delivery is 7 days after the order date.
        this.deliverDate = computedDelivery;
    }
    next();
});

// Indexes to improve query performance.
OrderSchema.index({ user: 1, orderDate: -1 });
OrderSchema.index({ seller: 1, orderDate: -1 });
OrderSchema.index({ seller: 1, orderDate: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });

export const Order = mongoose.model('Order', OrderSchema);
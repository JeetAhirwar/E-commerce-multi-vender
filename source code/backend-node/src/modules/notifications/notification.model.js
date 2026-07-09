import mongoose from 'mongoose';

/**
 * Notification schema for storing user notifications.
 */
const NotificationSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the notification recipient.
        required: [true, 'Notification alert must connect to a valid recipient customer'],
    },
    message: {
        type: String,
        required: [true, 'Notification alert message content is required'],
        trim: true,
    },
    readStatus: {
        type: Boolean,
        default: false, // New notifications are unread by default.
        required: true,
    },
    sentAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Indexes to improve query performance.
NotificationSchema.index({ customer: 1, sentAt: -1 }); // For loading recent notifications.
NotificationSchema.index({ customer: 1, readStatus: 1 }); // For finding unread notifications.

export const Notification = mongoose.model('Notification', NotificationSchema);
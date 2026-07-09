import mongoose from 'mongoose';

/**
 * Category schema for organizing products.
 * Supports up to 3 levels of nested categories.
 */
const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category display name is required'],
        trim: true,
    },
    categoryId: {
        type: String,
        required: [true, 'URL-friendly unique business categoryId is required'],
        unique: true, // Ensures every category has a unique identifier.
        lowercase: true,
        trim: true,
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // References another category as its parent.
        default: null, // Top-level categories do not have a parent.
    },
    level: {
        type: Number,
        required: [true, 'Hierarchy structural level is required'],
        min: [1, 'Structural level cannot be less than 1'],
        max: [3, 'Structural level hierarchy cannot exceed 3'],
    },
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Indexes to improve query performance.
CategorySchema.index({ categoryId: 1 });
CategorySchema.index({ level: 1 });
CategorySchema.index({ parentCategory: 1 });

export const Category = mongoose.model('Category', CategorySchema);
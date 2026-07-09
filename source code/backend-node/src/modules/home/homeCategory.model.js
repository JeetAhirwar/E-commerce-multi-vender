import mongoose from 'mongoose';

// Available homepage sections
const HOME_PAGE_SECTIONS = Object.freeze([
    'ELECTRIC_CATEGORIES',
    'GRID',
    'SHOP_BY_CATEGORIES',
    'DEALS'
]);

/**
 * Home category schema for managing homepage sections and banners.
 */
const HomeCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Homepage item display name is required'],
        trim: true,
    },
    image: {
        type: String, // Stores the banner or category image URL.
        required: [true, 'Homepage promotional visual image URL is required'],
        trim: true,
    },
    categoryId: {
        type: String, // Links this item to a product category.
        required: [true, 'Target landing business categoryId path is required'],
        trim: true,
    },
    section: {
        type: String,
        required: [true, 'Homepage container panel section classification is required'],
        enum: {
            values: HOME_PAGE_SECTIONS,
            message: '{VALUE} is not a valid e-commerce home-page panel layout section'
        },
        trim: true,
    },
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

// Indexes to improve query performance.
HomeCategorySchema.index({ section: 1 });
HomeCategorySchema.index({ categoryId: 1 });

export const HomeCategory = mongoose.model('HomeCategory', HomeCategorySchema);
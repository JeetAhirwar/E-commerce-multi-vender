import mongoose from 'mongoose';

/**
 * Product schema for storing product details.
 */
const ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Product title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
    },
    mrpPrice: {
        type: Number,
        required: [true, 'MRP original price is required'],
        min: [0, 'MRP price cannot be negative'],
    },
    sellingPrice: {
        type: Number,
        required: [true, 'Real Selling price is required'],
        min: [0, 'Selling price cannot be negative'],
        validate: {
            // Selling price should not be greater than the MRP.
            validator: function (value)
            {
                return value <= this.mrpPrice;
            },
            message: 'Selling price ({VALUE}) cannot exceed the defined MRP price'
        }
    },
    discountPercent: {
        type: Number,
        default: 0,
    },
    quantity: {
        type: Number,
        required: [true, 'Available stock inventory quantity is required'],
        min: [0, 'Available stock quantity cannot be negative'],
        default: 0,
    },
    color: {
        type: String,
        trim: true,
    },
    images: [{
        type: String, // Stores product image URLs.
        required: [true, 'At least one product catalog image is required'],
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Reference to the product category.
        required: [true, 'Leaf product category hierarchy mapping is required'],
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller', // Reference to the seller.
        required: [true, 'Vendor ownership reference is required'],
    },
    sizes: {
        type: String, // Example: "S,M,L,XL"
        trim: true,
    },
    brand: {
        type: String,
        trim: true,
    },
}, {
    // Automatically adds createdAt and updatedAt fields.
    timestamps: true,
});

/**
 * Calculate the discount percentage before validation.
 */
ProductSchema.pre('validate', function (next)
{
    if (this.mrpPrice && this.sellingPrice)
    {
        const calculatedDiscount = ((this.mrpPrice - this.sellingPrice) / this.mrpPrice) * 100;
        this.discountPercent = Math.round(calculatedDiscount);
    }
    next();
});

// Indexes to improve query performance.
ProductSchema.index({ category: 1 });
ProductSchema.index({ seller: 1, createdAt: -1 });
ProductSchema.index({ color: 1 });
ProductSchema.index({ sellingPrice: 1 });
ProductSchema.index({ discountPercent: 1 });

// Full-text search index for product title and description.
ProductSchema.index(
    { title: 'text', description: 'text' },
    { weights: { title: 10, description: 3 }, name: 'ProductTextSearchIndex' }
);

export const Product = mongoose.model('Product', ProductSchema);
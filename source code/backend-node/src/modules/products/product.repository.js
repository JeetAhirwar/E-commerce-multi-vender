/**
 * Pure function-based factory representing the Product Persistence Database Repository layer.
 * Implements loose-coupling and advanced dynamic Query Building algorithms.
 */
export const createProductRepository = ({ Product }) =>
{

    /**
     * Commits a new catalog product directly into the database.
     */
    const create = async (productData, options = {}) =>
    {
        const [newProduct] = await Product.create([productData], options);
        return newProduct ? newProduct.toObject() : null;
    };

    /**
     * Discovers a catalog item by its unique database ObjectId.
     * Populates associated third-party references (Seller & Category profiles) cleanly.
     */
    const findById = async (id, options = {}) =>
    {
        return Product.findById(id, null, options)
            .populate('category') // Dynamically populates Level 3 category properties
            .populate({
                path: 'seller',
                select: 'sellerName email mobile businessDetails.businessName pickupAddress' // Hides sensitive bank fields from product page lookups
            })
            .lean();
    };

    /**
     * Modifies an existing product document. Returns the newly updated state.
     */
    const update = async (id, updateData, options = {}) =>
    {
        return Product.findByIdAndUpdate(
            id,
            { $set: updateData }, // Safe update properties patch operators
            { ...options, new: true, runValidators: true } // Enforces Mongoose validations on update entries
        ).lean();
    };

    /**
     * Erases a catalog item record permanently from collection registries.
     */
    const deleteProduct = async (id, options = {}) =>
    {
        return Product.findByIdAndDelete(id, options).lean();
    };

    /**
     * Pulls vendor-specific store listings chronologically descending (newest first).
     */
    const findBySellerId = async (sellerId, options = {}) =>
    {
        return Product.find({ seller: sellerId }, null, options)
            .sort({ createdAt: -1 })
            .populate('category')
            .lean();
    };

    /**
     * Full-Text Keyword Search Engine.
     * Leverages MongoDB native $text index matching with text score relevance rankings.
     */
    const searchProducts = async ({ searchQuery }) =>
    {
        return Product.find(
            { $text: { $search: searchQuery } },
            { score: { $meta: 'textScore' } } // Attaches relevant query matches metrics scores
        )
            .sort({ score: { $meta: 'textScore' } }) // Priority order matching highest search density
            .populate('category')
            .lean();
    };

    /**
     * Advanced Dynamic Catalog Queries Filter & Spring-Boot Compatible Pagination Builder.
     * Compiles custom filters ranges on top of single database cursors scans.
     */
    const getAllProducts = async ({
        category = null,
        brand = null,
        color = null,
        size = null,
        minPrice = 0,
        maxPrice = Number.MAX_SAFE_INTEGER,
        minDiscount = 0,
        sort = 'newest',
        pageNumber = 0,
        sizeLimit = 10
    }) =>
    {

        // 1. Instantiate Mongoose querying filter criteria object
        const filterQuery = {};

        // A. Categories constraints resolution
        if (category)
        {
            filterQuery.category = category; // Leaf Category ObjectId matching
        }

        // B. Alphanumeric filters mapping (Supports loose case-insensitive matching)
        if (brand)
        {
            filterQuery.brand = { $regex: brand.trim(), $options: 'i' };
        }
        if (color)
        {
            filterQuery.color = { $regex: color.trim(), $options: 'i' };
        }
        if (size)
        {
            filterQuery.sizes = { $regex: size.trim(), $options: 'i' };
        }

        // C. Mathematical Ranges validations filters (Prices & Discounts caps)
        filterQuery.sellingPrice = {
            $gte: parseFloat(minPrice),
            $lte: parseFloat(maxPrice)
        };

        if (minDiscount > 0)
        {
            filterQuery.discountPercent = { $gte: parseInt(minDiscount, 10) };
        }

        // 2. Map sorting parameters properties to MongoDB operators
        let sortCriteria = { createdAt: -1 }; // Default: Newest first

        if (sort === 'price_low')
        {
            sortCriteria = { sellingPrice: 1 };
        } else if (sort === 'price_high')
        {
            sortCriteria = { sellingPrice: -1 };
        } else if (sort === 'discount')
        {
            sortCriteria = { discountPercent: -1 };
        } else if (sort === 'newest')
        {
            sortCriteria = { createdAt: -1 };
        }

        // 3. Mathematical Pagination offsets conversions
        const skipOffset = Math.max(0, parseInt(pageNumber, 10)) * parseInt(sizeLimit, 10);
        const limitConstraint = Math.max(1, parseInt(sizeLimit, 10));

        // 4. Concurrent Database Pipelines executions (Saves server latency)
        const [content, totalElements] = await Promise.all([
            // Pipeline A: Extract paginated items cursors
            Product.find(filterQuery)
                .sort(sortCriteria)
                .skip(skipOffset)
                .limit(limitConstraint)
                .populate('category')
                .lean(),

            // Pipeline B: Aggregate total elements counts matching filter criteria
            Product.countDocuments(filterQuery)
        ]);

        // Calculate total pages volume based on element count and sizes allocation
        const totalPages = Math.ceil(totalElements / limitConstraint);

        // 5. Package output exactly matching Spring-compatible payloads format expected by React Frontend
        return {
            content,
            totalPages,
            totalElements,
            pageNumber: parseInt(pageNumber, 10),
        };
    };

    return Object.freeze({
        create,
        findById,
        update,
        delete: deleteProduct,
        findBySellerId,
        searchProducts,
        getAllProducts,
    });
};
/**
 * Pure function-based factory representing the Shopping Cart Business Service.
 * Implements loose-coupling and strictly coordinates secure server-side pricing recalculations.
 */
export const createCartService = ({
    cartRepository,
    productRepository,
    createApiError
}) =>
{

    /**
     * Core Mathematical Recalculation Engine.
     * Recalculates all embedded items line-totals using fresh populated database prices.
     * Never trusts client-side prices to eliminate price tampering vulnerabilities.
     */
    const computeCartTotals = (items, couponPrice = 0) =>
    {
        let totalItem = 0;
        let totalMrpPrice = 0;
        let totalSellingPrice = 0;

        // Iterates item components to calculate lines totals
        for (const item of items)
        {
            // Direct validation check: Ensure product reference is successfully populated
            const unitMrp = item.product ? item.product.mrpPrice : (item.mrpPrice / item.quantity);
            const unitSelling = item.product ? item.product.sellingPrice : (item.sellingPrice / item.quantity);

            // Recalculates standard line totals
            item.mrpPrice = unitMrp * item.quantity;
            item.sellingPrice = unitSelling * item.quantity;

            // Accumulates core shopping summaries
            totalItem += item.quantity;
            totalMrpPrice += item.mrpPrice;
            totalSellingPrice += item.sellingPrice;
        }

        // Apply Coupon deductions securely if applicable
        const finalSellingPrice = Math.max(0, totalSellingPrice - couponPrice);
        const discountPercent = totalMrpPrice > 0
            ? Math.round(((totalMrpPrice - finalSellingPrice) / totalMrpPrice) * 100)
            : 0;

        return {
            items,
            totalItem,
            totalMrpPrice,
            totalSellingPrice: finalSellingPrice,
            discount: discountPercent,
        };
    };

    /**
     * Retrieves and automatically recalculates customer's shopping cart values.
     */
    const findUserCart = async ({ userId }) =>
    {
        const cart = await cartRepository.findByUserId({ userId });
        if (!cart)
        {
            throw createApiError({
                statusCode: 404,
                code: 'CART_NOT_FOUND',
                message: 'Active shopping cart session not found for this profile.'
            });
        }

        // Cascade Recalculations: Secures active totals before displaying cards to user
        const recalculatedData = computeCartTotals(cart.items, cart.couponPrice);

        // Commits calculated states into database cleanly
        return cartRepository.updateCart({ userId, cartData: recalculatedData });
    };

    /**
     * Adds an item to the customer's cart. 
     * If identical product & size exists, returns the duplicate item as per business specifications.
     */
    const addCartItem = async ({ userId, productId, size, quantity }) =>
    {
        const cart = await cartRepository.findByUserId({ userId });
        if (!cart)
        {
            throw createApiError({
                statusCode: 404,
                code: 'CART_NOT_FOUND',
                message: 'Cart session not initialized.'
            });
        }

        // 1. Check if identical product and size is already present in shopping array
        const existingDuplicate = cart.items.find(
            (item) => item.product._id.toString() === productId.toString() && item.size === size
        );

        // Business specification alignment: Return existing item immediately if duplicate is located
        if (existingDuplicate)
        {
            return existingDuplicate;
        }

        // 2. Load fresh catalog item details directly from database to retrieve secure standard prices
        const product = await productRepository.findById(productId);
        if (!product)
        {
            throw createApiError({
                statusCode: 404,
                code: 'PRODUCT_NOT_FOUND',
                message: 'Add to Cart failed. The requested product listing does not exist.'
            });
        }

        // 3. Assemble and push new item snapshot into list
        const newItemLine = {
            product: product._id,
            size,
            quantity,
            mrpPrice: product.mrpPrice * quantity,
            sellingPrice: product.sellingPrice * quantity,
            userId,
        };

        const updatedItemsCollection = [...cart.items, newItemLine];

        // 4. Trigger calculations engine with newly updated lists
        const recalculatedData = computeCartTotals(updatedItemsCollection, cart.couponPrice);

        // 5. Commit state updates to database
        const finalCart = await cartRepository.updateCart({ userId, cartData: recalculatedData });

        // Returns newly appended item snapshot
        return finalCart.items.find(
            (item) => item.product._id.toString() === productId.toString() && item.size === size
        );
    };

    /**
     * Modifies quantities of an existing embedded item inside cart.
     */
    const updateCartItem = async ({ userId, cartItemId, quantity }) =>
    {
        const cart = await cartRepository.findByUserId({ userId });
        if (!cart)
        {
            throw createApiError({
                statusCode: 404,
                code: 'CART_NOT_FOUND',
                message: 'Cart session is missing.'
            });
        }

        // 1. Locate specific target item inside embedded subdocument arrays
        const targetItem = cart.items.find((item) => item._id.toString() === cartItemId.toString());
        if (!targetItem)
        {
            throw createApiError({
                statusCode: 404,
                code: 'CART_ITEM_NOT_FOUND',
                message: 'Cart modification failed. The targeted item was not found inside your cart.'
            });
        }

        // 2. Overwrite quantity parameters
        targetItem.quantity = Math.max(1, parseInt(quantity, 10)); // Protect boundary bounds (quantity cannot be less than 1)

        // 3. Trigger recalculations stream and commit to database
        const recalculatedData = computeCartTotals(cart.items, cart.couponPrice);
        const finalCart = await cartRepository.updateCart({ userId, cartData: recalculatedData });

        return finalCart.items.find((item) => item._id.toString() === cartItemId.toString());
    };

    /**
     * Removes an item from the customer's cart.
     */
    const removeCartItem = async ({ userId, cartItemId }) =>
    {
        const cart = await cartRepository.findByUserId({ userId });
        if (!cart)
        {
            throw createApiError({
                statusCode: 404,
                code: 'CART_NOT_FOUND',
                message: 'Cart session is missing.'
            });
        }

        // 1. Check if item exists in arrays
        const itemExists = cart.items.some((item) => item._id.toString() === cartItemId.toString());
        if (!itemExists)
        {
            throw createApiError({
                statusCode: 404,
                code: 'CART_ITEM_NOT_FOUND',
                message: 'Item deletion failed. The targeted item does not exist in your cart.'
            });
        }

        // 2. Filter out targeted subdocument item cleanly
        const filteredItemsCollection = cart.items.filter(
            (item) => item._id.toString() !== cartItemId.toString()
        );

        // 3. Re-evaluate sums of residue lists
        const recalculatedData = computeCartTotals(filteredItemsCollection, cart.couponPrice);
        await cartRepository.updateCart({ userId, cartData: recalculatedData });

        return { success: true, message: 'Item successfully removed from cart.' };
    };

    return Object.freeze({
        findUserCart,
        addCartItem,
        updateCartItem,
        removeCartItem,
    });
};
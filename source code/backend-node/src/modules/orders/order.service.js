import crypto from 'crypto';
import mongoose from 'mongoose';

/**
 * Pure function-based factory representing the Sales Order Business Service layer.
 * Coordinates multi-vendor split checkouts and manages chronological order lifecycle workflows.
 */
export const createOrderService = ({
    orderRepository,
    cartRepository,
    userRepository,
    sellerReportRepository,
    createApiError,
}) =>
{

    /**
     * Internal generator. Compiles unique, human-readable e-commerce order IDs.
     * Example: 'ORD_93FA2C10'
     */
    const generateBusinessOrderId = () =>
    {
        const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `ORD_${randomHex}`;
    };

    /**
     * Split Checkout Engine.
     * Groups cart items by merchant seller, snapshots pricing/shipping details,
     * and registers child split orders atomically.
     */
    const createOrdersFromCart = async ({ userId, shippingAddress, paymentMethod }, sessionOptions = {}) =>
    {

        // 1. Retrieve and verify user shopping cart
        const cart = await cartRepository.findByUserId({ userId });
        if (!cart || cart.items.length === 0)
        {
            throw createApiError({
                statusCode: 400,
                code: 'EMPTY_CART',
                message: 'Checkout rejected: Your shopping cart is empty.'
            });
        }

        // 2. Multi-Vendor Split Algorithm: Group cart items by their associated seller ID
        const groupedBySeller = {};
        cart.items.forEach((item) =>
        {
            if (!item.product || !item.product.seller)
            {
                throw createApiError({
                    statusCode: 400,
                    code: 'PRODUCT_DATA_INCOMPLETE',
                    message: `Checkout failed: Incomplete metadata found on product catalog item '${item.product ? item.product.title : 'Unknown'}'.`
                });
            }

            const sellerIdStr = item.product.seller.toString();
            if (!groupedBySeller[sellerIdStr])
            {
                groupedBySeller[sellerIdStr] = [];
            }
            groupedBySeller[sellerIdStr].push(item);
        });

        const splitOrdersList = [];

        // 3. Process and persist individual split orders inside transaction
        for (const sellerIdStr of Object.keys(groupedBySeller))
        {
            const sellerItems = groupedBySeller[sellerIdStr];

            let totalMrpPrice = 0;
            let totalSellingPrice = 0;
            let totalItem = 0;

            // Copy cart items into immutable ordered snapshot objects
            const orderItemsSnapshots = sellerItems.map((item) =>
            {
                const lineMrp = item.product.mrpPrice * item.quantity;
                const lineSelling = item.product.sellingPrice * item.quantity;

                totalMrpPrice += lineMrp;
                totalSellingPrice += lineSelling;
                totalItem += item.quantity;

                return {
                    product: item.product._id,
                    title: item.product.title,
                    size: item.size,
                    quantity: item.quantity,
                    mrpPrice: lineMrp,
                    sellingPrice: lineSelling,
                };
            });

            // Assemble split order document linking specific merchant seller and customer shipping address snapshots
            const orderPayload = {
                orderId: generateBusinessOrderId(),
                user: userId,
                seller: new mongoose.Types.ObjectId(sellerIdStr),
                orderItems: orderItemsSnapshots,
                shippingAddress,
                totalMrpPrice,
                totalSellingPrice,
                discount: totalMrpPrice - totalSellingPrice,
                totalItem,
                orderStatus: 'PENDING',
                paymentStatus: 'PENDING',
            };

            const savedOrder = await orderRepository.createOrder(orderPayload, sessionOptions);
            splitOrdersList.push(savedOrder);
        }

        const totalPayableSellingPrice = splitOrdersList.reduce((sum, o) => sum + o.totalSellingPrice, 0);
        const finalAmountAfterCoupons = Math.max(0, totalPayableSellingPrice - cart.couponPrice);

        return {
            splitOrders: splitOrdersList,
            finalPayableAmount: finalAmountAfterCoupons,
        };
    };

    /**
     * Retrieves purchase history of a customer.
     */
    const getUserOrders = async ({ userId }) =>
    {
        return orderRepository.findByUser({ userId });
    };

    /**
     * Retrieves store orders panel for a merchant seller.
     */
    const getSellerOrders = async ({ sellerId }) =>
    {
        return orderRepository.findBySeller({ sellerId });
    };

    /**
     * Retrieves single order details, enforcing access controls for actors.
     */
    const getOrderById = async ({ orderId, actorId, actorRole }) =>
    {
        const order = await orderRepository.findById(orderId);
        if (!order)
        {
            throw createApiError({
                statusCode: 404,
                code: 'ORDER_NOT_FOUND',
                message: 'The requested sales order was not found.'
            });
        }

        const isCustomerOwner = actorRole === 'ROLE_CUSTOMER' && order.user._id.toString() === actorId.toString();
        const isSellerOwner = actorRole === 'ROLE_SELLER' && order.seller._id.toString() === actorId.toString();
        const isAdmin = actorRole === 'ROLE_ADMIN';

        if (!isCustomerOwner && !isSellerOwner && !isAdmin)
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCESS_FORBIDDEN',
                message: 'Access Denied: You do not possess authorizations to view this sales order.'
            });
        }

        return order;
    };

    /**
     * Executes order cancellations.
     */
    const cancelOrder = async ({ orderId, userId }) =>
    {
        let cancelledOrder = null;

        const session = await mongoose.startSession();

        try
        {
            await session.withTransaction(async () =>
            {
                const order = await orderRepository.findById(orderId, { session });
                if (!order)
                {
                    throw createApiError({
                        statusCode: 404,
                        code: 'ORDER_NOT_FOUND',
                        message: 'Cancellation failed. Targeted order does not exist.'
                    });
                }

                if (order.user._id.toString() !== userId.toString())
                {
                    throw createApiError({
                        statusCode: 403,
                        code: 'ACCESS_FORBIDDEN',
                        message: 'Cancellation rejected: You can only cancel orders belonging to your own account.'
                    });
                }

                if (order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED')
                {
                    throw createApiError({
                        statusCode: 400,
                        code: 'INVALID_ORDER_STATE_FOR_CANCELLATION',
                        message: `Cancellation rejected: Orders currently marked as ${order.orderStatus} cannot be cancelled.`
                    });
                }

                cancelledOrder = await orderRepository.updateStatus({
                    orderId,
                    orderStatus: 'CANCELLED',
                }, { session });

                await sellerReportRepository.applyCancellation({
                    sellerId: order.seller._id,
                    refund: order.totalSellingPrice,
                }, { session });
            });
        } finally
        {
            await session.endSession();
        }

        return cancelledOrder;
    };

    /**
     * Merchant Order Status Updater.
     */
    const updateOrderStatus = async ({ orderId, orderStatus, sellerId }) =>
    {
        const order = await orderRepository.findById(orderId);
        if (!order)
        {
            throw createApiError({
                statusCode: 404,
                code: 'ORDER_NOT_FOUND',
                message: 'Status update failed. Targeted sales order does not exist.'
            });
        }

        const isOwner = order.seller._id.toString() === sellerId.toString();
        if (!isOwner)
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCESS_FORBIDDEN',
                message: 'Access Denied: You cannot modify the status of another vendor’s sales order.'
            });
        }

        return orderRepository.updateStatus({ orderId, orderStatus });
    };

    /**
     * Merchant Order Deletion (Erase command).
     */
    const deleteOrder = async ({ orderId, sellerId }) =>
    {
        const order = await orderRepository.findById(orderId);
        if (!order)
        {
            throw createApiError({
                statusCode: 404,
                code: 'ORDER_NOT_FOUND',
                message: 'Deletion failed. Targeted order does not exist.'
            });
        }

        const isOwner = order.seller._id.toString() === sellerId.toString();
        if (!isOwner)
        {
            throw createApiError({
                statusCode: 403,
                code: 'ACCESS_FORBIDDEN',
                message: 'Access Denied: Deletion rejected. You can only remove orders belonging to your own store.'
            });
        }

        await orderRepository.updateStatus({ orderId, orderStatus: 'CANCELLED' });

        return { success: true, message: 'Sales order successfully removed.' };
    };

    /**
     * Order Item Snapshot lookups.
     * Resolves specific single item details directly using repository positional operator query.
     */
    const getOrderItemById = async ({ orderItemId }) =>
    {
        const itemSnapshot = await orderRepository.findOrderItemById(orderItemId);
        if (!itemSnapshot)
        {
            throw createApiError({
                statusCode: 404,
                code: 'ORDER_ITEM_NOT_FOUND',
                message: 'The requested ordered product snapshot was not found.'
            });
        }
        return itemSnapshot;
    };

    return Object.freeze({
        createOrdersFromCart,
        getUserOrders,
        getSellerOrders,
        getOrderById,
        cancelOrder,
        updateOrderStatus,
        deleteOrder,
        getOrderItemById, // Added positional ordered item lookup service
    });
};
/**
 * Pure function-based factory representing the AI Chatbot Business Service layer.
 * Coordinates Gemini API handshakes and implements a context-aware local mock engine.
 */
export const createAiService = ({
    cartRepository,
    productRepository,
    orderRepository,
    createApiError,
}) =>
{

    /**
     * High-Intelligence Local Mock AI Processor.
     * Parses prompts and leverages injected repository data to generate context-aware solutions.
     * Enables seamless local development/testing without any external API keys or network dependencies.
     */
    const processMockResponse = async ({ prompt, productId, userId }) =>
    {
        const query = prompt.toLowerCase().trim();

        // Context-Aware Trigger A: Customer requests Shopping Cart insight
        if (query.includes('cart') || query.includes('basket') || query.includes('bag'))
        {
            if (!userId)
            {
                return 'Please log in to your account first so I can retrieve and review your active shopping cart details.';
            }

            const cart = await cartRepository.findByUserId({ userId });
            if (!cart || cart.items.length === 0)
            {
                return 'I reviewed your active profile and noticed your shopping cart is currently empty. Would you like some product recommendations from our latest catalog?';
            }

            // Format custom plain text analytical breakdown of the user's cart
            const cartSummaryList = cart.items.map(
                (item) => `- ${item.product ? item.product.title : 'Product'} (Size: ${item.size} | Qty: ${item.quantity} | Price: Rs. ${item.sellingPrice})`
            ).join('\n');

            return `I accessed your shopping cart session securely! Here is the list of items currently saved in your basket:\n\n${cartSummaryList}\n\n**Subtotal Selling Price**: Rs. ${cart.totalSellingPrice}\n**Total Articles**: ${cart.totalItem} items\n\nWould you like me to apply a promotional coupon or help you proceed directly to our secure checkout portal?`;
        }

        // Context-Aware Trigger B: Customer requests Catalog Product details
        if (productId || query.includes('product') || query.includes('detail') || query.includes('item'))
        {
            const targetProductId = productId || '65c1a167098e987bca8a6a44'; // Fallback mockup key

            try
            {
                const product = await productRepository.findById(targetProductId);
                if (product)
                {
                    return `I pulled the catalog specifications for **${product.title}** directly from our database:\n\n- **Selling Price**: Rs. ${product.sellingPrice} (Original MRP: Rs. ${product.mrpPrice})\n- **Discounts Offered**: ${product.discountPercent}% Off\n- **In-Stock Quantity**: ${product.quantity} units available\n- **Color Variant**: ${product.color}\n- **Sizes Available**: ${product.sizes}\n- **Merchant Store**: ${product.seller ? product.seller.sellerName : 'Jeet Ahirwar Hub'}\n\nWould you like me to automatically add this verified catalog item directly into your shopping cart?`;
                }
            } catch (err)
            {
                // Fallback gracefully on parsing glitches
            }
        }

        // Context-Aware Trigger C: Customer requests purchases history
        if (query.includes('order') || query.includes('purchase') || query.includes('track'))
        {
            if (!userId)
            {
                return 'Authorization needed: Please authenticate into your account to securely track your sales orders history.';
            }

            const orders = await orderRepository.findByUser({ userId });
            if (!orders || orders.length === 0)
            {
                return 'I checked your accounting history logs and found zero active orders registered under your profile. Start shopping and I will help you track them!';
            }

            const orderSummaryList = orders.slice(0, 3).map(
                (o) => `- **ID**: ${o.orderId} | Date: ${new Date(o.orderDate).toLocaleDateString()} | Total: Rs. ${o.totalSellingPrice} | Status: ${o.orderStatus} (Payment: ${o.paymentStatus})`
            ).join('\n');

            return `I accessed your secure ledger accounts! Here are details of your most recent transactions (showing top 3 orders):\n\n${orderSummaryList}\n\nHow can I assist you further with shipping tracking or cancellations?`;
        }

        // Fallback Scenario: Standard friendly chatbot replies
        return `Hello! I am your **Jeet Ahirwar Marketplace AI Assistant** chatbot.\n\nI can dynamically fetch your real-time data directly from our databases securely. Ask me questions like:\n- *"What is in my cart?"*\n- *"Show my recent orders history"* \n- *"Tell me about the product detail"* \n\nHow can I assist you with your shopping experience today?`;
    };

    /**
     * Main Generative Assistant entry-point.
     * Coordinates handshakes with Google Gemini API, falling back to local mocks if API key is missing.
     */
    const getChatBotResponse = async ({ prompt, productId = null, userId = null }) =>
    {
        const geminiKey = process.env.GEMINI_API_KEY;

        // Checks key presence to toggle between real integrations or native high-velocity mock modes
        const isMockMode = !geminiKey || geminiKey.includes('MOCK') || process.env.NODE_ENV === 'test';

        if (isMockMode)
        {
            // Runs local mock engine parsing dynamic repository contexts
            return {
                response: await processMockResponse({ prompt, productId, userId }),
                mockMode: true,
            };
        }

        // Real Gemini REST handshaking triggers if API key is present
        try
        {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${prompt} (Current context metadata: UserID is ${userId}, ProductID is ${productId}). Answer as the friendly, helpful Jeet Ahirwar Marketplace AI Assistant.` }] }]
                })
            });

            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I am currently processing your request. Please try again.';

            return {
                response: generatedText,
                mockMode: false,
            };
        } catch (error)
        {
            console.error('[GEMINI API HANDSHAKE EXCEPTION] Falling back to local mock.', error.message);
            return {
                response: await processMockResponse({ prompt, productId, userId }),
                mockMode: true,
            };
        }
    };

    return Object.freeze({
        getChatBotResponse,
    });
};
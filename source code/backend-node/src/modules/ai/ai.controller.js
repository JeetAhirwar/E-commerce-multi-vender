/**
 * Pure function-based factory representing the AI Chatbot HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createAiController = ({ aiService }) =>
{

    /**
     * Main Conversational AI Chatbot endpoint.
     * Leverages optional user credentials context to generate highly relevant answers.
     * Maps exactly to: POST /ai/chat
     */
    const chat = async (req, res) =>
    {
        // Reads optional user credentials ID safely (Might be null if guest accesses chatbot)
        const userId = req.user ? req.user.id : null;

        // Destructures core prompt inputs and optional catalog targets
        const { prompt, productId } = req.body;

        const outcome = await aiService.getChatBotResponse({
            prompt,
            productId: productId || null,
            userId,
        });

        // 200 OK: Standard expected response payload delivery
        res.status(200).json(outcome);
    };

    /**
     * Simple Demo AI Chatbot endpoint.
     * Generates a rapid conversational response for testing and developmental evaluations.
     * Maps exactly to: POST /ai/chat/demo?message=... (Optional Public/dev)
     */
    const chatDemo = async (req, res) =>
    {
        // Reads dynamic user query from query parameters or body fallback
        const message = req.query.message || req.body.message || 'Hello';

        const outcome = await aiService.getChatBotResponse({
            prompt: message,
            productId: null,
            userId: null,
        });

        // 200 OK: Returns standard ApiResponse packaging back to client
        res.status(200).json({
            response: `[DEMO ASSISTANT] ${outcome.response}`,
            mockMode: true,
        });
    };

    return Object.freeze({
        chat,
        chatDemo, // Added demo chatbot controller method
    });
};
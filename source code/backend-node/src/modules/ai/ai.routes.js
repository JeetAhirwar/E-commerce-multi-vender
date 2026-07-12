/**
 * Pure function-based routing factory representing the AI Chatbot API gateways.
 * Binds AI chat paths supporting optional authentication for guest or logged-in users.
 */
export const createAiRoutes = ({
  router,
  aiController,
  authenticate,
  asyncHandler
}) =>
{

  /**
   * Optional Authentication Wrapper.
   * If a Bearer token is supplied, it verifies the signature and attaches req.user.
   * If no token is provided, it gracefully allows the request to proceed as a guest.
   */
  const optionalAuthenticate = (req, res, next) =>
  {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
    {
      return next(); // Proceed smoothly as guest
    }
    return authenticate(req, res, next);
  };

  // ==========================================
  // ARTIFICIAL INTELLIGENCE GATEWAYS (/ai/*)
  // ==========================================

  // Public/Optional-Auth Endpoint: Context-aware conversational AI assistant chatbot
  router.post(
    '/ai/chat',
    optionalAuthenticate,
    asyncHandler(aiController.chat)
  );

  // Public/Development Endpoint: Simple demo chatbot response generator
  router.post(
    '/ai/chat/demo',
    asyncHandler(aiController.chatDemo)
  );

  return router;
};
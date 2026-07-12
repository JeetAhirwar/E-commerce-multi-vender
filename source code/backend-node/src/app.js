import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Core Utilities & Middlewares
import { createErrorHandlerMiddleware } from './middlewares/errorHandler.js';
import { createAuthenticateMiddleware } from './middlewares/authenticate.js';
import { createAuthorizeRolesMiddleware } from './middlewares/authorizeRoles.js';
import { createApiError } from './utils/apiError.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { generateOTP } from './utils/otp.js';
import { signToken, verifyToken } from './utils/jwt.js';

// Mongoose Models
import { User } from './modules/users/user.model.js';
import { Seller } from './modules/sellers/seller.model.js';
import { Cart } from './modules/cart/cart.model.js';
import { VerificationCode } from './modules/auth/verificationCode.model.js';
import { Category } from './modules/categories/category.model.js';
import { Product } from './modules/products/product.model.js';
import { Wishlist } from './modules/wishlist/wishlist.model.js';
import { Coupon } from './modules/coupons/coupon.model.js';
import { Order } from './modules/orders/order.model.js';
import { PaymentOrder } from './modules/payments/paymentOrder.model.js';
import { Transaction } from './modules/transactions/transaction.model.js';
import { SellerReport } from './modules/reports/sellerReport.model.js';
import { Review } from './modules/reviews/review.model.js';
import { Notification } from './modules/notifications/notification.model.js';
import { PasswordResetToken } from './modules/auth/passwordResetToken.model.js';
import { RefreshToken } from './modules/auth/refreshToken.model.js';
import { Deal } from './modules/deals/deal.model.js';
import { HomeCategory } from './modules/home/homeCategory.model.js';

// Persistence Repositories Factories
import { createUserRepository } from './modules/users/user.repository.js';
import { createSellerRepository } from './modules/sellers/seller.repository.js';
import { createCartRepository } from './modules/cart/cart.repository.js';
import { createVerificationCodeRepository } from './modules/auth/verificationCode.repository.js';
import { createCategoryRepository } from './modules/categories/category.repository.js';
import { createProductRepository } from './modules/products/product.repository.js';
import { createWishlistRepository } from './modules/wishlist/wishlist.repository.js';
import { createCouponRepository } from './modules/coupons/coupon.repository.js';
import { createOrderRepository } from './modules/orders/order.repository.js';
import { createPaymentOrderRepository } from './modules/payments/paymentOrder.repository.js';
import { createTransactionRepository } from './modules/transactions/transaction.repository.js';
import { createSellerReportRepository } from './modules/reports/sellerReport.repository.js';
import { createReviewRepository } from './modules/reviews/review.repository.js';
import { createNotificationRepository } from './modules/notifications/notification.repository.js';
import { createPasswordResetTokenRepository } from './modules/auth/passwordResetToken.repository.js';
import { createRefreshTokenRepository } from './modules/auth/refreshToken.repository.js';
import { createDealRepository } from './modules/deals/deal.repository.js';
import { createHomeCategoryRepository } from './modules/home/homeCategory.repository.js';

// Integration Adapters Factories
import { createEmailClient } from './integrations/email/nodemailer.client.js';

// Business Services Factories
import { createAuthService } from './modules/auth/auth.service.js';
import { createSellerAuthService } from './modules/auth/sellerAuth.service.js';
import { createCategoryService } from './modules/categories/category.service.js';
import { createProductService } from './modules/products/product.service.js';
import { createCartService } from './modules/cart/cart.service.js';
import { createWishlistService } from './modules/wishlist/wishlist.service.js';
import { createCouponService } from './modules/coupons/coupon.service.js';
import { createOrderService } from './modules/orders/order.service.js';
import { createPaymentService } from './modules/payments/payment.service.js';
import { createRevenueService } from './modules/reports/revenue.service.js';
import { createSellerService } from './modules/sellers/seller.service.js';
import { createReviewService } from './modules/reviews/review.service.js';
import { createNotificationService } from './modules/notifications/notification.service.js';
import { createAiService } from './modules/ai/ai.service.js';
import { createDealService } from './modules/deals/deal.service.js';
import { createTransactionService } from './modules/transactions/transaction.service.js';
import { createHomeService } from './modules/home/home.service.js';

// HTTP Controllers Factories
import { createAuthController } from './modules/auth/auth.controller.js';
import { createSellerAuthController } from './modules/auth/sellerAuth.controller.js';
import { createProductController } from './modules/products/product.controller.js';
import { createCartController } from './modules/cart/cart.controller.js';
import { createWishlistController } from './modules/wishlist/wishlist.controller.js';
import { createCouponController } from './modules/coupons/coupon.controller.js';
import { createOrderController } from './modules/orders/order.controller.js';
import { createSellerOrderController } from './modules/orders/sellerOrder.controller.js';
import { createPaymentController } from './modules/payments/payment.controller.js';
import { createRevenueController } from './modules/reports/revenue.controller.js';
import { createAdminController } from './modules/admin/admin.controller.js';
import { createSellerController } from './modules/sellers/seller.controller.js';
import { createReviewController } from './modules/reviews/review.controller.js';
import { createNotificationController } from './modules/notifications/notification.controller.js';
import { createAiController } from './modules/ai/ai.controller.js';
import { createDealController } from './modules/deals/deal.controller.js';
import { createTransactionController } from './modules/transactions/transaction.controller.js';
import { createHomeMailController } from './modules/home/home.controller.js';

// Routing Gateway Compilers
import { createAuthRoutes } from './modules/auth/auth.routes.js';
import { createProductRoutes } from './modules/products/product.routes.js';
import { createCartRoutes } from './modules/cart/cart.routes.js';
import { createWishlistRoutes } from './modules/wishlist/wishlist.routes.js';
import { createCouponRoutes } from './modules/coupons/coupon.routes.js';
import { createOrderRoutes } from './modules/orders/order.routes.js';
import { createSellerOrderRoutes } from './modules/orders/sellerOrder.routes.js';
import { createPaymentRoutes } from './modules/payments/payment.routes.js';
import { createRevenueRoutes } from './modules/reports/revenue.routes.js';
import { createAdminRoutes } from './modules/admin/admin.routes.js';
import { createSellerRoutes } from './modules/sellers/seller.routes.js';
import { createReviewRoutes } from './modules/reviews/review.routes.js';
import { createNotificationRoutes } from './modules/notifications/notification.routes.js';
import { createAiRoutes } from './modules/ai/ai.routes.js';
import { createDealRoutes } from './modules/deals/deal.routes.js';
import { createTransactionRoutes } from './modules/transactions/transaction.routes.js';
import { createHomeRoutes } from './modules/home/home.routes.js';

/**
 * Functional dependency-injection based Express App Creator.
 * Acts as the master compilation assembler of the entire backend system.
 */
export const createApp = ({ env, dbManager }) =>
{
    const app = express();

    // 1. Core Global Security Middlewares
    app.use(helmet());
    app.use(cors({
        origin: env.corsOrigins,
        credentials: true, // Permits cookie authorization headers
    }));

    // 2. Dynamic Performance and Parsers Utilities
    app.use(compression());
    app.use(express.json()); // Network JSON bodies parsing wrapper
    app.use(express.urlencoded({ extended: true })); // Standard forms content wrapper
    app.use(cookieParser());

    // 3. System Credentials secrets config settings
    const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || 'simulation_jeet_access_secret_token_777';
    const jwtAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

    // Session refresh token configurations parameters
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'simulation_jeet_refresh_secret_token_777';
    const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';


    // =========================================================================
    // SECURITY MIDDLEWARES INSTANTIATIONS
    // =========================================================================

    const authenticate = createAuthenticateMiddleware({
        verifyToken,
        jwtAccessSecret,
        createApiError
    });

    const authorizeRoles = createAuthorizeRolesMiddleware({
        createApiError
    });


    // =========================================================================
    // DEPENDENCY INJECTION & INTEGRATIONS ASSEMBLY
    // =========================================================================

    // A. Instantiate Repositories
    const userRepository = createUserRepository({ User });
    const sellerRepository = createSellerRepository({ Seller });
    const cartRepository = createCartRepository({ Cart });
    const verificationCodeRepository = createVerificationCodeRepository({ VerificationCode });
    const categoryRepository = createCategoryRepository({ Category });
    const productRepository = createProductRepository({ Product });
    const wishlistRepository = createWishlistRepository({ Wishlist });
    const couponRepository = createCouponRepository({ Coupon });
    const orderRepository = createOrderRepository({ Order });
    const paymentOrderRepository = createPaymentOrderRepository({ PaymentOrder });
    const transactionRepository = createTransactionRepository({ Transaction });
    const sellerReportRepository = createSellerReportRepository({ SellerReport });
    const reviewRepository = createReviewRepository({ Review });
    const notificationRepository = createNotificationRepository({ Notification });
    const passwordResetTokenRepository = createPasswordResetTokenRepository({ PasswordResetToken });
    const refreshTokenRepository = createRefreshTokenRepository({ RefreshToken });
    const dealRepository = createDealRepository({ Deal });
    const homeCategoryRepository = createHomeCategoryRepository({ HomeCategory });

    // B. Setup Nodemailer Integration
    const emailClient = createEmailClient({
        smtpHost: process.env.SMTP_HOST || 'smtp.ethereal.email',
        smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
        smtpUser: process.env.SMTP_USER || 'mock@ethereal.email',
        smtpPass: process.env.SMTP_PASS || 'mock-pass',
        emailFrom: process.env.EMAIL_FROM || 'security@jeet-ahirwar.com',
    });

    // C. Setup Mock-Ready Payment Gateways Adapters
    const razorpayClient = {
        createPaymentLink: async ({ amount, paymentOrderId }) => ({
            id: `plink_rzp_mock_${Date.now()}`,
            payment_link_url: `https://rzp.io/i/mock_checkout_link_jeet_ahirwar?amount=${amount}&ref=${paymentOrderId}`
        }),
        fetchPaymentDetails: async (paymentId) => ({ status: 'captured' })
    };

    const stripeClient = {
        createCheckoutSession: async ({ amount, paymentOrderId }) => ({
            id: `cs_test_mock_${Date.now()}`,
            url: `https://checkout.stripe.com/c/mock_checkout_session_jeet_ahirwar?amount=${amount}&ref=${paymentOrderId}`
        })
    };

    // D. Setup Business Services
    const authService = createAuthService({
        userRepository,
        cartRepository,
        verificationCodeRepository,
        passwordResetTokenRepository,
        refreshTokenRepository,
        generateOTP,
        emailClient,
        signToken,
        verifyToken,
        createApiError,
        jwtAccessSecret,
        jwtAccessExpiresIn,
        jwtRefreshSecret,
        jwtRefreshExpiresIn,
    });

    const sellerAuthService = createSellerAuthService({
        sellerRepository,
        verificationCodeRepository,
        generateOTP,
        emailClient,
        signToken,
        createApiError,
        jwtAccessSecret,
        jwtAccessExpiresIn,
    });

    const categoryService = createCategoryService({
        categoryRepository,
        createApiError
    });

    const productService = createProductService({
        productRepository,
        categoryService,
        createApiError,
    });

    const cartService = createCartService({
        cartRepository,
        productRepository,
        createApiError,
    });

    const wishlistService = createWishlistService({
        wishlistRepository,
        productRepository,
        createApiError,
    });

    const couponService = createCouponService({
        couponRepository,
        cartRepository,
        userRepository,
        createApiError,
    });

    const orderService = createOrderService({
        orderRepository,
        cartRepository,
        userRepository,
        sellerReportRepository,
        createApiError,
    });

    const paymentService = createPaymentService({
        paymentOrderRepository,
        orderRepository,
        transactionRepository,
        sellerReportRepository,
        cartRepository,
        razorpayClient,
        stripeClient,
        createApiError,
    });

    const rtrService = authService; // References RTR token rotations actions cleanly

    const revenueService = createRevenueService({
        orderRepository,
        createApiError,
    });

    const sellerService = createSellerService({
        sellerRepository,
        createApiError,
    });

    const reviewService = createReviewService({
        reviewRepository,
        productRepository,
        createApiError,
    });

    const notificationService = createNotificationService({
        notificationRepository,
        userRepository,
        createApiError,
    });

    const aiService = createAiService({
        cartRepository,
        productRepository,
        orderRepository,
        createApiError,
    });

    const dealService = createDealService({
        dealRepository,
        createApiError,
    });

    const transactionService = createTransactionService({
        transactionRepository,
        orderRepository,
        createApiError,
    });

    const homeService = createHomeService({
        homeCategoryRepository,
        dealRepository,
        createApiError,
    });

    // E. Setup Thin HTTP Controllers
    const authController = createAuthController({ authService });
    const sellerAuthController = createSellerAuthController({ sellerAuthService });
    const productController = createProductController({ productService });
    const cartController = createCartController({ cartService });
    const wishlistController = createWishlistController({ wishlistService });
    const couponController = createCouponController({ couponService });
    const orderController = createOrderController({ orderService, paymentService });
    const sellerOrderController = createSellerOrderController({ orderService });
    const paymentController = createPaymentController({ paymentService });
    const revenueController = createRevenueController({ revenueService });
    const adminController = createAdminController({ sellerService });
    const sellerController = createSellerController({ sellerService, sellerReportRepository });
    const reviewController = createReviewController({ reviewService });
    const notificationController = createNotificationController({ notificationService });
    const aiController = createAiController({ aiService });
    const dealController = createDealController({ dealService });
    const transactionController = createTransactionController({ transactionService });
    const homeController = createHomeMailController({ homeService, homeCategoryRepository });

    // F. Assembly Routes
    const rawAuthRouterInstance = express.Router();
    const authRoutes = createAuthRoutes({
        router: rawAuthRouterInstance,
        authController,
        sellerAuthController,
        authenticate,
        asyncHandler,
    });

    const rawProductRouterInstance = express.Router();
    const productRoutes = createProductRoutes({
        router: rawProductRouterInstance,
        productController,
        authenticate,
        authorizeRoles,
        asyncHandler,
    });

    const rawCartRouterInstance = express.Router();
    const cartRoutes = createCartRoutes({
        router: rawCartRouterInstance,
        cartController,
        authenticate,
        asyncHandler,
    });

    const rawWishlistRouterInstance = express.Router();
    const wishlistRoutes = createWishlistRoutes({
        router: rawWishlistRouterInstance,
        wishlistController,
        authenticate,
        asyncHandler,
    });

    const rawCouponRouterInstance = express.Router();
    const couponRoutes = createCouponRoutes({
        router: rawCouponRouterInstance,
        couponController,
        authenticate,
        authorizeRoles,
        asyncHandler,
    });

    const rawOrderRouterInstance = express.Router();
    const orderRoutes = createOrderRoutes({
        router: rawOrderRouterInstance,
        orderController,
        authenticate,
        asyncHandler,
    });

    const rawSellerOrderRouterInstance = express.Router();
    const sellerOrderRoutes = createSellerOrderRoutes({
        router: rawSellerOrderRouterInstance,
        sellerOrderController,
        authenticate,
        authorizeRoles,
        asyncHandler,
    });

    const rawPaymentRouterInstance = express.Router();
    const paymentRoutes = createPaymentRoutes({
        router: rawPaymentRouterInstance,
        paymentController,
        authenticate,
        asyncHandler,
    });

    const rawRevenueRouterInstance = express.Router();
    const revenueRoutes = createRevenueRoutes({
        router: rawRevenueRouterInstance,
        revenueController,
        authenticate,
        authorizeRoles,
        asyncHandler,
    });

    const rawAdminRouterInstance = express.Router();
    const adminRoutes = createAdminRoutes({
        router: rawAdminRouterInstance,
        adminController,
        authenticate,
        authorizeRoles,
        asyncHandler,
    });

    // Instantiates Seller Routes cleanly (ADDED THIS INSTANTIATION!)
    const rawSellerRouterInstance = express.Router();
    const sellerRoutes = createSellerRoutes({
        router: rawSellerRouterInstance,
        sellerController,
        authenticate,
        authorizeRoles,
        asyncHandler,
    });

    const rawReviewRouterInstance = express.Router();
    const reviewRoutes = createReviewRoutes({
        router: rawReviewRouterInstance,
        reviewController,
        authenticate,
        asyncHandler,
    });

    const rawNotificationRouterInstance = express.Router();
    const notificationRoutes = createNotificationRoutes({
        router: rawNotificationRouterInstance,
        notificationController,
        authenticate,
        asyncHandler,
    });

    const rawAiRouterInstance = express.Router();
    const aiRoutes = createAiRoutes({
        router: rawAiRouterInstance,
        aiController,
        authenticate,
        asyncHandler,
    });

    const rawDealRouterInstance = express.Router();
    const dealRoutes = createDealRoutes({
        router: rawDealRouterInstance,
        dealController,
        authenticate,
        authorizeRoles,
        asyncHandler,
    });

    const rawTransactionRouterInstance = express.Router();
    const transactionRoutes = createTransactionRoutes({
        router: rawTransactionRouterInstance,
        transactionController,
        authenticate,
        authorizeRoles,
        asyncHandler,
    });

    const rawHomeRouterInstance = express.Router();
    const homeRoutes = createHomeRoutes({
        router: rawHomeRouterInstance,
        homeController,
        authenticate,
        authorizeRoles,
        asyncHandler,
    });


    // =========================================================================
    // MOUNT ROUTING & SYSTEM EXCEPTION CHANNELS
    // =========================================================================

    // Default Entry Gateway check
    app.get('/', (req, res) =>
    {
        res.status(200).json({
            message: 'Welcome to Jeet Ahirwar Marketplace API Gateway',
            online: true,
            databaseConnected: dbManager.isConnected(),
        });
    });

    // Standard Health Check Endpoint
    app.get('/health', (req, res) =>
    {
        const isDbConnected = dbManager.isConnected();

        const payload = {
            status: isDbConnected ? 'UP' : 'DOWN',
            uptime: process.uptime(),
            database: isDbConnected ? 'UP' : 'DOWN',
            memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            timestamp: new Date().toISOString()
        };

        if (!isDbConnected)
        {
            return res.status(503).json(payload);
        }

        res.status(200).json(payload);
    });

    // Mount central authentication pipelines
    app.use(authRoutes);

    // Mount product catalog and merchandising pathways
    app.use(productRoutes);

    // Mount shopping cart pathways
    app.use(cors());
    app.use(cartRoutes);

    // Mount wishlist pathways
    app.use(wishlistRoutes);

    // Mount coupon campaigns pathways
    app.use(couponRoutes);

    // Mount sales orders pathways
    app.use(orderRoutes);

    // Mount seller order management pathways
    app.use(sellerOrderRoutes);

    // Mount payment verification pathways
    app.use(paymentRoutes);

    // Mount seller revenue analytics pathways
    app.use(revenueRoutes);

    // Mount admin moderation pathways
    app.use(adminRoutes);

    // Mount seller profile and administrative seller management pathways
    app.use(sellerRoutes);

    // Mount reviews pathways
    app.use(reviewRoutes);

    // Mount notifications pathways
    app.use(notificationRoutes);

    // Mount AI chatbot pathways
    app.use(aiRoutes);

    // Mount campaign deals pathways
    app.use(dealRoutes);

    // Mount transaction ledger pathways
    app.use(transactionRoutes);

    // Mount homepage merchandising pathways
    app.use(homeRoutes);

    // Wildcard Fallback Route for non-existent system paths
    app.use((req, res, next) =>
    {
        next(createApiError({
            statusCode: 404,
            code: 'ROUTE_NOT_FOUND',
            message: `The requested endpoint ${req.originalUrl} does not exist on this server.`
        }));
    });

    // Central Centralized Error Interceptor Middleware
    app.use(createErrorHandlerMiddleware({ nodeEnv: env.nodeEnv }));

    return app;
};
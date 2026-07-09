import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Core Utilities & Middlewares
import { createErrorHandlerMiddleware } from './middlewares/errorHandler.js';
import { createApiError } from './utils/apiError.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { generateOTP } from './utils/otp.js';
import { signToken } from './utils/jwt.js';

// Mongoose Models
import { User } from './modules/users/user.model.js';
import { Seller } from './modules/sellers/seller.model.js';
import { Cart } from './modules/cart/cart.model.js';
import { VerificationCode } from './modules/auth/verificationCode.model.js';

// Persistence Repositories Factories
import { createUserRepository } from './modules/users/user.repository.js';
import { createSellerRepository } from './modules/sellers/seller.repository.js';
import { createCartRepository } from './modules/cart/cart.repository.js';
import { createVerificationCodeRepository } from './modules/auth/verificationCode.repository.js';

// Integration Adapters Factories
import { createEmailClient } from './integrations/email/nodemailer.client.js';

// Business Services Factories
import { createAuthService } from './modules/auth/auth.service.js';
import { createSellerAuthService } from './modules/auth/sellerAuth.service.js';

// HTTP Controllers Factories
import { createAuthController } from './modules/auth/auth.controller.js';
import { createSellerAuthController } from './modules/auth/sellerAuth.controller.js';

// Routing Gateway Compiler
import { createAuthRoutes } from './modules/auth/auth.routes.js';

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
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());


    // =========================================================================
    // DEPENDENCY INJECTION & INTEGRATIONS ASSEMBLY
    // =========================================================================

    // A. Instantiate Repositories (Passing direct model dependency references)
    const userRepository = createUserRepository({ User });
    const sellerRepository = createSellerRepository({ Seller });
    const cartRepository = createCartRepository({ Cart });
    const verificationCodeRepository = createVerificationCodeRepository({ VerificationCode });

    // B. Setup Nodemailer Integration (Pulls credential variables from configuration environment)
    const emailClient = createEmailClient({
        smtpHost: process.env.SMTP_HOST || 'smtp.ethereal.email', // Robust developmental mock fallbacks
        smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
        smtpUser: process.env.SMTP_USER || 'mock@ethereal.email',
        smtpPass: process.env.SMTP_PASS || 'mock-pass',
        emailFrom: process.env.EMAIL_FROM || 'security@jeet-ahirwar.com',
    });

    // C. Setup Security Token secrets parameters
    const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || 'simulation_jeet_access_secret_token_777';
    const jwtAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

    // D. Setup Business Services
    const authService = createAuthService({
        userRepository,
        cartRepository,
        verificationCodeRepository,
        generateOTP,
        emailClient,
        signToken,
        createApiError,
        jwtAccessSecret,
        jwtAccessExpiresIn,
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

    // E. Setup Thin HTTP Controllers
    const authController = createAuthController({ authService });
    const sellerAuthController = createSellerAuthController({ sellerAuthService });

    // F. Assembly Routes
    const rawRouterInstance = express.Router();
    const authRoutes = createAuthRoutes({
        router: rawRouterInstance,
        authController,
        sellerAuthController,
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

    // Register and mount dynamic authentication routing maps
    app.use(authRoutes);

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
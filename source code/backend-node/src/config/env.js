import dotenv from 'dotenv';

// 1. Process environment variables ko memory me load karein
dotenv.config();

// 2. Un variables ki list jo bootup par mandatory hain
const REQUIRED_ENV_VARS = ['MONGODB_URI'];

// 3. Check karein ki koi mandatory variable missing toh nahi hai
const missingVars = REQUIRED_ENV_VARS.filter((varName) => !process.env[varName]);

if (missingVars.length > 0)
{
    throw new Error(
        `[FATAL CONFIGURATION ERROR] Missing mandatory environment variables: ${missingVars.join(', ')}. Please configure them in your .env file.`
    );
}

// 4. Clean, typed, aur parsed options define karein
const configuration = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5454', 10),
    mongoDbUri: process.env.MONGODB_URI,
    logLevel: process.env.LOG_LEVEL || 'info',
    // Local development backend and hosted frontend CORS setup
    corsOrigins: (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin !== ''),
};

// 5. Object ko immutable banaein (Read-Only)
export const env = Object.freeze(configuration);
# Jeet Ahirwar Marketplace Backend (REST API Engine)

A highly-scalable, production-ready, secure, and loosely-coupled REST API backend designed for multi-vendor e-commerce marketplaces. Rewritten natively from the ground up in Node.js 22 LTS, Express 5, and MongoDB (Mongoose) following strict functional design standards.

## Core Architectural Philosophies
1. **Pure Function-based Factory Pattern**: Absolutely zero ES6 Classes, inheritance, dynamic 'this' contexts or constructor level dependency injection. All components are built using pure closures and functional factories.
2. **Decoupled Repositories Abstraction**: High-level business services are completely decoupled from database models. All database interactions go through specialized repository factories, enabling flawless unit testing and database-driver portability.
3. **YAGNI (You Aren't Gonna Need It)**: Bypasses premature abstractions and third-party bloat to guarantee ultra-fast execution and lightning-fast page loading speeds.
4. **Strict Security Barriers**: Implements automatic, cryptographically secure OTP hashing, session refresh token rotation (RTR), and secure HttpOnly cookie transport to protect customers credentials.

## Technology Stack
- **Runtime**: Node.js 22 LTS (ES Modules standard)
- **Framework**: Express 5 (Native Asynchronous Error handling)
- **Database**: MongoDB & Mongoose (Object-Document Mapper)
- **Loggers**: Pino & Pino-HTTP (High-speed asynchronous structured logging)
- **Testing**: Jest 29 & Supertest (Comprehensive integration and contract test suites)

## Installation & Local Development

### 1. Prerequisite Checks
Ensure you have Node.js 22+ and a local MongoDB instance running on your machine.

### 2. Dependency Resolution
Clone the repository, navigate to the root directory, and download dependencies:
```bash
npm install
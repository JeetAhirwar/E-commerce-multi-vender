import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';

// Mongoose Models tracking mocks representing clean interface stubs (Native ESM Compliant)
import { Cart } from '../modules/cart/cart.model.js';
import { Wishlist } from '../modules/wishlist/wishlist.model.js';
import { Coupon } from '../modules/coupons/coupon.model.js';

describe('Phase 5 Cart, Wishlist, Coupons - Global Integration and Contract Tests', () =>
{
    let mockEnv;
    let mockDbManager;
    let app;

    beforeEach(() =>
    {
        // Clear dynamic metrics and mock histories before running each isolated check
        jest.clearAllMocks();

        mockEnv = {
            nodeEnv: 'test',
            port: 5454,
            mongoDbUri: 'mongodb://mock',
            logLevel: 'silent', // Console logs cleanup during execution loops
            corsOrigins: ['http://localhost:3000'],
        };

        mockDbManager = {
            isConnected: () => true, // Native ESM stub
        };

        app = createApp({ env: mockEnv, dbManager: mockDbManager });
    });

    // ==========================================
    // SECTION A: Secured Shopping Cart Gateways
    // ==========================================

    it('GET /api/cart - Should block guest requests with 401 Unauthorized', async () =>
    {
        const response = await request(app)
            .get('/api/cart')
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('PUT /api/cart/add - Should block guest additions with 401 Access Denied', async () =>
    {
        const response = await request(app)
            .put('/api/cart/add')
            .send({ productId: '65c1a167098e987bca8a6a44', size: 'M', quantity: 1 })
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.success).toBe(false);
    });

    // ==========================================
    // SECTION B: Secured Wishlist Gateways
    // ==========================================

    it('GET /api/wishlist - Should block guest retrievals with 401 Unauthorized', async () =>
    {
        const response = await request(app)
            .get('/api/wishlist')
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('POST /api/wishlist/add-product/:productId - Should block guest toggles with 401 Access Denied', async () =>
    {
        const response = await request(app)
            .post('/api/wishlist/add-product/65c1a167098e987bca8a6a44')
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.success).toBe(false);
    });

    // ==========================================
    // SECTION C: Secured Coupons Gateways
    // ==========================================

    it('POST /api/coupons/apply - Should block guest promo applications with 401 Access Denied', async () =>
    {
        const response = await request(app)
            .post('/api/coupons/apply')
            .send({ code: 'WELCOME50', apply: true })
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
    });
});
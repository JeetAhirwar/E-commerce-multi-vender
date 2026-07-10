import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';

// Import Product model natively without top-level jest.mock calls (Native ESM Compliant)
import { Product } from '../modules/products/product.model.js';

describe('Phase 4 Catalog Module - Global Integration and Contract Tests', () =>
{
    let mockEnv;
    let mockDbManager;
    let app;

    beforeEach(() =>
    {
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
    // SECTION A: Public Catalog Gateways
    // ==========================================

    it('GET /products - Should return status 200 and Spring-Boot compatible paginated structure', async () =>
    {
        const mockProductsArray = [
            { _id: '1', title: 'Running Shoes Premium', mrpPrice: 1000, sellingPrice: 800, discountPercent: 20 },
            { _id: '2', title: 'Classic Leather Boots', mrpPrice: 1500, sellingPrice: 1200, discountPercent: 20 }
        ];

        // Method chaining stub attached directly to Mongoose Product Model (100% ESM Safe)
        Product.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue(mockProductsArray)
                        })
                    })
                })
            })
        });

        Product.countDocuments = jest.fn().mockResolvedValue(2);

        const response = await request(app)
            .get('/products')
            .expect('Content-Type', /json/)
            .expect(200);

        // Spring Interface Contract Validation: Ensure exact structural fields mapping
        expect(response.body).toEqual(
            expect.objectContaining({
                content: expect.any(Array),
                totalPages: expect.any(Number),
                totalElements: expect.any(Number),
                pageNumber: expect.any(Number)
            })
        );

        expect(response.body.content.length).toBe(2);
        expect(response.body.totalElements).toBe(2);
        expect(response.body.content[0].title).toBe('Running Shoes Premium');
    });

    it('GET /products/:productId - Should return 404 API custom exception on missing database records', async () =>
    {
        // Stubbing findById on Product model directly
        Product.findById = jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null)
                })
            })
        });

        const response = await request(app)
            .get('/products/65c1a167098e987bca8a6a12')
            .expect('Content-Type', /json/)
            .expect(404);

        expect(response.body).toEqual(
            expect.objectContaining({
                success: false,
                code: 'PRODUCT_NOT_FOUND'
            })
        );
    });

    // ======================================================
    // SECTION B: Private Secured Catalog Gates
    // ======================================================

    it('POST /sellers/product - Should block unauthenticated guest requests with 401 Access Denied', async () =>
    {
        const response = await request(app)
            .post('/sellers/product')
            .send({ title: 'Illegal Gadget', mrpPrice: 500, sellingPrice: 400 })
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('PUT /sellers/product/:productId - Should block updates without Bearer authorization credentials', async () =>
    {
        const response = await request(app)
            .put('/sellers/product/65c1a167098e987bca8a6a12')
            .send({ sellingPrice: 350 })
            .expect(401);

        expect(response.body.success).toBe(false);
    });
});
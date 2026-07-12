import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';

// Mongoose Models tracking mocks representing clean interface stubs (Native ESM Compliant)
import { Deal } from '../modules/deals/deal.model.js';
import { HomeCategory } from '../modules/home/homeCategory.model.js';

describe('Phase 7/8 Merchandising Campaigns - Global Integration and Contract Tests', () =>
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
    // SECTION A: Public Campaign Gateways
    // ==========================================

    it('GET /admin/deals - Should ALLOW guest lookups with 202 Accepted', async () =>
    {
        // Stub find on model level to bypass DB calls (100% ESM Safe)
        Deal.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([]) // Returns empty campaigns array
                })
            })
        });

        const response = await request(app)
            .get('/admin/deals')
            .expect('Content-Type', /json/)
            .expect(202);

        expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /home-page - Should ALLOW guest lookups with 200 OK and unified landing structures', async () =>
    {
        // Stub find on model level to bypass DB calls (100% ESM Safe)
        HomeCategory.find = jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]) // Returns empty home category array
        });

        Deal.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([])
                })
            })
        });

        const response = await request(app)
            .get('/home-page')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toEqual(
            expect.objectContaining({
                gridCategories: expect.any(Array),
                electricCategories: expect.any(Array),
                shopByCategories: expect.any(Array),
                deals: expect.any(Array)
            })
        );
    });

    // ==========================================
    // SECTION B: Secured Administrative Gateways
    // ==========================================

    it('POST /admin/deals - Should block guest campaign registrations with 401 Unauthorized', async () =>
    {
        const response = await request(app)
            .post('/admin/deals')
            .send({ discount: 50, categoryId: '65c1a167098e987bca8a6a44' })
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('PATCH /admin/deals/:id - Should block guest edits with 401 Access Denied', async () =>
    {
        const response = await request(app)
            .patch('/admin/deals/65c1a167098e987bca8a6a44')
            .send({ discount: 45 })
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.success).toBe(false);
    });

    it('POST /home/categories - Should block guest bulk layouts onboarding with 401 Unauthorized', async () =>
    {
        const response = await request(app)
            .post('/home/categories')
            .send([{ name: 'Test Card', image: 'url', categoryId: 'cat1', section: 'GRID' }])
            .expect('Content-Type', /json/)
            .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
    });
});
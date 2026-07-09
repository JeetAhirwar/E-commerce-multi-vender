import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Phase 1 Foundation - Core Express Integration Tests Suite', () =>
{
    let mockEnv;
    let mockDbManager;
    let app;

    beforeEach(() =>
    {
        mockEnv = {
            nodeEnv: 'test',
            port: 5454,
            mongoDbUri: 'mongodb://mock-test-uri',
            logLevel: 'silent',
            corsOrigins: ['http://localhost:3000'],
        };

        // Corrected with explicit ESM compatible Jest mock systems
        mockDbManager = {
            isConnected: jest.fn(),
        };

        app = createApp({ env: mockEnv, dbManager: mockDbManager });
    });

    it('GET / - Should return status 200 OK and valid JSON metadata', async () =>
    {
        // Asserting mock return values using ESM mock engine
        mockDbManager.isConnected.mockReturnValue(true);

        const response = await request(app)
            .get('/')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.online).toBe(true);
        expect(response.body.databaseConnected).toBe(true);
        expect(response.body.message).toContain('Welcome to Jeet Ahirwar Marketplace API Gateway');
    });

    it('GET / - Should return databaseConnected status false when DB is offline', async () =>
    {
        mockDbManager.isConnected.mockReturnValue(false);

        const response = await request(app)
            .get('/')
            .expect(200);

        expect(response.body.databaseConnected).toBe(false);
    });

    it('GET /api/missing-page - Should return 404 and structured apiError parameters JSON', async () =>
    {
        const response = await request(app)
            .get('/api/missing-page')
            .expect('Content-Type', /json/)
            .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('ROUTE_NOT_FOUND');
        expect(response.body).toHaveProperty('timestamp');
    });
});
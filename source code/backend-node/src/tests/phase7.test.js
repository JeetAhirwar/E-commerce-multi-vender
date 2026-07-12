import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';

// Mongoose Models tracking mocks representing clean interface stubs (Native ESM Compliant)
import { Seller } from '../modules/sellers/seller.model.js';
import { Order } from '../modules/orders/order.model.js';

describe('Phase 7 Dashboards & Analytics - Global Integration and Contract Tests', () => {
  let mockEnv;
  let mockDbManager;
  let app;

  beforeEach(() => {
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
  // SECTION A: Secured Seller Revenue Analytics Gateways
  // ==========================================

  it('GET /api/seller/revenue/chart - Should block guest analytics lookups with 401 Unauthorized', async () => {
    const response = await request(app)
      .get('/api/seller/revenue/chart?type=daily')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
  });

  // ==========================================
  // SECTION B: Secured Admin Moderation Gateways
  // ==========================================

  it('PATCH /admin/seller/:id/status/:status - Should block guest moderation actions with 401 Unauthorized', async () => {
    const response = await request(app)
      .patch('/admin/seller/65c1a167098e987bca8a6a44/status/ACTIVE')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
  });
});
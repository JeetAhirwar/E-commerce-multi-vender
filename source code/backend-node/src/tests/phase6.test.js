import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';

// Mongoose Models tracking mocks representing clean interface stubs (Native ESM Compliant)
import { Order } from '../modules/orders/order.model.js';
import { PaymentOrder } from '../modules/payments/paymentOrder.model.js';
import { Transaction } from '../modules/transactions/transaction.model.js';
import { SellerReport } from '../modules/reports/sellerReport.model.js';

describe('Phase 6 Orders & Payments - Global Integration and Contract Tests', () => {
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
  // SECTION A: Secured Customer Orders Gateways
  // ==========================================

  it('POST /api/orders - Should block guest checkouts with 401 Unauthorized', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ name: 'Jeet Ahirwar', mobile: '9988776655', streetAddress: 'IT Tech Corridor B', city: 'Pune', state: 'Maharashtra', pinCode: '411001' })
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('GET /api/orders/user - Should block guest history lookups with 401 Access Denied', async () => {
    const response = await request(app)
      .get('/api/orders/user')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it('PUT /api/orders/:orderId/cancel - Should block guest cancellations with 401 Access Denied', async () => {
    const response = await request(app)
      .put('/api/orders/65c1a167098e987bca8a6a44/cancel')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  // ==========================================
  // SECTION B: Secured Merchant Orders Gateways
  // ==========================================

  it('GET /seller/orders - Should block guest merchants store orders panel with 401 Unauthorized', async () => {
    const response = await request(app)
      .get('/seller/orders')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('PATCH /seller/orders/:orderId/status/:orderStatus - Should block guest status transitions with 401 Access Denied', async () => {
    const response = await request(app)
      .patch('/seller/orders/65c1a167098e987bca8a6a44/status/SHIPPED')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  // ==========================================
  // SECTION C: Secured Payments Gateways
  // ==========================================

  it('GET /api/payment/:paymentId - Should block guest payment verifications with 401 Access Denied', async () => {
    const response = await request(app)
      .get('/api/payment/pay_rzp_mock_777')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
  });
});
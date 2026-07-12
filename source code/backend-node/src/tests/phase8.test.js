import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';

// Mongoose Models tracking mocks representing clean interface stubs (Native ESM Compliant)
import { Review } from '../modules/reviews/review.model.js';
import { Notification } from '../modules/notifications/notification.model.js';

describe('Phase 8 Reviews, Notifications, AI - Global Integration and Contract Tests', () => {
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
  // SECTION A: Product Reviews Gateways
  // ==========================================

  it('GET /api/products/:productId/reviews - Should ALLOW guest lookups with 200 OK', async () => {
    // Stub findByProductId on model level to bypass DB calls (100% ESM Safe)
    Review.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]) // Returns empty reviews array
        })
      })
    });

    const response = await request(app)
      .get('/api/products/65c1a167098e987bca8a6a44/reviews')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /api/products/:productId/reviews - Should block guest reviews submissions with 401 Access Denied', async () => {
    const response = await request(app)
      .post('/api/products/65c1a167098e987bca8a6a44/reviews')
      .send({ reviewText: 'Compromised reviews submission attempt!', rating: 5 })
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
  });

  // ==========================================
  // SECTION B: Customer Notifications Gateways
  // ==========================================

  it('GET /api/notifications - Should block guest notifications list lookups with 401 Access Denied', async () => {
    const response = await request(app)
      .get('/api/notifications')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_REQUIRED');
  });

  // ==========================================
  // SECTION C: Optional-Auth AI Assistant Gateways
  // ==========================================

  it('POST /ai/chat - Should ALLOW guest conversational prompts with 200 OK in mockMode', async () => {
    const response = await request(app)
      .post('/ai/chat')
      .send({ prompt: 'Hello Assistant! Show my cart details.' })
      .expect('Content-Type', /json/)
      .expect(200);

    // AI Endpoint Contract: Ensure returns generated response text and mockMode indicator
    expect(response.body).toEqual(
      expect.objectContaining({
        response: expect.any(String),
        mockMode: true
      })
    );
  });
});
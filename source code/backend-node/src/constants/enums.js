/**
 * Centralized application constants.
 * 
 * These immutable values represent core business rules:
 * - User roles
 * - Account lifecycle states
 * - Order processing states
 * - Payment statuses and methods
 * 
 * Object.freeze() prevents accidental modification.
 * Keeping them centralized avoids duplicate values across the application.
 */

// Application user roles
export const ROLES = Object.freeze({
  CUSTOMER: 'ROLE_CUSTOMER',
  SELLER: 'ROLE_SELLER',
  ADMIN: 'ROLE_ADMIN',
});

// User account lifecycle states
export const ACCOUNT_STATUS = Object.freeze({
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
});

// Order lifecycle states
export const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PLACED: 'PLACED',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

// Payment transaction states
export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
});

// Supported payment gateways
export const PAYMENT_METHODS = Object.freeze({
  RAZORPAY: 'RAZORPAY',
  STRIPE: 'STRIPE',
});
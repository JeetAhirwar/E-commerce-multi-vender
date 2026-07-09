# Jeet Ahirwar Backend Rebuild

Node.js 22 LTS + Express 5 + MongoDB + Mongoose technology stack ko use karke design kiya gaya high-performance multi-vendor e-commerce platform backend engine.

## Core Architectural Philosophies
1. **Pure Function-based Factory Pattern**: Project me kahin bhi ES6 Classes, classes inheritance, dynamic 'this' contexts or constructor level dependency injection dependencies use nahi kiye gaye hain.
2. **Modular Domain Isolate Layer**: Har ek e-commerce features (jaise users, product catalogue, carts, checkout, payouts) apne folder me completely localized, testable aur isolated hain.
3. **YAGNI (You Aren't Gonna Need It)**: Premature abstractions ko strictly bypass kiya gaya hai to optimize system reading execution speeds.

## Progress Tracking Dashboard

- [x] **Phase 1: Foundation** (Establish server runtimes, Express 5 bootstrappings, Central error handlers, safe DB managers, Graceful Shutdown signals aur integrated test pipeline)
- [x] **Phase 2: Domain Models** (Complete database models schema structures design mapping, dynamic pre-validate pricing calculators, self-referential categories tree setups, Mongoose compound and text indexing setup, automated verification OTP TTL automatic garbage collections checks)
- [ ] **Phase 3: Authentication** (Dynamic Customers Register, Seller OTP logins verifications, password resetting features, JWT tokens rotation aur Cookie refresh configurations setups)
- [ ] **Phase 4: Catalog** (Products listings dynamic builders, multi-filters categories systems, textual indexing search configurations, CRUD updates with merchant security locks validations)
- [ ] **Phase 5: Cart, Wishlist, Coupons** (Calculators models recalculating pricing, coupons validity validations checkers aur inventory constraints locks checks)
- [ ] **Phase 6: Orders and Payments** (Logistics splits calculators, Razorpay/Stripe checkouts dynamic handshakes integration, payment callbacks webhooks atomic triggers)
- [ ] **Phase 7: Dashboards & Analytics** (Sellers store analytics summaries, administrators management modules, category merchandising controls, charts data aggregates)
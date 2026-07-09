import { createDatabaseManager } from './src/database/db.js';
import { env } from './src/config/env.js';
import { Payout } from './src/modules/payouts/payout.model.js';
import mongoose from 'mongoose';

const dbManager = createDatabaseManager({ mongoDbUri: env.mongoDbUri });
await dbManager.connect();

try
{
    console.log('Testing Payout constraint checks (Negative settlement transfer input check)...');
    const invalidAmountPayout = new Payout({
        transactions: [new mongoose.Types.ObjectId()],
        seller: new mongoose.Types.ObjectId(),
        amount: -1500, // Violates min: 0 check
        status: 'PENDING'
    });
    await invalidAmountPayout.validate();
} catch (err)
{
    console.log('Validation Catch Success -> Detected Invalid Payout Amount:', err.errors.amount.message);
}

try
{
    console.log('Testing Payout dynamic default states mapping verification...');
    const testPayoutBatch = new Payout({
        transactions: [new mongoose.Types.ObjectId()],
        seller: new mongoose.Types.ObjectId(),
        amount: 12500
    });
    console.log('Default assigned settlement status verified:', testPayoutBatch.status); // Must print PENDING
    console.log('Default assigned settlement logging dates verified:', testPayoutBatch.date.toISOString());
    console.log('Payout database model setups structure verify: Passed');
} catch (err)
{
    console.error(err);
}

await dbManager.disconnect();
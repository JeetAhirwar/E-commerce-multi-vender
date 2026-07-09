import { createDatabaseManager } from './src/database/db.js';
import { env } from './src/config/env.js';
import { User } from './src/modules/users/user.model.js';

const dbManager = createDatabaseManager({ mongoDbUri: env.mongoDbUri });
await dbManager.connect();

try
{
    console.log('Testing User creation validations (Email validation mismatch check)...');
    const invalidUser = new User({
        fullName: 'Jeet Ahirwar',
        email: 'invalid-email-pattern' // Regex mismatch
    });
    await invalidUser.validate();
} catch (err)
{
    console.log('Validation Catch Success -> Detected Invalid Email:', err.errors.email.message);
}

try
{
    console.log('Testing default fields mapping validation (ROLES allocation checks)...');
    const testUser = new User({
        fullName: 'Jeet Ahirwar',
        email: 'jeet@example.com'
    });
    console.log('Default assigned role checks:', testUser.role); // Should map 'ROLE_CUSTOMER'
} catch (err)
{
    console.error(err);
}

await dbManager.disconnect();
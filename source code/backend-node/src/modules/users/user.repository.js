/**
 * Creates a repository for managing users.
 */
export const createUserRepository = ({ User }) =>
{

    /**
     * Find a user by email.
     */
    const findByEmail = async (email, options = {}) =>
    {
        return User.findOne(
            { email: email.toLowerCase() },
            null, // Return all fields.
            options // Optional query options (e.g. session).
        ).lean(); // Return a plain JavaScript object.
    };

    /**
     * Find a user by ID.
     */
    const findById = async (id, options = {}) =>
    {
        return User.findById(
            id,
            { passwordHash: 0 }, // Exclude the password hash.
            options
        ).lean();
    };

    /**
     * Create a new user.
     */
    const create = async (userData, options = {}) =>
    {
        // Using an array supports MongoDB transactions.
        const [newUser] = await User.create([userData], options);

        // Convert the document to a plain JavaScript object.
        return newUser ? newUser.toObject() : null;
    };

    return Object.freeze({
        findByEmail,
        findById,
        create,
    });
};
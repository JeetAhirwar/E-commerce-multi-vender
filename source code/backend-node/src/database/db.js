import mongoose from 'mongoose';


// Creates a MongoDB database manager.
// Handles connect, disconnect, and connection status.

export const createDatabaseManager = ({ mongoDbUri }) =>
{

    // Establish a connection to MongoDB
    const connect = async () =>
    {
        try
        {
            await mongoose.connect(mongoDbUri);
            console.log('Successfully connected to MongoDB.');
        } catch (error)
        {
            console.error('CRITICAL: MongoDB connection failed!', error.message);
            throw error; // Stop application startup if the database is unavailable
        }
    };

    // Close the MongoDB connection gracefully
    const disconnect = async () =>
    {
        try
        {
            await mongoose.disconnect();
            console.log('MongoDB connection closed successfully.');
        } catch (error)
        {
            console.error('Error while disconnecting MongoDB:', error.message);
        }
    };

    // Returns true when MongoDB connection is active
    const isConnected = () =>
    {
        return mongoose.connection.readyState === 1; // 1 = Connected
    };

    // Return only the public methods of the database manager
    return Object.freeze({
        connect,
        disconnect,
        isConnected,
    });
};
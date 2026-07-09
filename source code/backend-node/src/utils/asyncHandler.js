/**
 * Higher-Order Function based custom Asynchronous Error Wrapper.
 * Automatically passes any errors to the Express error handler.
 */
export const asyncHandler = (controllerFunction) =>
{
    return (req, res, next) =>
    {
        // Execute the controller and forward any errors to the next middleware
        Promise.resolve(controllerFunction(req, res, next)).catch(next);
    };
};
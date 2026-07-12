/**
 * Pure function-based factory representing the Merchant Seller Revenue HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createRevenueController = ({ revenueService }) =>
{

    /**
     * Merchant sales charts analytics processor.
     * Maps exactly to: GET /api/seller/revenue/chart?type=today|daily|monthly (Seller authorization required)
     */
    const getRevenueChart = async (req, res) =>
    {
        // Reads authenticated vendor ID directly from decoded Bearer claims (req.user)
        const sellerId = req.user.id;

        // Reads standard timeline type from URL query string parameters: ?type=daily
        const { type } = req.query;

        const chartData = await revenueService.getSellerRevenueChartData({
            sellerId,
            type: type || 'today', // Defaults to current day hourly buckets if undefined
        });

        // 200 OK: Standard customer analytics response payload delivery
        res.status(200).json(chartData);
    };

    return Object.freeze({
        getRevenueChart,
    });
};
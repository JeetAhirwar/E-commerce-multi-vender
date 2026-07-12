/**
 * Pure function-based factory representing the Revenue & Sales Analytics Business Service.
 * Coordinates calendar math and implements robust data gap-filling algorithms.
 */
export const createRevenueService = ({ orderRepository, createApiError }) =>
{

    /**
     * Data Gap-Filling Engine.
     * Generates continuous chronological series and pre-populates missing data slots with '0'.
     * Ensures frontend analytical charts (curves) load flawlessly without structural breakages.
     */
    const buildSequentialChartBuckets = {
        // A. 24-Hours today buckets generator
        today: (orders) =>
        {
            const chartData = Array.from({ length: 24 }, (_, hour) => ({
                label: `${hour.toString().padStart(2, '0')}:00`,
                revenue: 0,
            }));

            orders.forEach((order) =>
            {
                const orderHour = new Date(order.orderDate).getHours();
                chartData[orderHour].revenue += order.totalSellingPrice;
            });

            return chartData;
        },

        // B. Past 30-Days calendar dates generator
        daily: (orders) =>
        {
            const chartData = [];
            const now = new Date();

            // Generates last 30 sequential days timeline blocks
            for (let i = 29; i >= 0; i--)
            {
                const targetDate = new Date(now);
                targetDate.setDate(now.getDate() - i);
                const dateString = targetDate.toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'

                chartData.push({
                    label: dateString,
                    revenue: 0,
                });
            }

            orders.forEach((order) =>
            {
                const orderDateStr = new Date(order.orderDate).toISOString().split('T')[0];
                const targetBucket = chartData.find((b) => b.label === orderDateStr);
                if (targetBucket)
                {
                    targetBucket.revenue += order.totalSellingPrice;
                }
            });

            return chartData;
        },

        // C. Past 12-Months calendar monthly blocks generator
        monthly: (orders) =>
        {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const chartData = [];
            const now = new Date();

            for (let i = 11; i >= 0; i--)
            {
                const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthLabel = `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

                chartData.push({
                    label: monthLabel,
                    revenue: 0,
                    year: targetDate.getFullYear(),
                    monthIndex: targetDate.getMonth(),
                });
            }

            orders.forEach((order) =>
            {
                const oDate = new Date(order.orderDate);
                const targetBucket = chartData.find(
                    (b) => b.year === oDate.getFullYear() && b.monthIndex === oDate.getMonth()
                );
                if (targetBucket)
                {
                    targetBucket.revenue += order.totalSellingPrice;
                }
            });

            // Cleanup internal year/monthIndex properties before exporting to client
            return chartData.map(({ label, revenue }) => ({ label, revenue }));
        }
    };

    /**
     * Main Analytical Router.
     * Pulls completed orders within timeline offsets and resolves chronological summaries buckets.
     */
    const getSellerRevenueChartData = async ({ sellerId, type = 'today' }) =>
    {
        const chartType = type.toLowerCase().trim();
        const allowedTypes = ['today', 'daily', 'monthly'];

        if (!allowedTypes.includes(chartType))
        {
            throw createApiError({
                statusCode: 400,
                code: 'INVALID_CHART_TYPE',
                message: `Inquiry failed: Chart types must strictly map to 'today', 'daily', or 'monthly' parameters.`
            });
        }

        // 1. Calculate past date boundary threshold values
        const now = new Date();
        let startDateBoundary = new Date();

        if (chartType === 'today')
        {
            startDateBoundary = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); // Midnight today
        } else if (chartType === 'daily')
        {
            startDateBoundary.setDate(now.getDate() - 30); // 30 days offset
        } else if (chartType === 'monthly')
        {
            startDateBoundary.setFullYear(now.getFullYear() - 1); // 12 months offset
        }

        // 2. Fetch completed orders from repositories using dynamic date filtering (YAGNI standard: bypasses heavy aggregate raw lookups)
        const allSellerOrders = await orderRepository.findBySeller({ sellerId });

        // Filter orders matching completed states falling within active timeline boundaries
        const filteredOrders = allSellerOrders.filter((order) =>
        {
            const oDate = new Date(order.orderDate);
            const isPaid = order.paymentStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED' || order.orderStatus === 'PLACED';
            const isWithinBounds = oDate >= startDateBoundary && oDate <= now;
            return isPaid && isWithinBounds;
        });

        // 3. Process data gap-fill routing mapping arrays
        return buildSequentialChartBuckets[chartType](filteredOrders);
    };

    return Object.freeze({
        getSellerRevenueChartData,
    });
};
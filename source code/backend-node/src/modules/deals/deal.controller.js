/**
 * Pure function-based factory representing the Deal campaigns HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createDealController = ({ dealService }) =>
{

    /**
     * Public campaigns and flash deals listing.
     * Maps exactly to: GET /admin/deals (Public route - No auth required for displays)
     */
    const listDeals = async (req, res) =>
    {
        const dealsList = await dealService.listDeals();

        // 202 Accepted: Matches expected e-commerce return code for successful lists retrieval
        res.status(202).json(dealsList);
    };

    /**
     * Administrative CRUD: Onboards a new promotional campaign deal.
     * Maps exactly to: POST /admin/deals (Admin authorization required)
     */
    const createDeal = async (req, res) =>
    {
        const { discount, categoryId } = req.body;

        const newDeal = await dealService.createDeal({
            discount,
            categoryId,
        });

        // 202 Accepted: New promotion asset successfully registered inside collections
        res.status(202).json(newDeal);
    };

    /**
     * Administrative CRUD: Modifies discount values on an already existing campaign deal.
     * Maps exactly to: PATCH /admin/deals/:id (Admin authorization required)
     */
    const updateDeal = async (req, res) =>
    {
        const { id } = req.params;
        const { discount } = req.body;

        const updatedDeal = await dealService.updateDeal({
            id,
            discount,
        });

        res.status(200).json(updatedDeal);
    };

    /**
     * Administrative CRUD: Erases targeted campaign asset cleanly.
     * Maps exactly to: DELETE /admin/deals/:id (Admin authorization required)
     */
    const deleteDeal = async (req, res) =>
    {
        const { id } = req.params;

        const outcome = await dealService.deleteDeal({ id });

        res.status(202).json(outcome);
    };

    return Object.freeze({
        listDeals,
        createDeal,
        updateDeal,
        deleteDeal,
    });
};
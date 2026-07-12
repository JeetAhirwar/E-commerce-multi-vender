/**
 * Pure function-based factory representing the Home Merchandising HTTP API Controllers.
 * Strictly enforces thin controller design principles, avoiding classes and context leaks.
 */
export const createHomeMailController = ({ homeService, homeCategoryRepository }) =>
{

    /**
     * Public Homepage Aggregator.
     * Pulls all required sections and campaign deals concurrently using parallel database cursor streams.
     * Maps exactly to: GET /home-page (Public route - No auth required)
     */
    const getHomePageData = async (req, res) =>
    {
        const pageData = await homeService.getHomePageData();

        // 200 OK: Standard customer gateway response payload delivery
        res.status(200).json(pageData);
    };

    /**
     * Administrative CRUD: Onboards a list of home categories merchandising banners.
     * Maps exactly to: POST /home/categories (Admin authorization required)
     */
    const createHomeCategories = async (req, res) =>
    {
        const categoryList = req.body; // Expects raw array of categories layout definitions

        const savedList = await homeService.createHomeCategories(categoryList);

        // 202 Accepted: Matches expected e-commerce return code for successful bulk registrations
        res.status(202).json(savedList);
    };

    /**
     * Administrative CRUD: Displays all configured HomeCategory layout documents.
     * Maps exactly to: GET /admin/home-category (Admin authorization required)
     */
    const listHomeCategories = async (req, res) =>
    {
        const categoriesList = await homeCategoryRepository.findAll();

        res.status(200).json(categoriesList);
    };

    /**
     * Administrative CRUD: Modifies an existing homepage category document.
     * Maps exactly to: PATCH /admin/home-category/:id (Admin authorization required)
     */
    const updateHomeCategory = async (req, res) =>
    {
        const { id } = req.params; // Captures target ID from path parameters
        const updatePayload = req.body;

        const updatedItem = await homeCategoryRepository.update(id, updatePayload);

        res.status(200).json(updatedItem);
    };

    return Object.freeze({
        getHomePageData,
        createHomeCategories,
        listHomeCategories,
        updateHomeCategory,
    });
};
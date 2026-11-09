export const createProductController = async (req, res) => {
    const { title, description, categoryId, brand, price, compareAtPrice, tags, variants, ratings, isFeatured, status } = req.body;
    console.log(title);
}
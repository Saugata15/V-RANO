import Product from "../models/product.model.js";

export const countProductsByCategoryDAO = async (categoryId) => {
    return Product.countDocuments({ categoryId });
};
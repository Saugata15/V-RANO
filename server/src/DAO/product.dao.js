import Product from "../models/product.model.js";

export const countProductsByCategoryDAO = async (categoryId) => {
    return Product.countDocuments({ categoryId });
};

export const createProductDAO = async (productData) => {
    return await Product.create(productData);
};

export const findProductBySlugDAO = async (slug) => {
    return await Product.findOne({ slug });
};
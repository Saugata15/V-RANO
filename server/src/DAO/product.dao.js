import Product from "../models/product.model.js";
import mongoose from "mongoose";

export const countProductsByCategoryDAO = async (categoryId) => {
    return Product.countDocuments({ categoryId });
};

export const createProductDAO = async (productData) => {
    return await Product.create(productData);
};

export const findProductBySlugDAO = async (slug) => {
    return await Product.findOne({ slug });
};

export const getActiveProductsDAO = async ({
    skip,
    limit,
    search,
    category,
    minPrice,
    maxPrice,
    size,
    color,
    sort,
}) => {
    const filter = {
        status: "active",
    };

    if (search) {
        const escapedSearch = search.trim().replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        filter.title = {
            $regex: escapedSearch,
            $options: "i",
        };
    }

    if (category) {
        filter.categoryId = new mongoose.Types.ObjectId(category);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};

        if (minPrice !== undefined) {
            filter.price.$gte = Number(minPrice);
        }

        if (maxPrice !== undefined) {
            filter.price.$lte = Number(maxPrice);
        }
    }

    if (size || color) {
        const variantFilter = {};

        if (size) variantFilter.size = size;
        if (color) variantFilter.color = color;

        filter.variants = {
            $elemMatch: variantFilter,
        };
    }

    const sortOptions = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        priceLow: { price: 1 },
        priceHigh: { price: -1 },
    };

    const sortQuery = sortOptions[sort] || sortOptions.newest;

    const result = await Product.aggregate([
        {
            $match: filter,
        },
        {
            $sort: sortQuery,
        },
        {
            $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category",
            },
        },
        {
            $unwind: "$category",
        },
        {
            $match: {
                "category.isActive": true,
            },
        },
        {
            $facet: {
                products: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            title: 1,
                            slug: 1,
                            description: 1,
                            price: 1,
                            compareAtPrice: 1,
                            images: 1,
                            variants: 1,
                            ratings: 1,
                            isFeatured: 1,
                            category: {
                                name: "$category.name",
                                slug: "$category.slug",
                                // id: "$category._id",
                            },
                        },
                    },
                ],
                totalCount: [
                    { $count: "count" },
                ],
            },
        },
    ]);

    return {
        products: result[0]?.products || [],
        totalProducts: result[0]?.totalCount[0]?.count || 0,
    };
};


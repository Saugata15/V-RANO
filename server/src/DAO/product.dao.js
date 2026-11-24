import Product from "../models/product.model.js";
import mongoose from "mongoose";

const withCategory = (product) => {
  if (!product) return null;
  const { categoryId, ...rest } = product;
  return { ...rest, category: categoryId ?? null };
};

export const categoryLookupStages = [
  {
    $lookup: {
      from: "categories",
      localField: "categoryId",
      foreignField: "_id",
      as: "category",
    },
  },
  { $unwind: "$category" },
];

// Public product card. images exposes url/alt/isPrimary only (no storage fileId).
export const PRODUCT_CARD_PROJECTION = {
  title: 1,
  slug: 1,
  description: 1,
  price: 1,
  compareAtPrice: 1,
  images: {
    $map: {
      input: "$images",
      as: "image",
      in: {
        url: "$$image.url",
        alt: "$$image.alt",
        isPrimary: "$$image.isPrimary",
      },
    },
  },
  variants: 1,
  ratings: 1,
  isFeatured: 1,
  brand: 1,
  inStock: { $gt: [{ $sum: "$variants.stock" }, 0] },
  category: {
    _id: "$category._id",
    name: "$category.name",
    slug: "$category.slug",
    gender: "$category.gender",
  },
};

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
  gender,
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
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  const sortQuery = { ...(sortOptions[sort] || sortOptions.newest), _id: -1 };

  const categoryMatch = { "category.isActive": true };

  if (gender) {
    // "men" also includes unisex categories like accessories
    categoryMatch["category.gender"] = { $in: [gender, "unisex"] };
  }

  const result = await Product.aggregate([
    { $match: filter },
    { $sort: sortQuery },
    ...categoryLookupStages,
    { $match: categoryMatch },
    {
      $facet: {
        products: [
          { $skip: skip },
          { $limit: limit },
          { $project: PRODUCT_CARD_PROJECTION },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  return {
    products: result[0]?.products || [],
    totalProducts: result[0]?.totalCount[0]?.count || 0,
  };
};

export const getAllProductsForAdminDAO = async ({
  skip,
  limit,
  search,
  status,
  category,
  sort,
}) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.title = {
      $regex: escapedSearch,
      $options: "i",
    };
  }

  if (category) {
    filter.categoryId = new mongoose.Types.ObjectId(category);
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priceLow: { price: 1 },
    priceHigh: { price: -1 },
  };

  const sortQuery = { ...(sortOptions[sort] || sortOptions.newest), _id: -1 };

  const [products, totalProducts] = await Promise.all([
    Product.find(filter)
      .populate("categoryId", "name slug gender isActive")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
  ]);

  return {
    products: products.map(withCategory),
    totalProducts,
  };
};

export const getProductDetailsDAO = async (slug) => {
  const normalizeSlug = slug.trim().toLowerCase();

  const product = await Product.findOne({
    slug: normalizeSlug,
    status: "active",
  })
    .select("-images.fileId")
    .populate({
      path: "categoryId",
      match: { isActive: true },
      select: "name slug gender isActive",
    })
    .lean();

  return withCategory(product);
};

export const getProductDetailsForAdminDAO = async (id) => {
  const product = await Product.findById(id)
    .populate({
      path: "categoryId",
      select: "name slug gender isActive",
    })
    .lean();

  return withCategory(product);
};

export const findActiveProductByIdDAO = async (id) => {
  return await Product.findOne({ _id: id, status: "active" });
};

export const findProductByIdDAO = async (id) => {
  return await Product.findOne({ _id: id });
};

export const findByIdAndDeleteDAO = async (id) => {
  return await Product.findByIdAndDelete(id);
};

export const updateProductDAO = async ({ id, updateData }) => {
  return await Product.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  );
};

export const getRelatedProductsDAO = async ({
  productId,
  categoryId,
  brand,
  tags = [],
  limit,
}) => {
  return Product.aggregate([
    {
      $match: {
        _id: { $ne: productId },
        categoryId,
        status: "active",
      },
    },
    {
      $addFields: {
        sharedTags: {
          $size: {
            $setIntersection: [{ $ifNull: ["$tags", []] }, { $literal: tags }],
          },
        },
        sameBrand: { $cond: [{ $eq: ["$brand", brand] }, 1, 0] },
      },
    },
    {
      $sort: {
        sharedTags: -1,
        sameBrand: -1,
        isFeatured: -1,
        "ratings.average": -1,
        createdAt: -1,
      },
    },
    { $limit: limit },
    ...categoryLookupStages,
    { $project: PRODUCT_CARD_PROJECTION },
  ]);
};

export const getFeaturedProductsDAO = async (limit) => {
  return Product.aggregate([
    { $match: { status: "active", isFeatured: true } },
    { $sort: { createdAt: -1 } },
    ...categoryLookupStages,
    { $match: { "category.isActive": true } },
    { $limit: limit },
    { $project: PRODUCT_CARD_PROJECTION },
  ]);
};

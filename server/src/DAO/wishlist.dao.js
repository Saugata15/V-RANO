import mongoose from "mongoose";
import Wishlist from "../models/wishlist.model.js";
import {
  categoryLookupStages,
  PRODUCT_CARD_PROJECTION,
} from "./product.dao.js";

export const findWishlistItemDAO = async ({ userId, productId }) => {
  return await Wishlist.findOne({ user: userId, productId }).lean();
};

export const countWishlistItemsDAO = async (userId) => {
  return await Wishlist.countDocuments({ user: userId });
};

// Upsert: safe if two requests arrive at the same time
export const addWishlistItemDAO = async ({ userId, productId }) => {
  return await Wishlist.updateOne(
    { user: userId, productId },
    { $setOnInsert: { user: userId, productId } },
    { upsert: true },
  );
};

export const removeWishlistItemDAO = async ({ userId, productId }) => {
  return await Wishlist.deleteOne({ user: userId, productId });
};

// Call this from deleteProductController
export const deleteWishlistItemsByProductDAO = async (productId) => {
  return await Wishlist.deleteMany({ productId });
};

// Lightweight list for the frontend heart icons
export const getWishlistProductIdsDAO = async (userId) => {
  const rows = await Wishlist.find({ user: userId })
    .select("productId")
    .lean();

  return rows.map((row) => row.productId);
};

// Full cards. Archived products and inactive categories are dropped quietly.
export const getWishlistDAO = async ({ userId, skip, limit }) => {
  const result = await Wishlist.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" }, // product deleted -> row dropped
    { $match: { "product.status": "active" } },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ["$product", { addedAt: "$createdAt" }] },
      },
    },
    ...categoryLookupStages,
    { $match: { "category.isActive": true } },
    { $sort: { addedAt: -1, _id: -1 } },
    {
      $facet: {
        products: [
          { $skip: skip },
          { $limit: limit },
          { $project: { ...PRODUCT_CARD_PROJECTION, addedAt: 1 } },
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
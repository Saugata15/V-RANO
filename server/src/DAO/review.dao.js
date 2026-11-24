import mongoose from "mongoose";
import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

const SORT_OPTIONS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  highest: { rating: -1, createdAt: -1, _id: -1 },
  lowest: { rating: 1, createdAt: -1, _id: -1 },
};

// Returns the user's most recent DELIVERED order that contains this product
export const findDeliveredOrderWithProductDAO = async ({
  userId,
  productId,
}) => {
  return await Order.findOne({
    user: userId,
    orderStatus: "delivered",
    "items.productId": productId,
  })
    .sort({ deliveredAt: -1 })
    .select("_id")
    .lean();
};

export const createReviewDAO = async (reviewData) => {
  return await Review.create(reviewData);
};

export const findReviewByUserAndProductDAO = async ({ userId, productId }) => {
  return await Review.findOne({ user: userId, productId }).lean();
};

export const findReviewByIdDAO = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return await Review.findById(id);
};

export const getProductReviewsDAO = async ({
  productId,
  rating,
  sort,
  skip,
  limit,
}) => {
  const filter = { productId };
  if (rating) filter.rating = rating;

  const [reviews, totalReviews] = await Promise.all([
    Review.find(filter)
      .populate("user", "name avatar") // adjust to your User field names
      .sort(SORT_OPTIONS[sort] ?? SORT_OPTIONS.newest)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return { reviews, totalReviews };
};

export const updateReviewDAO = async ({ id, updateData }) => {
  return await Review.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true },
  );
};

export const deleteReviewDAO = async (id) => {
  return await Review.findByIdAndDelete(id);
};

// Call this from deleteProductController so reviews don't outlive their product
export const deleteReviewsByProductDAO = async (productId) => {
  return await Review.deleteMany({ productId });
};

// One query gives the average, the count and the 1-5 star breakdown
export const getRatingStatsDAO = async (productId) => {
  const rows = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let total = 0;

  for (const row of rows) {
    distribution[row._id] = row.count;
    count += row.count;
    total += row._id * row.count;
  }

  return {
    average: count ? Math.round((total / count) * 10) / 10 : 0,
    count,
    distribution,
  };
};

// Writes the cached summary onto the product
export const updateProductRatingsDAO = async ({
  productId,
  average,
  count,
}) => {
  return await Product.updateOne(
    { _id: productId },
    { $set: { "ratings.average": average, "ratings.count": count } },
  );
};

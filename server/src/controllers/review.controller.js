import { findCategoryByIdDAO } from "../DAO/category.dao.js";
import {
  findActiveProductByIdDAO,
  findProductByIdDAO,
} from "../DAO/product.dao.js";
import {
  createReviewDAO,
  deleteReviewDAO,
  findDeliveredOrderWithProductDAO,
  findReviewByIdDAO,
  findReviewByUserAndProductDAO,
  getProductReviewsDAO,
  getRatingStatsDAO,
  updateReviewDAO,
} from "../DAO/review.dao.js";
import { recalculateProductRating } from "../services/review.services.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

const getVisibleProductOrThrow = async (productId) => {
  const product = await findActiveProductByIdDAO(productId);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const category = await findCategoryByIdDAO(product.categoryId);

  if (!category || !category.isActive) {
    throw new AppError(404, "Product not found");
  }

  return product;
};

const toPublicReview = (review, currentUserId) => ({
  _id: review._id,
  rating: review.rating,
  title: review.title,
  comment: review.comment,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
  isEdited: review.updatedAt.getTime() !== review.createdAt.getTime(),
  isMine: review.user?._id?.toString() === currentUserId.toString(),
  verifiedPurchase: true, // reviews can only exist for delivered orders
  user: {
    name: review.user?.name ?? "VERANO customer",
    avatar: review.user?.avatar ?? null,
  },
});

// Create a review (verified buyers only)
export const createReviewController = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const { rating, title = "", comment } = req.body;

  // The product may be archived by now. The customer still bought it.
  const product = await findProductByIdDAO(productId);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const existingReview = await findReviewByUserAndProductDAO({
    userId,
    productId,
  });

  if (existingReview) {
    throw new AppError(409, "You have already reviewed this product");
  }

  const deliveredOrder = await findDeliveredOrderWithProductDAO({
    userId,
    productId,
  });

  if (!deliveredOrder) {
    throw new AppError(
      403,
      "You can review a product only after an order containing it has been delivered",
    );
  }

  let review;

  try {
    review = await createReviewDAO({
      user: userId,
      productId,
      orderId: deliveredOrder._id,
      rating,
      title,
      comment,
    });
  } catch (error) {
    // Two simultaneous requests: the unique index stops the second one
    if (error.code === 11000) {
      throw new AppError(409, "You have already reviewed this product");
    }
    throw error;
  }

  await recalculateProductRating(productId);

  sendSuccess(res, 201, "Review submitted successfully", { review });
};

// Reviews for a product, plus the rating summary
export const getProductReviewsController = async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, sort = "newest", rating } = req.query;

  await getVisibleProductOrThrow(productId);

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // The summary always covers ALL reviews, even when a star filter is applied
  const [{ reviews, totalReviews }, summary] = await Promise.all([
    getProductReviewsDAO({
      productId,
      rating: rating ? Number(rating) : undefined,
      sort,
      skip,
      limit: limitNumber,
    }),
    getRatingStatsDAO(productId),
  ]);

  sendSuccess(res, 200, "Reviews fetched successfully", {
    reviews: reviews.map((review) => toPublicReview(review, req.user._id)),
    summary,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalReviews / limitNumber),
      totalReviews,
      limit: limitNumber,
    },
  });
};

// Tells the frontend whether to show "Write a review" or "Edit your review"
export const getMyProductReviewController = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const review = await findReviewByUserAndProductDAO({ userId, productId });

  let canReview = false;

  if (!review) {
    const deliveredOrder = await findDeliveredOrderWithProductDAO({
      userId,
      productId,
    });
    canReview = Boolean(deliveredOrder);
  }

  sendSuccess(res, 200, "Review status fetched", { review, canReview });
};

// Edit my review
export const updateReviewController = async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  const review = await findReviewByIdDAO(id);

  if (!review) {
    throw new AppError(404, "Review not found");
  }

  if (review.user.toString() !== req.user._id.toString()) {
    throw new AppError(403, "You can only edit your own review");
  }

  const updateData = {};

  if (rating !== undefined) updateData.rating = rating;
  if (title !== undefined) updateData.title = title;
  if (comment !== undefined) updateData.comment = comment;

  if (Object.keys(updateData).length === 0) {
    throw new AppError(400, "No fields provided for update");
  }

  const updatedReview = await updateReviewDAO({ id, updateData });

  if (!updatedReview) {
    throw new AppError(404, "Review not found");
  }

  await recalculateProductRating(updatedReview.productId);

  sendSuccess(res, 200, "Review updated successfully", {
    review: updatedReview,
  });
};

// Delete a review: the owner, or an admin
export const deleteReviewController = async (req, res) => {
  const { id } = req.params;

  const review = await findReviewByIdDAO(id);

  if (!review) {
    throw new AppError(404, "Review not found");
  }

  // Adjust this check to however your auth middleware marks admins
  const isAdmin = req.user.role === "admin";
  const isOwner = review.user.toString() === req.user._id.toString();

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You can only delete your own review");
  }

  const deletedReview = await deleteReviewDAO(id);

  if (!deletedReview) {
    throw new AppError(404, "Review not found");
  }

  await recalculateProductRating(deletedReview.productId);

  sendSuccess(res, 200, "Review deleted successfully");
};

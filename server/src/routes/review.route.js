import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createReviewController,
  deleteReviewController,
  getMyProductReviewController,
  getProductReviewsController,
  updateReviewController,
} from "../controllers/review.controller.js";
import {
  createReviewValidator,
  getProductReviewsValidator,
  productIdValidator,
  reviewIdValidator,
  updateReviewValidator,
} from "../validators/review.validator.js";

export const productReviewRouter = Router({ mergeParams: true });

// Add a review (verified buyers only)
productReviewRouter.post(
  "/",
  asyncHandler(requireAuth),
  createReviewValidator,
  validate,
  asyncHandler(createReviewController),
);

// List reviews + rating summary
productReviewRouter.get(
  "/",
  asyncHandler(requireAuth),
  getProductReviewsValidator,
  validate,
  asyncHandler(getProductReviewsController),
);

// My review for this product + whether I'm allowed to write one
productReviewRouter.get(
  "/me",
  asyncHandler(requireAuth),
  productIdValidator,
  validate,
  asyncHandler(getMyProductReviewController),
);

export const reviewRouter = Router();

// Edit my review
reviewRouter.patch(
  "/:id",
  asyncHandler(requireAuth),
  updateReviewValidator,
  validate,
  asyncHandler(updateReviewController),
);

// Delete my review (admins can delete any)
reviewRouter.delete(
  "/:id",
  asyncHandler(requireAuth),
  reviewIdValidator,
  validate,
  asyncHandler(deleteReviewController),
);
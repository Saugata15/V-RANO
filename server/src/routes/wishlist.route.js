import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addToWishlistController,
  getWishlistController,
  getWishlistIdsController,
  removeFromWishlistController,
} from "../controllers/wishlist.controller.js";
import {
  getWishlistValidator,
  wishlistProductIdValidator,
} from "../validators/wishlist.validator.js";

const router = Router();

// Wishlist page
router.get(
  "/",
  asyncHandler(requireAuth),
  getWishlistValidator,
  validate,
  asyncHandler(getWishlistController),
);

// Just the IDs, for heart icons on product cards
router.get(
  "/ids",
  asyncHandler(requireAuth),
  asyncHandler(getWishlistIdsController),
);

// Add
router.put(
  "/:productId",
  asyncHandler(requireAuth),
  wishlistProductIdValidator,
  validate,
  asyncHandler(addToWishlistController),
);

// Remove
router.delete(
  "/:productId",
  asyncHandler(requireAuth),
  wishlistProductIdValidator,
  validate,
  asyncHandler(removeFromWishlistController),
);

export default router;
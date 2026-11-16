import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  addToCartController,
  clearCartController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from "../controllers/cart.controller.js";
import {
  addCartItemValidator,
  removeCartItemValidator,
  updateCartItemValidator,
} from "../validators/cart.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

// Add product to cart
router.post(
  "/items",
  asyncHandler(requireAuth),
  addCartItemValidator,
  validate,
  asyncHandler(addToCartController),
);

// GET Cart items
router.get(
  "/items",
  asyncHandler(requireAuth),
  asyncHandler(getCartController),
);

// Clear Cart
router.delete(
  "/items",
  asyncHandler(requireAuth),
  asyncHandler(clearCartController),
);

router.patch(
  "/items/:itemId",
  asyncHandler(requireAuth),
  updateCartItemValidator,
  validate,
  asyncHandler(updateCartItemController),
);

// remove Item from Cart
router.delete(
  "/items/:itemId",
  asyncHandler(requireAuth),
  removeCartItemValidator,
  validate,
  asyncHandler(removeCartItemController),
);

export default router;

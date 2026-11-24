import { param, query } from "express-validator";

export const wishlistProductIdValidator = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
];

export const getWishlistValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50")
    .toInt(),
];
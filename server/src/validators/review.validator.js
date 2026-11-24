import { body, param, query } from "express-validator";
import {
  MAX_RATING,
  MIN_RATING,
  REVIEW_SORT_OPTIONS,
} from "../constants/review.constants.js";

const productIdParam = param("productId")
  .isMongoId()
  .withMessage("Invalid product ID");

const reviewIdParam = param("id").isMongoId().withMessage("Invalid review ID");

const ratingRange = `Rating must be a whole number between ${MIN_RATING} and ${MAX_RATING}`;

export const createReviewValidator = [
  productIdParam,

  body("rating")
    .exists().withMessage("Rating is required").bail()
    .isInt({ min: MIN_RATING, max: MAX_RATING }).withMessage(ratingRange)
    .toInt(),

  body("title")
    .optional()
    .isString().withMessage("Title must be a string").bail()
    .trim()
    .isLength({ max: 80 }).withMessage("Title must be under 80 characters"),

  body("comment")
    .isString().withMessage("Comment must be a string").bail()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage("Comment must be 10-1000 characters"),
];

export const getProductReviewsValidator = [
  productIdParam,

  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 30 }).withMessage("Limit must be between 1 and 30")
    .toInt(),

  query("sort")
    .optional()
    .isString().withMessage("Sort must be a string").bail()
    .isIn(REVIEW_SORT_OPTIONS).withMessage(`Sort must be one of: ${REVIEW_SORT_OPTIONS.join(", ")}`),

  query("rating")
    .optional()
    .isInt({ min: MIN_RATING, max: MAX_RATING }).withMessage(ratingRange)
    .toInt(),
];

export const productIdValidator = [productIdParam];

export const updateReviewValidator = [
  reviewIdParam,

  body("rating")
    .optional()
    .isInt({ min: MIN_RATING, max: MAX_RATING }).withMessage(ratingRange)
    .toInt(),

  body("title")
    .optional()
    .isString().withMessage("Title must be a string").bail()
    .trim()
    .isLength({ max: 80 }).withMessage("Title must be under 80 characters"),

  body("comment")
    .optional()
    .isString().withMessage("Comment must be a string").bail()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage("Comment must be 10-1000 characters"),
];

export const reviewIdValidator = [reviewIdParam];

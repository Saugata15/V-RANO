import { body, param, query } from "express-validator";
import {
    PRODUCT_SIZES,
    PRODUCT_COLORS,
} from "../constants/product.constants.js";

export const createProductValidator = [
    body("title")
        .isString().withMessage("Product title must be a string").bail()
        .trim()
        .notEmpty().withMessage("Product title is required").bail()
        .isLength({ min: 6, max: 60 }).withMessage("Product title must be 6-60 characters"),

    body("description")
        .isString().withMessage("Description must be a string").bail()
        .trim()
        .notEmpty().withMessage("Description is required").bail()
        .isLength({ min: 20, max: 200 }).withMessage("Description must be 20-200 characters"),

    body("categoryId")
        .isMongoId().withMessage("Invalid category ID"),

    body("brand")
        .isString().withMessage("Brand must be a string").bail()
        .trim()
        .notEmpty().withMessage("Brand is required"),

    body("price")
        .notEmpty().withMessage("Price is required").bail()
        .isFloat({ min: 0 }).withMessage("Price must be a valid non-negative number")
        .toFloat(),

    body("compareAtPrice")
        .optional({ values: "null" })
        .isFloat({ min: 0 }).withMessage("Compare-at price must be a non-negative number").bail()
        .toFloat()
        .custom((value, { req }) => {
            if (value <= req.body.price) {
                throw new Error(
                    "Compare-at price must be greater than selling price"
                );
            }

            return true;
        }),

    body("tags")
        .optional()
        .isArray().withMessage("Tags must be an array"),

    body("tags.*")
        .optional()
        .isString().withMessage("Each tag must be a string").bail()
        .trim()
        .notEmpty().withMessage("Tag cannot be empty").bail()
        .isLength({ max: 30 }).withMessage("Each tag must be under 30 characters"),

    body("variants")
        .isArray({ min: 1 }).withMessage("At least one product variant is required"),

    body("variants.*.size")
        .isString().withMessage("Variant size must be a string").bail()
        .trim()
        .isIn(PRODUCT_SIZES).withMessage("Invalid product size"),

    body("variants.*.color")
        .isString().withMessage("Variant color must be a string").bail()
        .trim()
        .isIn(PRODUCT_COLORS).withMessage("Invalid product color"),

    body("variants.*.stock")
        .notEmpty().withMessage("Variant stock is required").bail()
        .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer")
        .toInt(),

    body("variants")
        .custom((variants) => {
            if (!Array.isArray(variants)) return true;

            const combinations = variants.map(
                ({ size, color }) =>
                    `${size?.trim().toLowerCase()}-${color?.trim().toLowerCase()}`
            );

            if (new Set(combinations).size !== combinations.length) {
                throw new Error(
                    "Duplicate size and color combinations are not allowed"
                );
            }

            return true;
        }),

    body("ratings")
        .optional()
        .isObject().withMessage("Ratings must be an object"),

    body("ratings.average")
        .if(body("ratings").exists())
        .notEmpty().withMessage("Rating average is required").bail()
        .isFloat({ min: 0, max: 5 }).withMessage("Rating average must be between 0 and 5")
        .toFloat(),

    body("ratings.count")
        .if(body("ratings").exists())
        .notEmpty().withMessage("Rating count is required").bail()
        .isInt({ min: 0 }).withMessage("Rating count must be a non-negative integer")
        .toInt(),

    body("isFeatured")
        .optional()
        .isBoolean().withMessage("isFeatured must be a boolean").bail()
        .toBoolean(),
];

export const getActiveProductsValidator = [
    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),

    query("search")
        .optional()
        .isString().withMessage("Search must be a string").bail()
        .trim()
        .isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters"),

    query("category")
        .optional()
        .isMongoId().withMessage("Invalid category ID"),

    query("minPrice")
        .optional()
        .isFloat({ min: 0 }).withMessage("Minimum price must be non-negative"),

    query("maxPrice")
        .optional()
        .isFloat({ min: 0 }).withMessage("Maximum price must be non-negative").bail()
        .custom((value, { req }) => {
            if (
                req.query.minPrice !== undefined &&
                Number(value) < Number(req.query.minPrice)
            ) {
                throw new Error(
                    "Maximum price must be greater than or equal to minimum price"
                );
            }
            return true;
        }),

    query("size")
        .optional()
        .isIn(PRODUCT_SIZES).withMessage("Invalid product size"),

    query("color")
        .optional()
        .isIn(PRODUCT_COLORS).withMessage("Invalid product color"),

    query("sort")
        .optional()
        .isIn(["newest", "oldest", "priceLow", "priceHigh"]).withMessage("Invalid sorting option"),
];

export const getAllProductsForAdminValidator = [
    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive integer")
        .toInt(),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50")
        .toInt(),

    query("search")
        .optional()
        .isString().withMessage("Search must be a string").bail()
        .trim()
        .isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters"),

    query("status")
        .optional()
        .isIn(["active", "archived"]).withMessage("Invalid product status"),

    query("category")
        .optional()
        .isMongoId().withMessage("Invalid category ID"),

    query("sort")
        .optional()
        .isIn(["newest", "oldest", "priceLow", "priceHigh"]).withMessage("Invalid sorting option"),
];

export const updateProductValidator = [
    param("id")
        .isMongoId().withMessage("Invalid product ID"),

    body("title")
        .optional()
        .isString().withMessage("Title must be a string").bail()
        .trim()
        .notEmpty().withMessage("Title cannot be empty").bail()
        .isLength({ min: 6, max: 60 }).withMessage("Title must be between 6 and 60 characters"),

    body("description")
        .optional()
        .isString().withMessage("Description must be a string").bail()
        .trim()
        .notEmpty().withMessage("Description cannot be empty").bail()
        .isLength({ min: 20, max: 200 }).withMessage("Description must be between 20 and 200 characters"),

    body("categoryId")
        .optional()
        .isMongoId().withMessage("Invalid category ID"),

    body("brand")
        .optional()
        .isString().withMessage("Brand must be a string").bail()
        .trim()
        .notEmpty().withMessage("Brand cannot be empty"),

    body("price")
        .optional()
        .isFloat({ min: 0 }).withMessage("Price must be a valid positive number").bail()
        .toFloat(),

    body("compareAtPrice")
        .optional({ values: "null" })
        .isFloat({ min: 0 }).withMessage("Compare-at price must be a valid number").bail()
        .toFloat(),

    body("tags")
        .optional()
        .isArray().withMessage("Tags must be an array"),

    body("tags.*")
        .optional()
        .isString().withMessage("Each tag must be a string").bail()
        .trim()
        .notEmpty().withMessage("Tags cannot be empty").bail()
        .isLength({ max: 30 }).withMessage("Each tag cannot exceed 30 characters"),

    body("variants")
        .optional()
        .isArray({ min: 1 }).withMessage("At least one variant is required"),

    body("variants.*.size")
        .if(body("variants").exists())
        .isString().withMessage("Variant size must be a string").bail()
        .trim()
        .isIn(PRODUCT_SIZES).withMessage("Invalid product size"),

    body("variants.*.color")
        .if(body("variants").exists())
        .isString().withMessage("Variant color must be a string").bail()
        .trim()
        .isIn(PRODUCT_COLORS).withMessage("Invalid product color"),

    body("variants.*.stock")
        .if(body("variants").exists())
        .notEmpty().withMessage("Stock is required").bail()
        .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer").bail()
        .toInt(),

    body("variants")
        .optional()
        .custom((variants) => {
            const combinations = variants.map(
                ({ size, color }) =>
                    `${size.trim().toLowerCase()}-${color.trim().toLowerCase()}`
            );

            if (new Set(combinations).size !== combinations.length) {
                throw new Error(
                    "Duplicate size and color combinations are not allowed"
                );
            }

            return true;
        }),

    body("ratings")
        .optional()
        .custom((value) => {
            if (
                typeof value !== "object" ||
                value === null ||
                Array.isArray(value)
            ) {
                throw new Error("Ratings must be an object");
            }

            if (
                !Object.hasOwn(value, "average") ||
                !Object.hasOwn(value, "count")
            ) {
                throw new Error(
                    "Ratings must contain average and count"
                );
            }

            return true;
        }),

    body("ratings.average")
        .if(body("ratings").exists())
        .isFloat({ min: 0, max: 5 }).withMessage("Average rating must be between 0 and 5").bail()
        .toFloat(),

    body("ratings.count")
        .if(body("ratings").exists())
        .isInt({ min: 0 }).withMessage("Rating count must be a non-negative integer").bail()
        .toInt(),

    body("isFeatured")
        .optional()
        .isBoolean({ strict: true }).withMessage("isFeatured must be true or false").bail()
        .toBoolean(),
];

export const updateProductStatusValidator = [
    param("id")
        .isMongoId().withMessage("Invalid product ID"),

    body("status")
        .isIn(["active", "archived"]).withMessage("Status must be active or archived"),
];
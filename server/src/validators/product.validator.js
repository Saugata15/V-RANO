import { body } from "express-validator";
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

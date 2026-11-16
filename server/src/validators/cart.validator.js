import { body, param } from "express-validator";
import {
    PRODUCT_SIZES,
    PRODUCT_COLORS,
    MAX_QUANTITY_PER_ITEM,
} from "../constants/product.constants.js";

export const addCartItemValidator = [
    body("productId")
        .isMongoId().withMessage("Invalid product ID"),

    body("size")
        .isString().withMessage("Size must be a string").bail()
        .trim()
        .isIn(PRODUCT_SIZES).withMessage("Invalid product size"),

    body("color")
        .isString().withMessage("Color must be a string").bail()
        .trim()
        .isIn(PRODUCT_COLORS).withMessage("Invalid product color"),

    body("quantity")
        .optional()
        .isInt({ min: 1, max: MAX_QUANTITY_PER_ITEM }).withMessage("Quantity must be between 1 and 10")
        .toInt(),
];

export const removeCartItemValidator = [
    param("itemId")
        .isMongoId().withMessage("Invalid cart item ID"),
];

export const updateCartItemValidator = [
    param("itemId")
        .isMongoId().withMessage("Invalid cart item ID"),

    body("quantity")
        .notEmpty().withMessage("Quantity is required").bail()
        .isInt({ min: 1, max: MAX_QUANTITY_PER_ITEM })
        .withMessage(`Quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM}`)
        .toInt(),
];
import { body, param, query } from "express-validator"
import { GENDERS } from "../constants/category.constants.js";

export const createCategoryValidator = [
    body("name")
        .isString().withMessage("Category name should be a string").bail()
        .trim()
        .notEmpty().withMessage("Category name is required").bail()
        .isLength({ min: 3, max: 30 }).withMessage("Category name must be 3-30 characters"),

    body("gender")
        .isString().withMessage("Gender should be a string").bail()
        .trim()
        .toLowerCase()
        .isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(", ")}`),

    body("description")
        .optional()
        .isString().withMessage("Category description should be a string").bail()
        .trim()
        .isLength({ max: 500 }).withMessage("Category description must be under 500 characters"),

    body("isActive")
        .optional()
        .isBoolean().withMessage("isActive must be a boolean").bail()
        .toBoolean(),
];

export const updateCategoryValidator = [
    body("name")
        .optional()
        .isString().withMessage("Category name should be a string").bail()
        .trim()
        .notEmpty().withMessage("Category name cannot be empty").bail()
        .isLength({ min: 3, max: 30 }).withMessage("Category name must be 3-30 characters"),

    body("description")
        .optional()
        .isString().withMessage("Category description should be a string").bail()
        .trim()
        .isLength({ max: 500 }).withMessage("Category description must be under 500 characters"),

    param("id")
        .isMongoId().withMessage("Id must be a valid MongoDB ObjectId"),
];

export const mongoIdValidator = [
    param("id")
        .isMongoId().withMessage("Invalid MongoDB ID"),
];

export const updateCategoryStatusValidator = [
    param("id")
        .isMongoId().withMessage("Invalid category ID"),

    body("isActive")
        .exists().withMessage("isActive is required").bail()
        .isBoolean().withMessage("isActive must be a boolean").bail()
        .toBoolean(),
];

export const categoryGenderQueryValidator = [
    query("gender")
        .optional()
        .trim()
        .toLowerCase()
        .isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(", ")}`),
];

export const slugParamValidator = [
    param("slug")
        .isString().bail()
        .trim()
        .toLowerCase()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage("Invalid category slug")
        .isLength({ max: 80 }).withMessage("Invalid category slug"),
];
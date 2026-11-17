import { body, param } from "express-validator";
import { ADDRESS_TYPES } from "../constants/address.constants.js";

export const addressIdValidator = [
    param("id").isMongoId().withMessage("Invalid address ID"),
];

export const createAddressValidator = [
    body("fullName")
        .isString().withMessage("Full name must be a string").bail()
        .trim()
        .isLength({ min: 2, max: 60 }).withMessage("Full name must be 2-60 characters"),

    body("phone")
        .isString().withMessage("Phone must be a string").bail()
        .trim()
        .isMobilePhone("en-IN").withMessage("Invalid phone number"),

    body("line1")
        .isString().withMessage("Address line 1 must be a string").bail()
        .trim()
        .isLength({ min: 3, max: 120 }).withMessage("Address line 1 must be 3-120 characters"),

    body("line2")
        .optional()
        .isString().withMessage("Address line 2 must be a string").bail()
        .trim()
        .isLength({ max: 120 }).withMessage("Address line 2 cannot exceed 120 characters"),

    body("landmark")
        .optional()
        .isString().withMessage("Landmark must be a string").bail()
        .trim()
        .isLength({ max: 80 }).withMessage("Landmark cannot exceed 80 characters"),

    body("city")
        .isString().withMessage("City must be a string").bail()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage("City must be 2-50 characters"),

    body("state")
        .isString().withMessage("State must be a string").bail()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage("State must be 2-50 characters"),

    body("postalCode")
        .isString().withMessage("Postal code must be a string").bail()
        .trim()
        .matches(/^[1-9][0-9]{5}$/).withMessage("Postal code must be a valid 6-digit PIN"),

    body("type")
        .optional()
        .isIn(ADDRESS_TYPES).withMessage("Invalid address type"),

    body("isDefault")
        .optional()
        .isBoolean({ strict: true }).withMessage("isDefault must be true or false")
        .toBoolean(),
];

export const updateAddressValidator = [
    param("id").isMongoId().withMessage("Invalid address ID"),

    body("fullName")
        .optional()
        .isString().withMessage("Full name must be a string").bail()
        .trim()
        .isLength({ min: 2, max: 60 }).withMessage("Full name must be 2-60 characters"),

    body("phone")
        .optional()
        .isString().withMessage("Phone must be a string").bail()
        .trim()
        .isMobilePhone("en-IN").withMessage("Invalid phone number"),

    body("line1")
        .optional()
        .isString().withMessage("Address line 1 must be a string").bail()
        .trim()
        .isLength({ min: 3, max: 120 }).withMessage("Address line 1 must be 3-120 characters"),

    body("line2")
        .optional()
        .isString().withMessage("Address line 2 must be a string").bail()
        .trim()
        .isLength({ max: 120 }).withMessage("Address line 2 cannot exceed 120 characters"),

    body("landmark")
        .optional()
        .isString().withMessage("Landmark must be a string").bail()
        .trim()
        .isLength({ max: 80 }).withMessage("Landmark cannot exceed 80 characters"),

    body("city")
        .optional()
        .isString().withMessage("City must be a string").bail()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage("City must be 2-50 characters"),

    body("state")
        .optional()
        .isString().withMessage("State must be a string").bail()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage("State must be 2-50 characters"),

    body("postalCode")
        .optional()
        .isString().withMessage("Postal code must be a string").bail()
        .trim()
        .matches(/^[1-9][0-9]{5}$/).withMessage("Postal code must be a valid 6-digit PIN"),

    body("type")
        .optional()
        .isIn(ADDRESS_TYPES).withMessage("Invalid address type"),
];
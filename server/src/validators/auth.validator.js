import { body } from 'express-validator'

export const registerValidator = [
    body("name")
        .isString().withMessage("Name should be a string").bail()
        .trim()
        .notEmpty().withMessage("Name is required").bail()
        .isLength({ min: 3, max: 30 }).withMessage("Name must be 3-30 characters"),

    body("email")
        .isString().withMessage("Email should be a string").bail()
        .trim()
        .notEmpty().withMessage("Email is required").bail()
        .isEmail().withMessage("Enter a valid email address")
        .normalizeEmail(),

    body("password")
        .isString().withMessage("Password should be a string").bail()
        .notEmpty().withMessage("Password is required").bail()
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters").bail()
        .matches(/[A-Za-z]/).withMessage("Password must contain a letter").bail()
        .matches(/\d/).withMessage("Password must contain a number"),
];


export const loginValidator = [
    body("email")
        .isString().withMessage("Email should be a string").bail()
        .trim()
        .notEmpty().withMessage("Email is required").bail()
        .isEmail().withMessage("Enter a valid email address")
        .normalizeEmail(),

    body("password")
        .isString().withMessage("Password should be a string").bail()
        .notEmpty().withMessage("Password is required")
]
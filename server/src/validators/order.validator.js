import { body, param, query } from "express-validator";
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from "../constants/order.constants.js";

const pageQuery = query("page")
  .optional()
  .isInt({ min: 1 })
  .withMessage("Page must be a positive integer")
  .toInt();

const limitQuery = query("limit")
  .optional()
  .isInt({ min: 1, max: 50 })
  .withMessage("Limit must be between 1 and 50")
  .toInt();

const statusQuery = query("status")
  .optional()
  .isString()
  .withMessage("Status should be a string")
  .bail()
  .trim()
  .toLowerCase()
  .isIn(ORDER_STATUSES)
  .withMessage(`Status must be one of: ${ORDER_STATUSES.join(", ")}`);

export const placeOrderValidator = [
  body("addressId")
    .isMongoId()
    .withMessage("A valid delivery address is required"),

  body("paymentMethod")
    .isString()
    .withMessage("Payment method must be a string")
    .bail()
    .trim()
    .toLowerCase()
    .isIn(PAYMENT_METHODS)
    .withMessage(
      `Payment method must be one of: ${PAYMENT_METHODS.join(", ")}`,
    ),
];

export const getMyOrdersValidator = [pageQuery, limitQuery, statusQuery];

const orderIdParam = param("id").isMongoId().withMessage("Invalid order ID");

export const orderIdValidator = [orderIdParam];

export const verifyOrderPaymentValidator = [
  orderIdParam,

  body("razorpay_order_id")
    .isString().withMessage("razorpay_order_id is required").bail()
    .trim()
    .isLength({ min: 5, max: 60 }).withMessage("Invalid razorpay_order_id"),

  body("razorpay_payment_id")
    .isString().withMessage("razorpay_payment_id is required").bail()
    .trim()
    .isLength({ min: 5, max: 60 }).withMessage("Invalid razorpay_payment_id"),

  body("razorpay_signature")
    .isString().withMessage("razorpay_signature is required").bail()
    .trim()
    .isLength({ min: 20, max: 200 }).withMessage("Invalid razorpay_signature"),
];
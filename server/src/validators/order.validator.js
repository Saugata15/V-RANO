import { body } from "express-validator";
import { PAYMENT_METHODS } from "../constants/order.constants.js";

export const placeOrderValidator = [
  body("addressId")
    .isMongoId()
    .withMessage("A valid delivery address is required"),

  body("paymentMethod")
    .isString().withMessage("Payment method must be a string").bail()
    .trim()
    .toLowerCase()
    .isIn(PAYMENT_METHODS).withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(", ")}`),
];
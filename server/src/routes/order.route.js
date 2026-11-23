import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getMyOrderDetailsController,
  getMyOrdersController,
  getOrderPaymentController,
  placeOrderController,
  verifyOrderPaymentController,
} from "../controllers/order.controller.js";
import {
  getMyOrdersValidator,
  orderIdValidator,
  placeOrderValidator,
  verifyOrderPaymentValidator,
} from "../validators/order.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

// Place order from cart (COD or Razorpay)
router.post(
  "/",
  asyncHandler(requireAuth),
  placeOrderValidator,
  validate,
  asyncHandler(placeOrderController),
);

// My orders
router.get(
  "/",
  asyncHandler(requireAuth),
  getMyOrdersValidator,
  validate,
  asyncHandler(getMyOrdersController),
);

// "Pay now" for an order still waiting for payment
router.post(
  "/:id/pay",
  asyncHandler(requireAuth),
  orderIdValidator,
  validate,
  asyncHandler(getOrderPaymentController),
);

// Customer route for GET order Details
router.get(
  "/:id",
  asyncHandler(requireAuth),
  orderIdValidator,
  validate,
  asyncHandler(getMyOrderDetailsController),
);

// Verify the payment after the Razorpay popup succeeds
router.post(
  "/:id/verify-payment",
  asyncHandler(requireAuth),
  verifyOrderPaymentValidator,
  validate,
  asyncHandler(verifyOrderPaymentController),
);

export default router;
